let isShuttingDown = false;

/**
 * Creates a graceful shutdown handler bound to the server and database client.
 * 
 * @param {Object} server Express HTTP server instance.
 * @param {Object} prisma Prisma client instance.
 * @returns {Function} Shutdown handler function.
 */
function makeShutdownHandler(server, prisma) {
  return async (signal, exitCode, error = null) => {
    if (isShuttingDown) {
      console.warn(`⚠️ Shutdown already in progress. Ignoring signal/event: ${signal}`);
      return;
    }
    isShuttingDown = true;

    console.log(`\n🛑 [SHUTDOWN] Received signal/event: ${signal} at ${new Date().toISOString()}`);

    if (error) {
      console.error(`💥 [CRITICAL ERROR] Name: ${error.name || 'Error'}`);
      console.error(`💥 [CRITICAL ERROR] Message: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }

    // Force exit after 10 seconds if any connection is stuck
    const forceExitTimeout = setTimeout(() => {
      console.error('🚨 [SHUTDOWN] Force exiting backend server (10s timeout expired)');
      process.exit(exitCode);
    }, 10000);
    
    if (typeof forceExitTimeout.unref === 'function') {
      forceExitTimeout.unref();
    }

    // 1. Stop accepting new HTTP connections and give active requests a grace period
    if (server && typeof server.close === 'function') {
      console.log('📡 [SHUTDOWN] Closing HTTP server...');
      server.close(() => {
        console.log('✅ [SHUTDOWN] HTTP server closed');
      });
      // Short grace period for active requests to finish draining
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 2. Disconnect database client safely
    if (prisma && typeof prisma.$disconnect === 'function') {
      try {
        console.log('🔌 [SHUTDOWN] Disconnecting Prisma client...');
        await prisma.$disconnect();
        console.log('✅ [SHUTDOWN] Prisma disconnected');
      } catch (err) {
        console.error('❌ [SHUTDOWN] Error during database disconnection:', err.message);
      }
    }

    console.log(`👋 [SHUTDOWN] Exiting process with code ${exitCode}`);
    process.exit(exitCode);
  };
}

module.exports = {
  makeShutdownHandler,
  resetShutdownState: () => { isShuttingDown = false; }
};

import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Port ${PORT} is already in use. Retrying on ${nextPort}...`);
    // update PORT so next error uses nextPort + 1
    process.env.PORT = nextPort.toString();
    server.listen(nextPort);
  } else {
    console.log('Server Error:', err);
  }
});

process.on('unhandledRejection', (err: any) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

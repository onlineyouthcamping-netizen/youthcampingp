const { makeShutdownHandler, resetShutdownState } = require('../../backend/src/utils/shutdownHandler');

describe('Unit Tests: Graceful Shutdown Handler', () => {
  let mockServer: any;
  let mockPrisma: any;
  let originalExit: any;
  let exitMock: any;

  beforeEach(() => {
    resetShutdownState();
    
    // Mock server.close
    mockServer = {
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback();
      })
    };

    // Mock prisma.$disconnect
    mockPrisma = {
      $disconnect: jest.fn().mockResolvedValue(undefined)
    };

    // Mock process.exit
    originalExit = process.exit;
    exitMock = jest.fn();
    Object.defineProperty(process, 'exit', {
      value: exitMock,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
      writable: true,
      configurable: true
    });
  });

  it('should close HTTP server and disconnect Prisma client on SIGTERM', async () => {
    const handler = makeShutdownHandler(mockServer, mockPrisma);
    await handler('SIGTERM', 0);

    expect(mockServer.close).toHaveBeenCalled();
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should select exit code 1 for fatal errors like uncaughtException', async () => {
    const handler = makeShutdownHandler(mockServer, mockPrisma);
    const mockError = new Error('Test Fatal Exception');
    await handler('uncaughtException', 1, mockError);

    expect(mockServer.close).toHaveBeenCalled();
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should prevent shutdown from executing twice concurrently', async () => {
    const handler = makeShutdownHandler(mockServer, mockPrisma);
    
    // Fire shutdown twice
    const p1 = handler('SIGTERM', 0);
    const p2 = handler('SIGTERM', 0);

    await Promise.all([p1, p2]);

    // Expect server.close and disconnect to be called only once
    expect(mockServer.close).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('should force exit after 10 seconds if shutdown hangs', async () => {
    jest.useFakeTimers();
    
    // Mock server.close that never invokes its callback (hangs)
    const hangingServer = {
      close: jest.fn()
    };
    
    const handler = makeShutdownHandler(hangingServer, mockPrisma);
    
    // Start handler without awaiting it (since it hangs)
    handler('SIGTERM', 0);
    
    // Fast-forward time by 10 seconds
    jest.advanceTimersByTime(10000);
    
    // Expect process.exit to be called with exitCode (0) due to timeout
    expect(exitMock).toHaveBeenCalledWith(0);
    
    jest.useRealTimers();
  });
});

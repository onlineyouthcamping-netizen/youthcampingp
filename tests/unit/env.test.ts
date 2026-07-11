import fs from 'fs';

describe('Unit Tests: Env Loader & Safety Guard', () => {
  let mockExit: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockExistsSync: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Preserve original process.env
    originalEnv = { ...process.env };

    // Clear require cache for env module
    delete require.cache[require.resolve('../../backend/src/lib/env')];

    // Spy on process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined): never => {
      throw new Error(`Process.exit called with code: ${code}`);
    });

    // Spy on console.error
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Spy on fs.existsSync
    mockExistsSync = jest.spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    mockExistsSync.mockRestore();
    jest.resetModules();
  });

  it('Test 1: Development mode with no .env.local exits before startup', () => {
    process.env.NODE_ENV = 'development';
    mockExistsSync.mockReturnValue(false); // .env.local does not exist

    expect(() => {
      require('../../backend/src/lib/env');
    }).toThrow('Process.exit called with code: 1');

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Refusing to start local development because .env.local is missing')
    );
  });

  it('Test 2: Development mode with a fake Supabase/external DATABASE_URL exits before startup', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://postgres:password@db.myncdgifgxsworewkukj.supabase.co:5432/postgres';
    mockExistsSync.mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('.env.local')) {
        return true;
      }
      return false;
    });

    expect(() => {
      require('../../backend/src/lib/env');
    }).toThrow('Process.exit called with code: 1');

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('DATABASE_URL is not an approved local database host')
    );
  });

  it('Test 3: Development mode with localhost database URL passes the environment guard', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://postgres:local_password@127.0.0.1:5432/youthcamping_test';
    mockExistsSync.mockImplementation((path) => {
      if (typeof path === 'string' && path.endsWith('.env.local')) {
        return true;
      }
      return false;
    });

    expect(() => {
      require('../../backend/src/lib/env');
    }).not.toThrow();

    expect(mockExit).not.toHaveBeenCalled();
  });
});

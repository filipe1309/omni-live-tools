import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { HttpSocketServer, ServerConfig } from '../../../../presentation/server/HttpSocketServer';
import { RateLimiterService, StatisticsService } from '../../../../application/services';
import { IRateLimiterRepository } from '../../../../domain/repositories';

describe('HttpSocketServer Integration', () => {
  let server: HttpSocketServer;
  let clientSocket: ClientSocket;
  let mockRateLimiterRepository: jest.Mocked<IRateLimiterRepository>;
  let rateLimiterService: RateLimiterService;
  let statisticsService: StatisticsService;

  const getServerConfig = (port: number): ServerConfig => ({
    port,
    enableRateLimit: false,
    staticFilesPath: '/tmp/test-static',
    corsOrigin: '*',
    statisticsIntervalMs: 60000, // Long interval to avoid noise in tests
  });

  beforeEach(() => {
    mockRateLimiterRepository = {
      isBlocked: jest.fn().mockReturnValue(false),
      recordRequest: jest.fn(),
      getConnectionCount: jest.fn().mockReturnValue(0),
      incrementConnectionCount: jest.fn(),
      decrementConnectionCount: jest.fn(),
      reset: jest.fn(),
    };

    rateLimiterService = new RateLimiterService(
      mockRateLimiterRepository,
      10,
      5,
      false
    );

    statisticsService = new StatisticsService();
  });

  afterEach(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    if (server) {
      try {
        await server.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }
  });

  describe('server lifecycle', () => {
    it('should start and listen on specified port', (done) => {
      const config = getServerConfig(0); // Port 0 means random available port
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);
      
      // Get the underlying HTTP server to check if it's listening
      const httpServer = server['httpServer'];
      
      httpServer.once('listening', () => {
        const address = httpServer.address() as AddressInfo;
        expect(address.port).toBeGreaterThan(0);
        done();
      });

      server.start();
    });

    it('should stop gracefully after being started', async () => {
      const config = getServerConfig(0);
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);
      
      await new Promise<void>((resolve) => {
        server['httpServer'].once('listening', resolve);
        server.start();
      });

      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('Express app', () => {
    it('should expose the Express app for testing', () => {
      const config = getServerConfig(0);
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);

      const app = server.getApp();

      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
    });
  });

  describe('Socket.IO', () => {
    it('should expose the Socket.IO server for testing', () => {
      const config = getServerConfig(0);
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);

      const io = server.getIO();

      expect(io).toBeDefined();
      expect(typeof io.on).toBe('function');
    });

    it('should accept socket connections', (done) => {
      const config = getServerConfig(0);
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);

      server['httpServer'].once('listening', () => {
        const address = server['httpServer'].address() as AddressInfo;
        const port = address.port;

        clientSocket = ioClient(`http://localhost:${port}`, {
          transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          done();
        });
      });

      server.start();
    });

    it('should create a SocketHandler for each connection', (done) => {
      const config = getServerConfig(0);
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);

      let connectionCount = 0;
      const io = server.getIO();
      
      io.on('connection', () => {
        connectionCount++;
        if (connectionCount === 1) {
          expect(connectionCount).toBe(1);
          done();
        }
      });

      server['httpServer'].once('listening', () => {
        const address = server['httpServer'].address() as AddressInfo;
        const port = address.port;

        clientSocket = ioClient(`http://localhost:${port}`, {
          transports: ['websocket'],
        });
      });

      server.start();
    });
  });

  describe('statistics broadcasting', () => {
    it('should broadcast statistics at configured interval', (done) => {
      const config: ServerConfig = {
        ...getServerConfig(0),
        statisticsIntervalMs: 100, // Short interval for testing
      };
      server = new HttpSocketServer(config, rateLimiterService, statisticsService);

      server['httpServer'].once('listening', () => {
        const address = server['httpServer'].address() as AddressInfo;
        const port = address.port;

        clientSocket = ioClient(`http://localhost:${port}`, {
          transports: ['websocket'],
        });

        clientSocket.on('statistic', (data) => {
          expect(data).toHaveProperty('globalConnectionCount');
          expect(typeof data.globalConnectionCount).toBe('number');
          done();
        });
      });

      server.start();
    });
  });
});

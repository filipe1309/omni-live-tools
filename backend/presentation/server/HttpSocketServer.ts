import path from 'path';
import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketHandler } from '../handlers';
import { RateLimiterService, StatisticsService } from '../../application/services';
import { SocketEventType } from '../../domain/enums';

// Check if running as a packaged executable
const isPkg = !!(process as NodeJS.Process & { pkg?: unknown }).pkg;

// Type declaration for embedded files (injected during pkg build)
interface EmbeddedFile {
  content: string;
  binary: boolean;
}

// Use globalThis to access EMBEDDED_FILES to prevent esbuild from optimizing away the check
// EMBEDDED_FILES is injected at the top of the bundle during the build process
function getEmbeddedFiles (): Record<string, EmbeddedFile> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).EMBEDDED_FILES;
}

/**
 * Server Configuration
 */
export interface ServerConfig {
  port: number;
  sessionId?: string;
  enableRateLimit: boolean;
  staticFilesPath: string;
  corsOrigin: string;
  statisticsIntervalMs: number;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: 8081,
  enableRateLimit: false,
  staticFilesPath: path.join(__dirname, '../../../dist-frontend'),
  corsOrigin: '*',
  statisticsIntervalMs: 5000,
};

/**
 * HTTP and WebSocket Server
 */
export class HttpSocketServer {
  private readonly app: Application;
  private readonly httpServer: HttpServer;
  private readonly io: SocketIOServer;
  private statisticsInterval: NodeJS.Timeout | null = null;

  constructor (
    private readonly config: ServerConfig = DEFAULT_CONFIG,
    private readonly rateLimiterService: RateLimiterService,
    private readonly statisticsService: StatisticsService
  ) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.corsOrigin,
      },
    });

    this.setupMiddleware();
    this.setupSocketHandlers();
    this.setupStatisticsBroadcast();
  }

  /**
   * Start the server
   */
  start (): void {
    this.httpServer.listen(this.config.port, () => {
      console.info(`Server running! Please visit http://localhost:${this.config.port}`);
    });
  }

  /**
   * Stop the server
   */
  stop (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.statisticsInterval) {
        clearInterval(this.statisticsInterval);
        this.statisticsInterval = null;
      }

      this.io.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        // Only close if server is listening
        if (!this.httpServer.listening) {
          resolve();
          return;
        }

        this.httpServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Get the Express app instance (for testing)
   */
  getApp (): Application {
    return this.app;
  }

  /**
   * Get the Socket.IO server instance (for testing)
   */
  getIO (): SocketIOServer {
    return this.io;
  }

  /**
   * Get MIME type for a file path
   */
  private getMimeType (filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware (): void {
    const embeddedFiles = getEmbeddedFiles();

    if (isPkg && embeddedFiles) {
      console.info('Running in packaged mode - serving embedded files');
      // Use embedded files when running as a packaged executable
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        let filePath = req.path === '/' ? 'index.html' : req.path.substring(1);

        // Check if file exists in embedded files
        if (embeddedFiles[filePath]) {
          const file = embeddedFiles[filePath];
          res.type(this.getMimeType(filePath));
          if (file.binary) {
            res.send(Buffer.from(file.content, 'base64'));
          } else {
            res.send(file.content);
          }
          return;
        }

        // For SPA routing, serve index.html for non-asset paths
        if (!filePath.includes('.') && embeddedFiles['index.html']) {
          res.type('text/html').send(embeddedFiles['index.html'].content);
          return;
        }

        next();
      });
    } else {
      // Serve static files from filesystem (development mode)
      this.app.use(express.static(this.config.staticFilesPath));

      // SPA fallback - serve index.html for all non-file routes (client-side routing)
      this.app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(this.config.staticFilesPath, 'index.html'));
      });
    }
  }

  /**
   * Set up Socket.IO connection handlers
   */
  private setupSocketHandlers (): void {
    this.io.on('connection', (socket) => {
      new SocketHandler(
        socket,
        this.rateLimiterService,
        this.statisticsService,
        this.config.sessionId
      );
    });
  }

  /**
   * Set up statistics broadcast interval
   */
  private setupStatisticsBroadcast (): void {
    this.statisticsInterval = setInterval(() => {
      this.io.emit(SocketEventType.STATISTIC, this.statisticsService.getStatistics());
    }, this.config.statisticsIntervalMs);
  }
}

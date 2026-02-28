/**
 * Omni LIVE Tools
 * Main Entry Point - Application Bootstrap
 */

import 'dotenv/config';
import path from 'path';

import { loadConfig, validateConfig } from './config';
import { RateLimiterService, StatisticsService } from './application/services';
import { InMemoryRateLimiterRepository } from './infrastructure/rate-limiter';
import { HttpSocketServer, ServerConfig } from './presentation/server';

/**
 * Application class - Orchestrates all components
 */
class Application {
  private server: HttpSocketServer | null = null;
  private rateLimiterRepository: InMemoryRateLimiterRepository | null = null;
  private isShuttingDown = false;

  /**
   * Bootstrap and start the application
   */
  async start (): Promise<void> {
    try {
      console.info('Starting Omni LIVE Tools...');

      // Load and validate configuration
      const envConfig = loadConfig();
      validateConfig(envConfig);

      // Create infrastructure layer
      this.rateLimiterRepository = new InMemoryRateLimiterRepository({
        maxConnections: envConfig.maxConnections,
        maxRequestsPerMinute: envConfig.maxRequestsPerMinute,
        resetIntervalMs: 60 * 1000,
      });

      // Create application layer services
      const rateLimiterService = new RateLimiterService(
        this.rateLimiterRepository,
        envConfig.maxConnections,
        envConfig.maxRequestsPerMinute,
        envConfig.enableRateLimit
      );

      const statisticsService = new StatisticsService();

      // Create server configuration
      const serverConfig: ServerConfig = {
        port: envConfig.port,
        sessionId: envConfig.sessionId,
        enableRateLimit: envConfig.enableRateLimit,
        staticFilesPath: envConfig.staticFilesPath,
        corsOrigin: '*',
        statisticsIntervalMs: 5000,
      };

      // Create and start presentation layer
      this.server = new HttpSocketServer(
        serverConfig,
        rateLimiterService,
        statisticsService
      );

      this.server.start();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the application
   */
  async stop (): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    console.info('Stopping application...');

    if (this.server) {
      await this.server.stop();
      this.server = null;
    }

    if (this.rateLimiterRepository) {
      this.rateLimiterRepository.destroy();
      this.rateLimiterRepository = null;
    }

    console.info('Application stopped');
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown (): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }
      console.info(`Received ${signal}, initiating graceful shutdown...`);
      try {
        await this.stop();
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      // Don't shutdown for non-critical errors (like puppeteer/kick-js issues)
      if (error.message?.includes('EPIPE') || 
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('WebSocket') ||
          error.message?.includes('puppeteer') ||
          error.message?.includes('kick')) {
        console.warn('Non-critical error, continuing...');
        return;
      }
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      // Ignore errors during shutdown
      if (this.isShuttingDown) {
        return;
      }
      // Log but don't exit for unhandled rejections
      console.error('Unhandled rejection:', reason);
      // Don't shutdown - just log error and continue
    });
  }
}

// Start the application
const app = new Application();
app.start();

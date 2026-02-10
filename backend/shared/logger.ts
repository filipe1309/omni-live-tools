/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Console Logger implementation
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly prefix: string = '') {}

  info(message: string, ...args: unknown[]): void {
    console.info(this.format(message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.format(message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.format(message), ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(this.format(message), ...args);
  }

  private format(message: string): string {
    const timestamp = new Date().toISOString();
    return this.prefix 
      ? `[${timestamp}] [${this.prefix}] ${message}`
      : `[${timestamp}] ${message}`;
  }
}

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string): ILogger {
  return new ConsoleLogger(prefix);
}

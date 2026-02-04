// Logging utility for debugging and error tracking
const isDevelopment = process.env.NODE_ENV !== 'production';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: this.formatTimestamp(),
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;
    if (data) {
      console[level as any](prefix, message, data);
    } else {
      console[level as any](prefix, message);
    }
  }

  log(message: string, data?: any): void {
    this.addLog('log', message, data);
  }

  info(message: string, data?: any): void {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog('warn', message, data);
  }

  error(message: string, error?: any): void {
    this.addLog('error', message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      fullError: error,
    });
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getLogsAsString(): string {
    return this.logs
      .map((log) => {
        let logStr = `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`;
        if (log.data) {
          logStr += ` ${JSON.stringify(log.data)}`;
        }
        return logStr;
      })
      .join('\n');
  }

  clear(): void {
    this.logs = [];
  }

  // Export logs for sharing
  exportLogs(): string {
    return `Trinity Mobile App - Debug Logs\n${new Date().toISOString()}\n${'='.repeat(50)}\n${this.getLogsAsString()}`;
  }
}

export const logger = new Logger();

// Global error handler
export function setupGlobalErrorHandler(): void {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    logger.error('Console Error', args);
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    logger.warn('Console Warning', args);
    originalWarn.apply(console, args);
  };

  // Handle unhandled promise rejections
  if (global.onunhandledrejection === undefined) {
    global.onunhandledrejection = ({
      promise,
      reason,
    }: {
      promise: Promise<any>;
      reason: any;
    }) => {
      logger.error('Unhandled Promise Rejection', reason);
    };
  }
}

// Export for easier imports
export const log = logger.log.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

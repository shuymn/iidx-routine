export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
  private level: LogLevel = LogLevel.DEBUG;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(...args: unknown[]) {
    if (this.level > LogLevel.DEBUG) {
      return;
    }
    console.debug(...args);
  }

  info(...args: unknown[]) {
    if (this.level > LogLevel.INFO) {
      return;
    }
    console.info(...args);
  }

  warn(...args: unknown[]) {
    if (this.level > LogLevel.WARN) {
      return;
    }
    console.warn(...args);
  }

  error(...args: unknown[]) {
    if (this.level > LogLevel.ERROR) {
      return;
    }
    console.error(...args);
  }
}

export const log = new Logger();

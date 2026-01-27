import * as vscode from "vscode";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "off";

class Logger {
  private static instance: Logger;
  private outputChannel?: vscode.LogOutputChannel;
  private readonly logLevelOrder: LogLevel[] = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "off",
  ];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public initialize(outputChannel: vscode.LogOutputChannel): void {
    this.outputChannel = outputChannel;
  }

  private ensureInitialized(): void {
    if (!this.outputChannel) {
      throw new Error("Logger has not been initialized. Call initialize() first.");
    }
  }

  private getLogLevel(): LogLevel {
    const config = vscode.workspace.getConfiguration();
    return config.get<LogLevel>("amplifyBackend.logLevel") ?? "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevel = this.getLogLevel();
    if (currentLevel === "off") {
      return false;
    }
    const currentIndex = this.logLevelOrder.indexOf(currentLevel);
    const messageIndex = this.logLevelOrder.indexOf(level);
    return messageIndex >= currentIndex;
  }

  public trace(message: string): void {
    this.ensureInitialized();
    if (this.shouldLog("trace")) {
      this.outputChannel!.trace(message);
    }
  }

  public debug(message: string): void {
    this.ensureInitialized();
    if (this.shouldLog("debug")) {
      this.outputChannel!.debug(message);
    }
  }

  public info(message: string): void {
    this.ensureInitialized();
    if (this.shouldLog("info")) {
      this.outputChannel!.info(message);
    }
  }

  public warn(message: string): void {
    this.ensureInitialized();
    if (this.shouldLog("warn")) {
      this.outputChannel!.warn(message);
    }
  }

  public error(message: string, error?: Error): void {
    this.ensureInitialized();
    if (this.shouldLog("error")) {
      if (error) {
        this.outputChannel!.error(`${message}: ${error.message}`, error);
      } else {
        this.outputChannel!.error(message);
      }
    }
  }

  public show(): void {
    this.ensureInitialized();
    this.outputChannel!.show();
  }
}

export const logger = Logger.getInstance();

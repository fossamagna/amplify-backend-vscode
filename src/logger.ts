import * as vscode from "vscode";

class Logger {
  private static instance: Logger;
  private outputChannel?: vscode.LogOutputChannel;

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

  public trace(message: string): void {
    this.ensureInitialized();
    this.outputChannel!.trace(message);
  }

  public debug(message: string): void {
    this.ensureInitialized();
    this.outputChannel!.debug(message);
  }

  public info(message: string): void {
    this.ensureInitialized();
    this.outputChannel!.info(message);
  }

  public warn(message: string): void {
    this.ensureInitialized();
    this.outputChannel!.warn(message);
  }

  public error(message: string, error?: Error): void {
    this.ensureInitialized();
    if (error) {
      this.outputChannel!.error(`${message}: ${error.message}`, error);
    } else {
      this.outputChannel!.error(message);
    }
  }

  public show(): void {
    this.ensureInitialized();
    this.outputChannel!.show();
  }
}

export const logger = Logger.getInstance();

import { spawn } from "node:child_process";
import * as os from "node:os";

export interface AmplifySecrets {
  getSecret(secretName: string): Promise<SecretItem>;

  setSecret(secretName: string, secretValue: string): Promise<void>;

  removeSecret(secretName: string): Promise<void>;

  listSecrets(): Promise<string[]>;
}

export type SecretItem = {
  name: string;
  version: number;
  value: string;
  lastUpdated: Date;
};

export class AmpxAmplifySecrets implements AmplifySecrets {
  constructor(private projectDir: string, private identifier?: string) {}

  getSecret(secretName: string): Promise<SecretItem> {
    return new Promise<SecretItem>((resolve, reject) => {
      const output: string[] = [];
      const childProcess = this.spawnAmpx([
        "sandbox",
        "secret",
        "get",
        secretName,
      ]);
      childProcess.stdout.on("data", (data) => {
        output.push(data.toString());
      });
      childProcess.on("exit", (code) => {
        if (code === 0) {
          resolve(this.parseSecretOutput(output.join(os.EOL)));
        } else {
          reject();
        }
      });
    });
  }

  private parseSecretOutput(output: string): SecretItem {
    const lines = output.split(os.EOL);
    return lines.reduce((secret, line) => {
      const [key, value] = line.split(": ");
      switch (key) {
        case "name":
          secret.name = value;
          break;
        case "version":
          secret.version = Number(value);
          break;
        case "value":
          secret.value = value;
          break;
        case "lastUpdated":
          secret.lastUpdated = new Date(value);
          break;
        default:
          break;
      }
      return secret;
    }, {} as SecretItem);
  }

  removeSecret(secretName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const output: string[] = [];
      const childProcess = this.spawnAmpx([
        "sandbox",
        "secret",
        "remove",
        secretName,
      ]);
      childProcess.stdout.on("data", (data) => {
        output.push(data.toString());
      });
      childProcess.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  async setSecret(secretName: string, secretValue: string) {
    return new Promise<void>((resolve, reject) => {
      const childProcess = this.spawnAmpx([
        "sandbox",
        "secret",
        "set",
        secretName,
      ]);
      childProcess.stdout.on("data", (data) => {
        console.log(data.toString());
      });
      childProcess.on("exit", (code) => {
        console.log("write exit", code);
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
      childProcess.stdin.write(`${secretValue}`, () => {
        console.log("wrote secret value");
        childProcess.stdin.end();
      });
    });
  }

  async listSecrets(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const output: string[] = [];
      const childProcess = this.spawnAmpx(["sandbox", "secret", "list"]);
      childProcess.stdout.on("data", (data) => {
        output.push(data.toString());
      });
      childProcess.on("exit", (code) => {
        if (code === 0) {
          resolve(this.parseSecretsListOutput(output.join(os.EOL)));
        } else {
          reject();
        }
      });
    });
  }

  private spawnAmpx(args: string[]) {
    const childProcess = spawn("npx", ["ampx", ...args], {
      cwd: this.projectDir,
    });
    return childProcess;
  }

  private parseSecretsListOutput(output: string): string[] {
    const lines = output.split(os.EOL);
    const regex = / - (?<secretName>.*)/;
    const secretNames = lines
      .map((line) => line.match(regex))
      .map((matchGroup) => matchGroup?.groups?.secretName)
      .filter((secretName): secretName is string => !!secretName);
    return secretNames;
  }
}

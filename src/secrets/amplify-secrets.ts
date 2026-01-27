import type { BackendIdentifier } from "@aws-amplify/plugin-types";
import Auth from "../auth/credentials";
import { fromIni } from "@aws-sdk/credential-providers";
import { logger } from "../logger";

export interface AmplifySecrets {
  getSecret(secretName: string): Promise<SecretItem>;

  setSecret(secretName: string, secretValue: string): Promise<void>;

  removeSecret(secretName: string): Promise<void>;

  listSecrets(): Promise<string[]>;
}

export type SecretItem = {
  name: string;
  version?: number;
  value: string;
  lastUpdated?: Date;
};

export class AmplifyBackendSecret implements AmplifySecrets {
  private backendIdentifier: BackendIdentifier;

  constructor(backendIdentifier: BackendIdentifier) {
    this.backendIdentifier = backendIdentifier;
  }

  private async getBackendSecretClient() {
    const profile = Auth.instance.getProfile();
    const credentials = fromIni({
      profile,
    });
    const region = await Auth.instance.getRegion(profile);
    const backendSecret = import("@aws-amplify/backend-secret");
    const secretClient = (await backendSecret).getSecretClient({
      credentials,
      region,
    });
    return secretClient;
  }

  async getSecret(secretName: string): Promise<SecretItem> {
    try {
      const secretClient = await this.getBackendSecretClient();
      const secret = secretClient.getSecret(this.backendIdentifier, {
        name: secretName,
      });
      return secret;
    } catch (error) {
      logger.error(
        `Failed to get secret: ${secretName}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  async setSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      const secretClient = await this.getBackendSecretClient();
      await secretClient.setSecret(
        this.backendIdentifier,
        secretName,
        secretValue
      );
    } catch (error) {
      logger.error(
        `Failed to set secret: ${secretName}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  async removeSecret(secretName: string): Promise<void> {
    try {
      const secretClient = await this.getBackendSecretClient();
      await secretClient.removeSecret(this.backendIdentifier, secretName);
    } catch (error) {
      logger.error(
        `Failed to remove secret: ${secretName}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  async listSecrets(): Promise<string[]> {
    try {
      const secretClient = await this.getBackendSecretClient();
      const items = await secretClient.listSecrets(this.backendIdentifier);
      return items.map((item) => item.name);
    } catch (error) {
      logger.error(
        "Failed to list secrets",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

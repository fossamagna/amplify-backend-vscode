import type { BackendIdentifier } from "@aws-amplify/plugin-types";
const backendSecret = import("@aws-amplify/backend-secret");

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

  async getSecret(secretName: string): Promise<SecretItem> {
    const secretClient = (await backendSecret).getSecretClient();
    const secret = secretClient.getSecret(this.backendIdentifier, {
      name: secretName,
    });
    return secret;
  }

  async setSecret(secretName: string, secretValue: string): Promise<void> {
    const secretClient = (await backendSecret).getSecretClient();
    await secretClient.setSecret(
      this.backendIdentifier,
      secretName,
      secretValue
    );
  }

  async removeSecret(secretName: string): Promise<void> {
    const secretClient = (await backendSecret).getSecretClient();
    await secretClient.removeSecret(this.backendIdentifier, secretName);
  }

  async listSecrets(): Promise<string[]> {
    const secretClient = (await backendSecret).getSecretClient();
    const items = await secretClient.listSecrets(this.backendIdentifier);
    return items.map((item) => item.name);
  }
}

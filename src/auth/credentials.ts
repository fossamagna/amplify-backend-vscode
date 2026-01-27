import * as vscode from "vscode";
import {
  loadSharedConfigFiles,
  DEFAULT_PROFILE,
} from "@smithy/shared-ini-file-loader";

class Auth {
  static readonly instance = new Auth();

  private profile: string = DEFAULT_PROFILE;

  private _onDidChangeProfile: vscode.EventEmitter<string | undefined | void> =
    new vscode.EventEmitter<string | undefined | void>();

  readonly onDidChangeProfile = this._onDidChangeProfile.event;

  constructor() {}

  async getProfiles(): Promise<string[]> {
    const sharedConfigFiles = await loadSharedConfigFiles();
    return Object.keys(sharedConfigFiles.configFile);
  }

  async getCredentials(profile: string) {
    const sharedConfigFiles = await loadSharedConfigFiles();
    const iniSection = sharedConfigFiles.credentialsFile[profile];
    return {
      accessKeyId: iniSection.aws_access_key_id,
      secretAccessKey: iniSection.aws_secret_access_key,
      sessionToken: iniSection.aws_session_token,
    };
  }

  getProfile(): string {
    return this.profile;
  }

  setProfile(profile: string) {
    const oldProfile = this.profile;
    this.profile = profile;
    if (oldProfile !== profile) {
      this._onDidChangeProfile.fire(profile);
    }
  }

  async getRegion(profile?: string) {
    const sharedConfigFiles = await loadSharedConfigFiles();
    const iniSection = sharedConfigFiles.configFile[profile ?? this.profile];
    return iniSection?.region;
  }
}

export default Auth;

import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import Auth from "../auth/credentials";

export interface AWSClientProvider {
  getCloudFormationClient(): Promise<CloudFormationClient>;
}

export function getAWSClientProvider(): AWSClientProvider {
  return {
    async getCloudFormationClient() {
      const profile = await Auth.instance.getProfile();
      const region = await Auth.instance.getRegion(profile);
      return new CloudFormationClient({
        profile,
        region,
      });
    },
  };
}

// runpod-sdk: the Runpod REST v2 client from @runpod/typescript-api-sdk, plus
// the Serverless job client (run, runSync, status, stream, and the rest).

import { createRunpodClient, type RunpodClient } from "@runpod/typescript-api-sdk";
import { Endpoint, runpodServerlessBaseUrlProd } from "./serverless.js";

export * from "@runpod/typescript-api-sdk";
export * from "./serverless.js";

export type SdkOptions = {
  /** Serverless job API base URL. Defaults to https://api.runpod.ai/v2. */
  baseUrl?: string;
  /** REST v2 API base URL. Defaults to https://api.runpod.io. */
  apiBaseUrl?: string;
};

export class RunpodSdk {
  baseUrl: string = runpodServerlessBaseUrlProd;
  private apiKey: string = "";
  private apiBaseUrl?: string;
  private restClient?: RunpodClient;

  constructor(apiKey: string, options: SdkOptions = {}) {
    if (apiKey == null) {
      console.log("Api key not supplied");
      return;
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl ?? this.baseUrl;
    this.apiBaseUrl = options.apiBaseUrl;
  }

  /** A Serverless endpoint client for job requests. */
  endpoint(endpointId: string): Endpoint | null {
    if (endpointId == null) {
      console.log("Endpoint id not supplied");
      return null;
    }
    return new Endpoint(this.baseUrl, this.apiKey, endpointId);
  }

  /** The typed REST v2 client, for pods, endpoints, templates, volumes, and more. */
  get api(): RunpodClient {
    this.restClient ??= createRunpodClient({ apiKey: this.apiKey, baseUrl: this.apiBaseUrl });
    return this.restClient;
  }
}

export default function runpodSdk(apiKey: string, options: SdkOptions = {}): RunpodSdk {
  return new RunpodSdk(apiKey, options);
}

// Client for the Serverless job API (https://api.runpod.ai/v2/{endpointId}/...).
// This API is not part of the REST v2 OpenAPI spec, so it is written by hand.

declare const __RUNPOD_SDK_VERSION__: string;

export const runpodServerlessBaseUrlProd = "https://api.runpod.ai/v2";
export const runpodServerlessBaseUrlDev = "https://dev-api.runpod.ai/v2";

export type ExecutionPolicy = {
  executionTimeout?: number;
  lowPriority?: boolean;
  ttl?: number;
};
export type S3Config = {
  accessId: string;
  accessSecret: string;
  bucketName: string;
  endpointUrl: string;
  objectPath?: string;
};
export type EndpointInputPayload = {
  input: any;
  webhook?: string;
  webhookV2?: string;
  s3Config?: S3Config;
  policy?: ExecutionPolicy;
};
export type EndpointIncompleteOutput = {
  delayTime?: number;
  status: string;
  id: string;
};
export type EndpointCompletedOutput = {
  status: string;
  id: string;
  output: any;
  executionTime: number;
  delayTime: number;
};
export type EndpointOutput = EndpointCompletedOutput | EndpointIncompleteOutput;
export type EndpointStreamOutput = {
  status: string;
  stream: any[];
};
export type CancelOutput = {
  status: string;
  id: string;
  executionTime: number;
  delayTime: number;
};
export type HealthCheck = {
  jobs: { completed: number; failed: number; inProgress: number; inQueue: number; retried: number };
  workers: { idle: number; initializing: number; ready: number; running: number; throttled: number };
};
export type PurgeQueueOutput = {
  removed: number;
  status: string;
};

/** Thrown when the Serverless job API answers with a non-2xx status. */
export class RunpodServerlessError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
  constructor(status: number, statusText: string, body: string, url: string) {
    super(`runpod: ${status} ${statusText} from ${url}${body ? `: ${body}` : ""}`);
    this.name = "RunpodServerlessError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED", "TIMED_OUT"];
const isCompleted = (status: string) => TERMINAL_STATUSES.includes(status);
const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));
const endpointUrl = (baseUrl: string, endpointId: string) => `${baseUrl}/${endpointId}`;

function getUserAgent() {
  const version = typeof __RUNPOD_SDK_VERSION__ === "string" ? __RUNPOD_SDK_VERSION__ : "dev";
  const environment =
    typeof window !== "undefined" && window.navigator
      ? `Browser/${window.navigator.userAgent}`
      : "Unknown Environment";
  // The "RunPod-JS-SDK" product token is unchanged from 1.x so request
  // analytics keep counting this SDK.
  return `RunPod-JS-SDK/${version} (${environment})`;
}

async function request(
  method: "GET" | "POST",
  url: string,
  apiKey: string,
  body: unknown,
  timeout: number
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": getUserAgent(),
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new RunpodServerlessError(response.status, response.statusText, text, url);
  }
  return response;
}

// A 2xx other than 200 returns { status, statusText }, as in 1.x.
async function readJson(response: Response) {
  if (response.status !== 200) {
    return { status: response.status, statusText: response.statusText };
  }
  return response.json();
}

async function readStatus(response: Response) {
  if (response.status !== 200) {
    return { status: response.status, statusText: response.statusText, started: false };
  }
  const data = await response.json();
  return {
    ...data,
    started: true,
    completed: isCompleted(data.status),
    succeeded: data.status === "COMPLETED",
  };
}

/** POST /run: queue a job and return its id. */
export async function run(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  payload: EndpointInputPayload,
  timeout: number = 3000
): Promise<EndpointIncompleteOutput> {
  const url = `${endpointUrl(baseUrl, endpointId)}/run`;
  return readJson(await request("POST", url, apiKey, payload, timeout));
}

/** GET /status/{requestId}. */
export async function status(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string,
  timeout: number = 3000
): Promise<EndpointOutput> {
  const url = `${endpointUrl(baseUrl, endpointId)}/status/${requestId}`;
  return readStatus(await request("GET", url, apiKey, undefined, timeout));
}

/** GET /status-sync/{requestId}: wait on the server for up to `timeout` ms (1 to 90 s). */
export async function statusSync(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string,
  timeout: number = 90000
): Promise<EndpointOutput> {
  const wait = clamp(1000, 90000, timeout);
  const url = `${endpointUrl(baseUrl, endpointId)}/status-sync/${requestId}?wait=${wait}`;
  return readStatus(await request("GET", url, apiKey, undefined, 0));
}

async function runsyncOnce(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  payload: EndpointInputPayload,
  timeout: number
) {
  const wait = clamp(1000, 90000, timeout);
  const url = `${endpointUrl(baseUrl, endpointId)}/runsync?wait=${wait}`;
  return readStatus(await request("POST", url, apiKey, payload, 0));
}

/** POST /runsync, then poll /status-sync until the job ends or `timeout` ms pass. */
export async function runSync(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  payload: EndpointInputPayload,
  timeout: number = 90000
): Promise<EndpointCompletedOutput> {
  const start = Date.now();
  const remaining = () => clamp(1000, 90000, timeout - (Date.now() - start));
  let data: any = await runsyncOnce(baseUrl, apiKey, endpointId, payload, timeout);
  const { id } = data;
  while (!isCompleted(data.status)) {
    if (Date.now() - start > timeout) {
      return { ...data, started: true, completed: false };
    }
    data = await statusSync(baseUrl, apiKey, endpointId, id, remaining());
  }
  return { ...data, started: true, completed: true, succeeded: data.status === "COMPLETED" };
}

/** Poll GET /stream/{requestId} and yield each streamed output until the job ends. */
export async function* stream(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string,
  timeout: number = 0
): AsyncGenerator<any> {
  const start = Date.now();
  const url = `${endpointUrl(baseUrl, endpointId)}/stream/${requestId}`;
  let completed = false;
  while (!completed) {
    const data = await readJson(await request("GET", url, apiKey, undefined, 0));
    if (timeout !== 0 && Date.now() - start > timeout) {
      completed = true;
    }
    if (isCompleted(data.status)) {
      completed = true;
    }
    for (const output of data?.stream ?? []) {
      yield output;
    }
  }
}

/** POST /cancel/{requestId}. */
export async function cancel(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string,
  timeout: number = 3000
): Promise<CancelOutput> {
  const url = `${endpointUrl(baseUrl, endpointId)}/cancel/${requestId}`;
  return readJson(await request("POST", url, apiKey, {}, timeout));
}

/** GET /health: job and worker counts for the endpoint. */
export async function health(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  timeout: number = 3000
): Promise<HealthCheck> {
  const url = `${endpointUrl(baseUrl, endpointId)}/health`;
  return readJson(await request("GET", url, apiKey, undefined, timeout));
}

/** POST /purge-queue: remove every queued job. */
export async function purgeQueue(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  timeout: number = 3000
): Promise<PurgeQueueOutput> {
  const url = `${endpointUrl(baseUrl, endpointId)}/purge-queue`;
  return readJson(await request("POST", url, apiKey, {}, timeout));
}

/** One Serverless endpoint, bound to an API key. */
export class Endpoint {
  endpointId: string;
  baseUrl: string;
  private apiKey: string;
  constructor(baseUrl: string, apiKey: string, endpointId: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.endpointId = endpointId;
  }
  runSync(payload: EndpointInputPayload, timeout: number = 90000) {
    return runSync(this.baseUrl, this.apiKey, this.endpointId, payload, timeout);
  }
  run(payload: EndpointInputPayload, timeout: number = 3000) {
    return run(this.baseUrl, this.apiKey, this.endpointId, payload, timeout);
  }
  status(requestId: string, timeout: number = 3000) {
    return status(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout);
  }
  statusSync(requestId: string, timeout: number = 90000) {
    return statusSync(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout);
  }
  /** No timeout by default. */
  stream(requestId: string, timeout: number = 0) {
    return stream(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout);
  }
  cancel(requestId: string, timeout: number = 3000) {
    return cancel(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout);
  }
  health(timeout: number = 3000) {
    return health(this.baseUrl, this.apiKey, this.endpointId, timeout);
  }
  purgeQueue(timeout: number = 3000) {
    return purgeQueue(this.baseUrl, this.apiKey, this.endpointId, timeout);
  }
}

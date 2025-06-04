import xior, { XiorResponse as AxiosResponse } from "xior"
import { curry, clamp, isNil } from "ramda"
import pkg from "../package.json"

const axios = xior.create();

export type ExecutionPolicy = {
  executionTimeout?: number
  lowPriority?: boolean
  ttl?: number
}
export type S3Config = {
  accessId: string
  accessSecret: string
  bucketName: string
  endpointUrl: string
  objectPath?: string
}
export type EndpointInputPayload = {
  input: any
  webhook?: string
  webhookV2?: string
  s3Config?: S3Config
  policy?: ExecutionPolicy
}
export type EndpointIncompleteOutput = {
  delayTime?: number
  status: string
  id: string
}
export type EndpointCompletedOutput = {
  status: string
  id: string
  output: any
  executionTime: number
  delayTime: number
}

export type EndpointOutput = EndpointCompletedOutput | EndpointIncompleteOutput

export type EndpointStreamOutput = {
  status: string
  stream: [any]
}

export type CancelOutput = {
  status: string
  id: string
  executionTime: number
  delayTime: number
}

export type HealthCheck = {
  jobs: { completed: number; failed: number; inProgress: number; inQueue: number; retried: number }
  workers: { idle: number; initializing: number; ready: number; running: number; throttled: number }
}

export type PurgeQueueOutput = {
  removed: number
  status: string
}

export type SdkOptions = {
  baseUrl: string
}

function getUserAgent() {
  const sdkVersion = pkg.version;

  let environmentInfo = 'Unknown Environment';

  if (typeof window !== 'undefined' && window.navigator) {
    environmentInfo = `Browser/${window.navigator.userAgent}`;
  }

  return `RunPod-JS-SDK/${sdkVersion} (${environmentInfo})`;
}

const getAuthHeader = (apiKey: string) => ({
  headers: {
    "Authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
        "User-Agent": getUserAgent()
  },
})
const print = console.log

const handleErrors = async (axiosRequest: Promise<AxiosResponse>) => {
  const resp = await axiosRequest
  const { status, statusText } = resp
  if (status !== 200) {
    return { status, statusText }
  }
  return resp.data
}
const handleErrorsStatus = async (axiosRequest: Promise<AxiosResponse>) => {
  const resp = await axiosRequest
  const { status, statusText } = resp
  if (status !== 200) {
    return { status, statusText, started: false }
  }
  return {
    ...resp.data,
    started: true,
    completed: isCompleted(resp.data.status),
    succeeded: resp.data.status === "COMPLETED",
  }
}
export const runpodServerlessBaseUrlProd = "https://api.runpod.ai/v2"
export const runpodServerlessBaseUrlDev = "https://dev-api.runpod.ai/v2"
const getEndpointUrl = curry((baseUrl, endpointId: string) => `${baseUrl}/${endpointId}`)
const isCompleted = (status: string) =>
  ["COMPLETED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(status)

//run and then poll status
export const runSync = curry(
  async (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    request: EndpointInputPayload,
    timeout: number = 90000
  ) => {
    const startTime = Date.now()
    const getRemainingTime = () => clamp(1000, 90000, timeout - (Date.now() - startTime))
    const runResp: any = await runsync(baseUrl, apiKey, endpointId, request, timeout)
    let data: EndpointOutput = { ...runResp }
    const { id } = data
    const start = Date.now()
    while (!isCompleted(data.status)) {
      if (Date.now() - start > timeout) {
        print(`${id} timed out after ${timeout / 1000} seconds`)
        return { ...data, started: true, completed: false }
      }
      data = await statusSync(baseUrl, apiKey, endpointId, id, getRemainingTime())
      print(`${id}: ${data.status}`)
    }
    return { ...data, started: true, completed: true, succeeded: data.status === "COMPLETED" }
  }
)

//wrapper over /status-sync
const statusSync = curry(
  (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    requestId: String,
    timeout: number = 90000
  ) => {
    const wait = clamp(1000, 90000, timeout)
    const url = getEndpointUrl(baseUrl, endpointId) + "/status-sync/" + requestId + `?wait=${wait}`
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.get(url, { ...authHeader }))
  }
)

//wrapper over /runsync
const runsync = curry(
  (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    request: EndpointInputPayload,
    timeout: number = 90000
  ) => {
    const wait = clamp(1000, 90000, timeout)
    const url = getEndpointUrl(baseUrl, endpointId) + "/runsync" + `?wait=${wait}`
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.post(url, request, { ...authHeader }))
  }
)

//wrapper over /run
export const run = curry(
  (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    request: EndpointInputPayload,
    timeout: number = 3000
  ) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/run"
    const authHeader = getAuthHeader(apiKey)
    return handleErrors(axios.post(url, request, { ...authHeader, timeout }))
  }
)
//wrapper over /status
export const status = curry(
  (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    requestId: string,
    timeout: number = 3000
  ) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/status/" + requestId
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.get(url, { ...authHeader, timeout }))
  }
)

//generator yielding results of stream
export async function* stream(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string,
  timeout: number = 0
) {
  let completed = false
  const start = Date.now()
  while (!completed) {
    const url = getEndpointUrl(baseUrl, endpointId) + "/stream/" + requestId
    const authHeader = getAuthHeader(apiKey)
    const resp = await handleErrors(axios.get(url, authHeader))
    if (timeout !== 0 && Date.now() - start > timeout) {
      print(`stream timed out after ${timeout / 1000} seconds`)
      completed = true
    }
    if (isCompleted(resp.status)) {
      completed = true
    }
    for (const output of resp?.stream) {
      yield output
    }
  }
}

//wrapper over /cancel
const cancel = curry(
  (
    baseUrl: string,
    apiKey: string,
    endpointId: string,
    requestId: string,
    timeout: number = 3000
  ) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/cancel/" + requestId
    const authHeader = getAuthHeader(apiKey)
    return handleErrors(axios.post(url, {}, { ...authHeader, timeout }))
  }
)
//wrapper over /health
export const health = curry(
  (baseUrl: string, apiKey: string, endpointId: string, timeout: number = 3000) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/health"
    const authHeader = getAuthHeader(apiKey)
    return handleErrors(axios.get(url, { ...authHeader, timeout }))
  }
)
//wrapper over /purge-queue
export const purgeQueue = curry(
  (baseUrl: string, apiKey: string, endpointId: string, timeout: number = 3000) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/purge-queue"
    const authHeader = getAuthHeader(apiKey)
    return handleErrors(axios.post(url, {}, { ...authHeader, timeout }))
  }
)

class Endpoint {
  endpointId: string = ""
  baseUrl: string = runpodServerlessBaseUrlProd
  private apiKey: string = ""
  constructor(baseUrl: string, apiKey: string, endpointId: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.endpointId = endpointId
  }
  async runSync(
    request: EndpointInputPayload,
    timeout: number = 90000
  ): Promise<EndpointCompletedOutput> {
    return runSync(this.baseUrl, this.apiKey, this.endpointId, request, timeout)
  }
  async run(
    request: EndpointInputPayload,
    timeout: number = 3000
  ): Promise<EndpointIncompleteOutput> {
    return run(this.baseUrl, this.apiKey, this.endpointId, request, timeout)
  }
  async status(requestId: string, timeout: number = 3000): Promise<EndpointOutput> {
    return status(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout)
  }
  async statusSync(requestId: string, timeout: number = 90000): Promise<EndpointOutput> {
    return statusSync(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout)
  }
  //default to no timeout
  stream(requestId: string, timeout: number = 0): AsyncGenerator<any> {
    return stream(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout)
  }
  async cancel(requestId: string, timeout: number = 3000): Promise<CancelOutput> {
    return cancel(this.baseUrl, this.apiKey, this.endpointId, requestId, timeout)
  }
  async health(timeout: number = 3000): Promise<HealthCheck> {
    return health(this.baseUrl, this.apiKey, this.endpointId, timeout)
  }
  async purgeQueue(timeout: number = 3000): Promise<PurgeQueueOutput> {
    return purgeQueue(this.baseUrl, this.apiKey, this.endpointId, timeout)
  }
}

const defaultSdkOptions = {
  baseUrl: runpodServerlessBaseUrlProd,
}
class RunpodSdk {
  private apiKey: string = ""
  baseUrl: string = runpodServerlessBaseUrlProd
  constructor(apiKey: string, options: SdkOptions) {
    if (isNil(apiKey)) {
      print("Api key not supplied")
      return
    }
    this.apiKey = apiKey
    this.baseUrl = options.baseUrl ?? this.baseUrl
  }
  endpoint(endpointId: string) {
    if (isNil(endpointId)) {
      print("Endpoint id not supplied")
      return null
    }
    return new Endpoint(this.baseUrl, this.apiKey, endpointId)
  }
  //pod...
  //template...
}
export default (apiKey: string, options: SdkOptions = defaultSdkOptions) =>
  new RunpodSdk(apiKey, options)

import axios, { AxiosResponse } from "axios"
import { curry, clamp, isNil } from "ramda"
export type ExecutionPolicy = {
  ttl?: number
  executionTimeout?: number
}
export type S3Config = {
  accessId: string
  accessSecret: string
  bucketName: string
  endpointUrl: string
}
export type EndpointInputPayload = {
  input: any
  webhook?: string
  s3Config?: S3Config
  policy?: ExecutionPolicy
}
export type EndpointIncompleteOutput = {
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

const getAuthHeader = (apiKey: string) => ({
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
  },
})
const print = console.log
const sleep = (ms: any) => new Promise((resolve: any) => setTimeout(resolve, ms))

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
    completed: ["COMPLETED", "FAILED"].includes(resp.data.status),
    succeeded: resp.data.status === "COMPLETED",
  }
}
export const runpodServerlessBaseUrlProd = "https://api.runpod.ai/v2"
export const runpodServerlessBaseUrlDev = "https://dev-api.runpod.ai/v2"
const getEndpointUrl = curry((baseUrl, endpointId: string) => `${baseUrl}/${endpointId}`)

//run and then poll status
export const runSync = curry(
  async (baseUrl: string, apiKey: string, endpointId: string, request: EndpointInputPayload) => {
    const maxWaitTimeMs = request?.policy?.executionTimeout ?? 300 * 1000
    const startTime = Date.now()
    const getRemainingTime = () => clamp(1000, 90000, maxWaitTimeMs - (Date.now() - startTime))
    const runResp: any = await runsync(baseUrl, apiKey, endpointId, request)
    let data: EndpointOutput = { ...runResp }
    const { id } = data
    const start = Date.now()
    while (!["COMPLETED", "FAILED"].includes(data.status)) {
      if (Date.now() - start > maxWaitTimeMs) {
        print(`${id} timed out after ${maxWaitTimeMs / 1000} seconds`)
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
  (baseUrl: string, apiKey: string, endpointId: string, requestId: String, wait: number) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/status-sync/" + requestId + `?wait=${wait}`
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.get(url, authHeader))
  }
)

//wrapper over /runsync
const runsync = curry(
  (baseUrl: string, apiKey: string, endpointId: string, request: EndpointInputPayload) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/runsync"
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.post(url, request, authHeader))
  }
)

//wrapper over /run
export const run = curry(
  (baseUrl: string, apiKey: string, endpointId: string, request: EndpointInputPayload) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/run"
    const authHeader = getAuthHeader(apiKey)
    return handleErrors(axios.post(url, request, authHeader))
  }
)
//wrapper over /status
export const getStatus = curry(
  (baseUrl: string, apiKey: string, endpointId: string, requestId: string) => {
    const url = getEndpointUrl(baseUrl, endpointId) + "/status/" + requestId
    const authHeader = getAuthHeader(apiKey)
    return handleErrorsStatus(axios.get(url, authHeader))
  }
)
//wrapper over /stream
export async function* stream(
  baseUrl: string,
  apiKey: string,
  endpointId: string,
  requestId: string
) {
  let completed = false
  while (!completed) {
    const url = getEndpointUrl(baseUrl, endpointId) + "/stream/" + requestId
    const authHeader = getAuthHeader(apiKey)
    const resp = await handleErrors(axios.get(url, authHeader))
    if (["COMPLETED", "FAILED"].includes(resp.status)) {
      completed = true
    }
    for (const output of resp?.stream) {
      yield output
    }
  }
}

//wrapper over /cancel
const cancel = curry((baseUrl: string, apiKey: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(baseUrl, endpointId) + "/cancel/" + requestId
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.post(url, {}, authHeader))
})
//wrapper over /health
export const getHealth = curry((baseUrl: string, apiKey: string, endpointId: string) => {
  const url = getEndpointUrl(baseUrl, endpointId) + "/health"
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /purge-queue
export const purgeQueue = curry((baseUrl: string, apiKey: string, endpointId: string) => {
  const url = getEndpointUrl(baseUrl, endpointId) + "/purge-queue"
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.post(url, {}, authHeader))
})

class Endpoint {
  endpointId: string = ""
  baseUrl: string = runpodServerlessBaseUrlProd
  private apiKey: string = ""
  constructor(baseUrl: string, apiKey: string, endpointId: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.endpointId = endpointId
  }
  async runSync(request: EndpointInputPayload): Promise<EndpointCompletedOutput> {
    return runSync(this.baseUrl, this.apiKey, this.endpointId, request)
  }
  async run(request: EndpointInputPayload): Promise<string> {
    return run(this.baseUrl, this.apiKey, this.endpointId, request)
  }
  async getStatus(requestId: string): Promise<EndpointOutput> {
    return getStatus(this.baseUrl, this.apiKey, this.endpointId, requestId)
  }
  stream(requestId: string): AsyncGenerator<EndpointCompletedOutput> {
    return stream(this.baseUrl, this.apiKey, this.endpointId, requestId)
  }
  async cancel(requestId: string): Promise<CancelOutput> {
    return cancel(this.baseUrl, this.apiKey, this.endpointId, requestId)
  }
  async getHealth(): Promise<HealthCheck> {
    return getHealth(this.baseUrl, this.apiKey, this.endpointId)
  }
  async purgeQueue(): Promise<PurgeQueueOutput> {
    return purgeQueue(this.baseUrl, this.apiKey, this.endpointId)
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

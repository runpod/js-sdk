import axios, { AxiosResponse } from "axios"
import { curry } from "ramda"

type ExecutionPolicy = {
  executionTimeout: number
}
type S3Config = {
  accessId: string
  accessSecret: string
  bucketName: string
  endpointUrl: string
}
type EndpointInputPayload = {
  input: any
  webhook?: string
  s3Config?: S3Config
  policy?: ExecutionPolicy
}
type EndpointIncompleteOutput = {
  status: string
  id: string
}
type EndpointCompletedOutput = {
  status: string
  id: string
  output: any
  executionTime: number
  delayTime: number
}

type EndpointOutput = EndpointCompletedOutput | EndpointIncompleteOutput

type CancelOutput = {
  status: string
  id: string
  executionTime: number
  delayTime: number
}

type HealthCheck = {
  jobs: { completed: number; failed: number; inProgress: number; inQueue: number; retried: number }
  workers: { idle: number; initializing: number; ready: number; running: number; throttled: number }
}

type PurgeQueueOutput = {
  removed: number
  status: string
}

const runpodServerlessBaseUrl = "https://api.runpod.ai/v2"
const getAuthHeader = (apiKey: string) => ({
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
  },
})
const maxWaitTimeSeconds = 300
const print = console.log
const sleep = (ms: any) => new Promise((resolve: any) => setTimeout(resolve, ms))

const handleErrors = async (axiosRequest: Promise<AxiosResponse>) => {
  const resp = await axiosRequest
  const { status, statusText } = resp
  if (status !== 200) {
    return { status, statusText }
  }
  return { ...resp.data }
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

const getEndpointUrl = (endpointId: string) => `${runpodServerlessBaseUrl}/${endpointId}`

//run and then poll status
export const runSync = curry(async (apiKey: string, endpointId: string, request: any) => {
  const runResp: any = await runsync(apiKey, endpointId, request)
  let data: EndpointOutput = { ...runResp }
  const { id } = data
  const authHeader = getAuthHeader(apiKey)
  const getReqStatus = getStatus(apiKey, endpointId)
  const pollIntervalSeconds = 10
  const start = Date.now()
  while (!["COMPLETED", "FAILED"].includes(data.status)) {
    if (Date.now() - start > maxWaitTimeSeconds * 1000) {
      print(`${id} timed out after ${maxWaitTimeSeconds} seconds`)
      return { ...data, started: true, completed: false }
    }
    await sleep(1000 * pollIntervalSeconds)
    data = await getReqStatus(id)
    print(`${id}: ${data.status}`)
  }
  return { ...data, started: true, completed: true, succeeded: data.status === "COMPLETED" }
})

//wrapper over /runsync
const runsync = curry((apiKey: string, endpointId: string, request: EndpointInputPayload) => {
  const url = getEndpointUrl(endpointId) + "/runsync"
  const authHeader = getAuthHeader(apiKey)
  return handleErrorsStatus(axios.post(url, request, authHeader))
})

//wrapper over /run
export const run = curry((apiKey: string, endpointId: string, request: EndpointInputPayload) => {
  const url = getEndpointUrl(endpointId) + "/run"
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.post(url, request, authHeader))
})
//wrapper over /status
export const getStatus = curry((apiKey: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/status/" + requestId
  const authHeader = getAuthHeader(apiKey)
  return handleErrorsStatus(axios.get(url, authHeader))
})
//wrapper over /stream
export const stream = curry((apiKey: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/stream/" + requestId
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /cancel
const cancel = curry((apiKey: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/cancel/" + requestId
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.post(url, {}, authHeader))
})
//wrapper over /health
export const getHealth = curry((apiKey: string, endpointId: string) => {
  const url = getEndpointUrl(endpointId) + "/health"
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /purge-queue
export const purgeQueue = curry((apiKey: string, endpointId: string) => {
  const url = getEndpointUrl(endpointId) + "/purge-queue"
  const authHeader = getAuthHeader(apiKey)
  return handleErrors(axios.post(url, {}, authHeader))
})

class Endpoint {
  endpointId: string = ""
  private apiKey: string = ""
  constructor(apiKey: string, endpointId: string) {
    this.apiKey = apiKey
    this.endpointId = endpointId
  }
  async runSync(request: EndpointInputPayload): Promise<EndpointCompletedOutput> {
    return runSync(this.apiKey, this.endpointId, request)
  }
  async run(request: EndpointInputPayload): Promise<string> {
    return run(this.apiKey, this.endpointId, request)
  }
  async getStatus(requestId: string): Promise<EndpointOutput> {
    return getStatus(this.apiKey, this.endpointId, requestId)
  }
  async stream(requestId: string): Promise<EndpointOutput> {
    return stream(this.apiKey, this.endpointId, requestId)
  }
  async cancel(requestId: string): Promise<CancelOutput> {
    return cancel(this.apiKey, this.endpointId, requestId)
  }
  async getHealth(): Promise<HealthCheck> {
    return getHealth(this.apiKey, this.endpointId)
  }
  async purgeQueue(): Promise<PurgeQueueOutput> {
    return purgeQueue(this.apiKey, this.endpointId)
  }
}

export default (apiKey: string) => ({
  endpoint: (endpointId: string) => new Endpoint(apiKey, endpointId),
  //template...
  //pod...
})

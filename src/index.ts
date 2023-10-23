import axios from "axios"
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
type EndpointOutput = {
  status: string
  output: any
}

const runpodServerlessBaseUrl = "https://api.runpod.ai/v2"
const getAuthHeader = (api_key: string) => ({
  headers: {
    "Authorization": `Bearer ${api_key}`,
    "content-type": "application/json",
  },
})
const maxWaitTimeSeconds = 300
const print = console.log
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const handleErrors = async (axiosRequest) => {
  const resp = await axiosRequest
  const { status, statusText } = resp
  if (status !== 200) {
    return { status, statusText, started: false }
  }
  return { ...resp.data, started: true, completed: true, succeeded: true }
}

const getEndpointUrl = (endpointId) => `${runpodServerlessBaseUrl}/${endpointId}`

//run and then poll status
const runsync = curry(async (api_key, endpointId, request) => {
  const runResp = await run(api_key, endpointId, request)
  let data = runResp.data
  const { id } = data
  const authHeader = getAuthHeader(api_key)
  const statusUrl = getEndpointUrl(endpointId) + "/status/" + id
  const pollIntervalSeconds = 10
  const start = Date.now()
  while (!["COMPLETED", "FAILED"].includes(data.status)) {
    if (Date.now() - start > maxWaitTimeSeconds * 1000) {
      print(`${statusUrl} timed out after ${maxWaitTimeSeconds} seconds`)
      return { ...data, started: true, completed: false }
    }
    await sleep(1000 * pollIntervalSeconds)
    const statusResp = await axios.get(statusUrl, authHeader)
    data = statusResp.data
    print(`${statusUrl}: ${data.status}`)
  }
  return { output: data, started: true, completed: true, succeeded: data.status === "COMPLETED" }
})

//wrapper over /run
const run = curry((api_key: string, endpointId: string, request) => {
  const url = getEndpointUrl(endpointId) + "/run"
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.post(url, request, authHeader))
})
//wrapper over /status
const getStatus = curry((api_key: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/status/" + requestId
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /stream
const stream = curry((api_key: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/stream/" + requestId
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /cancel
const cancel = curry((api_key: string, endpointId: string, requestId: string) => {
  const url = getEndpointUrl(endpointId) + "/cancel/" + requestId
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.post(url, {}, authHeader))
})
//wrapper over /health
const getHealth = curry((api_key: string, endpointId: string) => {
  const url = getEndpointUrl(endpointId) + "/health"
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.get(url, authHeader))
})
//wrapper over /purge-queue
const purgeQueue = curry((api_key: string, endpointId: string) => {
  const url = getEndpointUrl(endpointId) + "/purge-queue"
  const authHeader = getAuthHeader(api_key)
  return handleErrors(axios.post(url, {}, authHeader))
})

class Endpoint {
  endpointId: string = ""
  private api_key: string = ""
  constructor(api_key: string, endpointId: string) {
    this.api_key = api_key
    this.endpointId = endpointId
  }
  async runsync(request: EndpointInputPayload): Promise<EndpointOutput> {
    return runsync(this.api_key, this.endpointId, request)
  }
  async run(request: EndpointInputPayload): Promise<string> {
    return run(this.api_key, this.endpointId, request)
  }
  async getStatus(requestId: string): Promise<EndpointOutput> {
    return getStatus(this.api_key, this.endpointId, requestId)
  }
  async stream(requestId: string): Promise<EndpointOutput> {
    return stream(this.api_key, this.endpointId, requestId)
  }
  async cancel(requestId: string) {
    return cancel(this.api_key, this.endpointId, requestId)
  }
  async getHealth() {
    return getHealth(this.api_key, this.endpointId)
  }
  async purgeQueue() {
    return purgeQueue(this.api_key, this.endpointId)
  }
}

export default (api_key: string) => ({
  endpoint: (endpointId) => new Endpoint(api_key, endpointId),
  //template...
  //pod...
})

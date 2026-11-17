import runpodSdk from "../dist/index.js"

const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env
if (!RUNPOD_API_KEY || !ENDPOINT_ID) {
  console.log("please supply RUNPOD_API_KEY and ENDPOINT_ID as an environment variable")
  process.exit()
}
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(ENDPOINT_ID)

const request = {
  input: {
    prompt: "photo of a horse",
  },
}

console.log("\nrun")
const runResp = await endpoint.run(request)
console.log(runResp)
const { id: requestId } = runResp
console.log("\nstatus")
const statusResp = await endpoint.status(requestId)
console.log(statusResp)
console.log("\ncancel")
const cancelResp = await endpoint.cancel(requestId)
console.log(cancelResp)
console.log("\nhealth")
const healthResp = await endpoint.health()
console.log(healthResp)
console.log("\npurge queue")
const purgeResp = await endpoint.purgeQueue()
console.log(purgeResp)
console.log("\nafter purge")
console.log(await endpoint.health())

console.log("runSync")
const result = await endpoint.runSync(request)
console.log(result)

const failingRequest = {
  input: {
    bogus_key: "photo of a horse",
  },
}
console.log("runSync failing")
const failingResult = await endpoint.runSync(failingRequest)
console.log(failingResult)

const slowRequest = {
  input: {
    prompt: "photo of a horse",
    num_inference_steps: 200,
  },
}

console.log("runSync timed out")
const timedOutResult = await endpoint.runSync(slowRequest, 3000)
console.log(timedOutResult)

console.log("\nstream")
//mock endpoint which returns whatever you specify as a stream
//with a specified delay between inputs
const streamingEndpoint = runpod.endpoint("gwp4kx5yd3nur1")
const streamReq = {
  input: {
    mock_return: ["a", "b", "c", "d", "e", "f", "g"],
    mock_delay: 2,
  },
}
const streamRunResp = await streamingEndpoint.run(streamReq)
const { id } = streamRunResp
for await (const result of endpoint.stream(id)) {
  console.log(`stream yielded ${JSON.stringify(result, null, 2)}`)
}

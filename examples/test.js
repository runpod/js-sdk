import runpodSdk from "../dist/index.js"

const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env
if (!(RUNPOD_API_KEY && ENDPOINT_ID)) {
  console.log("please supply RUNPOD_API_KEY and ENDPOINT_ID as environment variables")
  process.exit()
}
//OOP
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(ENDPOINT_ID)
const request = {
  input: {
    prompt: "photo of a horse",
  },
  policy: {
    executionTimeout: 120 * 1000,
  },
}

console.log("\nrun")
const runResp = await endpoint.run(request)
console.log(runResp)
const { id: requestId } = runResp
console.log("\nstatus")
const statusResp = await endpoint.getStatus(requestId)
console.log(statusResp)
console.log("\ncancel")
const cancelResp = await endpoint.cancel(requestId)
console.log(cancelResp)
console.log("\nhealth")
const healthResp = await endpoint.getHealth()
console.log(healthResp)
console.log("\npurge queue")
const purgeResp = await endpoint.purgeQueue()
console.log(purgeResp)
console.log("\nafter purge")
console.log(await endpoint.getHealth())

console.log("runSync")
const result = await endpoint.runSync(request)
console.log(result)

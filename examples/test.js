import runpodSdk from "../dist/index.js"

const { RUNPOD_API_KEY } = process.env
if (!RUNPOD_API_KEY) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint("mock")
const request = {
  input: {
    mock_return: "photo of a horse",
    mock_delay: 20,
  },
  policy: {
    executionTimeout: 10 * 1000,
  },
}

// console.log("\nrun")
// const runResp = await endpoint.run(request)
// console.log(runResp)
// const { id: requestId } = runResp
// console.log("\nstatus")
// const statusResp = await endpoint.getStatus(requestId)
// console.log(statusResp)
// console.log("\ncancel")
// const cancelResp = await endpoint.cancel(requestId)
// console.log(cancelResp)
// console.log("\nhealth")
// const healthResp = await endpoint.getHealth()
// console.log(healthResp)
// console.log("\npurge queue")
// const purgeResp = await endpoint.purgeQueue()
// console.log(purgeResp)
// console.log("\nafter purge")
// console.log(await endpoint.getHealth())

console.log("runSync")
const result = await endpoint.runSync(request)
console.log(result)

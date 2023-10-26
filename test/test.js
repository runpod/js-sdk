import runpodSdk, { runsync } from "../dist/index.js"

const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env
if (!(RUNPOD_API_KEY && ENDPOINT_ID)) {
  process.exit()
}
//OOP
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(ENDPOINT_ID)
const request = {
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
}

console.log("runsync")
const result = await endpoint.runsync(request)
console.log(result)

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
//functional
// const run = runsync(RUNPOD_API_KEY, ENDPOINT_ID)
// const res = await run({
//   input: {
//     prompt: "a photo of a horse the size of a Boeing 787",
//   },
// })

// console.log(res)

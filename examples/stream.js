import runpodSdk from "../dist/index.js"

const { RUNPOD_API_KEY } = process.env
if (!RUNPOD_API_KEY) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint("gwp4kx5yd3nur1")
const request = {
  input: {
    mock_return: ["a", "b", "c", "d", "e", "f", "g"],
    mock_delay: 5,
  },
}

console.log("\nrun")
const runResp = await endpoint.run(request)
console.log(runResp)
const { id } = runResp
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
await sleep(5000)
for await (const result of endpoint.stream(id)) {
  console.log(`stream yielded ${JSON.stringify(result, null, 2)}`)
}

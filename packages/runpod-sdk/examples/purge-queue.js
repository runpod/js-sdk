import runpodSdk from "../dist/index.js"
const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env
if (!RUNPOD_API_KEY || !ENDPOINT_ID) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}

const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(ENDPOINT_ID)
const result = await endpoint.purgeQueue()
console.log(result)

import runpodSdk from "runpod-sdk"
const { RUNPOD_API_KEY } = process.env
if (!RUNPOD_API_KEY) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}

const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint("faster-whisper")
const result = await endpoint.health()
console.log(result)

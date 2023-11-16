import runpodSdk from "../dist/index.js"
const { RUNPOD_API_KEY } = process.env
if (!RUNPOD_API_KEY) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}

const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint("faster-whisper")
const input = {
  input: {
    audio: "https://github.com/runpod-workers/sample-inputs/raw/main/audio/gettysburg.wav",
    model: "base",
  },
}
const result = await endpoint.run(input)
console.log("run resp")
console.log(result)

const { id } = result
const cancelResp = await endpoint.cancel(id)
console.log("cancel resp")
console.log(cancelResp)

const statusResp = await endpoint.status(id)
console.log("status after cancellation")
console.log(statusResp)

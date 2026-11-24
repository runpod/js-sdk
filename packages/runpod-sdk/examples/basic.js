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
const result = await endpoint.runSync(input)

console.log(result)

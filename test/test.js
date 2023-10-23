const runpodSdk = require("@runpod/sdk")
const { RUNPOD_API_KEY } = process.env
const endpointId = "qhj9cwwco1pszj"
if (!RUNPOD_API_KEY) {
  process.exit()
}
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(endpointId)
const result = await endpoint.runsync({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
})

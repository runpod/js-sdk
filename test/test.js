import runpodSdk, { runsync } from "../dist/index.js"

const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env
if (!(RUNPOD_API_KEY && ENDPOINT_ID)) {
  process.exit()
}
//OOP
const runpod = runpodSdk(RUNPOD_API_KEY)
const endpoint = runpod.endpoint(ENDPOINT_ID)
const result = await endpoint.runsync({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
})
console.log(result)

//functional
const run = runsync(RUNPOD_API_KEY, ENDPOINT_ID)
const res = await run({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
})

console.log(res)

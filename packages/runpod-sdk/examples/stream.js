import runpodSdk from "runpod-sdk"

const { RUNPOD_API_KEY } = process.env
if (!RUNPOD_API_KEY) {
  console.log("please supply RUNPOD_API_KEY as an environment variable")
  process.exit()
}
const runpod = runpodSdk(RUNPOD_API_KEY)
//mock endpoint which returns whatever you specify as a stream
//with a specified delay between inputs
const endpoint = runpod.endpoint("gwp4kx5yd3nur1")

const request = {
  input: {
    mock_return: ["a", "b", "c", "d", "e", "f", "g"],
    mock_delay: 2,
  },
}
const runResp = await endpoint.run(request)
const { id } = runResp
for await (const result of endpoint.stream(id)) {
  console.log(`stream yielded ${JSON.stringify(result, null, 2)}`)
}

// Expected output
/*
 stream yielded {
  "output": "a",
}
stream yielded {
  "output": "b"
}
stream yielded {
  "output": "c"
}
stream yielded {
  "output": "d"
}
stream yielded {
  "output": "e"
}
stream yielded {
  "output": "f"
}
stream yielded {
  "output": "g"
}
 */

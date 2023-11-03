# js-sdk

JavaScript client sdk for runpod

# Example Usage

```js
const { RUNPOD_API_KEY, ENDPOINT_ID } = process.env;
import runpodSdk from "runpod-sdk";

const runpod = runpodSdk(RUNPOD_API_KEY);
const endpoint = runpod.endpoint(ENDPOINT_ID);
const result = await endpoint.runSync({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
});
```

# Using Endpoints

Once an endpoint has been created, you can send requests to the queue:

```js
const { id } = await endpoint.run({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
});
```

You can check on the status of this request once you have the id:

```js
const status = await endpoint.getStatus(id);
```

If the request has been completed, the status object returned will contain the `output` of the request.

If you don't want to manage polling for request completion yourself, you can simply call `runSync`, which will enqueue the request and then poll until the request completes, fails or times out.

```js
const result = await endpoint.runSync({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
});
```

If you have the id of a request, you can cancel it if it's taking too long or no longer necessary:

```js
await endpoint.cancel(requestId);
```

For long running applications or troubleshooting, you may want to check the health of the endpoint workers:

```js
const health = await endpoint.getHealth();
```

Some Runpod endpoints are configured to yield multiple results for a single input, which can be streamed locally:

```js
const { id } = await endpoint.run({
  input: {
    prompt: "7 photos of a horse the size of a Boeing 787",
  },
});

for await (const result of endpoint.stream(id)) {
  console.log("Stream yielded another photo:");
  console.log(result.output);
}
```

(this horse photo endpoint is fictitious, but it shows why you might want a stream of results)

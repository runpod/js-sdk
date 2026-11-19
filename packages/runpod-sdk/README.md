# runpod-sdk

[![npm version](https://img.shields.io/npm/v/runpod-sdk.svg)](https://www.npmjs.com/package/runpod-sdk)

JavaScript and TypeScript SDK for Runpod. It has two parts:

- The Serverless job client: `run`, `runSync`, `status`, `stream`, `cancel`, `health`, and `purgeQueue` on an endpoint.
- The typed REST v2 client from [`@runpod/typescript-api-sdk`](https://www.npmjs.com/package/@runpod/typescript-api-sdk), for pods, Serverless endpoints, templates, network volumes, and more.

Supports **Node.js 20+**, ESM, and CommonJS.

<!-- runpod-agent-setup:start -->
**For AI agents:** setup instructions for the Runpod skills and MCP server are at https://agents.runpod.io/
<!-- runpod-agent-setup:end -->

# Installation

`npm install runpod-sdk`

Or for Yarn:

`yarn add runpod-sdk`

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

# Using the REST v2 API

`runpod.api` is a typed client for the [Runpod REST v2 API](https://api.runpod.io/v2/docs). Paths, parameters, and responses are typed from the OpenAPI spec.

```js
const { data: pods, error } = await runpod.api.GET("/v2/pods");
```

See the [`@runpod/typescript-api-sdk` README](../typescript-api-sdk/README.md) for retries, timeouts, rate limits, and log streams. Everything that package exports is also exported from `runpod-sdk`.

# Upgrading from 1.x

The `endpoint(id)` methods keep their 1.x names and arguments. Other changes in 2.0.0:

- Node.js 20 or later is required.
- An HTTP error throws `RunpodServerlessError`, with `status`, `statusText`, and `body`.
- The exported `run`, `runSync`, `status`, `stream`, `health`, and `purgeQueue` functions are no longer curried. Call them with all arguments.
- `runSync` no longer logs each poll to the console.

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
const status = await endpoint.status(id);
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
const health = await endpoint.health();
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

# Timeouts

All endpoint functions have a `timeout` parameter which is the maximum amount of time, in milliseconds, to wait for the function to complete.

For example,

```js
const result = await endpoint.runSync({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
}, 5000);
```
will timeout after 5 seconds.

Note that this is the timeout on the *local* function call, not the underlying request in the queue. So this:

```js
const result = await endpoint.run({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
}, 3000);
```

will not enqueue a request which can only take 3 seconds on the server, it will only timeout if the enqueue itself is slower than 3 seconds.

To affect the maximum time a request can take on the backend, you can provide a policy in the request input:

```js
const result = await endpoint.run({
  input: {
    prompt: "a photo of a horse the size of a Boeing 787",
  },
  policy: {
    executionTimeout: 3000,
  }
});
```

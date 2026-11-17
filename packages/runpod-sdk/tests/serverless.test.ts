import { afterEach, describe, expect, it, vi } from "vitest";
import runpodSdk, { createRunpodClient, RunpodServerlessError, runpodServerlessBaseUrlDev } from "../src/index.js";

type Call = { method: string; url: string; headers: Headers; body?: string };

function mockFetch(responses: Array<() => Response>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: string | Request, init: RequestInit = {}) => {
    const request = new Request(input, init);
    const url = request.url;
    calls.push({
      method: request.method,
      url,
      headers: request.headers,
      body: request.body ? await request.text() : undefined,
    });
    const next = responses.shift();
    if (!next) throw new Error(`unexpected request to ${url}`);
    return next();
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Serverless endpoint client", () => {
  const endpoint = runpodSdk("test-key").endpoint("ep1")!;

  it("queues a job with run", async () => {
    const calls = mockFetch([() => Response.json({ id: "job1", status: "IN_QUEUE" })]);
    const result = await endpoint.run({ input: { prompt: "hi" } });
    expect(result).toEqual({ id: "job1", status: "IN_QUEUE" });
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("https://api.runpod.ai/v2/ep1/run");
    expect(calls[0].headers.get("authorization")).toBe("Bearer test-key");
    expect(calls[0].headers.get("user-agent")).toMatch(/^RunPod-JS-SDK\//);
    expect(JSON.parse(calls[0].body!)).toEqual({ input: { prompt: "hi" } });
  });

  it("adds started, completed and succeeded to status", async () => {
    mockFetch([() => Response.json({ id: "job1", status: "COMPLETED", output: 42 })]);
    const result = await endpoint.status("job1");
    expect(result).toMatchObject({ output: 42, started: true, completed: true, succeeded: true });
  });

  it("polls status-sync until runSync finishes", async () => {
    const calls = mockFetch([
      () => Response.json({ id: "job1", status: "IN_PROGRESS" }),
      () => Response.json({ id: "job1", status: "COMPLETED", output: "done" }),
    ]);
    const result = await endpoint.runSync({ input: {} }, 5000);
    expect(result).toMatchObject({ output: "done", completed: true, succeeded: true });
    expect(calls[0].url).toBe("https://api.runpod.ai/v2/ep1/runsync?wait=5000");
    expect(calls[1].url).toMatch(/^https:\/\/api\.runpod\.ai\/v2\/ep1\/status-sync\/job1\?wait=\d+$/);
  });

  it("yields stream outputs until the job ends", async () => {
    mockFetch([
      () => Response.json({ status: "IN_PROGRESS", stream: [{ output: 1 }] }),
      () => Response.json({ status: "COMPLETED", stream: [{ output: 2 }, { output: 3 }] }),
    ]);
    const outputs = [];
    for await (const item of endpoint.stream("job1")) outputs.push(item.output);
    expect(outputs).toEqual([1, 2, 3]);
  });

  it("calls cancel, health and purge-queue", async () => {
    const calls = mockFetch([
      () => Response.json({ id: "job1", status: "CANCELLED" }),
      () => Response.json({ jobs: {}, workers: {} }),
      () => Response.json({ removed: 2, status: "completed" }),
    ]);
    await endpoint.cancel("job1");
    await endpoint.health();
    expect(await endpoint.purgeQueue()).toEqual({ removed: 2, status: "completed" });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST https://api.runpod.ai/v2/ep1/cancel/job1",
      "GET https://api.runpod.ai/v2/ep1/health",
      "POST https://api.runpod.ai/v2/ep1/purge-queue",
    ]);
  });

  it("throws RunpodServerlessError on a non-2xx answer", async () => {
    mockFetch([() => new Response("nope", { status: 401, statusText: "Unauthorized" })]);
    const error = await endpoint.health().catch((e) => e);
    expect(error).toBeInstanceOf(RunpodServerlessError);
    expect(error.status).toBe(401);
    expect(error.body).toBe("nope");
  });

  it("uses the baseUrl option", async () => {
    const calls = mockFetch([() => Response.json({ jobs: {}, workers: {} })]);
    await runpodSdk("k", { baseUrl: runpodServerlessBaseUrlDev }).endpoint("ep2")!.health();
    expect(calls[0].url).toBe("https://dev-api.runpod.ai/v2/ep2/health");
  });
});

describe("REST v2 client", () => {
  it("re-exports createRunpodClient and exposes it as sdk.api", async () => {
    expect(typeof createRunpodClient).toBe("function");
    const calls = mockFetch([() => Response.json([])]);
    const sdk = runpodSdk("test-key", { apiBaseUrl: "https://rest.example" });
    const { response } = await sdk.api.GET("/v2/pods");
    expect(response.ok).toBe(true);
    expect(sdk.api).toBe(sdk.api);
    expect(calls).toHaveLength(1);
  });
});

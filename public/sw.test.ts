// Loads the service worker with stubbed `self` / `caches` and drives its event handlers.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (event: Record<string, unknown>) => void;
const handlers: Record<string, Handler> = {};

const cache = { add: vi.fn(), put: vi.fn() };
const caches = {
  open: vi.fn(),
  keys: vi.fn(),
  delete: vi.fn(),
  match: vi.fn(),
};
const sw = {
  addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
  skipWaiting: vi.fn(),
  clients: { claim: vi.fn() },
};

beforeAll(async () => {
  vi.stubGlobal("self", sw);
  vi.stubGlobal("caches", caches);
  // @ts-expect-error -- plain service worker script, loaded for its side effects
  await import("./sw.js");
});

beforeEach(() => {
  vi.stubGlobal("caches", caches);
  caches.open.mockResolvedValue(cache);
});

/** Dispatches a fetch event and resolves with what the worker responded (or undefined). */
async function dispatchFetch(request: { url: string; method?: string; mode?: string }) {
  let responded: Promise<unknown> | undefined;
  handlers.fetch({ request: { method: "GET", ...request }, respondWith: (p: Promise<unknown>) => (responded = p) });
  return responded && (await responded);
}

describe("service worker", () => {
  it("pre-caches the offline page on install", async () => {
    let wait!: Promise<unknown>;
    handlers.install({ waitUntil: (p: Promise<unknown>) => (wait = p) });
    await wait;
    expect(cache.add).toHaveBeenCalledWith("/offline.html");
    expect(sw.skipWaiting).toHaveBeenCalled();
  });

  it("deletes old caches on activate", async () => {
    caches.keys.mockResolvedValue(["gradepoints-v1", "gradepoints-v2"]);
    let wait!: Promise<unknown>;
    handlers.activate({ waitUntil: (p: Promise<unknown>) => (wait = p) });
    await wait;
    expect(caches.delete).toHaveBeenCalledWith("gradepoints-v1");
    expect(caches.delete).not.toHaveBeenCalledWith("gradepoints-v2");
    expect(sw.clients.claim).toHaveBeenCalled();
  });

  it("ignores non-GET and non-navigation API requests", async () => {
    expect(await dispatchFetch({ url: "https://x/api/grades", method: "POST" })).toBeUndefined();
    expect(await dispatchFetch({ url: "https://x/api/grades" })).toBeUndefined();
  });

  it("serves static assets cache-first, caching misses", async () => {
    const cached = new Response("cached");
    caches.match.mockResolvedValueOnce(cached);
    expect(await dispatchFetch({ url: "https://x/icon-192.png" })).toBe(cached);

    const network = new Response("fresh");
    caches.match.mockResolvedValueOnce(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(network));
    expect(await dispatchFetch({ url: "https://x/_next/static/app.js" })).toBe(network);
    await vi.waitFor(() => expect(cache.put).toHaveBeenCalled());
  });

  it("falls back to the offline page for failed navigations", async () => {
    const offline = new Response("offline");
    caches.match.mockResolvedValue(offline);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await dispatchFetch({ url: "https://x/dashboard", mode: "navigate" })).toBe(offline);
  });
});

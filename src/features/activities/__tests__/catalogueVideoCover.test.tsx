import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";

import {
  clearCatalogueVideoCovers,
  loadCatalogueVideoCover,
  MAX_CONCURRENT_GENERATIONS,
  peekCatalogueVideoCover,
  useCatalogueVideoCover,
} from "@/features/activities/catalogueVideoCover";

/**
 * PRE-6 story 5.1b (revue) — cache des affiches vidéo partagé par le Catalogue et la Composition :
 * file FIFO de deux générations au plus, échec non gardé (nouvel essai au montage suivant), état
 * initial synchrone pour une affiche déjà générée.
 */
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn() }));
const poster = jest.requireMock("@/infrastructure/media/VideoPoster") as {
  generateVideoPoster: jest.Mock<(uri: string) => Promise<unknown>>;
};

type Deferred = { uri: string; resolve: (value: unknown) => void; reject: (error: unknown) => void };

/** Chaque génération reste en attente jusqu'à ce que le test la résolve. */
function deferGenerations(): Deferred[] {
  const calls: Deferred[] = [];
  poster.generateVideoPoster.mockImplementation(
    (uri: string) =>
      new Promise((resolve, reject) => {
        calls.push({ uri, resolve, reject });
      }),
  );
  return calls;
}

const handle = (name: string) => ({ image: { width: 1, height: 1, release: jest.fn(), name }, release: jest.fn() });

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

describe("catalogueVideoCover (PRE-6 story 5.1b, revue)", () => {
  beforeEach(async () => {
    poster.generateVideoPoster.mockReset();
    poster.generateVideoPoster.mockImplementation(async () => null);
    await clearCatalogueVideoCovers();
  });
  afterEach(async () => {
    poster.generateVideoPoster.mockImplementation(async () => null);
  });

  it("at most two generations at a time; the others wait in FIFO order", async () => {
    expect(MAX_CONCURRENT_GENERATIONS).toBe(2);
    const calls = deferGenerations();
    const loads = ["v1", "v2", "v3", "v4"].map((uri) => loadCatalogueVideoCover(uri));
    await flush();
    expect(calls.map((call) => call.uri)).toEqual(["v1", "v2"]);
    calls[1]!.resolve(handle("v2"));
    await flush();
    expect(calls.map((call) => call.uri)).toEqual(["v1", "v2", "v3"]);
    calls[0]!.reject(new Error("lecteur indisponible"));
    await flush();
    expect(calls.map((call) => call.uri)).toEqual(["v1", "v2", "v3", "v4"]);
    calls[2]!.resolve(null);
    calls[3]!.resolve(handle("v4"));
    const results = await Promise.all(loads);
    expect(results.map((result) => (result === null ? null : (result as unknown as { image: { name: string } }).image.name))).toEqual([
      null,
      "v2",
      null,
      "v4",
    ]);
  });

  it("one generation per URI while it is pending; a resolved poster is reused without a new generation", async () => {
    const calls = deferGenerations();
    const first = loadCatalogueVideoCover("v1");
    const second = loadCatalogueVideoCover("v1");
    await flush();
    expect(calls).toHaveLength(1);
    calls[0]!.resolve(handle("v1"));
    expect(await first).toBe(await second);
    expect(await loadCatalogueVideoCover("v1")).toBe(await first);
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(1);
    expect(peekCatalogueVideoCover("v1")).toBe(await first);
  });

  it("a failure (no poster, timeout or rejection) is not kept: a later mount retries", async () => {
    poster.generateVideoPoster.mockImplementationOnce(async () => null);
    expect(await loadCatalogueVideoCover("v1")).toBeNull();
    expect(peekCatalogueVideoCover("v1")).toBeUndefined();
    poster.generateVideoPoster.mockImplementationOnce(async () => {
      throw new Error("délai dépassé");
    });
    expect(await loadCatalogueVideoCover("v1")).toBeNull();
    const ready = handle("v1");
    poster.generateVideoPoster.mockImplementationOnce(async () => ready);
    expect(await loadCatalogueVideoCover("v1")).toBe(ready);
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(3);
  });

  it("hook: a failed mount stays failed, a new mount of the same URI retries and shows the poster", async () => {
    poster.generateVideoPoster.mockImplementationOnce(async () => null);
    const first = renderHook(() => useCatalogueVideoCover("v1"));
    expect(first.result.current).toEqual({ status: "loading" });
    await flush();
    expect(first.result.current).toEqual({ status: "failed" });
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(1);
    first.unmount();

    const ready = handle("v1");
    poster.generateVideoPoster.mockImplementationOnce(async () => ready);
    const second = renderHook(() => useCatalogueVideoCover("v1"));
    await flush();
    expect(second.result.current).toEqual({ status: "ready", image: ready.image });
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(2);
  });

  it("hook: an already generated poster is the synchronous initial state (no placeholder on remount)", async () => {
    const ready = handle("v1");
    poster.generateVideoPoster.mockImplementation(async () => ready);
    await loadCatalogueVideoCover("v1");
    const seen: string[] = [];
    renderHook(() => {
      const cover = useCatalogueVideoCover("v1");
      seen.push(cover.status);
      return cover;
    });
    expect(seen[0]).toBe("ready");
    expect(seen).not.toContain("loading");
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(1);
  });

  it("hook: switching to an already generated URI is immediate; null stays loading without generation", async () => {
    const ready = handle("v2");
    poster.generateVideoPoster.mockImplementation(async () => ready);
    await loadCatalogueVideoCover("v2");
    poster.generateVideoPoster.mockClear();
    const view = renderHook(({ uri }: { uri: string | null }) => useCatalogueVideoCover(uri), {
      initialProps: { uri: null as string | null },
    });
    expect(view.result.current).toEqual({ status: "loading" });
    view.rerender({ uri: "v2" });
    expect(view.result.current).toEqual({ status: "ready", image: ready.image });
    expect(poster.generateVideoPoster).not.toHaveBeenCalled();
  });
});

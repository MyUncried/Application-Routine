import { act, renderHook } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { createElement, StrictMode, type ReactNode } from "react";

import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";

// Fichier `.ts` volontairement (pas `.tsx`, conformément au plan) : le
// wrapper de contexte utilise `React.createElement` plutôt que la syntaxe
// JSX, qui ne serait pas transformée dans un fichier `.ts`.

// PRE-8 (E.1, E.2) : le hook lit le Catalogue unifié (`listCatalogueSessions`) et le projette.
function aSummary(id: string): CatalogueSessionRecord {
  return {
    id,
    name: `Séance ${id}`,
    color: "#3B82F6",
    labelId: null,
    status: "ACTIVE",
    archivedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    structure: { elements: [], stopPoints: [] },
  };
}

/** Projection attendue, sans référentiel de catégories (aucun contexte dans ces tests). */
const projected = (records: readonly CatalogueSessionRecord[]) => records.map((record) => projectSessionForCatalogue(record, new Map()));

/** Laisse se résoudre la lecture et la projection (plusieurs micro-tâches). */
async function flush() {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

/** Promesse dont la résolution/le rejet est contrôlé manuellement par le test. */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeFakeService(): {
  service: SessionService;
  listCatalogueSessions: jest.Mock<() => Promise<readonly CatalogueSessionRecord[]>>;
} {
  const listCatalogueSessions = jest.fn<() => Promise<readonly CatalogueSessionRecord[]>>();
  const service = { listCatalogueSessions } as unknown as SessionService;
  return { service, listCatalogueSessions };
}

function makeWrapper(service: SessionService, strict = false) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const provider = createElement(SessionServiceContext.Provider, { value: service }, children);
    return strict ? createElement(StrictMode, null, provider) : provider;
  };
}

describe("useSessionCatalogue", () => {
  it("starts in the loading state", () => {
    const { service } = makeFakeService();
    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    expect(result.current.state).toEqual({ status: "loading" });
  });

  it("transitions to empty when listCatalogueSessions resolves with an empty list", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);
    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    await act(async () => {
      result.current.reload();
      await flush();
    });

    expect(result.current.state).toEqual({ status: "empty" });
  });

  it("transitions to ready with the returned sessions", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const sessions = [aSummary("session-1"), aSummary("session-2")];
    listCatalogueSessions.mockResolvedValue(sessions);
    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    await act(async () => {
      result.current.reload();
      await flush();
    });

    expect(result.current.state).toEqual({ status: "ready", sessions: projected(sessions) });
  });

  it("transitions to a distinct error state on rejection, never to empty", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const failure = new Error("technical failure");
    listCatalogueSessions.mockRejectedValue(failure);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    try {
      await act(async () => {
        result.current.reload();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.state).toEqual({ status: "error", error: failure });
      expect(result.current.state.status).not.toBe("empty");
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("lets the most recently triggered reload win over a stale, later-resolving one", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const first = deferred<readonly CatalogueSessionRecord[]>();
    const second = deferred<readonly CatalogueSessionRecord[]>();
    listCatalogueSessions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });
    act(() => {
      result.current.reload();
    });

    // The stale (first) call resolves after the newer (second) one was
    // triggered — it must not win.
    await act(async () => {
      first.resolve([aSummary("stale")]);
      await flush();
    });
    expect(result.current.state).toEqual({ status: "loading" });

    await act(async () => {
      second.resolve([aSummary("fresh")]);
      await flush();
    });
    expect(result.current.state).toEqual({
      status: "ready",
      sessions: projected([aSummary("fresh")]),
    });
  });

  it("cancelPending invalidates the in-flight request: its late resolution has no effect", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const pending = deferred<readonly CatalogueSessionRecord[]>();
    listCatalogueSessions.mockReturnValue(pending.promise);

    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });
    expect(result.current.state).toEqual({ status: "loading" });

    act(() => {
      result.current.cancelPending();
    });

    await act(async () => {
      pending.resolve([aSummary("too-late")]);
      await flush();
    });

    // Still loading: the resolution was silently ignored, not converted
    // into any state (in particular not "empty").
    expect(result.current.state).toEqual({ status: "loading" });
  });

  it("ignores a resolution that arrives after the component has unmounted", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const pending = deferred<readonly CatalogueSessionRecord[]>();
    listCatalogueSessions.mockReturnValue(pending.promise);

    const { result, unmount } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });

    unmount();

    await act(async () => {
      pending.resolve([aSummary("after-unmount")]);
      await flush();
    });

    // No update was attempted after unmount; the last captured state
    // remains whatever it was right before unmounting.
    expect(result.current.state).toEqual({ status: "loading" });
  });

  it("keeps a stable reference for reload and cancelPending across ordinary re-renders", () => {
    const { service } = makeFakeService();
    const { result, rerender } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service),
    });

    const firstReload = result.current.reload;
    const firstCancelPending = result.current.cancelPending;

    rerender({});

    expect(result.current.reload).toBe(firstReload);
    expect(result.current.cancelPending).toBe(firstCancelPending);
  });

  it("keeps updating state correctly across React Strict Mode's synthetic mount/unmount/remount cycle", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([aSummary("under-strict-mode")]);

    const { result } = renderHook(() => useSessionCatalogue(), {
      wrapper: makeWrapper(service, true),
    });

    await act(async () => {
      result.current.reload();
      await flush();
    });

    // If the mounted guard were only ever set once via `useRef(true)`
    // (never reset inside the effect body), Strict Mode's synthetic
    // unmount would permanently flip it to `false`, and this update would
    // be silently dropped — this assertion would then fail.
    expect(result.current.state).toEqual({
      status: "ready",
      sessions: projected([aSummary("under-strict-mode")]),
    });
  });
});

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { createElement, type ReactNode } from "react";

import type { ActivityDefinition } from "@/domain/activities";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";

// Fichier `.ts` volontairement (même convention que `useSessionCatalogue.test.ts`) :
// le wrapper de contexte utilise `React.createElement` plutôt que la syntaxe
// JSX, qui ne serait pas transformée dans un fichier `.ts`.

function makeDefinition(id: string): ActivityDefinition {
  return {
    id,
    name: `Activité ${id}`,
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    recoverySeconds: 0,
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeWrapper(service: Partial<ActivityDefinitionService>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      ActivityDefinitionServiceContext.Provider,
      { value: service as ActivityDefinitionService },
      children,
    );
  };
}

describe("useActivityCatalogue", () => {
  it("starts loading, then reaches empty when there is no definition", async () => {
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions: jest
        .fn<ActivityDefinitionService["listActivityDefinitions"]>()
        .mockResolvedValue([]),
    };
    const { result } = renderHook(() => useActivityCatalogue(), {
      wrapper: makeWrapper(service),
    });

    expect(result.current.state.status).toBe("loading");

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.state.status).toBe("empty"));
  });

  it("reaches ready with the listed definitions", async () => {
    const definitions = [makeDefinition("a"), makeDefinition("b")];
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions: jest
        .fn<ActivityDefinitionService["listActivityDefinitions"]>()
        .mockResolvedValue(definitions),
    };
    const { result } = renderHook(() => useActivityCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toEqual({ status: "ready", definitions });
  });

  it("reaches error when the service rejects", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions: jest
        .fn<ActivityDefinitionService["listActivityDefinitions"]>()
        .mockRejectedValue(new Error("boom")),
    };
    const { result } = renderHook(() => useActivityCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.state.status).toBe("error"));
  });

  it("ignores a resolution invalidated by cancelPending", async () => {
    let resolveList: (definitions: readonly ActivityDefinition[]) => void = () => {};
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions: jest.fn(
        () =>
          new Promise<readonly ActivityDefinition[]>((resolve) => {
            resolveList = resolve;
          }),
      ),
    };
    const { result } = renderHook(() => useActivityCatalogue(), {
      wrapper: makeWrapper(service),
    });

    act(() => {
      result.current.reload();
    });
    act(() => {
      result.current.cancelPending();
    });
    await act(async () => {
      resolveList([makeDefinition("a")]);
      await Promise.resolve();
    });

    expect(result.current.state.status).toBe("loading");
  });
});

import { act, render } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { useEffect } from "react";
import { Text } from "react-native";

import { createEmptyDraft, createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import {
  useSessionDraft,
  type SessionDraftContextValue,
} from "@/features/sessions/SessionDraftContext";

function Capture({ onRender }: { onRender: (value: SessionDraftContextValue) => void }) {
  const value = useSessionDraft();
  useEffect(() => {
    onRender(value);
  });
  return <Text>captured</Text>;
}

describe("SessionDraftProvider", () => {
  it("initializes with an empty draft (createEmptyDraft())", () => {
    let captured: SessionDraftContextValue | undefined;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    expect(captured?.draft).toEqual(createEmptyDraft());
  });

  it("updateDraft merges the provided patch into the current draft, without discarding other fields", () => {
    let captured!: SessionDraftContextValue;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({ name: "Séance simple" });
    });
    act(() => {
      captured.updateDraft({ color: "#E5484D" });
    });

    expect(captured.draft.name).toBe("Séance simple");
    expect(captured.draft.color).toBe("#E5484D");
  });

  it("resetDraft restores exactly createEmptyDraft(), discarding every prior modification", () => {
    let captured!: SessionDraftContextValue;
    render(
      <SessionDraftProvider>
        <Capture onRender={(value) => (captured = value)} />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({
        name: "Séance simple",
        color: "#E5484D",
        initialCountdownSeconds: 20,
        finalPhaseSeconds: 15,
        exercise: { ...createExerciseDraft(), name: "Gainage", durationSeconds: 30 },
      });
    });
    expect(captured.draft.name).toBe("Séance simple");

    act(() => {
      captured.resetDraft();
    });

    expect(captured.draft).toEqual(createEmptyDraft());
  });

  it("keeps updateDraft/resetDraft referentially stable across renders caused by a draft change", () => {
    const seenUpdateDraft = new Set<SessionDraftContextValue["updateDraft"]>();
    const seenResetDraft = new Set<SessionDraftContextValue["resetDraft"]>();
    let captured!: SessionDraftContextValue;

    render(
      <SessionDraftProvider>
        <Capture
          onRender={(value) => {
            captured = value;
            seenUpdateDraft.add(value.updateDraft);
            seenResetDraft.add(value.resetDraft);
          }}
        />
      </SessionDraftProvider>,
    );

    act(() => {
      captured.updateDraft({ name: "Séance simple" });
    });
    act(() => {
      captured.updateDraft({ name: "Autre nom" });
    });

    expect(seenUpdateDraft.size).toBe(1);
    expect(seenResetDraft.size).toBe(1);
  });

  it("persists the same draft across two renders of a descendant tree (no unmount in between)", () => {
    const renders: unknown[] = [];

    function Sibling() {
      const { draft } = useSessionDraft();
      renders.push(draft.name);
      return <Text>sibling</Text>;
    }

    const { rerender } = render(
      <SessionDraftProvider>
        <Sibling />
      </SessionDraftProvider>,
    );

    rerender(
      <SessionDraftProvider>
        <Sibling />
      </SessionDraftProvider>,
    );

    // Both renders saw the same (empty) draft name: the Provider's state was
    // never reset by the second render pass, since `SessionDraftProvider`
    // itself was never unmounted between the two `render`/`rerender` calls.
    expect(renders).toEqual(["", ""]);
  });
});

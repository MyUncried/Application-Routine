import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import type { ModelMovement } from "@/domain/sessions/formatModels";
import { compactBlockDuration, modelTimeline } from "@/domain/sessions/formatTimeline";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { TableCell } from "@/features/sessions/FormatTables";

/**
 * Recette iPhone du 05/11/2026 (Hermann) — cahier « Recette Formats 04/11 » : Déroulé AMRAP en durée compacte (constat e),
 * charge For time atteinte par la barre (e-fortime-charge), options du Circuit replié qui glissent (e-replie-glisse).
 */
describe("Déroulé : durée compacte des blocs (constat e)", () => {
  it("30\", 1'30\", 2'", () => {
    expect(compactBlockDuration(30)).toBe('30"');
    expect(compactBlockDuration(90)).toBe("1'30\"");
    expect(compactBlockDuration(65)).toBe("1'05\"");
    expect(compactBlockDuration(120)).toBe("2'");
  });

  it("AMRAP : un objectif en durée s'affiche au format compact, les répétitions restent des nombres", () => {
    const movement = (id: string, mode: "REPETITIONS" | "DURATION", repetitions: number) =>
      ({ exercise: { id, name: id }, values: { mode, repetitions } }) as unknown as ModelMovement;
    const timeline = modelTimeline("AMRAP", { durationSeconds: 600 }, [movement("a", "DURATION", 45), movement("b", "REPETITIONS", 10)]);
    const labels = timeline.blocks.flatMap((block) => (block.kind === "WORK" ? [block.label] : []));
    expect(labels.slice(0, 2)).toEqual(['45"', "10"]);
  });
});

describe("For time : charge atteinte par Précédent / Suivant (e-fortime-charge)", () => {
  it("case de charge sans zone tactile propre ; objectif resserré", () => {
    render(
      <>
        <TableCell kind="decimal" value={20} barOnly compact boxed onChange={() => undefined} format={String} label="charge" testID="load" />
        <TableCell kind="integer" value={10} tight boxed onChange={() => undefined} format={String} label="objectif" testID="objective" />
      </>,
    );
    expect(screen.getByTestId("load").props.pointerEvents).toBe("none");
    expect(screen.getByTestId("objective").props.pointerEvents).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId("objective").props.style).minHeight).toBe(26);
  });
});

describe("Circuit replié : options glissées avec le Circuit (e-replie-glisse)", () => {
  const row = (slideActions: boolean) => (
    <SwipeActionsRow
      actions={[{ key: "rename", label: "Renommer", backgroundColor: "#000", onPress: () => undefined }]}
      revealed
      slideActions={slideActions}
      onReveal={() => undefined}
      onHide={() => undefined}
      onPress={() => undefined}
      accessibilityLabel="Circuit"
      testID="row"
    >
      <Text>Circuit</Text>
    </SwipeActionsRow>
  );

  it("le bloc d'actions suit la translation de la rangée", () => {
    render(row(true));
    expect(StyleSheet.flatten(screen.getByTestId("row-actions").props.style).transform).toBeDefined();
  });

  it("sans l'option, le bloc d'actions reste découvert sur place", () => {
    render(row(false));
    expect(StyleSheet.flatten(screen.getByTestId("row-actions").props.style).transform).toBeUndefined();
  });
});

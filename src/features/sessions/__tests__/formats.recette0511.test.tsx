import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import type { ModelMovement } from "@/domain/sessions/formatModels";
import { compactBlockDuration, modelTimeline } from "@/domain/sessions/formatTimeline";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { formatSeconds, TableCell } from "@/features/sessions/FormatTables";

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
  it("case de charge sans zone tactile propre ; objectif au cadre standard de 24 (remarque e du 06/11)", () => {
    render(
      <>
        <TableCell kind="decimal" value={20} barOnly width={60} onChange={() => undefined} format={String} label="charge" testID="load" />
        <TableCell kind="integer" value={10} width={60} onChange={() => undefined} format={String} label="objectif" testID="objective" />
      </>,
    );
    expect(screen.getByTestId("load").props.pointerEvents).toBe("none");
    expect(screen.getByTestId("objective").props.pointerEvents).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId("objective").props.style).minHeight).toBe(24);
  });
});

describe("contre-recette du 05/11 (k-fortime-pastille, k-clavier-vide)", () => {
  it("charge : « kg » toujours affiché pendant la saisie, curseur devant l'unité", () => {
    const onChange = jest.fn();
    render(<TableCell kind="decimal" value={null} entrySuffix=" kg" onChange={onChange} format={String} label="charge" testID="load" />);
    fireEvent(screen.getByTestId("load"), "focus");
    fireEvent.changeText(screen.getByTestId("load"), "12,5");
    expect(screen.getByTestId("load").props.value).toBe("12,5 kg");
    expect(screen.getByTestId("load").props.selection).toEqual({ start: 4, end: 4 });
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it("pastille vide : le texte de remplacement (« Sans limite ») est affiché comme une valeur", () => {
    render(<TableCell kind="duration" value={null} badge placeholder="Sans limite" onChange={() => undefined} format={String} label="Temps limite" testID="cap" />);
    expect(screen.getByTestId("cap").props.value).toBe("Sans limite");
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

describe("recette du 05/11 au soir (r-tabata : « entrée 01:30 affiche 1 min »)", () => {
  it("durées des cases de tableau au format court : « 1 min 30 », « 12 min 30 », « 1 min 05 » ; minutes ou secondes seules inchangées", () => {
    expect(formatSeconds(90)).toBe("1 min 30");
    expect(formatSeconds(750)).toBe("12 min 30");
    expect(formatSeconds(65)).toBe("1 min 05");
    expect(formatSeconds(60)).toBe("1 min");
    expect(formatSeconds(45)).toBe("45 s");
  });

  it("une durée saisie « 01:30 » s'affiche « 1 min 30 » au repos", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <TableCell kind="duration" value={null} onChange={onChange} format={formatSeconds} label="Objectif" testID="cell" />,
    );
    fireEvent(screen.getByTestId("cell"), "focus");
    for (const digit of "130") fireEvent.changeText(screen.getByTestId("cell"), `${screen.getByTestId("cell").props.value as string}${digit}`);
    fireEvent(screen.getByTestId("cell"), "blur");
    expect(onChange).toHaveBeenLastCalledWith(90);
    rerender(<TableCell kind="duration" value={90} onChange={onChange} format={formatSeconds} label="Objectif" testID="cell" />);
    expect(screen.getByTestId("cell").props.value).toBe("1 min 30");
  });
});

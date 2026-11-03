import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { CircuitNature } from "@/domain/sessions/circuit";
import type { ElementFormat } from "@/domain/sessions/formats";
import type { FormatModelKey } from "@/domain/sessions/formatModels";
import type { Activity } from "@/domain/sessions/Session";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { carrierHeaderOf, circuitDisplayTitle } from "@/features/sessions/carrierPresentation";
import { CircuitHeader } from "@/features/sessions/CircuitHeader";
import { collapsedCircuitTone } from "@/features/sessions/compositionPresentation";
import { layoutDropCandidates, layoutHeaderKey, layoutItemKey, type LayoutBox } from "@/features/sessions/layoutDrop";
import { projectSessionTree } from "@/features/sessions/sessionCatalogueProjection";
import { treeLineLabel } from "@/features/sessions/SessionCompositionTree";

/**
 * PRE-9 — recette iPhone n° 3 du 03/11/2026 (autres constats, Composition de séance) : nom du Circuit
 * d'après son modèle d'origine (point 1), alignement de la nature d'un Circuit porteur (point 2),
 * tonalité du Circuit replié (point 3), emplacements interdits par le buy-in / buy-out (point 5).
 * Jest ne prouve ni le rendu ni le geste sur iPhone.
 */

function renderHeader({
  nature = "SERIES",
  letter,
  format,
  originModel,
}: { nature?: CircuitNature; letter?: string; format?: ElementFormat; originModel?: FormatModelKey } = {}) {
  render(
    <CircuitHeader
      nature={nature}
      letter={letter}
      count={8}
      duration="4 min"
      isCounterOpen={false}
      onToggleCounter={jest.fn()}
      onChangeCount={jest.fn()}
      isNatureMenuOpen={false}
      natureFocusRequest={0}
      onOpenNatureMenu={jest.fn()}
      onCloseNatureMenu={jest.fn()}
      onSelectNature={jest.fn()}
      isCollapsed={false}
      onToggleCollapsed={jest.fn()}
      memberNames={[]}
      carrier={format === undefined ? undefined : carrierHeaderOf({ nature, format }, undefined)}
      originTitle={circuitDisplayTitle({ format: format ?? null, originModel: originModel ?? null })}
      testID="header"
    />,
  );
}

describe("point 1 — nom du Circuit = nom du format", () => {
  it("Circuit standard d'un modèle : « Tabata » à la place de « Circuit », lettre conservée ; sans modèle : « Circuit »", () => {
    renderHeader({ originModel: "TABATA" });
    expect(screen.getByTestId("header-title")).toHaveTextContent("Tabata");
    expect(screen.getByTestId("header-collapse").props.accessibilityLabel).toBe("Tabata, 4 min");
    screen.unmount();
    renderHeader({ originModel: "STRENGTH", letter: "B" });
    expect(screen.getByTestId("header-title")).toHaveTextContent("Renforcement B");
    screen.unmount();
    renderHeader({ letter: "A" });
    expect(screen.getByTestId("header-title")).toHaveTextContent("Circuit A");
  });

  it("le compteur suit le titre réel : largeur minimale seulement, aucun écart fixe depuis le bord (un titre long décale le compteur)", () => {
    renderHeader({ originModel: "PROGRESSION" });
    const target = StyleSheet.flatten(screen.getByTestId("header-collapse").props.style);
    expect(target.width).toBeUndefined();
    expect(target.minWidth).toBeGreaterThan(0);
    const slot = StyleSheet.flatten(screen.getByTestId("header-counter-slot").props.style);
    expect(slot.position).toBeUndefined();
    expect(slot.flexShrink).toBe(0);
  });

  it("circuitDisplayTitle : Format du porteur, sinon modèle d'origine, sinon rien", () => {
    expect(circuitDisplayTitle({ format: { key: "AMRAP", settings: {} }, originModel: "AMRAP" })).toBe("AMRAP");
    expect(circuitDisplayTitle({ originModel: "INTERVALS_30_30" })).toBe("30/30");
    expect(circuitDisplayTitle({})).toBeUndefined();
  });

  it("Catalogue des Séances : « Tabata · 8 tours · alternées » ; Circuit de la Composition : « Circuit · … »", () => {
    const activity = (id: string) => ({ id, type: "EXERCISE", name: id, executionParameters: durationParameters(20, 8, 10), postActivityRecoverySeconds: 0 }) as unknown as Activity;
    const structure: SessionStructure<Activity, StructureStopPointLocation & { id: string }> = {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "t", repeatCount: 8, nature: "SERIES", originModel: "TABATA", exercises: [activity("a"), activity("b")] } },
        { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", exercises: [activity("c1"), activity("c2")] } },
      ],
      stopPoints: [],
    };
    const lines = projectSessionTree({ structure }).filter((line) => line.kind === "CIRCUIT");
    expect(lines.map((line) => treeLineLabel(line).name)).toEqual(["Tabata · 8 tours · alternées", "Circuit · 2 tours · groupées"]);
  });
});

describe("point 2 — nature d'un Circuit porteur alignée sur la ligne", () => {
  it("le texte « groupées » est posé dans la même boîte que l'adjectif du menu (décalage du contenu identique)", () => {
    renderHeader({ nature: "TOURS", format: { key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 0 } } });
    expect(screen.getByTestId("header-counter-adjective")).toHaveTextContent("groupées");
    const carrierBox = StyleSheet.flatten(screen.getByTestId("header-counter-adjective-target", { includeHiddenElements: true }).props.style);
    screen.unmount();
    renderHeader({ nature: "TOURS" });
    const menuBox = StyleSheet.flatten(screen.getByTestId("header-counter-adjective-target", { includeHiddenElements: true }).props.style);
    expect(carrierBox).toEqual(menuBox);
    expect(carrierBox.paddingTop).toBeGreaterThan(0);
  });
});

function withPhases(durations: readonly number[]): ExecutionParameters {
  const base = durationParameters(30, 3, 10);
  return {
    ...base,
    series: { ...base.series, workPhases: durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds })) },
  } as ExecutionParameters;
}

describe("point 3 — tonalité du Circuit replié", () => {
  const complete = { executionParameters: durationParameters(30, 3, 10) };
  const toVerify = { executionParameters: withPhases([6, 4]), phasesToVerify: [2] };
  const incomplete = { executionParameters: withPhases([0, 4]) };

  it("aucune carte signalée : aplat habituel ; « à vérifier » : orange ; « à compléter » prime", () => {
    expect(collapsedCircuitTone([complete, complete])).toBeNull();
    expect(collapsedCircuitTone([complete, toVerify])).toBe("TO_VERIFY");
    expect(collapsedCircuitTone([toVerify, incomplete, complete])).toBe("INCOMPLETE");
    expect(collapsedCircuitTone([])).toBeNull();
  });
});

describe("point 5 — glisser : aucun emplacement interdit par le buy-in / buy-out", () => {
  type Item = { readonly id: string; readonly format?: ElementFormat };
  const AMRAP: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 600, restBetweenBlocksSeconds: 0 } };
  const buyIn: Item = { id: "in", format: { key: "AMRAP", settings: { incrementPerRound: 0, passageOnce: 1 } } };
  const member = (id: string): Item => ({ id, format: { key: "AMRAP", settings: { incrementPerRound: 0 } } });
  const layout: Pick<SessionStructure<Item>, "elements"> = {
    elements: [
      { kind: "EXERCISE", exercise: { id: "x" } },
      { kind: "CIRCUIT", circuit: { id: "am", repeatCount: 2, nature: "TOURS", format: AMRAP, exercises: [buyIn, member("a"), member("b")] } },
    ],
  };
  const box = (top: number, height: number): LayoutBox => ({ top, height });
  const boxes = new Map<string, LayoutBox>([
    [layoutItemKey({ kind: "EXERCISE", id: "x" }), box(0, 80)],
    [layoutItemKey({ kind: "CIRCUIT", id: "am" }), box(100, 310)],
    [layoutHeaderKey("CIRCUIT", "am"), box(114, 18)],
    [layoutItemKey({ kind: "EXERCISE", id: "in" }), box(141, 80)],
    [layoutItemKey({ kind: "EXERCISE", id: "a" }), box(230, 80)],
    [layoutItemKey({ kind: "EXERCISE", id: "b" }), box(319, 80)],
  ]);
  const passage = (item: Item) => item.format?.settings.passageOnce === 1;
  const inCircuit = (source: string) =>
    layoutDropCandidates(layout, { kind: "EXERCISE", id: source }, boxes, (item) => item.id, undefined, [], passage)
      .filter((candidate) => candidate.container.kind === "CIRCUIT")
      .map((candidate) => candidate.index);

  it("le buy-in n'a que sa propre place dans le Circuit ; une autre carte jamais avant lui ; sans prédicat : inchangé", () => {
    expect(inCircuit("in")).toEqual([0]);
    expect(inCircuit("b")).toEqual([1, 2]);
    expect(inCircuit("x")).toEqual([1, 2, 3]);
    expect(
      layoutDropCandidates(layout, { kind: "EXERCISE", id: "x" }, boxes, (item) => item.id)
        .filter((candidate) => candidate.container.kind === "CIRCUIT")
        .map((candidate) => candidate.index),
    ).toEqual([0, 1, 2, 3]);
  });
});

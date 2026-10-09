import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import { StyleSheet } from "react-native";

import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import {
  ActivityEditorForm,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Éditeur commun d'un Exercice (CE-T03-04, PRE-3). Rendu et actions de cette
 * surface uniquement : la phrase et ses montants sont générés par le Domaine
 * (`executionPhrase`, `executionCalculations`), prouvés dans leurs suites —
 * ici, on vérifie qu'ils sont affichés tels quels, en flux, sans stockage.
 */
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" },
  { id: "fessier", name: "Fessier", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

function fakeReferentialService(): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => BODY_ZONE_FIXTURES),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function parameters(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: 90, pauseSeconds: 15 },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  };
}

const variable = (rows: [number | null, number][]) => ({
  kind: "VARIABLE" as const,
  rows: rows.map(([target, pauseSeconds]) => ({ target, pauseSeconds })),
});

function baseValue(overrides: Partial<ActivityEditorFormValue> = {}): ActivityEditorFormValue {
  return { name: "", instruction: null, executionParameters: parameters(), bodyZoneIds: [], media: [], ...overrides };
}

function Harness({
  initial,
  onChangeSpy,
  onFinish = jest.fn(),
  errorMessage = null,
  isFinishDisabled = false,
  category = null,
  onOpenCategory = jest.fn(),
  onBodyZonesPickerClose,
}: {
  initial?: Partial<ActivityEditorFormValue>;
  onChangeSpy?: (patch: Partial<ActivityEditorFormValue>) => void;
  onFinish?: () => void;
  errorMessage?: string | null;
  isFinishDisabled?: boolean;
  category?: EditorCategory;
  onOpenCategory?: () => void;
  onBodyZonesPickerClose?: () => void;
}) {
  const [value, setValue] = useState<ActivityEditorFormValue>(baseValue(initial));
  return (
    <TestSafeAreaProvider>
      <ReferentialServiceContext.Provider value={fakeReferentialService()}>
        <ActivityEditorForm
          value={value}
          onChange={(patch) => {
            onChangeSpy?.(patch);
            setValue((current) => ({ ...current, ...patch }));
          }}
          bodyZones={BODY_ZONE_FIXTURES}
          onBodyZonesPickerClose={onBodyZonesPickerClose}
          category={category}
          onOpenCategory={onOpenCategory}
          profileSideRecoverySecondsDefault={10}
          mediaService={null}
          mediaDraftId="draft-test"
          finishLabel="Terminer"
          onFinish={onFinish}
          isFinishDisabled={isFinishDisabled}
          errorMessage={errorMessage}
          finishSlotTestID="test-finish-slot"
          finishActionTestID="test-finish-action"
          errorTestID="test-save-error"
        />
      </ReferentialServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

/** Texte intégral de la phrase (segments imbriqués concaténés). */
function phrase(): string {
  const node = screen.getByTestId("exercise-parameters-phrase");
  const flatten = (children: unknown): string =>
    Array.isArray(children)
      ? children.map(flatten).join("")
      : typeof children === "string"
        ? children
        : children && typeof children === "object" && "props" in children
          ? flatten((children as { props: { children: unknown } }).props.children)
          : "";
  return flatten(node.props.children);
}

function boldSegments(): string[] {
  const children = screen.getByTestId("exercise-parameters-phrase").props.children as unknown[];
  return (Array.isArray(children) ? children : [children])
    .filter((child): child is { props: { children: string } } => typeof child === "object" && child !== null)
    .map((child) => child.props.children);
}

describe("ActivityEditorForm — contrats conservés", () => {
  it("renders and reports the name field", () => {
    const onChangeSpy = jest.fn();
    render(<Harness initial={{ name: "Squat" }} onChangeSpy={onChangeSpy} />);
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes");
    expect(onChangeSpy).toHaveBeenCalledWith({ name: "Fentes" });
  });

  it("selects body zones via the picker modal and applies them on Confirmer; notifies the caller on close", async () => {
    const onBodyZonesPickerClose = jest.fn();
    render(<Harness onBodyZonesPickerClose={onBodyZonesPickerClose} />);
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(screen.getByText("Cuisses")).toBeTruthy();
    expect(onBodyZonesPickerClose).toHaveBeenCalledTimes(1);
  });

  it("shows the provided error message above the finish action and honours the external disabled state", () => {
    const onFinish = jest.fn();
    render(<Harness errorMessage="Échec" isFinishDisabled onFinish={onFinish} />);
    expect(screen.getByTestId("test-save-error").props.children).toBe("Échec");
    fireEvent.press(screen.getByTestId("test-finish-action"));
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("isActivityEditorFormValid — nom et paramètres canoniques valides ; Catégorie et Zone exigées pour un nouvel Exercice", () => {
    expect(isActivityEditorFormValid(baseValue())).toBe(false);
    expect(isActivityEditorFormValid(baseValue({ name: "Squat" }))).toBe(true);
    expect(isActivityEditorFormValid(baseValue({ name: "Squat", executionParameters: parameters({ mode: null }) }))).toBe(false);
    expect(
      isActivityEditorFormValid(baseValue({ name: "Squat" }), { requireReferences: true, hasCategory: true }),
    ).toBe(false);
    expect(
      isActivityEditorFormValid(baseValue({ name: "Squat", bodyZoneIds: ["cou"] }), { requireReferences: true, hasCategory: true }),
    ).toBe(true);
  });
});

describe("ActivityEditorForm — PRE-3", () => {
  it("P3-02/editor-fields — nom, Catégorie, Zones, Paramètres, description et médias accessibles ; Terminer désactivé tant que l'adaptateur l'exige", () => {
    const onOpenCategory = jest.fn();
    const onFinish = jest.fn();
    render(<Harness onOpenCategory={onOpenCategory} onFinish={onFinish} isFinishDisabled />);
    expect(screen.getByLabelText("Nom de l’exercice")).toBeTruthy();
    expect(screen.getByLabelText("Catégorie — non renseignée")).toBeTruthy();
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    expect(onOpenCategory).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("exercise-body-zones-open")).toBeTruthy();
    expect(screen.getByTestId("exercise-parameters-card")).toBeTruthy();
    expect(screen.getByLabelText("Description de l’exercice")).toBeTruthy();
    expect(screen.getByText("Médias")).toBeTruthy();
    expect(screen.getByTestId("test-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("test-finish-action"));
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("P3-02/keyboard-scroll — corps défilant avec clavier ; Terminer hors du défilement, marge Safe Area ; description sans hauteur figée", () => {
    render(<Harness />);
    expect(screen.getByTestId("exercise-body").props.keyboardShouldPersistTaps).toBe("handled");
    const instruction = StyleSheet.flatten(screen.getByTestId("exercise-instruction-input").props.style);
    expect(instruction.height).toBeUndefined();
    expect(instruction.minHeight).toBeGreaterThanOrEqual(44);
    const slot = StyleSheet.flatten(screen.getByTestId("test-finish-slot").props.style);
    expect(slot.marginBottom).toBeGreaterThanOrEqual(16);
    expect(within(screen.getByTestId("exercise-body")).queryByTestId("test-finish-action")).toBeNull();
  });

  it("P3-12/normative-totals — totaux affichés tels que calculés : A 195 s, C 405 s, D 375 s exacts ; Répétitions cadencées ≈ 5 min ; Durée cadencée 5 min exact", () => {
    const rows = variable([[30, 10], [45, 20], [60, 30]]);
    const cases: [ExecutionParametersInput, string][] = [
      [parameters({ series: rows }), "Durée totale : 3 min 15 s."],
      [parameters({ series: rows, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }), "Durée totale : 6 min 45 s."],
      [
        parameters({ series: rows, sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 15 }),
        "Durée totale : 6 min 15 s.",
      ],
      [
        parameters({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 4, target: 15, pauseSeconds: 15 }, cadenceBeepIntervalSeconds: 4 }),
        "Durée totale : ≈ 5 min.",
      ],
      [
        parameters({ series: { kind: "UNIFORM", count: 4, target: 60, pauseSeconds: 15 }, cadenceBeepIntervalSeconds: 4 }),
        "Durée totale : 5 min.",
      ],
    ];
    for (const [executionParameters, expected] of cases) {
      const { unmount } = render(<Harness initial={{ executionParameters }} />);
      expect(phrase().endsWith(expected)).toBe(true);
      unmount();
    }
  });

  it("P3-12/omission — Répétitions sans bip et À l'échec : aucune ligne, valeur, zéro, tiret ni « ≥ » de durée", () => {
    for (const executionParameters of [
      parameters({ mode: "REPETITIONS", series: variable([[12, 30], [10, 45], [8, 60]]) }),
      parameters({ mode: "TO_FAILURE", series: { kind: "UNIFORM", count: 3, target: null, pauseSeconds: 15 }, cadenceBeepIntervalSeconds: 4 }),
    ]) {
      const { unmount } = render(<Harness initial={{ executionParameters }} />);
      expect(phrase()).not.toMatch(/Durée totale|≥|—| 0 s/);
      unmount();
    }
  });

  it("P3-15/grammar-edges — N=1 sans pause : total redondant omis ; pause 15 s : total présent ; ≤ 3 variables énumérées, > 3 min/max", () => {
    const render1 = (executionParameters: ExecutionParametersInput) => {
      const view = render(<Harness initial={{ executionParameters }} />);
      const result = phrase();
      view.unmount();
      return result;
    };
    expect(render1(parameters({ series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 0 } }))).not.toContain("Durée totale");
    expect(render1(parameters({ series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 15 } }))).toContain("Durée totale : 45 s.");
    expect(render1(parameters({ series: variable([[30, 10], [45, 20], [60, 30]]) }))).toContain("(30 s, 45 s puis 1 min)");
    expect(render1(parameters({ series: variable([[20, 0], [25, 0], [30, 0], [45, 0]]) }))).toContain("de 20 s à 45 s");
  });

  it("P3-15/long-phrase — phrase longue intégrale en Text imbriqués, sans numberOfLines ni ellipse ; segments gras émis par le générateur", () => {
    render(
      <Harness
        initial={{
          executionParameters: parameters({
            series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 },
            sideMode: "RIGHT_LEFT",
            sideRecoverySeconds: 10,
          }),
        }}
      />,
    );
    const node = screen.getByTestId("exercise-parameters-phrase");
    expect(node.props.numberOfLines).toBeUndefined();
    expect(node.props.ellipsizeMode).toBeUndefined();
    expect(phrase()).toBe(
      "1 série de 1 min 30 s, avec 15 s de pause après chaque série, en faisant le côté droit puis le gauche, avec 10 s de pause au changement de côté. Durée totale : 3 min 40 s.",
    );
    expect(boldSegments()).toEqual(expect.arrayContaining(["1 série", "1 min 30 s", "gauche", "3 min 40 s"]));
    expect(boldSegments()).not.toContain("droit");
  });

  it("P3-20/all-surfaces — titres et valeurs des écrans de référence ; carte bordée rayon 12 ; phrase Inter 13 / 20", () => {
    render(<Harness initial={{ executionParameters: parameters({ mode: null, series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 } }) }} />);
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    expect(screen.getByText("Choisir un mode")).toBeTruthy();
    expect(screen.getByText("Compte à rebours")).toBeTruthy();
    expect(screen.getByText("Fin d’exercice")).toBeTruthy();
    expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("10 s");
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("5 s");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-parameters-card").props.style)).toMatchObject({
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E0E3E8",
    });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-parameters-phrase").props.style)).toMatchObject({
      fontSize: 13,
      lineHeight: 20,
    });
  });

  it("P3-21/accessible-controls — libellés complets ; la feuille reçoit le focus modal ; ✕ y revient sans modifier le parent", () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} category={{ name: "Renforcement", color: "#8FB8FF" }} initial={{ bodyZoneIds: ["cuisses", "fessier"] }} />);
    expect(screen.getByLabelText("Catégorie Renforcement")).toBeTruthy();
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityLabel).toContain("Cuisses, Fessier");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it("INTERACTION/parameter-card — toute la carte ouvre la feuille ; ✓ remplace les paramètres et la phrase est régénérée", () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    expect(phrase()).toContain("3 séries");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressIn");
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressOut");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(onChangeSpy).toHaveBeenCalledWith({
      executionParameters: expect.objectContaining({ series: { kind: "UNIFORM", count: 4, target: 90, pauseSeconds: 15 } }),
    });
    expect(phrase()).toContain("4 séries");
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  });

  it("ACCESSIBILITY/parameter-card — une seule cible nommée contient la phrase intégrale, annoncée une fois ; segments non accessibles séparément", () => {
    render(<Harness />);
    const card = screen.getByTestId("exercise-parameters-card");
    expect(card.props.accessibilityRole).toBe("button");
    expect(card.props.accessibilityLabel).toBe(
      `Modifier les paramètres d’exécution. ${phrase()} Compte à rebours 10 s, Fin d’exercice 5 s.`,
    );
    const nested = screen.getByTestId("exercise-parameters-phrase").props.children as { props?: { accessible?: boolean; accessibilityRole?: string } }[];
    expect(nested.filter((child) => typeof child === "object" && child?.props?.accessibilityRole).length).toBe(0);
  });
});

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState, type ReactNode } from "react";
import { AccessibilityInfo, Dimensions, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { numberTarget, unsetTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  toTarget,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { Silhouette } from "@/domain/preferences/Profile";
import type { ImportItem, ImportResult, PickedMedia } from "@/domain/media/ActivityMediaImportService";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import {
  ActivityEditorForm,
  EDITOR_HEADER,
  EDITOR_VERTICAL_GRID,
  editorSideMargin,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import { applyStepBackspace, applyStepTextChange, displayedStepRows, renderedStepRows } from "@/features/activities/DescriptionSteps";
import { chooseExecutionMode, tapExecutionSheetStep } from "@/features/activities/testing/executionSheetActions";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { finalActionZoneHeight } from "@/shared/ui/finalAction";
import { colors, dimensions } from "@/shared/ui/tokens";

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

function fakeReferentialService(bodyZones: readonly BodyZone[] = BODY_ZONE_FIXTURES): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => bodyZones),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function parameters(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

const variable = (rows: [number | null, number][]) => ({
  kind: "VARIABLE" as const,
  rows: rows.map(([target, pauseSeconds]) => ({ target: target === null ? unsetTarget() : toTarget(target), pauseSeconds, loadKg: 0 })),
  workPhases: [],
});

function baseValue(overrides: Partial<ActivityEditorFormValue> = {}): ActivityEditorFormValue {
  return { name: "", instructionSteps: [], executionParameters: parameters(), bodyZoneIds: [], media: [], ...overrides };
}

/** Métriques de test, ou encart bas imposé (PRE-5 story 3.2, AC2). */
function SafeArea({ bottom, children }: { bottom?: number; children: ReactNode }) {
  if (bottom === undefined) return <TestSafeAreaProvider>{children}</TestSafeAreaProvider>;
  return (
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 402, height: 874 }, insets: { top: 47, left: 0, right: 0, bottom } }}
    >
      {children}
    </SafeAreaProvider>
  );
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
  mediaService = null,
  silhouette,
  isCategoryPickerOpen,
  bodyZones = BODY_ZONE_FIXTURES,
  exerciseSignals,
  safeAreaBottom,
}: {
  /** PRE-5 story 3.2 (AC2) : encart bas de sécurité ; absent = métriques de test (34). */
  safeAreaBottom?: number;
  bodyZones?: readonly BodyZone[];
  /** PRE-5 story 2.5 (AC4) : signaux de la Feuille ; absent = défaut du composant. */
  exerciseSignals?: "present" | "absent";
  initial?: Partial<ActivityEditorFormValue>;
  onChangeSpy?: (patch: Partial<ActivityEditorFormValue>) => void;
  onFinish?: () => void;
  errorMessage?: string | null;
  isFinishDisabled?: boolean;
  category?: EditorCategory;
  onOpenCategory?: () => void;
  onBodyZonesPickerClose?: () => void;
  mediaService?: ActivityDefinitionService | null;
  silhouette?: Silhouette | null;
  isCategoryPickerOpen?: boolean;
}) {
  const [value, setValue] = useState<ActivityEditorFormValue>(baseValue(initial));
  return (
    <SafeArea bottom={safeAreaBottom}>
      <ReferentialServiceContext.Provider value={fakeReferentialService(bodyZones)}>
        <ActivityEditorForm
          value={value}
          onChange={(patch) => {
            onChangeSpy?.(patch);
            setValue((current) => ({ ...current, ...patch }));
          }}
          bodyZones={bodyZones}
          onBodyZonesPickerClose={onBodyZonesPickerClose}
          category={category}
          onOpenCategory={onOpenCategory}
          isCategoryPickerOpen={isCategoryPickerOpen}
          silhouette={silhouette}
          profileSideRecoverySecondsDefault={10}
          exerciseSignals={exerciseSignals}
          mediaService={mediaService}
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
    </SafeArea>
  );
}

/**
 * Texte intégral CANONIQUE de la phrase (segments imbriqués concaténés) : le
 * retour de ligne de présentation avant « Durée totale » (phrase v1 §5) est
 * ramené à l'espace du corpus v15.
 */
function phrase(): string {
  return renderedPhrase().replace("\nDurée totale : ", " Durée totale : ");
}

/** Texte tel que rendu (retour de ligne de présentation compris). */
function renderedPhrase(): string {
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
    // PRE-5 story 3.1 (AC6) : sous le titre « Description de l’exercice », chaque étape est nommée « Étape n ».
    expect(screen.getByText("Description de l’exercice")).toBeTruthy();
    expect(screen.getByLabelText("Étape 1")).toBeTruthy();
    expect(screen.getByText("Médias")).toBeTruthy();
    expect(screen.getByTestId("test-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("test-finish-action"));
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("P3-02/keyboard-scroll — corps défilant avec clavier ; Terminer hors du défilement, dans la zone d'action fixe au-dessus de la zone de sécurité (D-444, story 7.10) ; description sans hauteur figée", () => {
    render(<Harness />);
    expect(screen.getByTestId("exercise-body").props.keyboardShouldPersistTaps).toBe("handled");
    // PRE-5 story 3.1 : étapes sans contenant ni hauteur figée (la cible tactile d'une ligne
    // se contrôle sur appareil, recette du lot Éditeur).
    const instruction = StyleSheet.flatten(screen.getByTestId("exercise-instruction-input").props.style);
    expect(instruction.height).toBeUndefined();
    expect(instruction.maxHeight).toBeUndefined();
    const slot = StyleSheet.flatten(screen.getByTestId("test-finish-slot").props.style);
    // PRE-6 story 7.10 (D-444, remplace « 24 du bas » de PRE-5 3.2). Correctif J6f (D-444) : bouton centré dans la zone protégée — 33 au-dessus et au-dessous avec l'encart de test 34 (zone 114).
    expect(slot).toMatchObject({ position: "absolute", bottom: 0, paddingTop: 33, paddingBottom: 33 });
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
        parameters({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 4, target: numberTarget(15), pauseSeconds: 15, loadKg: 0, workPhases: [] }, cadenceBeepIntervalSeconds: 4 }),
        "Durée totale : ≈ 5 min.",
      ],
      [
        parameters({ series: { kind: "UNIFORM", count: 4, target: numberTarget(60), pauseSeconds: 15, loadKg: 0, workPhases: [] }, cadenceBeepIntervalSeconds: 4 }),
        "Durée totale : 5 min.",
      ],
    ];
    for (const [executionParameters, expected] of cases) {
      const { unmount } = render(<Harness initial={{ executionParameters }} />);
      expect(phrase().endsWith(expected)).toBe(true);
      unmount();
    }
  });

  it("P3-12/omission — Répétitions sans bip et tout échec : aucune ligne, valeur, zéro, tiret ni « ≥ » de durée", () => {
    for (const executionParameters of [
      parameters({ mode: "REPETITIONS", series: variable([[12, 30], [10, 45], [8, 60]]) }),
      { ...allFailureParameters(3, 15, { cadenceBeepIntervalSeconds: 4 }), countdownSeconds: 10, endSeconds: 5 },
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
    expect(render1(parameters({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }))).not.toContain("Durée totale");
    expect(render1(parameters({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] } }))).toContain("Durée totale : 45 s.");
    expect(render1(parameters({ series: variable([[30, 10], [45, 20], [60, 30]]) }))).toContain("(30 s, 45 s puis 1 min)");
    expect(render1(parameters({ series: variable([[20, 0], [25, 0], [30, 0], [45, 0]]) }))).toContain("de 20 s à 45 s");
  });

  it("P3-15/long-phrase — phrase longue intégrale en Text imbriqués, sans numberOfLines ni ellipse ; segments gras émis par le générateur", () => {
    render(
      <Harness
        initial={{
          executionParameters: parameters({
            series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
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
      "1 série de 1 min 30 s, avec 15 s de pause après chaque série, en faisant le côté 1 puis le côté 2, avec 10 s de pause au changement de côté. Durée totale : 3 min 40 s.",
    );
    // PRE-5 (story 1.2, AC4) : clause des côtés neutre ; « côté 2 » remplace l'ancien mot gras.
    expect(boldSegments()).toEqual(expect.arrayContaining(["1 série", "1 min 30 s", "côté 2", "3 min 40 s"]));
    expect(boldSegments()).not.toContain("côté 1");
  });

  it("P3-20/all-surfaces — titres et valeurs des écrans de référence ; Carte `surfaceSubtle` rayon 12 sans liseré (PRE-5 3.2) ; phrase Inter 14 / 20 (PRE-5 3.2, arbitrage G-6)", () => {
    render(<Harness initial={{ executionParameters: parameters({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }) }} />);
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    // Story 4.2 (Q23) : « Choisir un mode » retiré ; E-21 : la Carte vide ne porte aucune invite.
    expect(screen.queryByText("Choisir un mode")).toBeNull();
    expect(screen.queryByText("Appuyez pour définir les séries et les durées")).toBeNull();
    // PRE-5 story 3.2 (R-14, FR-36) : ni Compte à rebours ni Fin sur la Carte.
    expect(screen.queryByText("Compte à rebours")).toBeNull();
    expect(screen.queryByText("Fin d’exercice")).toBeNull();
    const cardStyle = StyleSheet.flatten(screen.getByTestId("exercise-parameters-card").props.style);
    expect(cardStyle).toMatchObject({ borderRadius: 12, backgroundColor: "#F9FAFC" });
    expect(cardStyle.borderWidth ?? 0).toBe(0);
    // E-21 (2026-10-18) : sans Mode, aucune invite ; la Phrase (vide) garde son style.
    // PRE-5 3.2, arbitrage G-6 : Inter Regular 14 (`type.body`), interligne 20.
    expect(screen.queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("exercise-parameters-phrase").props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontSize: 14,
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
    // Story 3.3 : ± à l’appui — le champ de N s’ouvre d’abord (utilitaire partagé).
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(onChangeSpy).toHaveBeenCalledWith({
      executionParameters: expect.objectContaining({ series: { kind: "UNIFORM", count: 4, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
    });
    expect(phrase()).toContain("4 séries");
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  });

  it("ACCESSIBILITY/parameter-card — une seule cible nommée contient la phrase intégrale, annoncée une fois ; segments non accessibles séparément", () => {
    render(<Harness />);
    const card = screen.getByTestId("exercise-parameters-card");
    expect(card.props.accessibilityRole).toBe("button");
    // PRE-5 story 3.2 (R-14, FR-36) : la Phrase seule, sans Compte à rebours ni Fin.
    expect(card.props.accessibilityLabel).toBe(`Modifier les paramètres d’exécution. ${phrase()}`);
    const nested = screen.getByTestId("exercise-parameters-phrase").props.children as { props?: { accessible?: boolean; accessibilityRole?: string } }[];
    expect(nested.filter((child) => typeof child === "object" && child?.props?.accessibilityRole).length).toBe(0);
  });
});

/**
 * Correction revue 1 — REV-03 (ordre de sélection après échec/réessai) et
 * phrase v1 §5 (retour de ligne de présentation avant « Durée totale »).
 */
describe("ActivityEditorForm — correction revue 1", () => {
  const picked: PickedMedia = {
    uri: "file:///cache/x.jpg",
    kind: "PHOTO",
    mimeType: "image/jpeg",
    fileName: null,
    sizeBytes: 1,
    durationMs: null,
    width: 1,
    height: 1,
    nativeAssetId: null,
  };
  const ready = (id: string): ImportItem => ({
    key: id,
    state: "READY",
    picked,
    media: { assetId: id, asset: { id, uri: `kodjo-media/${id}.jpg`, createdAt: "now", kind: "PHOTO" } },
  });
  const failed = (id: string): ImportItem => ({ key: id, state: "FAILED", picked, error: "COPY_FAILED" });

  function mediaService(results: ImportResult[], retries: Record<string, ImportItem[]>) {
    return {
      supportsMediaImport: true,
      resolveMediaUri: (uri: string) => uri,
      leaseDraftMedia: jest.fn(),
      importPendingMedia: jest.fn(async () => null),
      importMedia: jest.fn(async () => results.shift()!),
      retryMediaImport: jest.fn(async (_draft: string, item: ImportItem) => retries[item.key]!.shift()!),
    } as unknown as ActivityDefinitionService;
  }

  function renderWithMedia(service: ActivityDefinitionService) {
    let latest: readonly DraftMediaItem[] = [];
    render(<Harness mediaService={service} onChangeSpy={(patch) => patch.media && (latest = patch.media)} />);
    return () => latest.map((item) => item.assetId);
  }

  async function press(testID: string) {
    await act(async () => {
      fireEvent.press(screen.getByTestId(testID));
    });
  }

  it("REV-03 — A, B, C avec A et C en échec : réessais (C puis A, A deux fois) → A, B, C ; une sélection ultérieure reste en fin ; annulation neutre ; aucun doublon", async () => {
    const service = mediaService(
      [
        { status: "IMPORTED", limitedAccess: false, items: [failed("a"), ready("b"), failed("c")] },
        { status: "CANCELED" },
        { status: "IMPORTED", limitedAccess: false, items: [ready("d")] },
      ],
      { a: [failed("a"), ready("a")], c: [ready("c")] },
    );
    const order = renderWithMedia(service);
    await press("media-add");
    expect(order()).toEqual(["b"]);
    expect(screen.getByTestId("media-pending-1-retry")).toBeTruthy();
    expect(screen.getByTestId("media-pending-2-retry")).toBeTruthy();
    await press("media-add"); // annulation : rien ne change, échecs conservés
    expect(order()).toEqual(["b"]);
    expect(screen.getByTestId("media-pending-2-retry")).toBeTruthy();
    await press("media-add"); // sélection ultérieure D
    expect(order()).toEqual(["b", "d"]);
    expect(screen.getByTestId("media-pending-2-retry")).toBeTruthy();
    await press("media-pending-2-retry"); // C
    expect(order()).toEqual(["b", "c", "d"]);
    await press("media-pending-1-retry"); // A échoue encore
    expect(order()).toEqual(["b", "c", "d"]);
    expect(screen.getByTestId("media-pending-1-error")).toBeTruthy();
    await press("media-pending-1-retry"); // A réussit
    expect(order()).toEqual(["a", "b", "c", "d"]);
    expect(screen.queryByTestId("media-pending-1")).toBeNull();
  });

  it("REV-03 — un réordonnancement ou un retrait explicite avant le réessai est conservé", async () => {
    const service = mediaService(
      [{ status: "IMPORTED", limitedAccess: false, items: [failed("a"), ready("b"), ready("c")] }],
      { a: [ready("a")] },
    );
    const order = renderWithMedia(service);
    await press("media-add");
    expect(order()).toEqual(["b", "c"]);
    fireEvent(screen.getByTestId("media-item-2"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(order()).toEqual(["c", "b"]);
    fireEvent(screen.getByTestId("media-item-2"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(order()).toEqual(["c"]);
    await press("media-pending-1-retry");
    // B retiré : A se place avant le premier voisin suivant encore présent (C).
    expect(order()).toEqual(["a", "c"]);
  });

  it("phrase v1 §5 — retour de ligne de présentation avant « Durée totale », texte canonique inchangé pour l'accessibilité", () => {
    render(<Harness />);
    expect(renderedPhrase()).toBe(
      "3 séries de 1 min 30 s, avec 15 s de pause après chaque série.\nDurée totale : 5 min 15 s.",
    );
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toContain(
      "après chaque série. Durée totale : 5 min 15 s.",
    );
  });
});

describe("ActivityEditorForm — recette 1 (T-49)", () => {
  it("T-49 — zone de contexte : halo blanc Ø 59,28 concentrique au bouton Retour, rogné à la zone, et fondu figé sur les 20 % inférieurs, tous deux sous le contenu", () => {
    render(<Harness />);
    const band = screen.getByTestId("exercise-context-band");
    expect(StyleSheet.flatten(band.props.style).overflow).toBe("hidden");
    // X-3 : couleur figée de la « Zone bleue » ; le token partagé de la Composition ne change pas.
    expect(StyleSheet.flatten(band.props.style).backgroundColor).toBe("#EAEAFF");

    const halo = StyleSheet.flatten(screen.getByTestId("exercise-context-band-halo").props.style);
    expect(halo).toMatchObject({ position: "absolute", width: 59.28, height: 59.28, borderRadius: 29.64, backgroundColor: "#FFFFFF" });
    // PRE-5 3.2, arbitrage G-1 : centre = centre du ✕ de l’en-tête de l’Éditeur (cible 48 à 12 du
    // bord, soit x 36, indépendant de la largeur) ; 24 au-dessus de la zone (moitié de l’en-tête 48) en y.
    expect(EDITOR_HEADER.backCenterX).toBe(36);
    expect(halo.left! + 29.64).toBeCloseTo(EDITOR_HEADER.backCenterX, 5);
    expect(halo.top! + 29.64).toBeCloseTo(-24, 5);

    const fade = screen.getByTestId("exercise-context-band-fade");
    expect(StyleSheet.flatten(fade.props.style)).toMatchObject({ position: "absolute", bottom: 0, height: "20%" });
    const opacities = (fade.props.children as { props: { style: unknown } }[]).map(
      (step) => (StyleSheet.flatten(step.props.style as never) as { opacity: number }).opacity,
    );
    expect(opacities.length).toBeGreaterThanOrEqual(10);
    expect([...opacities].sort((a, b) => a - b)).toEqual(opacities);
    expect(opacities[0]).toBeLessThan(0.1);
    expect(opacities[opacities.length - 1]).toBeGreaterThan(0.9);
    // Recette 2 (T-49) : couches superposées jusqu’au bas de la zone, aucune bande juxtaposée.
    for (const layer of fade.props.children as { props: { style: unknown } }[]) {
      expect(StyleSheet.flatten(layer.props.style as never)).toMatchObject({ position: "absolute", bottom: 0 });
    }
    // Recette 2 (T-49) : aucun liseré autour du champ Nom.
    expect(StyleSheet.flatten(screen.getByTestId("exercise-name-input").props.style).borderWidth).toBeUndefined();

    // Sous le contenu : les effets précèdent le champ du nom dans l’ordre de dessin.
    const children = band.props.children as { props: { testID?: string } }[];
    const order = children.flat().map((child) => child?.props?.testID).filter(Boolean);
    expect(order.indexOf("exercise-context-band-fade")).toBeLessThan(order.indexOf("exercise-name-input"));
    expect(order.indexOf("exercise-context-band-halo")).toBeLessThan(order.indexOf("exercise-name-input"));
  });
});

describe("ActivityEditorForm — recette 2 (N-05 : Description et clavier)", () => {
  it("N-05 / PRE5-3.1/AC2 — Terminer hors de la zone qui évite le clavier ; l'étape active recadrée juste au-dessus du clavier, à chaque étape et quand elle grandit ; aucune hauteur bornée", async () => {
    const { Keyboard, KeyboardAvoidingView, ScrollView } = jest.requireActual<typeof import("react-native")>("react-native");
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
    const listeners: Record<string, () => void> = {};
    const addListener = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
      listeners[event] = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    render(<Harness />);

    // Terminer n’est pas dans la zone qui évite le clavier : il ne remonte pas avec lui.
    expect(within(screen.UNSAFE_getByType(KeyboardAvoidingView)).queryByTestId("test-finish-slot")).toBeNull();
    expect(screen.getByTestId("test-finish-slot")).toBeTruthy();

    const layout = (testID: string, y: number, height: number) =>
      fireEvent(screen.getByTestId(testID), "layout", { nativeEvent: { layout: { x: 0, y, width: 354, height } } });
    layout("exercise-body", 0, 300);
    layout("exercise-section-description", 0, 0);
    fireEvent(screen.getByTestId("exercise-section-description"), "layout", { nativeEvent: { layout: { x: 24, y: 400, width: 354, height: 160 } } });
    layout("exercise-description-steps-area", 25, 17);
    layout("exercise-instruction-row-1", 0, 17);

    scrollTo.mockClear();
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-instruction-input").props.style).maxHeight).toBeUndefined();
    act(() => listeners.keyboardDidShow!());
    // Bas de l'étape active (400 + 25 + 17) + marge 12 − zone visible 300 = 154.
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 154, animated: true });

    // Entrée crée l'étape 2, qui reçoit le focus : recadrage sur elle.
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit\n");
    layout("exercise-instruction-row-2", 25, 17);
    fireEvent(screen.getByTestId("exercise-instruction-step-2"), "focus");
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 179, animated: true });

    // L'étape active grandit (texte sur deux lignes) : nouveau recadrage.
    layout("exercise-instruction-row-2", 25, 34);
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 196, animated: true });

    fireEvent(screen.getByTestId("exercise-instruction-input"), "blur");
    fireEvent(screen.getByTestId("exercise-instruction-step-2"), "blur");
    await flushDeferredBlur();
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
    scrollTo.mockRestore();
    addListener.mockRestore();
  });
});

/** PRE-5 story 3.1 : la perte de focus d'une étape est différée d'un tour (passage d'une étape à l'autre). */
async function flushDeferredBlur() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("ActivityEditorForm — recette 3 (N-05 : ↑ dans la Description)", () => {
  it("N-05 / PRE5-3.1/AC2 — ↑ visible dans la Description pendant la saisie, nommé ; il ferme le clavier sans enregistrer ; étapes conservées ; Retour crée une étape, jamais une validation", async () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    const onFinish = jest.fn();
    render(<Harness onFinish={onFinish} />);
    const input = () => screen.getByTestId("exercise-instruction-input");
    const area = () => screen.getByTestId("exercise-description-steps-area");

    // Hors saisie : pas de ↑ ; la place du bouton est réservée (le texte ne change pas de largeur au focus).
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
    const reserved = StyleSheet.flatten(area().props.style).paddingRight as number;
    expect(reserved).toBeGreaterThanOrEqual(32 + 8);

    fireEvent(input(), "focus");
    fireEvent.changeText(input(), "Ligne 1\nLigne 2");
    const send = screen.getByTestId("exercise-instruction-submit");
    expect(send.props.accessibilityLabel).toBe("Valider la description");
    expect(within(screen.getByTestId("exercise-section-description")).getByTestId("exercise-instruction-submit")).toBe(send);
    expect(StyleSheet.flatten(send.props.style)).toMatchObject({ position: "absolute", width: 32, height: 32, borderRadius: 16 });
    expect(StyleSheet.flatten(area().props.style).paddingRight).toBe(reserved);
    // La touche Retour n’est jamais une validation : elle passe par le texte (étape suivante).
    expect(input().props.onSubmitEditing).toBeUndefined();

    fireEvent.press(send);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent(input(), "blur");
    await flushDeferredBlur();
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
    expect(input().props.value).toBe("Ligne 1");
    expect(screen.getByTestId("exercise-instruction-step-2").props.value).toBe("Ligne 2");
    expect(screen.getByTestId("test-finish-slot")).toBeTruthy();
    dismiss.mockRestore();
  });

  it("PRE5-3.1/AC2 — passage d'une étape à l'autre (perte de focus de l'étape 1 AVANT le focus de l'étape 2, ordre iOS) : ↑ reste monté, sans clignotement", async () => {
    render(<Harness initial={{ instructionSteps: ["Ligne 1"] }} />);
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    const send = screen.getByTestId("exercise-instruction-submit");
    fireEvent(screen.getByTestId("exercise-instruction-input"), "blur");
    expect(screen.getByTestId("exercise-instruction-submit")).toBe(send);
    fireEvent(screen.getByTestId("exercise-instruction-step-2"), "focus");
    await flushDeferredBlur();
    // Même instance : ↑ n'a été ni démonté ni remonté.
    expect(screen.getByTestId("exercise-instruction-submit")).toBe(send);
    fireEvent(screen.getByTestId("exercise-instruction-step-2"), "blur");
    await flushDeferredBlur();
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
  });
});

/**
 * PRE-4 (story 1.1) — interface PRE-3 adaptée au minimum : Exercice migré tout
 * à l'échec (AC21), Cible à renseigner héritée (AC23), tolérance historique
 * de la validation unique avec ligne de base (AC7, H25).
 */
describe("ActivityEditorForm — PRE-4 story 1.1", () => {
  it("PRE4-1.1/AC21 — ancien Exercice « à l’échec » migré (3 séries, Pause 10 s, Bip 2) : Phrase tout échec sans clause de Bip, aucune Durée totale ; Mode affiché Répétitions", () => {
    render(<Harness initial={{ name: "Tractions", executionParameters: allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 }) }} />);
    expect(phrase()).toBe("3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série.");
    expect(phrase()).not.toMatch(/Durée totale|cadenc/u);
    expect(boldSegments()).toContain("3 séries");
    // Story 4.2 (Q23, AC14) : plus de bouton de Mode à côté du titre ; le Mode se lit dans la Feuille.
    expect(screen.queryByTestId("exercise-parameters-mode")).toBeNull();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    // PRE-5 story 2.4 : le Mode est un segmenté en ligne ; l'option affichée est sélectionnée.
    expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS").props.accessibilityState).toMatchObject({ selected: true });
    // PRE-5 story 2.4 (FR-21) : à l'échec, la Condition d'arrêt l'indique et la ligne de cible est masquée.
    expect(screen.getByTestId("execution-sheet-stop-condition-control-FAILURE").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId("execution-sheet-row-target")).toBeNull();
  });

  it("PRE4-1.1/AC23 — Cible à renseigner héritée : carte « Paramètres à compléter. », Terminer invalide ; une Cible réglée par la commande existante est enregistrée en NUMBER, jamais FAILURE", () => {
    const onChangeSpy = jest.fn<(patch: Partial<ActivityEditorFormValue>) => void>();
    const inherited = repetitionParameters("UNSET", 3, 10);
    render(<Harness onChangeSpy={onChangeSpy} initial={{ name: "Pompes", executionParameters: inherited }} />);
    expect(phrase()).toBe("Paramètres à compléter.");
    expect(isActivityEditorFormValid(baseValue({ name: "Pompes", executionParameters: inherited }), {
      requireReferences: false,
      hasCategory: true,
      baseline: inherited,
    })).toBe(false);

    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Story 3.5 : Sélecteur ouvert sur 1 (« — », Q25), ✓ sans tourner applique 1.
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    const applied = onChangeSpy.mock.calls.at(-1)?.[0].executionParameters;
    expect(applied?.series).toEqual({ kind: "UNIFORM", count: 3, target: numberTarget(1), pauseSeconds: 10, loadKg: 0, workPhases: [] });
    expect(JSON.stringify(applied)).not.toContain("FAILURE");
    expect(phrase()).not.toBe("Paramètres à compléter.");
  });

  it("PRE4-1.1/AC24 — isActivityEditorFormValid avec ligne de base (H25) : valeur historique 5999 s inchangée tolérée ; modifiée, elle doit respecter les bornes", () => {
    const historic = durationParameters(5999, 3, 10);
    const value = baseValue({ name: "Gainage", executionParameters: historic });
    expect(isActivityEditorFormValid(value, { requireReferences: false, hasCategory: true, baseline: historic })).toBe(true);
    // Création (aucune base) : 5999 s hors bornes, refusée.
    expect(isActivityEditorFormValid(value)).toBe(false);
    // Valeur modifiée : 5995 s hors bornes refusée, 3535 s acceptée.
    expect(
      isActivityEditorFormValid(baseValue({ name: "Gainage", executionParameters: durationParameters(5995, 3, 10) }), {
        requireReferences: false,
        hasCategory: true,
        baseline: historic,
      }),
    ).toBe(false);
    expect(
      isActivityEditorFormValid(baseValue({ name: "Gainage", executionParameters: durationParameters(3535, 3, 10) }), {
        requireReferences: false,
        hasCategory: true,
        baseline: historic,
      }),
    ).toBe(true);
  });
});

describe("ActivityEditorForm — PRE-4 story 2.2", () => {
  // PRE-5 story 3.2 (R-14, FR-36) : la Carte ne montre plus Compte à rebours ni Fin ; leur
  // formatage reste prouvé dans la Feuille (`ExecutionParametersSheet.test.tsx`).
  it("PRE4-2.2/AC1 + PRE5-3.2/AC1 — Compte à rebours 60 s et Fin 0 s : aucune valeur ni ligne sur la Carte ; la Feuille les montre", () => {
    render(<Harness initial={{ executionParameters: parameters({ countdownSeconds: 60, endSeconds: 0 }) }} />);
    expect(screen.queryByTestId("exercise-parameters-countdown")).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-end")).toBeNull();
    expect(screen.queryByText("1 min")).toBeNull();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent.press(screen.getByLabelText("Afficher le compte à rebours et la fin d’exercice"));
    expect(screen.getByTestId("execution-sheet-countdown-value").props.children).toBe("1 min");
    expect(screen.getByTestId("execution-sheet-end-value").props.children).toBe("0 s");
  });
});

/**
 * PRE-4 story 2.3, AC15 (FR-16-11, FR-17-05) — la Phrase est rendue en entier
 * dans la Carte existante, sans plafond de lignes ni de taille ; le bouton de
 * Mode et le libellé accessible de la Carte restent ceux du code de départ
 * (4.2). Une suite verte ne vaut pas recette visuelle (NFR-04).
 */
describe("ActivityEditorForm — PRE-4 story 2.3", () => {
  /** Aucun plafond de lignes, de hauteur ni de taille sur le texte ni sur ses segments imbriqués. */
  function expectUncapped(node: { props: Record<string, unknown> }): void {
    expect(node.props.numberOfLines).toBeUndefined();
    expect(node.props.ellipsizeMode).toBeUndefined();
    expect(node.props.maxFontSizeMultiplier).toBeUndefined();
    expect(node.props.adjustsFontSizeToFit).toBeUndefined();
    const style = StyleSheet.flatten(node.props.style as Parameters<typeof StyleSheet.flatten>[0]) ?? {};
    expect(style).not.toHaveProperty("height");
    expect(style).not.toHaveProperty("maxHeight");
  }

  it("PRE4-2.3/AC15 — cas 144 affiché en entier dans la Carte, un seul flux de texte, aucun plafond ; ni Compte à rebours ni Fin (PRE-5 3.2)", () => {
    render(
      <Harness
        initial={{
          executionParameters: repetitionParameters(12, 6, 15, {
            cadenceBeepIntervalSeconds: 4,
            sideMode: "RIGHT_LEFT",
            sideOrder: "BY_SIDE",
            sideRecoverySeconds: 5,
            countdownSeconds: 10,
            endSeconds: 5,
            loadEnabled: false,
          }),
        }}
      />,
    );
    // 2 × 6 × (12 × 4 + 15) + 5 = 761 s.
    expect(2 * 6 * (12 * 4 + 15) + 5).toBe(761);
    expect(phrase()).toBe(
      "6 séries de 12 répétitions cadencées toutes les 4 s, avec 15 s de pause après chaque série, en faisant d’abord toutes les séries du côté 1, puis du côté 2, avec 5 s de pause au changement de côté. Durée totale : ≈ 12 min 41 s.",
    );
    // Aucune espace avant la ponctuation ; le seul retour de ligne est celui de présentation avant « Durée totale ».
    expect(renderedPhrase()).not.toMatch(/ [.,)]/u);
    expect(renderedPhrase().split("\n")).toHaveLength(2);
    const node = screen.getByTestId("exercise-parameters-phrase");
    expectUncapped(node);
    const nested = (node.props.children as unknown[]).filter(
      (child): child is { props: Record<string, unknown> } => typeof child === "object" && child !== null,
    );
    expect(nested.length).toBeGreaterThan(0);
    nested.forEach(expectUncapped);
    // Les segments ne sont pas interactifs.
    expect(nested.filter((child) => child.props.onPress !== undefined || child.props.accessibilityRole !== undefined)).toEqual([]);
    // PRE-5 3.2, arbitrage G-6 : Inter 14 Regular, interligne 20 ; segments gras en Inter Semi Bold (600).
    expect(StyleSheet.flatten(node.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontWeight: "400",
      fontSize: 14,
      lineHeight: 20,
    });
    for (const child of nested) {
      expect(StyleSheet.flatten(child.props.style as Parameters<typeof StyleSheet.flatten>[0])).toMatchObject({
        fontFamily: "Inter_600SemiBold",
        fontWeight: "600",
      });
    }
    expect(boldSegments()).toEqual(["6 séries", "12 répétitions", "4 s", "15 s", "côté 1", "côté 2", "5 s", "≈ 12 min 41 s"]);
    expect(screen.queryByTestId("exercise-parameters-countdown")).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-end")).toBeNull();
  });

  it("PRE4-2.3/AC15 — mélange rendu dans la Carte : « jusqu’à l’échec » normal, valeurs et « ≥ » en gras ; bouton de Mode et libellé accessible inchangés", () => {
    render(
      <Harness
        initial={{
          executionParameters: variableParameters({
            mode: "DURATION",
            rows: [
              [30, 10],
              [45, 10],
              ["FAILURE", 10],
            ],
            countdownSeconds: 10,
            endSeconds: 5,
            loadEnabled: false,
          }),
        }}
      />,
    );
    expect(phrase()).toBe("3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.");
    expect(boldSegments()).toEqual(["3 séries", "30 s", "45 s", "≥ 1 min 45 s"]);
    // Story 4.2 (Q23, AC14) : bouton de Mode retiré. PRE-5 story 3.2 : libellé de la Carte
    // réduit à la Phrase (ni Compte à rebours ni Fin).
    expect(screen.queryByTestId("exercise-parameters-mode")).toBeNull();
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toBe(
      `Modifier les paramètres d’exécution. ${phrase()}`,
    );
  });

  it("PRE4-2.3/AC15 — aucune carte consommatrice (Catalogue, Composition) ne reçoit la Phrase", () => {
    const root = path.resolve(__dirname, "../../../..");
    // Tout module de production de src/ et app/ (tests exclus) ; `totalClauseAmount` reste permis (ActivityCard).
    const sources = (directory: string): string[] =>
      readdirSync(directory).flatMap((entry) => {
        const full = path.join(directory, entry);
        if (statSync(full).isDirectory()) {
          return entry === "node_modules" || entry === "__tests__" ? [] : sources(full);
        }
        return /\.(ts|tsx)$/u.test(entry) && !/\.test\.(ts|tsx)$/u.test(entry) ? [full] : [];
      });
    const users = [...sources(path.join(root, "src")), ...sources(path.join(root, "app"))]
      .filter((file) => /\b(generateExecutionPhrase|phraseText)\b/u.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(root, file).replace(/\\/g, "/"))
      .sort();
    expect(users).toEqual(["src/domain/activities/executionPhrase.ts", "src/features/activities/ActivityEditorForm.tsx"]);
  });
});

/**
 * PRE-4 story 3.8 (AC1, FR-03-01, FR-22-07, H13) — à la fermeture de la Feuille, le focus
 * VoiceOver revient à la Carte Paramètres d'exécution (`AccessibilityInfo.setAccessibilityFocus`
 * sur son nœud natif). Sous Jest, `findNodeHandle` ne résout aucun nœud natif : il est
 * remplacé par un nœud fictif pour observer l'appel. Le retour effectif du focus se juge
 * sur iPhone (R-3.8-01).
 */
describe("ActivityEditorForm — PRE-4 story 3.8", () => {
  it("PRE4-3.8/AC1 — ✕, retour système ou ✓ de la Feuille : le focus revient à la Carte Paramètres d'exécution", () => {
    const CARD_NODE = 4242;
    // Le module lui-même (et non une copie d'espace de noms) : `findNodeHandle` y est un accesseur.
    const reactNative = jest.requireActual<typeof import("react-native")>("react-native");
    const findNodeHandle = jest
      .spyOn(reactNative as unknown as Record<"findNodeHandle", unknown>, "findNodeHandle", "get")
      .mockReturnValue(() => CARD_NODE);
    const setAccessibilityFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => {});
    setAccessibilityFocus.mockClear();
    try {
      render(<Harness />);
      const card = screen.getByTestId("exercise-parameters-card");
      expect(card.props.accessibilityLabel.startsWith("Modifier les paramètres d’exécution.")).toBe(true);
      fireEvent.press(card);
      expect(setAccessibilityFocus).not.toHaveBeenCalled();
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      expect(screen.queryByTestId("execution-sheet")).toBeNull();
      expect(setAccessibilityFocus).toHaveBeenLastCalledWith(CARD_NODE);
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      fireEvent(screen.getByTestId("execution-sheet-modal"), "requestClose");
      expect(setAccessibilityFocus).toHaveBeenCalledTimes(2);
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
      expect(screen.queryByTestId("execution-sheet")).toBeNull();
      expect(setAccessibilityFocus).toHaveBeenCalledTimes(3);
      expect(setAccessibilityFocus.mock.calls.every(([node]) => node === CARD_NODE)).toBe(true);
    } finally {
      findNodeHandle.mockRestore();
      setAccessibilityFocus.mockRestore();
    }
  });

  it("PRE4-3.8/AC5 — ✓ ou ✕ de la Feuille absorbé par une roue ouverte : la Feuille reste montée, le focus n'est pas déplacé, les paramètres sont intacts", () => {
    const setAccessibilityFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => {});
    setAccessibilityFocus.mockClear();
    const onChangeSpy = jest.fn();
    try {
      render(<Harness onChangeSpy={onChangeSpy} />);
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      for (const header of ["execution-sheet-validate", "execution-sheet-cancel"]) {
        fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
        expect(screen.getByTestId("execution-sheet-target-panel")).toBeTruthy();
        fireEvent.press(screen.getByTestId(header, { includeHiddenElements: true }));
        expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
        expect(screen.getByTestId("execution-sheet")).toBeTruthy();
      }
      expect(setAccessibilityFocus).not.toHaveBeenCalled();
      expect(onChangeSpy).not.toHaveBeenCalled();
    } finally {
      setAccessibilityFocus.mockRestore();
    }
  });
});

/**
 * PRE-4 story 4.2 — écran principal conforme aux références : ordre P7 (AC3),
 * grille D-327 et marges 24 / 16 (AC5), Carte vide et invite H22, focus unique
 * (AC6, AC14), Description (AC7), Terminer (AC8), états de FR-02-11 (AC11),
 * rendu par les jetons (AC13). Jest n'a pas de moteur de mise en page : les
 * styles appliqués sont vérifiés, la géométrie effective l'est à la recette
 * (R-4.2-06). Rappel NFR-04 : une suite verte ne vaut pas validation visuelle.
 */
describe("ActivityEditorForm — PRE-4 story 4.2", () => {
  const PHOTO_ITEM: DraftMediaItem = {
    assetId: "p1",
    asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "2026-10-18T10:00:00.000Z", kind: "PHOTO" },
  };
  const EMPTY = parameters({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } });

  /** Identifiants de test dans l'ordre du document (parcours en profondeur de l'arbre rendu). */
  function documentOrder(): string[] {
    const found: string[] = [];
    const visit = (node: unknown) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!node || typeof node !== "object") return;
      const element = node as { props?: { testID?: unknown }; children?: unknown };
      if (typeof element.props?.testID === "string") found.push(element.props.testID);
      visit(element.children);
    };
    visit(screen.toJSON());
    return found;
  }

  /** Rend le Harness à une largeur de fenêtre simulée (`useWindowDimensions`), puis rétablit la largeur. */
  function renderAtWidth(width: number, initial?: Partial<ActivityEditorFormValue>) {
    const window = Dimensions.get("window");
    const screenSize = Dimensions.get("screen");
    const reset = () =>
      act(() => {
        Dimensions.set({ window, screen: screenSize });
      });
    act(() => {
      Dimensions.set({ window: { ...window, width }, screen: { ...screenSize, width } });
    });
    let view: ReturnType<typeof render>;
    try {
      view = render(<Harness initial={initial} />);
    } catch (error) {
      // Revue 4.2 : la largeur est rétablie même si le rendu lève.
      reset();
      throw error;
    }
    return {
      ...view,
      restore: () => {
        try {
          view.unmount();
        } finally {
          reset();
        }
      },
    };
  }

  const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

  it("PRE4-4.2/AC3 — ordre P7 : bandeau (Nom, puis accès Catégorie et Zones), Description, Carte, Médias, Terminer ; ni contexte « Séance · », ni type d'Exercice ; placeholder du Nom", () => {
    render(<Harness />);
    const order = documentOrder();
    const expected = [
      "exercise-context-band",
      "exercise-name-input",
      "activity-editor-category-button",
      "exercise-body-zones-open",
      "exercise-body",
      "exercise-section-description",
      "exercise-section-parameters",
      "activity-editor-section-media",
      "test-finish-slot",
      "test-finish-action",
    ];
    const positions = expected.map((testID) => order.indexOf(testID));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    // Le Nom est le premier élément du bandeau (après les seuls effets de fond, sans interaction).
    const band = order.slice(order.indexOf("exercise-context-band") + 1, order.indexOf("exercise-name-input"));
    expect(band.every((testID) => testID.startsWith("exercise-context-band-"))).toBe(true);
    expect(screen.getByTestId("exercise-name-input").props.placeholder).toBe("Nom de l’exercice");
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("");
    expect(screen.queryByText(/^Séance ·/u)).toBeNull();
    expect(screen.queryByText(/Récupération|Type d’exercice/u)).toBeNull();
  });

  // PRE-8, recette A/B (A01, arbitrage du 27/10) : marge standard 16 à toutes les largeurs (24 au-delà de 390 auparavant).
  it("PRE4-4.2/AC5 — marge latérale 16 à toutes les largeurs (A01) ; grille 14 / 10 / 16 / 12 par styles (PRE-5 3.2, arbitrage G-2), sans position absolue", () => {
    expect([360, 389, 390, 402, 440].map(editorSideMargin)).toEqual([16, 16, 16, 16, 16]);
    expect(EDITOR_VERTICAL_GRID).toEqual({ contextToFirstText: 14, blockToNextTitle: 16, titleToBlock: 10, blockToBlock: 12 });
    for (const [width, margin] of [
      [360, 16],
      [390, 16],
      [402, 16],
      [440, 16],
    ] as const) {
      const view = renderAtWidth(width);
      try {
        expect(style("exercise-context-band").paddingHorizontal).toBe(margin);
        const content = StyleSheet.flatten(screen.getByTestId("exercise-body").props.contentContainerStyle);
        expect(content.paddingHorizontal).toBe(margin);
        expect(style("test-finish-slot").paddingHorizontal).toBe(margin);
        // Centre du halo comparé au padding réellement reçu par `FixedHeader` : `ExerciseScreen.test.tsx`, `PRE4-4.2/AC4 AC5`.
        // PRE-5 3.2, arbitrage G-2 (à la place de D-327 pour cet écran) : 14 du bas du dégradé à
        // la première section ; 10 titre → contenu ; 16 entre sections ; 12 dernier bloc → Terminer.
        // PRE-6 story 7.10 (D-444) : réserve de défilement = zone d'action fixe (24 + 48 + 34 + 8).
        expect(content).toMatchObject({ paddingTop: 14, paddingBottom: finalActionZoneHeight(34) });
        expect(content.gap).toBeUndefined();
        expect(style("exercise-section-description")).toMatchObject({ gap: 10 });
        expect(style("exercise-section-description").marginTop).toBeUndefined();
        for (const section of ["exercise-section-parameters", "activity-editor-section-media"]) {
          expect(style(section)).toMatchObject({ gap: 10, marginTop: 16 });
        }
        expect(style("test-finish-slot").marginTop).toBeUndefined();
        for (const testID of ["exercise-section-description", "exercise-section-parameters", "activity-editor-section-media", "test-finish-action"]) {
          expect(style(testID).position === "absolute").toBe(false);
        }
        // PRE-6 story 7.10 (D-444) : seule la zone d'action est en absolu, fixe au bas de l'écran.
        expect(style("test-finish-slot")).toMatchObject({ position: "absolute", bottom: 0 });
      } finally {
        view.restore();
      }
    }
  });

  it("PRE4-4.2/AC6, E-21 — Carte vide : aucune invite (décision de Hermann du 2026-10-18, retour au rendu PRE-3) ; zone unique qui ouvre la Feuille ; libellé composé ; « Paramètres d’exécution », jamais « Modalités d’exécution »", () => {
    render(<Harness initial={{ executionParameters: EMPTY }} />);
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    expect(screen.queryByText(/Modalités d’exécution/u)).toBeNull();
    const card = screen.getByTestId("exercise-parameters-card");
    expect(within(card).queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
    expect(screen.queryByText("Appuyez pour définir les séries et les durées")).toBeNull();
    expect(within(card).getByTestId("exercise-parameters-phrase").props.children).toBe("");
    // PRE-5 story 3.2 (R-14, FR-36) : Phrase vide, libellé sans Phrase ni Compte à rebours / Fin.
    expect(card.props.accessibilityLabel).toBe("Modifier les paramètres d’exécution.");
    expect(within(card).queryByTestId("exercise-parameters-countdown")).toBeNull();
    expect(within(card).queryByTestId("exercise-parameters-end")).toBeNull();
    fireEvent.press(card);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
  });

  it("PRE4-4.2/AC6 — dès qu'un Mode est validé (Durée ou Répétitions, Cible renseignée ou non), aucune Carte n'affiche l'invite ; ✓ de la Feuille remplace l'invite par la Phrase", () => {
    for (const executionParameters of [
      durationParameters(90, 3, 15, { countdownSeconds: 10, endSeconds: 5 }),
      repetitionParameters(12, 3, 30, { countdownSeconds: 10, endSeconds: 5 }),
      repetitionParameters("FAILURE", 3, 30, { countdownSeconds: 10, endSeconds: 5 }),
      parameters({ series: { kind: "UNIFORM", count: 2, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }),
    ]) {
      const view = render(<Harness initial={{ executionParameters }} />);
      expect(screen.queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
      expect(screen.queryByText("Appuyez pour définir les séries et les durées")).toBeNull();
      expect(screen.getByTestId("exercise-parameters-phrase")).toBeTruthy();
      view.unmount();
    }

    render(<Harness initial={{ executionParameters: EMPTY }} />);
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    chooseExecutionMode("Répétitions");
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
    // Q25 : la roue s'ouvre sur la valeur minimale (1) ; son ✓ la valide.
    expect(phrase()).toBe("1 série de 1 répétition.");
  });

  it("PRE4-4.2/AC6 AC14 — une seule Phrase du générateur unique, retour de ligne de rendu avant « Durée totale » sans virgule en tête de ligne ; un seul focus ; hauteur intrinsèque", () => {
    const executionParameters = variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        [45, 20],
        ["FAILURE", 30],
      ],
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 2,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
    render(<Harness initial={{ executionParameters }} />);
    const generated = phraseText(generateExecutionPhrase(executionParameters)!);
    expect(phrase()).toBe(generated);
    expect(screen.getAllByTestId("exercise-parameters-phrase")).toHaveLength(1);
    const lines = renderedPhrase().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]!.startsWith("Durée totale")).toBe(true);
    expect(lines.every((line) => !/^\s*,/u.test(line))).toBe(true);

    // Un seul focus : la Carte ; aucun descendant accessible, pressable ni rôle propre (Q23, D-298).
    const card = screen.getByTestId("exercise-parameters-card");
    expect(card.props.accessible).not.toBe(false);
    const interactive = card.findAll(
      (node) =>
        node !== card &&
        typeof node.type === "string" &&
        (node.props.accessible === true || node.props.onPress !== undefined || node.props.accessibilityRole !== undefined),
    );
    expect(interactive).toEqual([]);
    expect(card.props.accessibilityLabel).toBe(`Modifier les paramètres d’exécution. ${generated}`);
    // Aucune hauteur fixée sur la Carte ni sur la Phrase (la phrase longue est couverte par PRE4-2.3/AC15).
    for (const testID of ["exercise-parameters-card", "exercise-parameters-phrase"]) {
      expect(style(testID)).not.toHaveProperty("height");
      expect(style(testID)).not.toHaveProperty("maxHeight");
    }
  });

  it("PRE4-4.2/AC7 + PRE5-3.1 — Description facultative en étapes ; Retour crée une étape ; ↑ ferme le clavier sans enregistrer ; invite de la première étape ; `maxLength` ne compte pas", () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    const onFinish = jest.fn();
    const onChangeSpy = jest.fn();
    try {
      render(<Harness onFinish={onFinish} onChangeSpy={onChangeSpy} />);
      const input = () => screen.getByTestId("exercise-instruction-input");
      expect(input().props).toMatchObject({
        accessibilityLabel: "Étape 1",
        placeholder: "Décrivez la première étape",
      });
      expect(input().props.maxLength).toBeUndefined();
      expect(input().props.onSubmitEditing).toBeUndefined();
      expect(isActivityEditorFormValid(baseValue({ name: "Squat", instructionSteps: [] }))).toBe(true);
      fireEvent(input(), "focus");
      fireEvent.changeText(input(), "Dos droit.\nGenoux fléchis.");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["Dos droit.", "Genoux fléchis."] });
      fireEvent.press(screen.getByTestId("exercise-instruction-submit"));
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(onFinish).not.toHaveBeenCalled();
      // Effacées, les étapes ne portent plus de texte (l'encodage à `Terminer` donne `null`).
      fireEvent.changeText(screen.getByTestId("exercise-instruction-step-2"), "");
      fireEvent.changeText(input(), "");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["", ""] });
    } finally {
      dismiss.mockRestore();
    }
  });

  it("PRE4-4.2/AC8 — Terminer : bouton principal pleine largeur utile, hauteur 48, rayon 24, libellé centré, hors de la zone qui évite le clavier, sans position absolue", () => {
    const { KeyboardAvoidingView } = jest.requireActual<typeof import("react-native")>("react-native");
    const view = renderAtWidth(402);
    try {
      expect(within(screen.UNSAFE_getByType(KeyboardAvoidingView)).queryByTestId("test-finish-slot")).toBeNull();
      expect(within(screen.getByTestId("exercise-body")).queryByTestId("test-finish-action")).toBeNull();
      expect(style("test-finish-action")).toMatchObject({
        minHeight: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0508E5",
      });
      // Pleine largeur utile : aucune largeur fixée, seule la marge latérale de l'Éditeur (24 à 402)
      // la borne ; la mesure 354 × 48 est contrôlée sur appareil (R-4.2-06).
      expect(style("test-finish-action").width).toBeUndefined();
      expect(style("test-finish-action").position).toBeUndefined();
      expect(style("test-finish-slot")).toMatchObject({ paddingHorizontal: 16 });
      expect(style("test-finish-slot").width).toBeUndefined();
    } finally {
      view.restore();
    }
  });

  it("PRE4-4.2/AC11 — états rendus : vide ; nom seul ; Catégorie renseignée ; nom, description et Média ; résumé identiques ; variables en Durée, en Répétitions ; à l'échec ; Cible mixte ; bilatéral dans chaque Ordre des côtés", () => {
    const states: { name: string; initial: Partial<ActivityEditorFormValue>; category?: EditorCategory; expectText?: RegExp | string }[] = [
      { name: "vide", initial: { executionParameters: EMPTY } },
      { name: "nom seul", initial: { name: "Squat", executionParameters: EMPTY } },
      { name: "Catégorie renseignée", initial: { executionParameters: EMPTY }, category: { name: "Renforcement", color: "#8FB8FF" } },
      {
        name: "nom, description et Média",
        initial: { name: "Squat", instructionSteps: ["Dos droit."], media: [PHOTO_ITEM], executionParameters: EMPTY },
      },
      { name: "résumé identiques", initial: { executionParameters: durationParameters(90, 3, 15) }, expectText: /^3 séries de 1 min 30 s/u },
      {
        name: "variables en Durée",
        initial: { executionParameters: variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 20], [60, 30]] }) },
        expectText: /\(30 s, 45 s puis 1 min\)/u,
      },
      {
        name: "variables en Répétitions",
        initial: { executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[12, 30], [10, 30], [8, 30]] }) },
      },
      { name: "à l'échec", initial: { executionParameters: allFailureParameters(3, 15) }, expectText: /jusqu’à l’échec/u },
      {
        name: "Cible mixte",
        initial: { executionParameters: variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 10], ["FAILURE", 10]] }) },
        expectText: /≥/u,
      },
      ...(["BY_SIDE", "BY_SERIES"] as const).flatMap((sideOrder) =>
        (["RIGHT_LEFT", "LEFT_RIGHT"] as const).map((sideMode) => ({
          name: `bilatéral ${sideMode} ${sideOrder}`,
          initial: { executionParameters: durationParameters(60, 3, 15, { sideMode, sideOrder, sideRecoverySeconds: 10 }) },
        })),
      ),
    ];
    for (const state of states) {
      const view = render(<Harness initial={state.initial} category={state.category ?? null} />);
      // Blocs présents dans chaque état, dans l'ordre P7.
      for (const testID of ["exercise-name-input", "exercise-section-description", "exercise-parameters-card", "activity-editor-section-media", "test-finish-action"]) {
        expect(screen.getByTestId(testID)).toBeTruthy();
      }
      const executionParameters = state.initial.executionParameters!;
      if (executionParameters.mode === null) {
        // E-21 : Carte vide sans invite, Phrase vide (PRE-3).
      expect(screen.queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
      expect(phrase()).toBe("");
      } else {
        // La Carte affiche la Phrase du générateur unique (2.3), telle quelle.
        expect(phrase()).toBe(phraseText(generateExecutionPhrase(executionParameters)!));
      }
      if (typeof state.expectText === "string") expect(screen.getByText(state.expectText)).toBeTruthy();
      if (state.expectText instanceof RegExp) expect(phrase()).toMatch(state.expectText);
      if (state.category) expect(screen.getByLabelText("Catégorie Renforcement")).toBeTruthy();
      if (state.initial.name) expect(screen.getByDisplayValue(state.initial.name)).toBeTruthy();
      for (const step of state.initial.instructionSteps ?? []) expect(screen.getByDisplayValue(step)).toBeTruthy();
      if (state.initial.media?.length) {
        // Une tuile par Média, par son identifiant (jamais un motif qui attraperait le conteneur).
        const section = within(screen.getByTestId("activity-editor-section-media"));
        expect(section.getByTestId("media-item-1")).toBeTruthy();
        expect(section.queryAllByTestId(/^media-item-\d+$/u)).toHaveLength(state.initial.media.length);
      }
      if (executionParameters.mode !== null && executionParameters.sideMode !== "UNILATERAL") {
        // PRE-5 (story 1.2, AC4) : clause des côtés neutre, sans direction.
        expect(phrase()).toMatch(/côté 1.*côté 2/u);
        expect(phrase()).not.toMatch(/droit|gauche/u);
      }
      view.unmount();
    }
  });

  it("PRE4-4.2/AC13 — rendu par les jetons existants : couleurs et typographies retenues au relevé ; aucune opacité locale codée en dur ; Nom 20 / 22, placeholder `textPrimary`, Phrase 14 / 20 (PRE-5 3.2, arbitrages G-3, G-4, G-6)", () => {
    render(<Harness initial={{ executionParameters: EMPTY }} isFinishDisabled />);
    expect(style("exercise-context-band").backgroundColor).toBe("#EAEAFF");
    // PRE-5 3.2, arbitrage G-4 : `type.screenTitle` (Inter Semi Bold 20) avec interligne local 22.
    expect(style("exercise-name-input")).toMatchObject({
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      fontSize: 20,
      lineHeight: 22,
      color: "#141414",
    });
    // PRE-5 3.2, arbitrage G-3 : placeholder en `textPrimary`.
    expect(screen.getByTestId("exercise-name-input").props.placeholderTextColor).toBe(colors.textPrimary);
    // PRE-5 3.2, arbitrage G-6 : Phrase en `type.body` (Inter Regular 14), interligne 20.
    expect(style("exercise-parameters-phrase")).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 });
    expect(style("exercise-parameters-card")).toMatchObject({ borderRadius: 12 });
    expect(style("test-finish-action").backgroundColor).toBe("#BEC2CC");
    // AD-11 : toute opacité rendue vaut `UNSELECTED_OPACITY` ou 1 — hors des couches du
    // dégradé T-49 (accepté, rampe calculée) qui ne portent aucun élément atténué.
    const opacities: unknown[] = [];
    const visit = (node: ReturnType<typeof screen.getByTestId>) => {
      if (node.props.testID === "exercise-context-band-fade") return;
      if (typeof node.type === "string") {
        const opacity = (StyleSheet.flatten(node.props.style as never) as { opacity?: unknown } | undefined)?.opacity;
        if (opacity !== undefined) opacities.push(opacity);
      }
      for (const child of node.children) {
        if (typeof child !== "string") visit(child);
      }
    };
    visit(screen.UNSAFE_root);
    expect(opacities.every((opacity) => opacity === UNSELECTED_OPACITY || opacity === 1)).toBe(true);
  });

  it("PRE4-4.2/AC14 — aucun bouton ni nom du Mode à droite du titre, avec ou sans Mode ; `exercise-parameters-mode` n'existe plus ; le Mode reste dans la Feuille", () => {
    for (const executionParameters of [EMPTY, durationParameters(90, 3, 15), repetitionParameters(12, 3, 30)]) {
      const view = render(<Harness initial={{ executionParameters }} />);
      expect(screen.queryByTestId("exercise-parameters-mode")).toBeNull();
      expect(screen.queryByText("Choisir un mode")).toBeNull();
      const section = screen.getByTestId("exercise-section-parameters");
      // Titre, puis la Carte : aucun autre enfant direct.
      const children = (section.props.children as unknown[]).flat().filter(Boolean) as { props: { testID?: string } }[];
      expect(children).toHaveLength(2);
      expect(children[1]!.props.testID).toBe("exercise-parameters-card");
      expect(within(section).queryByText(/^(Durée|Répétitions)$/u)).toBeNull();
      if (executionParameters.mode !== null) {
        fireEvent.press(screen.getByTestId("exercise-parameters-card"));
        // PRE-5 story 2.4 : segmenté du Mode en ligne, option du Mode courant sélectionnée.
        expect(screen.getByTestId(`execution-sheet-mode-control-${executionParameters.mode}`).props.accessibilityState).toMatchObject({
          selected: true,
        });
      }
      view.unmount();
    }
  });
});

/**
 * PRE-4 story 4.3 — accès Catégorie et Zones du bandeau (AC2 ; FR-02-05, P35),
 * conservation du Brouillon (AC3), Zones sans effet sur la Phrase (AC6).
 * Rappel NFR-04 : ces tests ne valent pas recette visuelle (R-4.3-01 à 05).
 */
describe("ActivityEditorForm — PRE-4 story 4.3", () => {
  /** Source de l’image rendue (la vue native d’`expo-image` la reçoit en tableau). */
  const iconSource = (testID: string): unknown => {
    const source = screen.getByTestId(testID).props.source as unknown;
    return Array.isArray(source) ? source[0] : source;
  };
  const CONTOUR_HOMME = require("../../../../assets/icons/body-zone-homme.svg") as unknown;
  const PLEIN_HOMME = require("../../../../assets/icons/body-zone-homme-plein.svg") as unknown;
  const CONTOUR_FEMME = require("../../../../assets/icons/body-zone-femme.svg") as unknown;
  const PLEIN_FEMME = require("../../../../assets/icons/body-zone-femme-plein.svg") as unknown;
  const CONTOUR_CATEGORIE = require("../../../../assets/icons/icon-categorie.svg") as unknown;
  const PLEIN_CATEGORIE = require("../../../../assets/icons/icon-categorie-plein.svg") as unknown;
  /** Silhouettes rendues dans tout l'écran (bandeau et feuille), une entrée par icône. */
  function renderedSilhouettes(): string[] {
    return screen
      .UNSAFE_getAllByType(KodjoIcon)
      .map((node) => node.props.name as string)
      .filter((name) => name.startsWith("body-zone-"));
  }

  it("PRE4-4.3/AC2 — non renseignés : chaque accès est un bouton icône + libellé « Catégorie » / « Zone corporelle » (lexique), glyphes pleins au repos (PRE-5 3.2, arbitrage G-5)", () => {
    render(<Harness />);
    const categoryButton = screen.getByTestId("activity-editor-category-button");
    const zonesButton = screen.getByTestId("exercise-body-zones-open");
    expect(categoryButton.props.accessibilityRole).toBe("button");
    expect(zonesButton.props.accessibilityRole).toBe("button");
    expect(within(categoryButton).getByTestId("activity-editor-category-label").props.children).toBe("Catégorie");
    expect(within(zonesButton).getByTestId("exercise-body-zones-label").props.children).toBe("Zone corporelle");
    expect(screen.getByTestId("activity-editor-category-label").props.children).toBe(
      strings.screens.activities.editor.category.label,
    );
    expect(screen.getByTestId("exercise-body-zones-label").props.children).toBe(strings.screens.exercise.bodyZones.unsetLabel);
    // PRE-5 3.2, arbitrage G-5 : glyphes pleins au repos, jamais au contour ; un seul testID par accès.
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(iconSource("activity-editor-category-icon")).not.toEqual(CONTOUR_CATEGORIE);
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    expect(iconSource("exercise-body-zones-icon")).not.toEqual(CONTOUR_HOMME);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
    // Noms accessibles : ils contiennent le texte visible (WCAG 2.5.3) et l'état « non renseignée ».
    expect(categoryButton.props.accessibilityLabel).toBe("Catégorie — non renseignée");
    expect(zonesButton.props.accessibilityLabel).toBe("Zone corporelle — non renseignée");
    expect(zonesButton.props.accessibilityLabel).toBe(strings.screens.exercise.bodyZones.unsetAccessibilityLabel);
    for (const [button, label] of [
      [categoryButton, "activity-editor-category-label"],
      [zonesButton, "exercise-body-zones-label"],
    ] as const) {
      expect(button.props.accessibilityLabel).toContain(screen.getByTestId(label).props.children as string);
      expect(button.props.accessibilityState).toEqual({ expanded: false });
    }
    // Aucune icône `+` (P35).
    expect(within(categoryButton).queryByText("+")).toBeNull();
    expect(within(zonesButton).queryByText("+")).toBeNull();
  });

  it("PRE4-4.3/AC2 + PRE5-3.2 — renseignés : glyphe Catégorie plein teinté de sa couleur + nom ; silhouette + noms des Zones avec le séparateur de la capture `8328:37022`", () => {
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ bodyZoneIds: ["cou", "fessier"] }} />);
    const categoryButton = screen.getByTestId("activity-editor-category-button");
    const glyph = within(categoryButton).getByTestId("activity-editor-category-glyph");
    expect(iconSource("activity-editor-category-glyph")).toEqual(PLEIN_CATEGORIE);
    expect(StyleSheet.flatten(glyph.props.style).tintColor).toBe("#3B82F6");
    expect(screen.queryByTestId("activity-editor-category-swatch")).toBeNull();
    expect(within(categoryButton).getByText("Cardio")).toBeTruthy();
    expect(within(categoryButton).queryByTestId("activity-editor-category-label")).toBeNull();
    expect(within(categoryButton).queryByTestId("activity-editor-category-icon")).toBeNull();
    expect(categoryButton.props.accessibilityLabel).toBe("Catégorie Cardio");
    const zonesButton = screen.getByTestId("exercise-body-zones-open");
    // PRE-5 3.2, arbitrage G-5 : silhouette pleine, renseignée ou non.
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    // Q49 (a) : la valeur du séparateur attend Hermann ; seul l'usage de la clé est vérifié.
    expect(within(zonesButton).getByTestId("exercise-body-zones-label").props.children).toBe(
      ["Cou", "Fessier"].join(strings.screens.exercise.bodyZones.bandSeparator),
    );
    // Le nom accessible contient chacun des noms affichés (WCAG 2.5.3).
    expect(zonesButton.props.accessibilityLabel).toBe("Zones corporelles Cou, Fessier");
    for (const name of ["Cou", "Fessier"]) expect(zonesButton.props.accessibilityLabel).toContain(name);
    expect(categoryButton.props.accessibilityLabel).toContain("Cardio");
  });

  it("PRE4-4.3/AC2 — état « développé » exposé pendant l'ouverture de chaque feuille, Catégorie renseignée comprise (sans état ouvert visuel, E-V12)", async () => {
    const view = render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} isCategoryPickerOpen />);
    const categoryButton = () => screen.getByTestId("activity-editor-category-button");
    expect(categoryButton().props.accessibilityState).toEqual({ expanded: true });
    // Catégorie renseignée : la pilule pastille + nom ne change pas de rendu (aucune icône à remplir).
    const openStyle = StyleSheet.flatten(categoryButton().props.style);
    view.rerender(<Harness category={{ name: "Cardio", color: "#3B82F6" }} isCategoryPickerOpen={false} />);
    expect(categoryButton().props.accessibilityState).toEqual({ expanded: false });
    expect(StyleSheet.flatten(categoryButton().props.style)).toEqual(openStyle);
    view.unmount();
    render(<Harness initial={{ bodyZoneIds: ["cou"] }} />);
    const zonesButton = () => screen.getByTestId("exercise-body-zones-open");
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: false });
    fireEvent.press(zonesButton());
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: true });
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: false });
  });

  it("PRE4-4.3/AC2 — Zones : glyphe plein au repos, feuille ouverte, après ✕ puis après ✓ (PRE-5 3.2, arbitrage G-5) ; l'ouverture n'est annoncée que par « développé » ; la pilule ne change pas", async () => {
    render(<Harness initial={{ bodyZoneIds: ["cou"] }} />);
    const zonesButton = () => screen.getByTestId("exercise-body-zones-open");
    const pillStyle = () => StyleSheet.flatten(zonesButton().props.style);
    const restingPill = pillStyle();
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    fireEvent.press(zonesButton());
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: true });
    expect(pillStyle()).toEqual(restingPill);
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: false });
    fireEvent.press(zonesButton());
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
    expect(zonesButton().props.accessibilityState).toEqual({ expanded: false });
  });

  it("PRE4-4.3/AC2 — icône Catégorie pleine, que l'adaptateur signale sa feuille ouverte ou non (PRE-5 3.2, arbitrage G-5) ; seul « développé » change ; même pilule", () => {
    const view = render(<Harness isCategoryPickerOpen />);
    const button = () => screen.getByTestId("activity-editor-category-button");
    const openPill = StyleSheet.flatten(button().props.style);
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-label")).toBeTruthy();
    expect(button().props.accessibilityState).toEqual({ expanded: true });
    view.rerender(<Harness isCategoryPickerOpen={false} />);
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(button().props.accessibilityState).toEqual({ expanded: false });
    expect(StyleSheet.flatten(button().props.style)).toEqual(openPill);
  });

  it("PRE4-4.3/AC2 — une seule silhouette, celle du Profil (homme par défaut, femme si choisie), pleine feuille fermée comme ouverte (PRE-5 3.2, arbitrage G-5) ; jamais deux boutons homme / femme", async () => {
    for (const [silhouette, contour, plein, contourSource, pleinSource] of [
      [null, "body-zone-homme", "body-zone-homme-plein", CONTOUR_HOMME, PLEIN_HOMME],
      ["homme", "body-zone-homme", "body-zone-homme-plein", CONTOUR_HOMME, PLEIN_HOMME],
      ["femme", "body-zone-femme", "body-zone-femme-plein", CONTOUR_FEMME, PLEIN_FEMME],
    ] as const) {
      const view = render(<Harness silhouette={silhouette} />);
      expect(renderedSilhouettes()).toEqual([plein]);
      expect(renderedSilhouettes()).not.toContain(contour);
      expect(iconSource("exercise-body-zones-icon")).toEqual(pleinSource);
      expect(iconSource("exercise-body-zones-icon")).not.toEqual(contourSource);
      expect(screen.queryByLabelText(/homme|femme/i)).toBeNull();
      fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
      await screen.findByTestId("body-zone-selector-tag-cou");
      // Feuille ouverte : la seule silhouette est celle, pleine, du bandeau ; aucune
      // n'est répétée dans les options (AC5).
      expect(renderedSilhouettes()).toEqual([plein]);
      expect(iconSource("exercise-body-zones-icon")).toEqual(pleinSource);
      fireEvent.press(screen.getByTestId("body-zone-picker-close"));
      view.unmount();
    }
  });

  it("PRE4-4.3/AC2 — chaque accès a une cible d'au moins 44 × 44 (FR-22-04), sans recouvrement entre les deux accès, ni d'une ligne à l'autre quand ils passent à la ligne", () => {
    render(<Harness />);
    const rowStyle = StyleSheet.flatten(screen.getByTestId("exercise-reference-row").props.style);
    expect(rowStyle.flexWrap).toBe("wrap");
    const columnGap = rowStyle.columnGap as number;
    const rowGap = rowStyle.rowGap as number;
    for (const testID of ["activity-editor-category-button", "exercise-body-zones-open"]) {
      const button = screen.getByTestId(testID);
      const style = StyleSheet.flatten(button.props.style);
      const slop = button.props.hitSlop as { top: number; bottom: number; left: number; right: number };
      expect((style.minHeight as number) + slop.top + slop.bottom).toBeGreaterThanOrEqual(44);
      // Largeur : marges + glyphe (18, PRE-5 3.2) + écart + libellé non vide, plus les débords latéraux.
      const minimalWidth =
        (style.paddingLeft as number) + (style.paddingRight as number) + 18 + (style.gap as number) + 1 + slop.left + slop.right;
      expect(minimalWidth).toBeGreaterThanOrEqual(44);
      expect(slop.left + slop.right).toBeLessThanOrEqual(columnGap);
      // PRE-5 3.2 : l'accès est centré dans une rangée de 32 ; seuls ses débords hors de la
      // rangée (haut et bas) doivent tenir dans l'écart entre deux lignes.
      const inset = ((rowStyle.minHeight as number) - (style.minHeight as number)) / 2;
      expect(Math.max(0, slop.top - inset) + Math.max(0, slop.bottom - inset)).toBeLessThanOrEqual(rowGap);
    }
  });

  it("PRE4-4.3/AC3 — ouvrir puis fermer la feuille des Zones (✕ ou ✓) conserve tout le Brouillon, Régime variables compris", async () => {
    const onChangeSpy = jest.fn();
    const executionParameters = parameters({
      series: variable([
        [30, 10],
        [null, 20],
        [60, 0],
      ]),
    });
    render(
      <Harness
        onChangeSpy={onChangeSpy}
        initial={{ name: "Fentes", instructionSteps: ["Dos droit"], executionParameters, bodyZoneIds: ["cou"] }}
      />,
    );
    const phraseBefore = phrase();
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit")).toBeTruthy();
    expect(phrase()).toBe(phraseBefore);
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(onChangeSpy.mock.calls).toEqual([[{ bodyZoneIds: ["cou", "cuisses"] }]]);
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit")).toBeTruthy();
    expect(phrase()).toBe(phraseBefore);
  });

  it("PRE4-4.3/AC6 — Catégorie et Zones sans effet sur la Phrase ni sur les Paramètres d'exécution", () => {
    const executionParameters = parameters({
      series: variable([
        [30, 10],
        [45, 20],
      ]),
    });
    const bare = render(<Harness initial={{ executionParameters }} />);
    const phraseBare = phrase();
    bare.unmount();
    render(
      <Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ executionParameters, bodyZoneIds: ["cou", "cuisses"] }} />,
    );
    expect(phrase()).toBe(phraseBare);
  });
});

/**
 * PRE-4, décision Q53 de Hermann (2026-10-18) : un Exercice qui garde une Zone retirée du
 * référentiel la garde dans le bandeau et dans la feuille, où elle se conserve, se remplace ou
 * se retire. Q53 (9), même jour : aucun avis textuel ni annonce VoiceOver (« ce n'est pas un
 * besoin ») ; restent le fond rouge clair et le nom accessible dans la feuille.
 */
describe("ActivityEditorForm — PRE-4 Q53 (Zone retirée encore affectée)", () => {
  const RETIRED_LEGS: BodyZone = { id: "jambes", name: "Jambes", isActive: false, createdAt: "2026-01-01T00:00:05.000Z" };
  const ZONES_WITH_RETIRED: readonly BodyZone[] = [...BODY_ZONE_FIXTURES, RETIRED_LEGS];
  // Q53 (9) : formulations des avis retirés (« … a été retirée … », « … ont été retirées … »).
  const RETIRED_NOTICE_TEXT = /a été retirée|ont été retirées|reste associée|restent associées/;

  it("PRE4-Q53/editor-no-notice-retired — Zone retirée affectée : aucun avis textuel, aucune annonce ; la Zone reste dans le bandeau ; Terminer reste actif", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(<Harness bodyZones={ZONES_WITH_RETIRED} initial={{ name: "Squat", bodyZoneIds: ["jambes", "cou"] }} />);
    expect(screen.queryByTestId("exercise-retired-body-zones-notice")).toBeNull();
    expect(screen.queryByText(RETIRED_NOTICE_TEXT)).toBeNull();
    expect(within(screen.getByTestId("exercise-context-band")).queryByText(RETIRED_NOTICE_TEXT)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityLabel).toBe("Zones corporelles Cou, Jambes");
    expect(screen.getByTestId("test-finish-action").props.accessibilityState?.disabled ?? false).toBe(false);
    announce.mockRestore();
  });

  it("PRE4-Q53/editor-no-notice — sans Zone retirée affectée (Zone retirée non affectée comprise) : aucun avis, aucune annonce", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(<Harness bodyZones={ZONES_WITH_RETIRED} initial={{ bodyZoneIds: ["cou"] }} />);
    expect(screen.queryByTestId("exercise-retired-body-zones-notice")).toBeNull();
    expect(screen.queryByText(RETIRED_NOTICE_TEXT)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });

  it("PRE4-Q53/editor-replace — remplacer la Zone retirée dans la feuille : elle quitte le bandeau, sans avis ni annonce", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(<Harness bodyZones={ZONES_WITH_RETIRED} initial={{ bodyZoneIds: ["jambes"] }} />);
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    const legs = await screen.findByTestId("body-zone-selector-tag-jambes");
    expect(legs.props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-jambes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(screen.queryByTestId("exercise-retired-body-zones-notice")).toBeNull();
    expect(screen.queryByText(RETIRED_NOTICE_TEXT)).toBeNull();
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityLabel).toBe("Zones corporelles Cou");
    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });

  it("PRE4-Q53/editor-no-notice-plural — plusieurs Zones retirées affectées : aucun avis (ni singulier ni pluriel)", () => {
    const retiredArms: BodyZone = { id: "bras", name: "Bras", isActive: false, createdAt: "2026-01-01T00:00:06.000Z" };
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(<Harness bodyZones={[...ZONES_WITH_RETIRED, retiredArms]} initial={{ bodyZoneIds: ["jambes", "bras"] }} />);
    expect(screen.queryByText(RETIRED_NOTICE_TEXT)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });
});

describe("ActivityEditorForm — PRE-4 Q53 (7) (suppression depuis l'Exercice courant)", () => {
  it("PRE4-Q53/editor-delete-only-zone — supprimer la seule Zone depuis la feuille : elle quitte le bandeau et la sélection, sans avis Q53 ; ✕ ne la rétablit pas ; Terminer inactif jusqu'au choix d'une autre Zone", async () => {
    const zones: BodyZone[] = BODY_ZONE_FIXTURES.map((zone) => ({ ...zone }));
    const service = {
      listBodyZones: jest.fn(async () => zones.map((zone) => ({ ...zone }))),
      createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
      renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
      retireBodyZone: jest.fn(async (id: string) => {
        const index = zones.findIndex((zone) => zone.id === id);
        zones[index] = { ...zones[index]!, isActive: false };
        return { status: "OK" as const, value: zones[index]! };
      }),
      isBodyZoneUsed: jest.fn(async () => true),
    } as unknown as ReferentialService;
    function Host() {
      const [value, setValue] = useState<ActivityEditorFormValue>(
        baseValue({ name: "Squat", executionParameters: parameters(), bodyZoneIds: ["cou"] }),
      );
      return (
        <TestSafeAreaProvider>
          <ReferentialServiceContext.Provider value={service}>
            <ActivityEditorForm
              value={value}
              onChange={(patch) => setValue((current) => ({ ...current, ...patch }))}
              bodyZones={zones}
              category={{ name: "Cardio", color: "#3B82F6" }}
              onOpenCategory={jest.fn()}
              profileSideRecoverySecondsDefault={10}
              mediaService={null}
              mediaDraftId="draft-test"
              finishLabel="Terminer"
              onFinish={jest.fn()}
              finishSlotTestID="test-finish-slot"
              finishActionTestID="test-finish-action"
            />
          </ReferentialServiceContext.Provider>
        </TestSafeAreaProvider>
      );
    }
    render(<Host />);
    expect(screen.getByTestId("test-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    const cou = await screen.findByTestId("body-zone-selector-tag-cou");
    await act(async () => {
      fireEvent(cou, "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete-confirm-confirm"));
    });
    expect(screen.queryByTestId("body-zone-selector-tag-cou")).toBeNull();
    expect(screen.getByTestId("body-zone-picker-at-least-one-notice")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    });
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityLabel).toBe("Zone corporelle — non renseignée");
    expect(screen.queryByTestId("exercise-retired-body-zones-notice")).toBeNull();
    expect(screen.getByTestId("test-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(screen.getByTestId("test-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
  });
});

describe("ActivityEditorForm — PRE-4 Q53 (8) (Catégorie retirée encore affectée)", () => {
  // Q53 (9), décision de Hermann du 2026-10-18 : l'avis textuel de la Catégorie retirée est
  // retiré ; la Catégorie reste affichée (pastille + nom) et Terminer reste actif.
  it("PRE4-Q53/category-editor-no-notice — Catégorie (retirée ou non) : aucun avis textuel, aucune annonce ; Terminer reste actif", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ name: "Squat", bodyZoneIds: ["cou"] }} />);
    expect(screen.queryByTestId("exercise-retired-category-notice")).toBeNull();
    expect(screen.queryByText(/a été retirée|reste associée/)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toBe("Catégorie Cardio");
    expect(screen.getByTestId("test-finish-action").props.accessibilityState?.disabled ?? false).toBe(false);
    announce.mockRestore();
  });
});

describe("ActivityEditorForm — PRE-5 story 2.5", () => {
  it("PRE5-2.5/AC4 — signaux de la Feuille transmis : défaut présents (repliés sous la Durée de l’exercice) ; « absent » (Séance) : ni Compte à rebours, ni Fin, ni chevron ; Carte de l’Éditeur inchangée", () => {
    const view = render(<Harness initial={{ executionParameters: parameters({ countdownSeconds: 12, endSeconds: 7 }) }} />);
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-duration-disclosure-frame")).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-row-countdown")).toBeNull();
    fireEvent.press(screen.getByLabelText("Afficher le compte à rebours et la fin d’exercice"));
    expect(screen.getByTestId("execution-sheet-row-countdown")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-row-end")).toBeTruthy();
    view.unmount();

    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} exerciseSignals="absent" initial={{ executionParameters: parameters({ countdownSeconds: 12, endSeconds: 7 }) }} />);
    // PRE-5 story 3.2 (R-14) : la Carte ne montre plus Compte à rebours ni Fin, en aucun parcours.
    expect(screen.queryByTestId("exercise-parameters-countdown")).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-end")).toBeNull();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.queryByTestId("execution-sheet-row-countdown")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-row-end")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-duration-disclosure-frame")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(onChangeSpy).toHaveBeenCalledWith({
      executionParameters: expect.objectContaining({ countdownSeconds: 12, endSeconds: 7 }),
    });
  });
});

/**
 * PRE-5 story 3.1 (FR-33, FR-34, FR-44, AD-22, D-425) — Description en étapes numérotées :
 * état vide et liste remplie (AC1), saisie (Entrée, coupure, collage, retour arrière, AC2),
 * limite de 1 000 refusée en entier (AC3), VoiceOver et lexique (AC6). Le codec est prouvé
 * dans `instructionSteps.test.ts` ; ici, son emploi par l'Éditeur.
 */
describe("ActivityEditorForm — PRE-5 story 3.1 (Description en étapes)", () => {
  const PROMPT_GREY = "#AEB3BA";
  const stepInput = (n: number) =>
    screen.getByTestId(n === 1 ? "exercise-instruction-input" : `exercise-instruction-step-${n}`);
  const stepNumber = (n: number) =>
    screen.getByTestId(`exercise-instruction-step-number-${n}`, { includeHiddenElements: true });
  const rowCount = () => screen.queryAllByTestId(/^exercise-instruction-row-\d+$/u).length;
  /** PRE-7 story B.2 (B1) : une ligne prend le focus — l'invite « Étape suivante » est rendue. */
  const focusStep = (n: number) => fireEvent(stepInput(n), "focus");

  /** Focus et curseur donnés par l'Éditeur : contextes des appels `focus` / `setSelection` du `TextInput`. */
  function spyInputFocus() {
    const { TextInput } = jest.requireActual<typeof import("react-native")>("react-native");
    const prototype = TextInput.prototype as unknown as {
      focus: () => void;
      setSelection?: (start: number, end: number) => void;
    };
    const focus = jest.spyOn(prototype, "focus");
    const setSelection = jest.fn<(start: number, end: number) => void>();
    prototype.setSelection = setSelection;
    const testIDOf = (context: unknown) => (context as { props: { testID?: string } }).props.testID;
    return {
      lastFocused: () => testIDOf(focus.mock.contexts[focus.mock.contexts.length - 1]),
      lastSelection: () => setSelection.mock.calls[setSelection.mock.calls.length - 1],
      lastSelected: () => testIDOf(setSelection.mock.contexts[setSelection.mock.contexts.length - 1]),
      restore: () => {
        focus.mockRestore();
        delete prototype.setSelection;
      },
    };
  }

  describe("fonctions pures de saisie", () => {
    it("lignes affichées : une invite après la dernière étape remplie, jamais de seconde invite", () => {
      expect(displayedStepRows([])).toEqual([""]);
      expect(displayedStepRows(["A", "B"])).toEqual(["A", "B", ""]);
      expect(displayedStepRows(["A", "B", ""])).toEqual(["A", "B", ""]);
      expect(displayedStepRows(["A", "", "B"])).toEqual(["A", "", "B", ""]);
    });

    it("PRE7-B.2 (B1, A1) — lignes rendues : invite de rang > 1 seulement si active ; rang 1 toujours ; étapes inchangées", () => {
      expect(renderedStepRows([], false)).toEqual([""]);
      expect(renderedStepRows([""], false)).toEqual([""]);
      expect(renderedStepRows(["", ""], false)).toEqual([""]);
      expect(renderedStepRows(["A", "B"], false)).toEqual(["A", "B"]);
      expect(renderedStepRows(["A", "B"], true)).toEqual(["A", "B", ""]);
      expect(renderedStepRows(["A", ""], false)).toEqual(["A"]);
      expect(renderedStepRows(["A", ""], true)).toEqual(["A", ""]);
      expect(renderedStepRows(["A", "", "B"], false)).toEqual(["A", "", "B"]);
    });

    it("frappe en place, dans l'invite, Entrée en fin et au milieu, collage `\\n` et `\\r\\n`, sélection remplacée", () => {
      expect(applyStepTextChange(["A"], 0, "Ab")).toEqual({ steps: ["Ab"], focus: null });
      expect(applyStepTextChange(["A"], 1, "B")).toEqual({ steps: ["A", "B"], focus: null });
      expect(applyStepTextChange([], 0, "A")).toEqual({ steps: ["A"], focus: null });
      expect(applyStepTextChange(["A", "B"], 1, "B\n")).toEqual({ steps: ["A", "B", ""], focus: { index: 2, cursor: 0 } });
      expect(applyStepTextChange(["Dosdroit"], 0, "Dos\ndroit")).toEqual({
        steps: ["Dos", "droit"],
        focus: { index: 1, cursor: 0 },
      });
      expect(applyStepTextChange(["AvantAprès"], 0, "AvantX\r\nY\r\nZAprès")).toEqual({
        steps: ["AvantX", "Y", "ZAprès"],
        focus: { index: 2, cursor: 1 },
      });
      expect(applyStepTextChange(["A"], 1, "L1\nL2\nL3")).toEqual({ steps: ["A", "L1", "L2", "L3"], focus: { index: 3, cursor: 2 } });
      expect(applyStepTextChange(["abc"], 0, "aL1\nL2c")).toEqual({ steps: ["aL1", "L2c"], focus: { index: 1, cursor: 2 } });
      // Aucune autre étape n'est modifiée ; aucun changement : rien à appliquer.
      expect(applyStepTextChange(["A", "B", "C"], 1, "B1\nB2")?.steps).toEqual(["A", "B1", "B2", "C"]);
      expect(applyStepTextChange(["A"], 0, "A")).toBeNull();
      expect(applyStepTextChange(["A"], 3, "x")).toBeNull();
    });

    it("limite de 1 000 points de code sur la chaîne encodée : refus entier, sans troncature ; raccourcissement admis", () => {
      const full = "x".repeat(1000);
      expect(applyStepTextChange(["x".repeat(999)], 0, full)?.steps).toEqual([full]);
      expect(applyStepTextChange([full], 0, `${full}y`)).toBeNull();
      expect(applyStepTextChange([full], 1, "y")).toBeNull();
      expect(applyStepTextChange(["x".repeat(991)], 1, "a\nb\nc\nd\ne")).toBeNull();
      // Séparateurs compris : couper une étape pleine au milieu dépasserait la limite.
      expect(applyStepTextChange([full], 0, `${"x".repeat(500)}\n${"x".repeat(500)}`)).toBeNull();
      // Une étape vide créée par Entrée en fin ne compte pas.
      expect(applyStepTextChange([full], 0, `${full}\n`)?.steps).toEqual([full, ""]);
      expect(applyStepTextChange([full], 0, "x".repeat(999))?.steps).toEqual(["x".repeat(999)]);
      // Points de code, pas unités UTF-16.
      expect(applyStepTextChange(["😀".repeat(999)], 0, "😀".repeat(1000))?.steps).toEqual(["😀".repeat(1000)]);
    });

    it("retour arrière sur une étape vide n > 1 : supprimée, curseur en fin de n − 1 ; ailleurs, comportement natif", () => {
      expect(applyStepBackspace(["A", "B", ""], 2)).toEqual({ steps: ["A", "B"], focus: { index: 1, cursor: 1 } });
      expect(applyStepBackspace(["A", "", "B"], 1)).toEqual({ steps: ["A", "B"], focus: { index: 0, cursor: 1 } });
      // Ligne d'invite : seul le curseur remonte.
      expect(applyStepBackspace(["Dos"], 1)).toEqual({ steps: ["Dos"], focus: { index: 0, cursor: 3 } });
      expect(applyStepBackspace(["", "B"], 0)).toBeNull();
      expect(applyStepBackspace(["A", "B"], 1)).toBeNull();
    });
  });

  it("AC1 — état vide : une seule ligne grise « 1. » + « Décrivez la première étape », sans ligne d'invitation", () => {
    render(<Harness />);
    expect(rowCount()).toBe(1);
    expect(stepNumber(1)).toHaveTextContent("1.");
    expect(StyleSheet.flatten(stepNumber(1).props.style).color).toBe(PROMPT_GREY);
    expect(stepInput(1).props).toMatchObject({ value: "", placeholder: "Décrivez la première étape", placeholderTextColor: PROMPT_GREY });
    expect(screen.queryByText("Étape suivante")).toBeNull();
    expect(screen.queryByTestId("exercise-instruction-step-2")).toBeNull();
    // Pas de bouton Ajouter.
    expect(within(screen.getByTestId("exercise-section-description")).queryAllByRole("button")).toEqual([]);
  });

  it("AC1, PRE7-B.2 (B1) — liste remplie : « 1. A », « 2. B », puis, en saisie seulement, l'invite grise « 3. Étape suivante » ; une étape vide intercalée garde son numéro gris sans invite", () => {
    const view = render(<Harness initial={{ instructionSteps: ["A", "B"] }} />);
    // B1 : au repos, pas d'invite « Étape suivante ».
    expect(rowCount()).toBe(2);
    expect(screen.queryByTestId("exercise-instruction-step-3")).toBeNull();
    focusStep(1);
    expect(rowCount()).toBe(3);
    expect(stepInput(1).props.value).toBe("A");
    expect(stepInput(2).props.value).toBe("B");
    expect(stepInput(1).props.placeholder).toBeUndefined();
    expect(StyleSheet.flatten(stepNumber(1).props.style).color).toBe("#595E66");
    expect(stepNumber(3)).toHaveTextContent("3.");
    expect(StyleSheet.flatten(stepNumber(3).props.style).color).toBe(PROMPT_GREY);
    expect(stepInput(3).props).toMatchObject({ value: "", placeholder: "Étape suivante" });
    view.unmount();

    render(<Harness initial={{ instructionSteps: ["A", "", "B"] }} />);
    expect(rowCount()).toBe(3);
    focusStep(1);
    expect(rowCount()).toBe(4);
    expect(stepInput(2).props.placeholder).toBeUndefined();
    expect(StyleSheet.flatten(stepNumber(2).props.style).color).toBe(PROMPT_GREY);
    expect(stepInput(4).props.placeholder).toBe("Étape suivante");
  });

  it("AC1 — présentation relevée (9071:53260) : texte et numéros à 14, numéro Medium de largeur 16 aligné à droite, sans contenant", () => {
    render(<Harness initial={{ instructionSteps: ["A"] }} />);
    expect(StyleSheet.flatten(stepNumber(1).props.style)).toMatchObject({
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      minWidth: 16,
      textAlign: "right",
    });
    const text = StyleSheet.flatten(stepInput(1).props.style);
    expect(text).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 14, color: "#141414" });
    for (const style of [text, StyleSheet.flatten(screen.getByTestId("exercise-instruction-steps").props.style)]) {
      expect(style.borderWidth).toBeUndefined();
      expect(style.backgroundColor).toBeUndefined();
    }
    expect(StyleSheet.flatten(screen.getByTestId("exercise-instruction-steps").props.style).gap).toBe(8);
    expect(StyleSheet.flatten(screen.getByTestId("exercise-instruction-row-1").props.style)).toMatchObject({
      flexDirection: "row",
      gap: 8,
    });
  });

  it("AC2 — Entrée en fin crée l'étape suivante et lui donne le curseur ; pas de seconde invite", () => {
    const onChangeSpy = jest.fn();
    const focus = spyInputFocus();
    try {
      render(<Harness initial={{ instructionSteps: ["A", "B"] }} onChangeSpy={onChangeSpy} />);
      focusStep(2);
      fireEvent.changeText(stepInput(2), "B\n");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["A", "B", ""] });
      expect(stepInput(2).props.value).toBe("B");
      expect(rowCount()).toBe(3);
      expect(stepInput(3).props.placeholder).toBe("Étape suivante");
      expect(focus.lastFocused()).toBe("exercise-instruction-step-3");
      expect(focus.lastSelected()).toBe("exercise-instruction-step-3");
      expect(focus.lastSelection()).toEqual([0, 0]);
      // Trois étapes par Entrée depuis l'état vide (R-3.1-01).
      fireEvent.changeText(stepInput(3), "C");
      fireEvent.changeText(stepInput(3), "C\n");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["A", "B", "C", ""] });
      expect(focus.lastFocused()).toBe("exercise-instruction-step-4");
    } finally {
      focus.restore();
    }
  });

  it("AC2 — Entrée au milieu coupe l'étape au curseur ; collage de trois lignes (`\\r\\n`) : une étape par ligne, curseur à la fin du texte collé ; modification en place", () => {
    const onChangeSpy = jest.fn();
    const focus = spyInputFocus();
    try {
      render(<Harness initial={{ instructionSteps: ["Dosdroit", "Fin"] }} onChangeSpy={onChangeSpy} />);
      focusStep(1);
      fireEvent.changeText(stepInput(1), "Dos\ndroit");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["Dos", "droit", "Fin"] });
      expect(focus.lastFocused()).toBe("exercise-instruction-step-2");
      expect(focus.lastSelection()).toEqual([0, 0]);

      fireEvent.changeText(stepInput(4), "Un\r\nDeux\r\nTrois");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["Dos", "droit", "Fin", "Un", "Deux", "Trois"] });
      expect(focus.lastFocused()).toBe("exercise-instruction-step-6");
      expect(focus.lastSelection()).toEqual([5, 5]);

      fireEvent.changeText(stepInput(2), "droite");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["Dos", "droite", "Fin", "Un", "Deux", "Trois"] });
    } finally {
      focus.restore();
    }
  });

  it("AC2 — retour arrière sur l'étape vide n > 1 : supprimée, curseur en fin de l'étape n − 1", () => {
    const onChangeSpy = jest.fn();
    const focus = spyInputFocus();
    try {
      render(<Harness initial={{ instructionSteps: ["A", "Bras", ""] }} onChangeSpy={onChangeSpy} />);
      // B1 : l'étape vide finale porte l'invite, rendue en saisie seulement.
      expect(rowCount()).toBe(2);
      focusStep(2);
      fireEvent(stepInput(3), "keyPress", { nativeEvent: { key: "Backspace" } });
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["A", "Bras"] });
      expect(focus.lastFocused()).toBe("exercise-instruction-step-2");
      expect(focus.lastSelection()).toEqual([4, 4]);
      // Étape non vide : comportement natif, aucune fusion.
      onChangeSpy.mockClear();
      fireEvent(stepInput(2), "keyPress", { nativeEvent: { key: "Backspace" } });
      expect(onChangeSpy).not.toHaveBeenCalled();
    } finally {
      focus.restore();
    }
  });

  it("AC3 — une saisie qui dépasserait 1 000 est refusée en entier : aucune étape modifiée", () => {
    const onChangeSpy = jest.fn();
    const full = "x".repeat(1000);
    render(<Harness initial={{ instructionSteps: [full] }} onChangeSpy={onChangeSpy} />);
    focusStep(1);
    fireEvent.changeText(stepInput(1), `${full}y`);
    fireEvent.changeText(stepInput(2), "y\nz");
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(stepInput(1).props.value).toBe(full);
    expect(stepInput(2).props.value).toBe("");
    fireEvent.changeText(stepInput(1), "x".repeat(999));
    expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["x".repeat(999)] });
  });

  it("AC6 — VoiceOver : chaque étape est un champ « Étape n » ; le numéro visible n'est pas lu en double ; textes du lexique", () => {
    render(<Harness initial={{ instructionSteps: ["A", "B"] }} />);
    focusStep(1);
    expect([1, 2, 3].map((n) => stepInput(n).props.accessibilityLabel)).toEqual(["Étape 1", "Étape 2", "Étape 3"]);
    for (const n of [1, 2, 3]) {
      expect(stepNumber(n).props).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });
    }
    const lexicon = strings.screens.exercise.instruction;
    expect(lexicon.firstStepPlaceholder).toBe("Décrivez la première étape");
    expect(lexicon.nextStepPlaceholder).toBe("Étape suivante");
    expect(strings.executionParameters.card).not.toHaveProperty("descriptionPlaceholder");
  });

  it("PRE7-B.2 (B1) — « 3. Étape suivante » apparaît au focus et disparaît à la perte de focus, sans modifier les étapes", async () => {
    const onChangeSpy = jest.fn();
    render(<Harness initial={{ instructionSteps: ["A", "B"] }} onChangeSpy={onChangeSpy} />);
    expect(screen.queryByText("Étape suivante")).toBeNull();
    expect(screen.queryByTestId("exercise-instruction-step-3")).toBeNull();
    focusStep(2);
    expect(stepInput(3).props).toMatchObject({ value: "", placeholder: "Étape suivante" });
    fireEvent(stepInput(2), "blur");
    await flushDeferredBlur();
    expect(screen.queryByTestId("exercise-instruction-step-3")).toBeNull();
    expect(rowCount()).toBe(2);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it("PRE7-B.2 (B1) — passage de ligne à ligne (perte de focus avant le focus suivant, ordre iOS) : l'invite n'est jamais démontée", async () => {
    render(<Harness initial={{ instructionSteps: ["A", "B"] }} />);
    focusStep(1);
    const prompt = stepInput(3);
    fireEvent(stepInput(1), "blur");
    expect(stepInput(3)).toBe(prompt);
    focusStep(2);
    await flushDeferredBlur();
    expect(stepInput(3)).toBe(prompt);
    // Saisie dans l'invite : l'étape 3 est créée, une nouvelle invite suit tant que la saisie dure.
    fireEvent(stepInput(2), "blur");
    focusStep(3);
    await flushDeferredBlur();
    fireEvent.changeText(stepInput(3), "C");
    expect(stepInput(4).props.placeholder).toBe("Étape suivante");
    fireEvent(stepInput(3), "blur");
    await flushDeferredBlur();
    expect(rowCount()).toBe(3);
  });

  it("PRE7-B.2 (B1) — dernière étape vide (Entrée) : masquée au repos, conservée dans les étapes ; état vide : « Décrivez la première étape » toujours rendue", async () => {
    const onChangeSpy = jest.fn();
    const view = render(<Harness initial={{ instructionSteps: ["A"] }} onChangeSpy={onChangeSpy} />);
    focusStep(1);
    fireEvent.changeText(stepInput(1), "A\n");
    expect(onChangeSpy).toHaveBeenLastCalledWith({ instructionSteps: ["A", ""] });
    fireEvent(stepInput(1), "blur");
    await flushDeferredBlur();
    expect(rowCount()).toBe(1);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    view.unmount();

    const view2 = render(<Harness initial={{ instructionSteps: [""] }} />);
    expect(rowCount()).toBe(1);
    expect(stepInput(1).props.placeholder).toBe("Décrivez la première étape");
    focusStep(1);
    expect(rowCount()).toBe(1);
    fireEvent(stepInput(1), "blur");
    await flushDeferredBlur();
    view2.unmount();

    // Entrée dans une Description vide (`["", ""]`) : au repos, une ligne, invite de première étape, étapes inchangées.
    const onEmptyChange = jest.fn();
    render(<Harness initial={{ instructionSteps: ["", ""] }} onChangeSpy={onEmptyChange} />);
    expect(rowCount()).toBe(1);
    expect(stepInput(1).props.placeholder).toBe("Décrivez la première étape");
    expect(onEmptyChange).not.toHaveBeenCalled();
    focusStep(1);
    expect(rowCount()).toBe(2);
    fireEvent(stepInput(1), "blur");
    await flushDeferredBlur();
    expect(stepInput(1).props.placeholder).toBe("Décrivez la première étape");
  });

  it("AC6 — ordre Description → Paramètres d'exécution → Média et titre « Paramètres d'exécution » inchangés", () => {
    render(<Harness initial={{ instructionSteps: ["A"] }} />);
    const sections = within(screen.getByTestId("exercise-body"))
      .getAllByTestId(/^(exercise-section-description|exercise-section-parameters|activity-editor-section-media)$/u)
      .map((node) => node.props.testID as string);
    expect(sections).toEqual(["exercise-section-description", "exercise-section-parameters", "activity-editor-section-media"]);
    expect(within(screen.getByTestId("exercise-section-parameters")).getByText("Paramètres d’exécution")).toBeTruthy();
  });
});

/**
 * PRE-5 story 3.2 (R-14, FR-36 à FR-38, AD-30) — Carte allégée, `Terminer` abaissé, titres
 * de section et Classification Catégorie / Zones (frames `8328:35698`, `8328:36853`,
 * `8328:37022`). Styles appliqués seulement : le rendu, la position de `Terminer` face à
 * l'indicateur d'accueil et les cibles se jugent sur iPhone (R-3.2-01 à R-3.2-05).
 */
describe("ActivityEditorForm — PRE-5 story 3.2", () => {
  const EMPTY = parameters({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } });
  const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

  it("AC1 — Compte à rebours 10 s et Fin 5 s : ni ligne, ni valeur, ni filet sur la Carte ; libellé sans ces valeurs (Phrase remplie puis vide) ; la Feuille les montre toujours", () => {
    const view = render(<Harness initial={{ executionParameters: parameters({ countdownSeconds: 10, endSeconds: 5 }) }} />);
    const card = screen.getByTestId("exercise-parameters-card");
    // La Carte ne contient que la Phrase : aucun filet ni rangée de phases.
    const children = ((card.props.children as unknown[]).flat().filter(Boolean) as { type: { name?: string }; props: { testID?: string } }[])
      // Vue de débogage de `Pressable` (développement seulement), sans rendu.
      .filter((child) => child.type.name !== "PressabilityDebugView");
    expect(children).toHaveLength(1);
    expect(children[0]!.props.testID).toBe("exercise-parameters-phrase");
    expect(within(card).queryByText(/Compte à rebours|Fin d’exercice/u)).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-countdown")).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-end")).toBeNull();
    expect(card.props.accessibilityLabel).toBe(`Modifier les paramètres d’exécution. ${phrase()}`);
    expect(card.props.accessibilityLabel).not.toMatch(/Compte à rebours|Fin d’exercice|10 s,/u);
    // Clés orphelines retirées (AD-32) ; la Feuille garde les siennes.
    expect(strings.executionParameters.card).not.toHaveProperty("countdown");
    expect(strings.executionParameters.card).not.toHaveProperty("end");
    expect(strings.executionParameters.sheet.countdown).toBe("Compte à rebours");
    fireEvent.press(card);
    fireEvent.press(screen.getByLabelText("Afficher le compte à rebours et la fin d’exercice"));
    expect(screen.getByTestId("execution-sheet-countdown-value").props.children).toBe("10 s");
    expect(screen.getByTestId("execution-sheet-end-value").props.children).toBe("5 s");
    view.unmount();

    render(<Harness initial={{ executionParameters: EMPTY }} />);
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toBe("Modifier les paramètres d’exécution.");
  });

  it("AC1 — Carte : fond `surfaceSubtle`, rayon 12, sans liseré, padding 12 / 24 (gouttière des étapes)", () => {
    render(<Harness />);
    const card = style("exercise-parameters-card");
    expect(card).toMatchObject({ backgroundColor: "#F9FAFC", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 });
    expect(card.borderWidth ?? 0).toBe(0);
    expect(card.borderColor).toBeUndefined();
  });

  // PRE-6 story 7.10 (D-444, remplace « 24 du bord de l'écran » et la réserve de 12 de PRE-5 3.2) :
  // zone protégée de 24 + 48 + encart + 8 (16 sans encart) ; réserve = hauteur de la zone.
  // Correctif J6f (D-444) : zone de 114 (encart 34) ou 88 (sans encart), bouton centré (33 / 20).
  it("AC2, story 7.10 (correctif J6f) — `Terminer` centré dans la zone : 33 au-dessus et au-dessous avec `insets.bottom` 34, 20 sans encart ; hors du `KeyboardAvoidingView` ; réserve de défilement = hauteur de la zone (114 / 88)", () => {
    for (const [bottom, padding, zone] of [[34, 33, 114], [0, 20, 88]] as const) {
      const view = render(<Harness safeAreaBottom={bottom} />);
      expect(style("test-finish-slot")).toMatchObject({ paddingTop: padding, paddingBottom: padding });
      expect(padding * 2 + 48).toBe(zone);
      expect(within(screen.UNSAFE_getByType(KeyboardAvoidingView)).queryByTestId("test-finish-slot")).toBeNull();
      expect(StyleSheet.flatten(screen.getByTestId("exercise-body").props.contentContainerStyle).paddingBottom).toBe(zone);
      // Couleurs actif / inactif inchangées.
      expect(style("test-finish-action").backgroundColor).toBe("#0508E5");
      view.unmount();
    }
    render(<Harness isFinishDisabled />);
    expect(style("test-finish-action").backgroundColor).toBe("#BEC2CC");
  });

  it("AC2 — `Terminer` : hauteur `dimensions.finalAction.buttonHeight` (48) et ombre locale #1A1A26 18 %, (0, 2), rayon 10, actif comme inactif (PRE-5 3.2, arbitrage G-8)", () => {
    for (const isFinishDisabled of [false, true]) {
      const view = render(<Harness isFinishDisabled={isFinishDisabled} />);
      expect(style("test-finish-action")).toMatchObject({
        minHeight: dimensions.finalAction.buttonHeight,
        shadowColor: "#1A1A26",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 10,
        elevation: 3,
      });
      expect(dimensions.finalAction.buttonHeight).toBe(48);
      view.unmount();
    }
  });

  it("AC2 (revue), story 7.10 (correctif J6f) — Android, bord à bord, encart bas 48 (barre de navigation à 3 boutons) : zone 24 + 48 + 56 = 128 ; centré, `Terminer` couvrirait 8 points de la barre : bas à 48 (jamais sous l'encart), 32 au-dessus ; encart 0 : centré 20 / 20", () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    try {
      const view = render(<Harness safeAreaBottom={48} />);
      expect(style("test-finish-slot")).toMatchObject({ paddingTop: 32, paddingBottom: 48 });
      view.unmount();
      render(<Harness safeAreaBottom={0} />);
      expect(style("test-finish-slot")).toMatchObject({ paddingTop: 20, paddingBottom: 20 });
    } finally {
      os.restore();
    }
  });

  it("AC2 — titres de section (Description, Paramètres d’exécution) en Regular 11 `textSecondary`, rôle `header` ; « Médias » en-tête VoiceOver sans titre visible (PRE-5 3.2, arbitrage G-7)", () => {
    render(<Harness />);
    for (const title of ["Description de l’exercice", "Paramètres d’exécution"]) {
      const node = screen.getByText(title);
      expect(node.props.accessibilityRole).toBe("header");
      expect(StyleSheet.flatten(node.props.style)).toMatchObject({
        fontFamily: "Inter_400Regular",
        fontSize: 11,
        color: "#595E66",
      });
    }
    // G-7 : le titre « Médias » reste un en-tête lu par VoiceOver (ni masqué, ni retiré de
    // l'arbre d'accessibilité), mais hors flux, 1 × 1, rogné et transparent.
    const media = screen.getByTestId("activity-editor-media-title");
    expect(media.props.children).toBe("Médias");
    expect(media.props.accessibilityRole).toBe("header");
    expect(media.props.accessibilityElementsHidden).not.toBe(true);
    expect(media.props.importantForAccessibility).not.toBe("no-hide-descendants");
    expect(within(screen.getByTestId("activity-editor-section-media")).getByTestId("activity-editor-media-title")).toBe(media);
    const mediaStyle = StyleSheet.flatten(media.props.style);
    expect(mediaStyle).toMatchObject({ position: "absolute", width: 1, height: 1, overflow: "hidden", color: "transparent" });
    expect(mediaStyle.opacity ?? 1).toBe(1);
    expect(mediaStyle.display).toBeUndefined();
  });

  it("AC3 — Classification : même géométrie « à renseigner » et « renseigné » ; seuls fond et couleurs changent ; glyphe Catégorie teinté", () => {
    const GEOMETRY = ["minHeight", "height", "borderRadius", "paddingLeft", "paddingRight", "gap", "borderWidth"] as const;
    const geometry = (testID: string) => {
      const value = style(testID) as Record<string, unknown>;
      return Object.fromEntries(GEOMETRY.map((key) => [key, value[key]]));
    };
    const view = render(<Harness />);
    const unsetCategory = geometry("activity-editor-category-button");
    const unsetZones = geometry("exercise-body-zones-open");
    expect(unsetCategory).toMatchObject({ minHeight: 26, borderRadius: 13, paddingLeft: 8, paddingRight: 10, gap: 6 });
    expect(unsetZones).toEqual(unsetCategory);
    for (const testID of ["activity-editor-category-button", "exercise-body-zones-open"]) {
      expect(style(testID).backgroundColor).toBe("rgba(255, 255, 255, 0.35)");
    }
    for (const label of ["activity-editor-category-label", "exercise-body-zones-label"]) {
      expect(style(label)).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 13, color: "#0508E5" });
    }
    expect(style("activity-editor-category-icon")).toMatchObject({ width: 18, height: 18 });
    expect(style("exercise-body-zones-icon")).toMatchObject({ width: 18, height: 18 });
    expect(style("exercise-reference-row")).toMatchObject({ paddingLeft: 6, columnGap: 20 });
    // E-V4 : écart Nom → rangée nul.
    expect(style("exercise-context-band").gap ?? 0).toBe(0);
    view.unmount();

    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ bodyZoneIds: ["cou"] }} />);
    expect(geometry("activity-editor-category-button")).toEqual(unsetCategory);
    expect(geometry("exercise-body-zones-open")).toEqual(unsetZones);
    for (const testID of ["activity-editor-category-button", "exercise-body-zones-open"]) {
      expect(style(testID).backgroundColor).toBeUndefined();
    }
    expect(StyleSheet.flatten(screen.getByText("Cardio").props.style)).toMatchObject({ fontSize: 13, color: "#141414" });
    expect(style("exercise-body-zones-label")).toMatchObject({ fontSize: 13, color: "#141414" });
    expect(style("activity-editor-category-glyph")).toMatchObject({ width: 18, height: 18, tintColor: "#3B82F6" });
  });

  it("AC3 — Catégorie sans couleur : glyphe plein non teinté", () => {
    render(<Harness category={{ name: "Mobilité", color: null }} />);
    expect(style("activity-editor-category-glyph").tintColor).toBeUndefined();
  });

  it("AC3 — rangée de 32 ; cibles ≥ 44 de haut étendues vers le bas, sans recouvrir le Nom (`hitSlop` 1 / 17) ; débord sous la rangée dans la marge basse de la zone ; frontière au milieu de l'écart de 20", () => {
    render(<Harness />);
    const rowHeight = style("exercise-reference-row").minHeight as number;
    expect(rowHeight).toBe(32);
    for (const testID of ["activity-editor-category-button", "exercise-body-zones-open"]) {
      const slop = screen.getByTestId(testID).props.hitSlop as { top: number; bottom: number; left: number; right: number };
      const accessHeight = style(testID).minHeight as number;
      expect(slop).toEqual({ top: 1, bottom: 17, left: 10, right: 10 });
      expect(accessHeight + slop.top + slop.bottom).toBeGreaterThanOrEqual(44);
      // L'accès est centré dans la rangée : son débord haut reste sous le cadre du Nom.
      expect(slop.top).toBeLessThanOrEqual((rowHeight - accessHeight) / 2);
      const overflowBelowRow = slop.bottom - (rowHeight - accessHeight) / 2;
      expect(overflowBelowRow).toBe(14);
      expect(overflowBelowRow).toBeLessThanOrEqual(dimensions.contextBand.paddingBottom);
      expect(style("exercise-reference-row").rowGap).toBe(overflowBelowRow);
    }
  });
});

/**
 * Recette JA, décision de Hermann du 26/10/2026 (« un appui sur une zone de l'écran doit fermer le
 * clavier et ne doit pas ouvrir les paramètres ou éditer la zone de description ») : la fermeture
 * est portée par la primitive native (`keyboardShouldPersistTaps="never"`, capture du premier
 * appui) ; l'effet tactile réel se constate sur iPhone.
 */
describe("ActivityEditorForm — recette JA (Nom en saisie, appui ailleurs)", () => {
  const body = () => screen.getByTestId("exercise-body");
  const stepsArea = () => screen.getByTestId("exercise-description-steps-area");

  it("Nom en saisie : corps en `never`, étapes de Description sans toucher ; fin de saisie : retour à `handled`", () => {
    render(<Harness />);
    expect(body().props.keyboardShouldPersistTaps).toBe("handled");
    expect(stepsArea().props.pointerEvents).toBe("auto");
    fireEvent(screen.getByTestId("exercise-name-input"), "focus");
    expect(body().props.keyboardShouldPersistTaps).toBe("never");
    expect(stepsArea().props.pointerEvents).toBe("none");
    fireEvent(screen.getByTestId("exercise-name-input"), "blur");
    expect(body().props.keyboardShouldPersistTaps).toBe("handled");
    expect(stepsArea().props.pointerEvents).toBe("auto");
  });

  it("Description en saisie : corps en `handled` (barre d'accessoire, ↑ D-351, étapes D-425 inchangés)", () => {
    render(<Harness />);
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    expect(body().props.keyboardShouldPersistTaps).toBe("handled");
    expect(stepsArea().props.pointerEvents).toBe("auto");
  });
});

describe("ActivityEditorForm — PRE-7 R-7 (D-448, point 7)", () => {
  const workPhases = [
    { id: 1, label: "Montée", durationSeconds: 3 },
    { id: 2, label: "Descente", durationSeconds: 0 },
  ];

  it("phase sans durée : « Paramètres à compléter. » en `colors.danger` sur la fiche ; phrase complète inchangée", () => {
    render(
      <Harness
        initial={{
          executionParameters: parameters({
            series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 60, loadKg: 0, workPhases },
          }),
        }}
      />,
    );
    const node = screen.getByTestId("exercise-parameters-phrase");
    expect(renderedPhrase()).toBe(strings.executionParameters.card.incomplete);
    expect(StyleSheet.flatten(node.props.style).color).toBe(colors.danger);
  });

  it("paramètres complets : couleur de phrase ordinaire", () => {
    render(<Harness />);
    expect(StyleSheet.flatten(screen.getByTestId("exercise-parameters-phrase").props.style).color).toBe(colors.textPrimary);
  });
});

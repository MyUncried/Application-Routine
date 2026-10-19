import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import { AccessibilityInfo, Dimensions, StyleSheet } from "react-native";

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
  EDITOR_VERTICAL_GRID,
  editorSideMargin,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import { chooseExecutionMode, tapExecutionSheetStep } from "@/features/activities/testing/executionSheetActions";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
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
    version: 3,
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
  mediaService = null,
  silhouette,
  isCategoryPickerOpen,
  bodyZones = BODY_ZONE_FIXTURES,
}: {
  bodyZones?: readonly BodyZone[];
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
    <TestSafeAreaProvider>
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
    </TestSafeAreaProvider>
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
      "1 série de 1 min 30 s, avec 15 s de pause après chaque série, en faisant le côté droit puis le gauche, avec 10 s de pause au changement de côté. Durée totale : 3 min 40 s.",
    );
    expect(boldSegments()).toEqual(expect.arrayContaining(["1 série", "1 min 30 s", "gauche", "3 min 40 s"]));
    expect(boldSegments()).not.toContain("droit");
  });

  it("P3-20/all-surfaces — titres et valeurs des écrans de référence ; carte bordée rayon 12 ; phrase Inter 13 / 20", () => {
    render(<Harness initial={{ executionParameters: parameters({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }) }} />);
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    // Story 4.2 (Q23) : « Choisir un mode » retiré ; E-21 : la Carte vide ne porte aucune invite.
    expect(screen.queryByText("Choisir un mode")).toBeNull();
    expect(screen.queryByText("Appuyez pour définir les séries et les durées")).toBeNull();
    expect(screen.getByText("Compte à rebours")).toBeTruthy();
    expect(screen.getByText("Fin d’exercice")).toBeTruthy();
    expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("10 s");
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("5 s");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-parameters-card").props.style)).toMatchObject({
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E0E3E8",
    });
    // E-21 (2026-10-18) : sans Mode, aucune invite ; la Phrase (vide, PRE-3) garde son style.
    expect(screen.queryByTestId("exercise-parameters-empty-prompt")).toBeNull();
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
    expect(card.props.accessibilityLabel).toBe(
      `Modifier les paramètres d’exécution. ${phrase()} Compte à rebours 10 s, Fin d’exercice 5 s.`,
    );
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
    // Centre : marge 24 + rayon du bouton 19 en x ; 24 au-dessus de la zone (moitié de l’en-tête 48) en y.
    expect(halo.left! + 29.64).toBeCloseTo(43, 5);
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
  it("N-05 — Terminer hors de la zone qui évite le clavier ; Description recadrée juste au-dessus du clavier, hauteur bornée pendant la saisie puis rétablie", () => {
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
    layout("exercise-instruction-input", 25, 120);

    scrollTo.mockClear();
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-instruction-input").props.style).maxHeight).toBe(276);
    act(() => listeners.keyboardDidShow!());
    // Bas du champ (400 + 25 + 120) + marge 12 − zone visible 300 = 257.
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 257, animated: true });

    // Le champ grandit avec les retours à la ligne : nouveau recadrage.
    layout("exercise-instruction-input", 25, 180);
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 317, animated: true });

    fireEvent(screen.getByTestId("exercise-instruction-input"), "blur");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-instruction-input").props.style).maxHeight).toBeUndefined();
    scrollTo.mockRestore();
    addListener.mockRestore();
  });
});

describe("ActivityEditorForm — recette 3 (N-05 : ↑ dans la Description)", () => {
  it("N-05 — ↑ visible dans le champ pendant la saisie, nommé ; il ferme le clavier sans enregistrer ; texte multiligne conservé ; retour à la ligne inchangé", () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    const onFinish = jest.fn();
    render(<Harness onFinish={onFinish} />);
    const input = () => screen.getByTestId("exercise-instruction-input");

    // Hors saisie : pas de ↑ ; la place du bouton est réservée (le texte ne change pas de largeur au focus).
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
    const reserved = StyleSheet.flatten(input().props.style).paddingRight as number;
    expect(reserved).toBeGreaterThanOrEqual(32 + 16);

    fireEvent(input(), "focus");
    fireEvent.changeText(input(), "Ligne 1\nLigne 2");
    const send = screen.getByTestId("exercise-instruction-submit");
    expect(send.props.accessibilityLabel).toBe("Valider la description");
    expect(within(screen.getByTestId("exercise-section-description")).getByTestId("exercise-instruction-submit")).toBe(send);
    expect(StyleSheet.flatten(send.props.style)).toMatchObject({ position: "absolute", width: 32, height: 32, borderRadius: 16 });
    expect(StyleSheet.flatten(input().props.style).paddingRight).toBe(reserved);
    // Description reste multiligne : la touche Retour n’est jamais une validation.
    expect(input().props.multiline).toBe(true);
    expect(input().props.onSubmitEditing).toBeUndefined();

    fireEvent.press(send);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent(input(), "blur");
    expect(screen.queryByTestId("exercise-instruction-submit")).toBeNull();
    expect(input().props.value).toBe("Ligne 1\nLigne 2");
    expect(screen.getByTestId("test-finish-slot")).toBeTruthy();
    dismiss.mockRestore();
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
  it("PRE4-2.2/AC1 — Compte à rebours et Fin d'exercice passent par le formateur unique : 60 → « 1 min », 0 → « 0 s »", () => {
    render(<Harness initial={{ executionParameters: parameters({ countdownSeconds: 60, endSeconds: 0 }) }} />);
    expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("1 min");
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("0 s");
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

  it("PRE4-2.3/AC15 — cas 144 affiché en entier dans la Carte, un seul flux de texte, aucun plafond ; Compte à rebours et Fin sur leurs lignes", () => {
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
      "6 séries de 12 répétitions cadencées toutes les 4 s, avec 15 s de pause après chaque série, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté. Durée totale : ≈ 12 min 41 s.",
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
    // Inter 13 Regular, interligne 20 ; segments gras en Inter Semi Bold (600).
    expect(StyleSheet.flatten(node.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontWeight: "400",
      fontSize: 13,
      lineHeight: 20,
    });
    for (const child of nested) {
      expect(StyleSheet.flatten(child.props.style as Parameters<typeof StyleSheet.flatten>[0])).toMatchObject({
        fontFamily: "Inter_600SemiBold",
        fontWeight: "600",
      });
    }
    expect(boldSegments()).toEqual(["6 séries", "12 répétitions", "4 s", "15 s", "droite", "gauche", "5 s", "≈ 12 min 41 s"]);
    expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("10 s");
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("5 s");
    expectUncapped(screen.getByTestId("exercise-parameters-countdown"));
    expectUncapped(screen.getByTestId("exercise-parameters-end"));
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
    // Story 4.2 (Q23, AC14) : bouton de Mode retiré ; libellé accessible de la Carte inchangé.
    expect(screen.queryByTestId("exercise-parameters-mode")).toBeNull();
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toBe(
      `Modifier les paramètres d’exécution. ${phrase()} Compte à rebours 10 s, Fin d’exercice 5 s.`,
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

  it("PRE4-4.2/AC5 — marge latérale 16 à 360, 24 à 390, 402 et 440 ; Terminer 354 de large à 402 ; grille 18 / 13 / 20 / 12 par styles, sans position absolue", () => {
    expect([360, 389, 390, 402, 440].map(editorSideMargin)).toEqual([16, 16, 24, 24, 24]);
    expect(EDITOR_VERTICAL_GRID).toEqual({ contextToFirstText: 18, blockToNextTitle: 20, titleToBlock: 13, blockToBlock: 12 });
    for (const [width, margin] of [
      [360, 16],
      [390, 24],
      [402, 24],
      [440, 24],
    ] as const) {
      const view = renderAtWidth(width);
      try {
        expect(style("exercise-context-band").paddingHorizontal).toBe(margin);
        const content = StyleSheet.flatten(screen.getByTestId("exercise-body").props.contentContainerStyle);
        expect(content.paddingHorizontal).toBe(margin);
        expect(style("test-finish-slot").marginHorizontal).toBe(margin);
        // Centre du halo comparé au padding réellement reçu par `FixedHeader` : `ExerciseScreen.test.tsx`, `PRE4-4.2/AC4 AC5`.
        // Grille de D-327 : 18 du bas du dégradé au premier titre ; 13 titre → bloc ;
        // 20 dernier élément → titre suivant ; 12 dernier bloc → Terminer.
        expect(content).toMatchObject({ paddingTop: 18, paddingBottom: 12 });
        expect(content.gap).toBeUndefined();
        expect(style("exercise-section-description")).toMatchObject({ gap: 13 });
        expect(style("exercise-section-description").marginTop).toBeUndefined();
        for (const section of ["exercise-section-parameters", "activity-editor-section-media"]) {
          expect(style(section)).toMatchObject({ gap: 13, marginTop: 20 });
        }
        expect(style("test-finish-slot").marginTop).toBeUndefined();
        for (const testID of ["exercise-section-description", "exercise-section-parameters", "activity-editor-section-media", "test-finish-slot", "test-finish-action"]) {
          expect(style(testID).position === "absolute").toBe(false);
        }
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
    // Composition PRE-3 du libellé accessible (Phrase vide).
    expect(card.props.accessibilityLabel).toBe(
      "Modifier les paramètres d’exécution.  Compte à rebours 10 s, Fin d’exercice 5 s.",
    );
    // Lignes Compte à rebours et Fin, dans la Carte (P17).
    expect(within(card).getByTestId("exercise-parameters-countdown")).toBeTruthy();
    expect(within(card).getByTestId("exercise-parameters-end")).toBeTruthy();
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
    expect(card.props.accessibilityLabel).toBe(
      `Modifier les paramètres d’exécution. ${generated} Compte à rebours 10 s, Fin d’exercice 5 s.`,
    );
    // Aucune hauteur fixée sur la Carte ni sur la Phrase (la phrase longue est couverte par PRE4-2.3/AC15).
    for (const testID of ["exercise-parameters-card", "exercise-parameters-phrase"]) {
      expect(style(testID)).not.toHaveProperty("height");
      expect(style(testID)).not.toHaveProperty("maxHeight");
    }
  });

  it("PRE4-4.2/AC7 — Description facultative, multiligne, 1000 caractères ; Retour reste un retour à la ligne ; ↑ ferme le clavier sans enregistrer ; placeholder du code de départ", () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    const onFinish = jest.fn();
    const onChangeSpy = jest.fn();
    try {
      render(<Harness onFinish={onFinish} onChangeSpy={onChangeSpy} />);
      const input = () => screen.getByTestId("exercise-instruction-input");
      expect(input().props).toMatchObject({
        multiline: true,
        maxLength: 1000,
        accessibilityLabel: "Description de l’exercice",
        placeholder: "Décrivez ce qu’il faut faire, comment, et avec quoi",
      });
      expect(input().props.onSubmitEditing).toBeUndefined();
      expect(isActivityEditorFormValid(baseValue({ name: "Squat", instruction: null }))).toBe(true);
      fireEvent(input(), "focus");
      fireEvent.changeText(input(), "Dos droit.\nGenoux fléchis.");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instruction: "Dos droit.\nGenoux fléchis." });
      fireEvent.press(screen.getByTestId("exercise-instruction-submit"));
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(onFinish).not.toHaveBeenCalled();
      // Effacée, la Description redevient absente (facultative).
      fireEvent.changeText(input(), "");
      expect(onChangeSpy).toHaveBeenLastCalledWith({ instruction: null });
      expect(screen.queryByText(/Décrivez la première étape|Étape suivante/u)).toBeNull();
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
      expect(style("test-finish-slot")).toMatchObject({ marginHorizontal: 24 });
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
        initial: { name: "Squat", instruction: "Dos droit.", media: [PHOTO_ITEM], executionParameters: EMPTY },
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
      if (state.initial.instruction) expect(screen.getByDisplayValue(state.initial.instruction)).toBeTruthy();
      if (state.initial.media?.length) {
        // Une tuile par Média, par son identifiant (jamais un motif qui attraperait le conteneur).
        const section = within(screen.getByTestId("activity-editor-section-media"));
        expect(section.getByTestId("media-item-1")).toBeTruthy();
        expect(section.queryAllByTestId(/^media-item-\d+$/u)).toHaveLength(state.initial.media.length);
      }
      if (executionParameters.mode !== null && executionParameters.sideMode !== "UNILATERAL") {
        expect(phrase()).toMatch(/droit|gauche/u);
      }
      view.unmount();
    }
  });

  it("PRE4-4.2/AC13 — rendu par les jetons existants : couleurs et typographies retenues au relevé ; aucune opacité locale codée en dur", () => {
    render(<Harness initial={{ executionParameters: EMPTY }} isFinishDisabled />);
    expect(style("exercise-context-band").backgroundColor).toBe("#EAEAFF");
    expect(style("exercise-name-input")).toMatchObject({ fontSize: 20, lineHeight: 24, color: "#141414" });
    expect(style("exercise-parameters-phrase")).toMatchObject({ fontSize: 13, lineHeight: 20 });
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

  it("PRE4-4.3/AC2 — non renseignés : chaque accès est un bouton icône + libellé « Catégorie » / « Zone corporelle » (lexique), icônes au contour", () => {
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
    expect(iconSource("activity-editor-category-icon")).toEqual(CONTOUR_CATEGORIE);
    expect(iconSource("exercise-body-zones-icon")).toEqual(CONTOUR_HOMME);
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

  it("PRE4-4.3/AC2 — renseignés : pilule pastille + nom (Catégorie) ; silhouette + noms des Zones avec le séparateur de la capture `8328:37022`", () => {
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ bodyZoneIds: ["cou", "fessier"] }} />);
    const categoryButton = screen.getByTestId("activity-editor-category-button");
    expect(
      StyleSheet.flatten(within(categoryButton).getByTestId("activity-editor-category-swatch").props.style).backgroundColor,
    ).toBe("#3B82F6");
    expect(within(categoryButton).getByText("Cardio")).toBeTruthy();
    expect(within(categoryButton).queryByTestId("activity-editor-category-label")).toBeNull();
    expect(within(categoryButton).queryByTestId("activity-editor-category-icon")).toBeNull();
    expect(categoryButton.props.accessibilityLabel).toBe("Catégorie Cardio");
    const zonesButton = screen.getByTestId("exercise-body-zones-open");
    expect(iconSource("exercise-body-zones-icon")).toEqual(CONTOUR_HOMME);
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

  it("PRE4-4.3/AC2 — icône pleine pendant l'ouverture de la feuille des Zones, retour au contour après ✕ puis après ✓ ; la pilule ne change pas", async () => {
    render(<Harness initial={{ bodyZoneIds: ["cou"] }} />);
    const pillStyle = () => StyleSheet.flatten(screen.getByTestId("exercise-body-zones-open").props.style);
    const restingPill = pillStyle();
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(iconSource("exercise-body-zones-icon-filled")).toEqual(PLEIN_HOMME);
    expect(screen.queryByTestId("exercise-body-zones-icon")).toBeNull();
    expect(pillStyle()).toEqual(restingPill);
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    expect(iconSource("exercise-body-zones-icon")).toEqual(CONTOUR_HOMME);
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(screen.getByTestId("exercise-body-zones-icon-filled")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(iconSource("exercise-body-zones-icon")).toEqual(CONTOUR_HOMME);
    expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
  });

  it("PRE4-4.3/AC2 — icône Catégorie pleine tant que l'adaptateur signale sa feuille ouverte, au contour sinon ; même pilule", () => {
    const view = render(<Harness isCategoryPickerOpen />);
    const openPill = StyleSheet.flatten(screen.getByTestId("activity-editor-category-button").props.style);
    expect(iconSource("activity-editor-category-icon-filled")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-label")).toBeTruthy();
    view.rerender(<Harness isCategoryPickerOpen={false} />);
    expect(iconSource("activity-editor-category-icon")).toEqual(CONTOUR_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("activity-editor-category-button").props.style)).toEqual(openPill);
  });

  it("PRE4-4.3/AC2 — une seule silhouette, celle du Profil (homme par défaut, femme si choisie), dans ses deux états ; jamais deux boutons homme / femme", async () => {
    for (const [silhouette, contour, plein, contourSource, pleinSource] of [
      [null, "body-zone-homme", "body-zone-homme-plein", CONTOUR_HOMME, PLEIN_HOMME],
      ["homme", "body-zone-homme", "body-zone-homme-plein", CONTOUR_HOMME, PLEIN_HOMME],
      ["femme", "body-zone-femme", "body-zone-femme-plein", CONTOUR_FEMME, PLEIN_FEMME],
    ] as const) {
      const view = render(<Harness silhouette={silhouette} />);
      expect(renderedSilhouettes()).toEqual([contour]);
      expect(iconSource("exercise-body-zones-icon")).toEqual(contourSource);
      expect(screen.queryByLabelText(/homme|femme/i)).toBeNull();
      fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
      await screen.findByTestId("body-zone-selector-tag-cou");
      // Feuille ouverte : la seule silhouette est celle, pleine, du bandeau ; aucune
      // n'est répétée dans les options (AC5).
      expect(renderedSilhouettes()).toEqual([plein]);
      expect(iconSource("exercise-body-zones-icon-filled")).toEqual(pleinSource);
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
      // Largeur : marges + icône (20 au moins) + écart + libellé non vide, plus les débords latéraux.
      const minimalWidth =
        (style.paddingLeft as number) + (style.paddingRight as number) + 20 + (style.gap as number) + 1 + slop.left + slop.right;
      expect(minimalWidth).toBeGreaterThanOrEqual(44);
      expect(slop.left + slop.right).toBeLessThanOrEqual(columnGap);
      expect(slop.top + slop.bottom).toBeLessThanOrEqual(rowGap);
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
        initial={{ name: "Fentes", instruction: "Dos droit", executionParameters, bodyZoneIds: ["cou"] }}
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

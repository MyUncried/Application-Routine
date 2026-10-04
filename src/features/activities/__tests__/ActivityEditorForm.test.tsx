import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
} from "@/features/activities/ActivityEditorForm";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * `ActivityEditorForm` reçoit désormais le référentiel persistant des Zones
 * corporelles en prop (V2-PRE-1, plan §3.1, UI-1652FFC3B512) — jamais
 * `BODY_ZONES` importé statiquement. Fixture locale reprenant les mêmes
 * identifiants/noms que le référentiel historique, pour ce fichier.
 */
const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "epaules", name: "Épaules", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

/**
 * V2-PRE-2 (plan §6.5) : `ActivityEditorForm` ouvre désormais
 * `BodyZonePickerModal` (confirmation explicite), qui s'auto-alimente via
 * `ReferentialServiceContext` — jamais `bodyZones` (la prop ne sert plus
 * qu'à la synthèse affichée hors modale).
 */
function fakeReferentialService(): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => BODY_ZONE_FIXTURES),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function baseValue(overrides: Partial<ActivityEditorFormValue> = {}): ActivityEditorFormValue {
  const draft = createExerciseDraft("draft-id");
  return {
    name: draft.name,
    instruction: draft.instruction,
    executionMode: draft.executionMode,
    durationSeconds: draft.durationSeconds,
    repetitionCount: draft.repetitionCount,
    seriesCount: draft.seriesCount,
    pauseSeconds: draft.pauseSeconds,
    bodyZoneIds: draft.bodyZoneIds,
    sideMode: draft.sideMode,
    ...overrides,
  };
}

function Harness({
  initial,
  onChangeSpy,
  onFinish = jest.fn(),
  showMediaSection = true,
  errorMessage = null,
  isFinishDisabled = false,
}: {
  initial?: Partial<ActivityEditorFormValue>;
  onChangeSpy?: (patch: Partial<ActivityEditorFormValue>) => void;
  onFinish?: () => void;
  showMediaSection?: boolean;
  errorMessage?: string | null;
  isFinishDisabled?: boolean;
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
          showMediaSection={showMediaSection}
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

describe("ActivityEditorForm", () => {
  it("renders the name field with the current value", () => {
    render(<Harness initial={{ name: "Squat" }} />);
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
  });

  it("reports a name change", () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes");
    expect(onChangeSpy).toHaveBeenCalledWith({ name: "Fentes" });
  });

  it("switches to REPETITIONS mode and shows the repetition field instead of duration", async () => {
    render(<Harness initial={{ name: "Squat" }} />);
    expect(screen.getByTestId("exercise-field-duration")).toBeTruthy();

    fireEvent.press(screen.getByText("Répétitions"));

    // V2-CAT-01 (retour indépendant, minuteurs Jest) : ce changement de
    // segment démarre l'indicateur animé de `SegmentedControl`
    // (`Animated.timing`, 220 ms, minuteurs RÉELS — hors périmètre de
    // modification de ce composant). Laisser ce minuteur s'achever avant la
    // fin du test évite qu'il ne se déclenche après le démontage de
    // l'environnement Jest de ce fichier (avertissement `act()`
    // asynchrone, voire erreur d'environnement démonté sur certains
    // runners CI).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(screen.queryByTestId("exercise-field-duration")).toBeNull();
    expect(screen.getByTestId("exercise-field-repetitionCount")).toBeTruthy();
  });

  it("selects a body zone via the picker modal and applies it on Confirmer (V2-PRE-2)", async () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    fireEvent.press(screen.getByTestId("exercise-section-body-zones-header"));
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));

    await screen.findByTestId("body-zone-selector-tag-dos");
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-selector-tag-dos"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });

    expect(onChangeSpy).toHaveBeenCalledWith({ bodyZoneIds: ["dos"] });
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 3) :
   * présentation Médias IDENTIQUE quelle que soit l'origine — la section
   * est désormais visible par défaut aussi bien pour la Composition que
   * pour le Catalogue (`showMediaSection` par défaut `true`).
   */
  it("shows the Médias section by default, identically regardless of origin (Composition or Catalogue)", () => {
    render(<Harness />);
    expect(screen.getByTestId("activity-editor-section-media")).toBeTruthy();
  });

  it("keeps the Médias section collapsed by default, with no redundant text or button once expanded", () => {
    render(<Harness />);
    expect(screen.queryByTestId("activity-editor-section-media-content")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-editor-section-media-header"));

    expect(screen.getByTestId("activity-editor-section-media-content")).toBeTruthy();
    // VISUAL_CORRECTION (point 3) : ni le texte d'état vide, ni le bouton
    // `Ajouter un média` redondant de cette section ne subsistent — seul
    // celui de la zone bleue contextuelle, sous le nom, reste (D-105).
    expect(screen.queryByTestId("activity-editor-media-placeholder")).toBeNull();
    expect(screen.queryByText("Aucun média pour cette activité.")).toBeNull();
    expect(screen.queryByTestId("activity-editor-add-media")).toBeNull();
    expect(screen.getByTestId("exercise-add-media")).toBeTruthy();
  });

  it("can still explicitly hide the Médias section when a caller opts out", () => {
    render(<Harness showMediaSection={false} />);
    expect(screen.queryByTestId("activity-editor-section-media")).toBeNull();
  });

  it("bolds only the name inside the summary", () => {
    render(<Harness initial={{ name: "Squat" }} />);
    const boldName = screen.getByTestId("exercise-summary-name");
    expect(boldName.props.children).toBe("Squat");
  });

  it("disables the finish action while the name is empty, without calling onFinish", () => {
    const onFinish = jest.fn();
    render(<Harness initial={{ name: "" }} onFinish={onFinish} />);
    expect(screen.getByTestId("test-finish-action").props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByTestId("test-finish-action"));
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("enables the finish action once the name becomes valid, and calls onFinish when pressed", () => {
    const onFinish = jest.fn();
    render(<Harness initial={{ name: "" }} onFinish={onFinish} />);

    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    expect(screen.getByTestId("test-finish-action").props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId("test-finish-action"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("shows the provided error message above the finish action without losing the draft", () => {
    render(<Harness initial={{ name: "Squat" }} errorMessage="Erreur de sauvegarde" />);
    expect(screen.getByTestId("test-save-error")).toBeTruthy();
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
  });

  it("disables the finish action while an external save is in progress", () => {
    render(<Harness initial={{ name: "Squat" }} isFinishDisabled />);
    expect(screen.getByTestId("test-finish-action").props.accessibilityState.disabled).toBe(true);
  });
});

describe("isActivityEditorFormValid", () => {
  it("is false for an empty name", () => {
    expect(isActivityEditorFormValid(baseValue({ name: "" }))).toBe(false);
  });

  it("is true for a valid DURATION activity", () => {
    expect(isActivityEditorFormValid(baseValue({ name: "Squat" }))).toBe(true);
  });
});

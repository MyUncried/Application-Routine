import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import { createEmptyDraft, createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseSheet } from "@/features/sessions/ExerciseSheet";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 04/11/2026 — décision de Hermann : « Affichage de la fiche d'exercice avec photo,
 * description phase et synthèse des paramètres d'exécution. Pas de bouton d'action en bas, en lecture seule
 * (donc pas d'accès aux paramètres d'exécution en modification), pas d'affichage du titre de section ni de son
 * champ si aucune valeur n'y est renseignée. » Jest ne prouve pas le rendu sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return { ...actual, useRouter: () => ({ push: jest.fn(), back: mockBack }) };
});

const service = {
  supportsMediaImport: false,
  resolveMediaUri: (uri: string) => `file:///${uri}`,
  leaseDraftMedia: jest.fn(),
  importPendingMedia: jest.fn(async () => null),
  listBodyZones: jest.fn(async () => [{ id: "jambes", name: "Jambes" }]),
} as unknown as ActivityDefinitionService;
const referentialService = {
  listCategories: jest.fn(async () => [{ id: "force", name: "Force", color: "#FF0000" }]),
} as unknown as ReferentialService;
const profileService = {
  getProfile: jest.fn(async () => ({
    sideChangeRecoverySecondsDefault: 0,
    exerciseCountdownSecondsDefault: 5,
    exerciseEndSecondsDefault: 0,
    postActivityRecoverySecondsDefault: 30,
    silhouette: null,
  })),
} as unknown as ProfileService;

const PHOTO: DraftMediaItem = {
  assetId: "p1",
  asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "2026-11-04T10:00:00.000Z", kind: "PHOTO" },
};

function withPhases(parameters: ExecutionParameters): ExecutionParameters {
  return {
    ...parameters,
    series: {
      ...parameters.series,
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 2 },
        { id: 2, label: "Montée", durationSeconds: 1 },
      ],
    },
  } as ExecutionParameters;
}

function exercise(patch: Partial<SessionDraftExercise> = {}): SessionDraftExercise {
  return {
    ...createExerciseDraft("ex-1", 0),
    name: "Squats",
    executionParameters: repetitionParameters(10, 3, 30),
    ...patch,
  };
}

function Host({ occurrence, children }: { occurrence: SessionDraftExercise; children: ReactNode }) {
  const value: SessionDraftContextValue = {
    draft: { ...createEmptyDraft(), exercises: [occurrence] },
    updateDraft: jest.fn(),
    resetDraft: jest.fn(),
  };
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

async function renderSheet(occurrence: SessionDraftExercise) {
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
      <ReferentialServiceContext.Provider value={referentialService}>
      <ProfileServiceContext.Provider value={profileService}>
        <Host occurrence={occurrence}>
          <ExerciseSheet exerciseId={occurrence.id} />
        </Host>
      </ProfileServiceContext.Provider>
      </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => undefined);
}

describe("ExerciseSheet — fiche d'un Exercice de la Composition en lecture seule (décision du 04/11/2026)", () => {
  it("affiche nom, photo, description, phases et synthèse des paramètres ; aucun bouton d'action en bas", async () => {
    const parameters = withPhases(repetitionParameters(10, 3, 30));
    await renderSheet(
      exercise({ instruction: encodeInstructionSteps(["Dos droit", "Genoux alignés"]), media: [PHOTO], executionParameters: parameters }),
    );

    expect(screen.getByText(strings.executionParameters.card.exerciseSheetTitle)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Squats");
    expect(screen.getByTestId("exercise-name-input").props.editable).toBe(false);
    expect(screen.getByTestId("movement-photo-template")).toBeTruthy();
    expect(screen.getByTestId("exercise-section-description")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit")).toBeTruthy();
    expect(screen.getByTestId("movement-section-phases")).toBeTruthy();
    expect(screen.getByText("Descente")).toBeTruthy();
    expect(screen.getByText("Montée")).toBeTruthy();
    const phrase = generateExecutionPhrase(parameters);
    expect(phrase).not.toBeNull();
    // Complément du 5 novembre 2026 (§10) : section « Dans cette séance » — Phrase, puis Récupération propre à l'Exercice.
    const section = screen.getByTestId("exercise-section-in-this-session");
    expect(section.props.accessibilityLabel).toContain(phraseText(phrase!));
    expect(screen.getByText(strings.executionParameters.card.inThisSession)).toBeTruthy();
    expect(screen.queryByTestId("exercise-section-parameters")).toBeNull();
    // Pas de bouton d'action en bas.
    expect(screen.queryByTestId("exercise-sheet-finish-slot")).toBeNull();
    expect(screen.queryByTestId("exercise-sheet-finish-action")).toBeNull();
  });

  // Précision de Hermann du 04/11/2026 : « on garde les informations de la zone de contexte telles qu'elles
  // sont, renseignées ou pas. »
  it("zone de contexte inchangée : Catégorie et Zones affichées, renseignées ou non, sans accès", async () => {
    await renderSheet(exercise({ categoryId: "force", bodyZoneIds: ["jambes"] }));
    expect(screen.getByTestId("exercise-reference-row")).toBeTruthy();
    expect(screen.getByText("Force")).toBeTruthy();
    expect(screen.getByTestId("exercise-body-zones-label").props.children).toBe("Jambes");
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("zone de contexte non renseignée : accès Catégorie et Zones affichés quand même (non masqués)", async () => {
    await renderSheet(exercise({ categoryId: null, bodyZoneIds: [] }));
    expect(screen.getByTestId("activity-editor-category-label")).toBeTruthy();
    expect(screen.getByTestId("exercise-body-zones-label")).toBeTruthy();
  });

  it("la synthèse des paramètres n'est pas un bouton : aucune Feuille des paramètres ne s'ouvre", async () => {
    await renderSheet(exercise());

    expect(screen.queryByTestId("exercise-parameters-card")).toBeNull();
    const card = screen.getByTestId("exercise-section-in-this-session");
    expect(card.props.accessibilityRole).toBeUndefined();
    expect(card.props.onPress).toBeUndefined();
    fireEvent.press(screen.getByTestId("exercise-parameters-phrase"));
    await act(async () => undefined);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  });

  it("une section sans valeur n'affiche ni son titre ni son champ (description, photo, phases)", async () => {
    await renderSheet(exercise({ instruction: "", media: [] }));

    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Squats");
    expect(screen.queryByTestId("exercise-section-description")).toBeNull();
    expect(screen.queryByTestId("activity-editor-description-title")).toBeNull();
    expect(screen.queryByText(strings.screens.movement.descriptionTitle)).toBeNull();
    expect(screen.queryByTestId("movement-photo-template")).toBeNull();
    expect(screen.queryByTestId("movement-section-phases")).toBeNull();
    expect(screen.getByTestId("exercise-section-in-this-session")).toBeTruthy();
  });

  it("complément du 05/11 : « Dans cette séance » présente la Récupération propre à l'Exercice", async () => {
    await renderSheet(exercise({ postActivityRecoverySeconds: 30 }));
    expect(screen.getByTestId("exercise-section-in-this-session").props.accessibilityLabel).toContain("Récupération de 30 s avant l’exercice suivant.");
  });

  it("complément du 05/11 : récupération à 0 annoncée, récupération non renseignée omise", async () => {
    await renderSheet(exercise({ postActivityRecoverySeconds: 0 }));
    expect(screen.getByTestId("exercise-section-in-this-session").props.accessibilityLabel).toContain(strings.executionParameters.card.noRecoveryBeforeNext);
  });

  it("la croix ferme la fiche (retour à la Composition)", async () => {
    await renderSheet(exercise());
    fireEvent.press(screen.getByLabelText(strings.screens.movement.close));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

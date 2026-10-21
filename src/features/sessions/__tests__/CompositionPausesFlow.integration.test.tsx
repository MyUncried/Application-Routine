import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { router as expoRouter } from "expo-router";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Session } from "@/domain/sessions/Session";
import { createEmptyDraft, createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { toSessionDurationResult } from "@/domain/sessions/calculations";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { formatEstimatedDuration } from "@/features/sessions/formatSessionSummary";
import { strings } from "@/shared/i18n";

/**
 * PRE-6 story 4.3 — pauses de bout en bout, sur une vraie base SQLite migrée
 * (`NodeSqliteDatabase`, même patron que `CompositionSaveFlow.integration.test.tsx`) :
 * vraies routes, vrai `SessionDraftProvider`, vrais services et repositories.
 *
 * Parcours : séance persistée A (avant) · Circuit de Tours N = 2 [B, C] · D (après) →
 * ouverture en modification → placement d'une récupération à 0 et d'un point après A (hors
 * Circuit), d'une récupération positive et d'un point après B (dans le Circuit) →
 * « Continuer » → relecture de la base → réouverture de la séance.
 *
 * Seul `expo-sqlite` natif est doublé (étiquettes de la Composition, hors périmètre).
 */
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

/** `jest-expo` ne fournit pas `randomUUID` : identifiants réels jusqu'aux contraintes SQLite (points d'arrêt). */
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

const composition = strings.screens.composition;
const placement = composition.placement;

/** Exercices de 60 s, une série, sans Pause : seule la récupération positive ajoute du temps. */
const exerciseAt = (id: string, name: string, structuralPosition: SessionDraftExercise["structuralPosition"]) => ({
  ...createExerciseDraft(id),
  name,
  structuralPosition,
  executionParameters: durationParameters(60, 1, 0),
});

async function seedAndRender() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionRepository = new SqliteSessionRepository(database);
  const sessionService = new SessionService(sessionRepository, new SqliteCategoryRepository(database));
  const created = await sessionService.createSession({
    ...createEmptyDraft(),
    name: "Pauses",
    tourRepeatCount: 2,
    circuitNature: "TOURS",
    exercises: [
      exerciseAt("ex-a", "A", "BEFORE_TOUR"),
      exerciseAt("ex-b", "B", "IN_TOUR"),
      exerciseAt("ex-c", "C", "IN_TOUR"),
      exerciseAt("ex-d", "D", "AFTER_TOUR"),
    ],
  });
  if (!created.ok) {
    throw new Error(`seed failed: ${JSON.stringify(created.violations)}`);
  }
  const sessionId = created.value.id;
  const activityDefinitionService = new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const referentialService = new ReferentialService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const profileService = new ProfileService(new SqliteProfileRepository(database));

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={activityDefinitionService}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>{children}</ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }

  const router = renderRouter(
    {
      index: () => null,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
    },
    { initialUrl: `/composition?sessionId=${sessionId}`, wrapper: Wrapper },
  );
  return { router, database, sessionRepository, sessionId };
}

const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children as string;
const recoveryLabel = (name: string) => placement.addRecoveryAccessibilityLabel.replace("{exercise}", name);
const stopLabel = (name: string) => placement.addStopPointAccessibilityLabel.replace("{exercise}", name);
const nativeChange = (testID: string, selection: number) =>
  fireEvent(screen.getByTestId(testID), "selectionChange", { nativeEvent: { selection } });

/**
 * Récupérations et points tels qu'affichés hors placement (story 4.2). Sans récupération positive
 * ni point, la ligne n'existe pas (décision Hermann 21/10/2026, remplace D-303). PRE-6 story 5.1
 * (D-435) : la récupération est en ligne 3 de la carte ; la rangée sous la carte ne porte plus que
 * le point.
 */
function displayedPauses() {
  return ["ex-a", "ex-b", "ex-c", "ex-d"].map((id) => {
    const line = screen.queryByTestId(`composition-activity-recovery-${id}`);
    return {
      id,
      line: line !== null,
      recovery: screen.queryByTestId(`composition-activity-recovery-${id}-recovery`) !== null,
      stopPoint: line !== null && within(line).queryByTestId(`composition-activity-recovery-${id}-stop-point`) !== null,
    };
  });
}

/** Récupérations (absente / 0 / positive) et points d'une séance relue. */
function persistedPauses(session: Session) {
  const activities = [
    ...(session.cycle.beforeTour ?? []),
    ...session.cycle.tour.exercises,
    ...(session.cycle.afterTour ?? []),
  ];
  return {
    recoveries: activities.map((activity) => [activity.name, activity.postActivityRecoverySeconds ?? null]),
    stopPoints: (session.stopPoints ?? []).map(({ scope, position }) => ({ scope, position })),
  };
}

// Roulette native iOS (`selectionChange`), comme `CompositionScreen.test.tsx` ; rétablie après le fichier.
let originalPlatformOS: typeof Platform.OS;
beforeAll(() => {
  originalPlatformOS = Platform.OS;
  Platform.OS = "ios";
});
afterAll(() => {
  Platform.OS = originalPlatformOS;
});

describe("Pauses de bout en bout : placement → Continuer → réouverture (PRE-6 story 4.3)", () => {
  it("récupérations (absente / 0 / positive) et points, dans, hors et après le Circuit, survivent à l'enregistrement et à la réouverture ; la durée relue est la durée affichée", async () => {
    const { router, database, sessionRepository, sessionId } = await seedAndRender();
    try {
      await screen.findByLabelText(composition.name);
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      // 4 × 60 s, B et C répétés deux fois : 360 s, aucune pause entre les exercices.
      expect(sessionDuration()).toBe(formatEstimatedDuration(360, "exact"));
      expect(screen.getByTestId("composition-unpaused-warning")).toBeTruthy();

      // Placement : après A (hors Circuit) R = 0 et un point ; après B (dans le Circuit) R = 45 s et
      // un point ; un point « après le Circuit ».
      // L'entrée en placement lit le défaut du Profil (asynchrone) avant d'ouvrir une roulette.
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      fireEvent.press(screen.getByLabelText(recoveryLabel("A")));
      await screen.findByTestId("duration-wheel-seconds");
      nativeChange("duration-wheel-minutes", 0);
      nativeChange("duration-wheel-seconds", 0);
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      fireEvent.press(screen.getByLabelText(recoveryLabel("B")));
      nativeChange("duration-wheel-minutes", 0);
      nativeChange("duration-wheel-seconds", 45);
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      fireEvent.press(screen.getByLabelText(stopLabel("B")));
      fireEvent.press(screen.getByLabelText(placement.addStopPointAfterCircuitAccessibilityLabel));
      fireEvent.press(screen.getByTestId("composition-placement-bar-confirm"));

      // Durée affichée avant enregistrement : R de B répétée à chaque Tour, points à 0 s,
      // R = 0 de A ne compte rien → 60 + 2 × (60 + 45) + 2 × 60 + 60 = 450 s.
      const displayedBeforeSave = sessionDuration();
      expect(displayedBeforeSave).toBe(formatEstimatedDuration(450, "exact"));
      const pausesBeforeSave = displayedPauses();
      expect(pausesBeforeSave).toEqual([
        // A : R = 0 n'affiche rien, la ligne n'existe que par son point ; B : R dans la carte, point
        // dans la ligne ; C, D : aucune ligne.
        { id: "ex-a", line: true, recovery: false, stopPoint: true },
        { id: "ex-b", line: true, recovery: true, stopPoint: true },
        { id: "ex-c", line: false, recovery: false, stopPoint: false },
        { id: "ex-d", line: false, recovery: false, stopPoint: false },
      ]);
      expect(screen.getByTestId("composition-after-circuit-line")).toBeTruthy();
      // D-301 : C (Tour 1) → B (Tour 2) reste sans pause ; le message n'empêche pas l'enregistrement.
      const warningBeforeSave = screen.queryByTestId("composition-unpaused-warning") !== null;
      expect(warningBeforeSave).toBe(true);

      await act(async () => {
        fireEvent.press(screen.getByLabelText(composition.saveAction));
      });
      await waitFor(() => expect(router.getPathname()).toBe("/"));

      // Relecture de la base : récupérations absente / 0 / positive et points à l'identique.
      const saved = await sessionRepository.findById(sessionId);
      expect(saved).not.toBeNull();
      const persisted = persistedPauses(saved!);
      expect(persisted.recoveries).toEqual([
        ["A", 0],
        ["B", 45],
        ["C", null],
        ["D", null],
      ]);
      expect([...persisted.stopPoints].sort((x, y) => `${x.scope}${x.position}`.localeCompare(`${y.scope}${y.position}`))).toEqual([
        { scope: "AFTER_TOUR", position: 0 },
        { scope: "BEFORE_TOUR", position: 1 },
        { scope: "IN_TOUR", position: 1 },
      ]);
      // Durée de la séance relue = durée affichée avant enregistrement (R et point répétés à chaque Tour).
      expect(toSessionDurationResult(saved!)).toEqual({ kind: "exact", seconds: 450 });

      // Réouverture : mêmes pauses, même point après le Circuit, même durée, même avertissement.
      await act(async () => {
        expoRouter.push(`/composition?sessionId=${sessionId}`);
      });
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      expect(displayedPauses()).toEqual(pausesBeforeSave);
      expect(screen.getByTestId("composition-after-circuit-line")).toBeTruthy();
      expect(sessionDuration()).toBe(displayedBeforeSave);
      expect(screen.queryByTestId("composition-unpaused-warning") !== null).toBe(warningBeforeSave);

      // R = 0 de A est restée présente : une nouvelle entrée en placement la montre comme existante.
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      expect(screen.queryByLabelText(recoveryLabel("A"))).toBeNull();
      expect(
        screen.getByLabelText(
          composition.pauses.modifiableRecoveryAccessibilityLabel.replace("{duration}", "0 s").replace("{exercise}", "A"),
        ),
      ).toBeTruthy();
      expect(screen.queryByLabelText(recoveryLabel("C"))).not.toBeNull();
      fireEvent.press(screen.getByTestId("composition-placement-bar-cancel"));
    } finally {
      database.close();
    }
  }, 60000);
});

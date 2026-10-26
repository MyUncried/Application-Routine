import { act, fireEvent, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { router as expoRouter } from "expo-router";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
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

/** `stopPoints` (story 6.3) : points d'arrêt de la séance persistée (par défaut aucun). */
async function seedAndRender(stopPoints: NonNullable<SessionDraft["stopPoints"]> = []) {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionRepository = new SqliteSessionRepository(database);
  const sessionService = new SessionService(sessionRepository, new SqliteCategoryRepository(database));
  // PRE-7 (R-3, C05) : Exercices créés localement (Mouvements NEW, `withLocalMovements`).
  const created = await sessionService.createSession(withLocalMovements({
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
    stopPoints,
  }));
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
 * Récupérations et points tels qu'affichés hors placement (story 4.2). PRE-6 story 5.1 (D-435) : la
 * récupération est en ligne 3 de la carte. PRE-6 story 6.2 (D-441) : chaque point est une rangée
 * autonome de la séquence, nommée par sa place (« Point d'arrêt après {exercice} »).
 */
function displayedPauses() {
  return {
    recoveries: ["ex-a", "ex-b", "ex-c", "ex-d"].map((id) => [
      id,
      screen.queryByTestId(`composition-activity-recovery-${id}-recovery`) !== null,
    ]),
    stopPoints: screen
      .queryAllByTestId(/^composition-stop-point-[^-]+.*-chip$/u)
      .map((chip) => chip.props.accessibilityLabel as string),
  };
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
      expect(sessionDuration()).toBe("≈ 6 min");
      // Story 7.2 (D-442) : D-301 retirée, aucun message d'enchaînement sans pause.
      expect(screen.queryByText("Attention, les exercices vont s’enchaîner sans pause.")).toBeNull();

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
      expect(displayedBeforeSave).toBe("≈ 7 min 30 s");
      const pausesBeforeSave = displayedPauses();
      expect(pausesBeforeSave).toEqual({
        // A : R = 0 n'affiche rien ; B : R dans la carte ; C, D : rien.
        recoveries: [
          ["ex-a", false],
          ["ex-b", true],
          ["ex-c", false],
          ["ex-d", false],
        ],
        // Trois rangées de points, dans l'ordre de la séquence.
        stopPoints: [
          placement.existingStopPointAccessibilityLabel.replace("{exercise}", "A"),
          placement.existingStopPointAccessibilityLabel.replace("{exercise}", "B"),
          placement.existingStopPointAfterCircuitAccessibilityLabel,
        ],
      });

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

      // Réouverture : mêmes pauses, même point après le Circuit, même durée.
      await act(async () => {
        expoRouter.push(`/composition?sessionId=${sessionId}`);
      });
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      expect(displayedPauses()).toEqual(pausesBeforeSave);
      expect(sessionDuration()).toBe(displayedBeforeSave);

      // R = 0 de A est restée présente : une nouvelle entrée en placement la montre comme existante,
      // sélectionnée à 0 (story 7.2, D-442).
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      expect(screen.queryByLabelText(recoveryLabel("A"))).toBeNull();
      const zero = screen.getByLabelText(placement.existingRecoveryAccessibilityLabel.replace("{exercise}", "A"));
      expect(zero.props.accessibilityState).toMatchObject({ selected: true });
      expect(zero.props.accessibilityValue).toEqual({ text: "0 s" });
      expect(screen.queryByLabelText(recoveryLabel("C"))).not.toBeNull();
      fireEvent.press(screen.getByTestId("composition-placement-bar-cancel"));
    } finally {
      database.close();
    }
  }, 60000);
});

/**
 * PRE-6 story 6.3 (D-441 R3, ch13 CE-T03-08 complément 8 à 11) — retrait d'un point en placement :
 * désélection, « Confirmer les modifications », aucune écriture avant « Continuer », puis relecture
 * de la base et réouverture : le point retiré a disparu, l'autre est intact et sélectionné.
 */
describe("Retrait d'un point en placement → Continuer → réouverture (PRE-6 story 6.3)", () => {
  it("le point désélectionné n'est retiré qu'à « Continuer » ; à la réouverture il a disparu, l'autre reste sélectionné", async () => {
    const { router, database, sessionRepository, sessionId } = await seedAndRender([
      { id: "seed-p-a", scope: "BEFORE_TOUR", position: 1 },
      { id: "seed-p-b", scope: "IN_TOUR", position: 1 },
    ]);
    try {
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      const existing = (name: string) =>
        screen.getByLabelText(placement.existingStopPointAccessibilityLabel.replace("{exercise}", name));
      const confirm = () => screen.getByTestId("composition-placement-bar-confirm");

      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      expect(existing("A").props.accessibilityState).toMatchObject({ selected: true });
      expect(existing("B").props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(existing("A"));
      expect(confirm().props.accessibilityLabel).toBe(placement.confirmChanges);
      fireEvent.press(confirm());

      // Confirmer n'écrit rien : la base porte encore les deux points.
      const beforeSave = await sessionRepository.findById(sessionId);
      expect(persistedPauses(beforeSave!).stopPoints).toHaveLength(2);
      expect(displayedPauses().stopPoints).toEqual([placement.existingStopPointAccessibilityLabel.replace("{exercise}", "B")]);

      await act(async () => {
        fireEvent.press(screen.getByLabelText(composition.saveAction));
      });
      await waitFor(() => expect(router.getPathname()).toBe("/"));
      const saved = await sessionRepository.findById(sessionId);
      expect(persistedPauses(saved!).stopPoints).toEqual([{ scope: "IN_TOUR", position: 1 }]);

      await act(async () => {
        expoRouter.push(`/composition?sessionId=${sessionId}`);
      });
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      expect(displayedPauses().stopPoints).toEqual([placement.existingStopPointAccessibilityLabel.replace("{exercise}", "B")]);
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      expect(existing("B").props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.queryByLabelText(placement.existingStopPointAccessibilityLabel.replace("{exercise}", "A"))).toBeNull();
      expect(screen.getByLabelText(stopLabel("A")).props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(screen.getByTestId("composition-placement-bar-cancel"));
    } finally {
      database.close();
    }
  }, 60000);
});

/**
 * PRE-6 story 7.2 (D-442, ch13 CE-T03-08 complément D-442 point 4) — retrait d'une récupération en
 * placement : désélection de la zone, « Confirmer les modifications », rien d'écrit avant
 * « Continuer » ; relecture de la base : récupération absente, Pause terminale rétablie (RM-038).
 */
describe("Retrait d'une récupération en placement → Continuer → réouverture (PRE-6 story 7.2)", () => {
  it("la récupération désélectionnée n'est retirée qu'à « Continuer » ; à la réouverture sa zone est libre", async () => {
    const { router, database, sessionRepository, sessionId } = await seedAndRender();
    try {
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      const confirm = () => screen.getByTestId("composition-placement-bar-confirm");
      // Récupération de 45 s après B (ajout puis Confirmer, Continuer).
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      fireEvent.press(screen.getByLabelText(recoveryLabel("B")));
      await screen.findByTestId("duration-wheel-seconds");
      nativeChange("duration-wheel-minutes", 0);
      nativeChange("duration-wheel-seconds", 45);
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      fireEvent.press(confirm());
      await act(async () => {
        fireEvent.press(screen.getByLabelText(composition.saveAction));
      });
      await waitFor(() => expect(router.getPathname()).toBe("/"));
      expect(persistedPauses((await sessionRepository.findById(sessionId))!).recoveries).toContainEqual(["B", 45]);

      await act(async () => {
        expoRouter.push(`/composition?sessionId=${sessionId}`);
      });
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      // Hors placement : simple affichage, aucune cible (le toucher traverse jusqu’à la carte).
      expect(StyleSheet.flatten(screen.getByTestId("composition-activity-recovery-ex-b-recovery").props.style).pointerEvents).toBe("none");
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      const existingB = () => screen.getByLabelText(placement.existingRecoveryAccessibilityLabel.replace("{exercise}", "B"));
      expect(existingB().props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(existingB());
      expect(existingB().props.accessibilityState).toMatchObject({ selected: false });
      expect(confirm().props.accessibilityLabel).toBe(placement.confirmChanges);
      fireEvent.press(confirm());
      // Confirmer n'écrit rien : la base porte encore la récupération.
      expect(persistedPauses((await sessionRepository.findById(sessionId))!).recoveries).toContainEqual(["B", 45]);
      expect(screen.queryByTestId("composition-activity-recovery-ex-b-recovery")).toBeNull();
      // Durée sans la récupération (exercices sans Pause : RM-038 est prouvée par le test d’écran « timed »).
      expect(sessionDuration()).toBe("≈ 6 min");

      await act(async () => {
        fireEvent.press(screen.getByLabelText(composition.saveAction));
      });
      await waitFor(() => expect(router.getPathname()).toBe("/"));
      const saved = await sessionRepository.findById(sessionId);
      expect(persistedPauses(saved!).recoveries).toEqual([
        ["A", null],
        ["B", null],
        ["C", null],
        ["D", null],
      ]);
      expect(toSessionDurationResult(saved!)).toEqual({ kind: "exact", seconds: 360 });

      await act(async () => {
        expoRouter.push(`/composition?sessionId=${sessionId}`);
      });
      await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
      await act(async () => {
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
      });
      expect(screen.getByLabelText(recoveryLabel("B")).props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(screen.getByTestId("composition-placement-bar-cancel"));
    } finally {
      database.close();
    }
  }, 60000);
});

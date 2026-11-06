import { act, fireEvent, renderRouter, screen, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { chooseExecutionMode } from "@/features/activities/testing/executionSheetActions";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { CreationRootStack } from "@/features/sessions/testing/CreationRootStack";

/**
 * PRE-9 — ordre de Hermann du 01/11/2026, point 2 (ch07 « Récupération de l'Exercice et défauts du
 * Profil ») : parcours réel (routeur, `SessionDraftProvider`, SQLite en mémoire).
 * - Un nouvel Exercice reprend « Récupération après un exercice » du Profil ; la carte de la
 *   Composition affiche exactement cette valeur ; la feuille la porte au bloc Récupération.
 * - Défaut du Profil sur fond orange jusqu'au premier ✓ : ✕ laisse l'état en attente ; ✓ applique
 *   valeurs et état validé ; une réouverture après ✓ est normale.
 * - Modifier conserve la valeur ; changer le Profil ensuite ne réinitialise pas l'Exercice.
 * - Le mode Placement (« Ajouter un arrêt ») ne propose aucune récupération.
 */

jest.mock("expo-sqlite", () => ({ useSQLiteContext: () => ({}) }));
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const composition = strings.screens.composition;
const addToSession = strings.screens.activities.addToSession;
const NOW = "2026-11-01T09:00:00.000Z";
const ORANGE = toVerifyColors.surface;
const hidden = { includeHiddenElements: true } as const;

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const profiles = () => new ProfileService(new SqliteProfileRepository(database));

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});


function renderApp() {
  const service = new ActivityDefinitionService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
    undefined,
    movements(),
  );
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const referentialService = new ReferentialService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const profileService = profiles();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={service}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>{children}</ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }
  /* eslint-disable @typescript-eslint/no-require-imports */
  return renderRouter(
    {
      _layout: CreationRootStack,
      index: () => null,
      movement: require("../../../../app/movement").default,
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      "formats-window": require("../../../../app/formats-window").default,
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
    },
    { initialUrl: "/composition", wrapper: Wrapper },
  );
  /* eslint-enable @typescript-eslint/no-require-imports */
}

async function settle(ms = 0) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
    for (let round = 0; round < 5; round += 1) {
      await jest.advanceTimersByTimeAsync(0);
    }
  });
}

/** Reprendre un Mouvement existant par « Créer un exercice » (saisie du nom, toucher de sa carte). */
async function useExistingMovement(name: string, id: string) {
  fireEvent.press(screen.getByLabelText(composition.addActivity));
  fireEvent.press(within(screen.getByTestId("composition-add-activity-tree")).getByLabelText(addToSession.newActivity));
  await settle(300);
  // Complément du 5 novembre 2026 (§1, §3) : modale de création, puis « Exercice libre ».
  fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
  await settle(300);
  fireEvent.changeText(screen.getByTestId("exercise-name-input"), name);
  await settle();
  const result = await screen.findByTestId(`movement-suggestion-result-${id}`);
  await act(async () => {
    fireEvent.press(result);
  });
  await settle(300);
  // Recette du 05/11/2026 au soir (r-creer) : la fiche du mouvement choisi s'affiche ; sa coche le remet à la Composition.
  await act(async () => {
    fireEvent.press(within(await screen.findByTestId("movement-chosen-overlay")).getByTestId("screen-header-validate"));
  });
  await settle(300);
}

const cardLabel = (name: string) =>
  String(screen.getByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, ${name},`)).props.accessibilityLabel);

async function tapCard(name: string) {
  fireEvent.press(screen.getByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, ${name},`)));
  await settle(300);
}

const recoveryText = () => String(screen.getByTestId("execution-sheet-recovery-text", hidden).props.children);
const recoveryBackground = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-recovery", hidden).props.style).backgroundColor;

async function closeSheet(testID: "execution-sheet-validate" | "execution-sheet-cancel") {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle(300);
}

/** Mode Durée, 45 s (Cible à renseigner d'un nouvel Exercice). */
function setDuration45() {
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  fireEvent.press(screen.getByTestId("duration-wheel-validate"));
}

/** Roulette de la Récupération : minute 1, première valeur de la grille (60 s). */
function setRecoveryOneMinute() {
  fireEvent.press(screen.getByTestId("execution-sheet-recovery", hidden));
  const wheel = within(screen.getByTestId("execution-sheet-recovery-wheel", hidden));
  fireEvent(wheel.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
  fireEvent(wheel.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent.press(wheel.getByTestId("duration-wheel-validate"));
}

describe("PRE-9 (01/11/2026, point 2) — Récupération de l'Exercice et défauts du Profil", () => {
  it("nouvel Exercice : Récupération du Profil (45 s) sur la carte et dans la feuille, orange jusqu'au premier ✓ ; ✕ garde l'attente ; ✓ valide ; modification conservée ; Profil changé ensuite sans effet", async () => {
    await profiles().setDefault("postActivityRecoverySecondsDefault", 45);
    await movements().create(movement("abdos", "Abdos"));
    renderApp();
    await settle();
    await useExistingMovement("Abdos", "abdos");

    // La Composition affiche la Récupération de l'Exercice (même valeur que la feuille).
    expect(cardLabel("Abdos")).toContain(composition.occurrenceCard.accessibilityRecovery.replace("{duration}", "45 s"));

    // Ouverture : bloc Récupération, défaut du Profil sur fond orange. ✕ : rien ne change, l'attente reste.
    await tapCard("Abdos");
    expect(recoveryText()).toBe("45 s");
    expect(recoveryBackground()).toBe(ORANGE);
    await closeSheet("execution-sheet-cancel");
    await tapCard("Abdos");
    expect(recoveryBackground()).toBe(ORANGE);

    // Premier ✓ (Cible renseignée) : valeurs appliquées, état validé.
    setDuration45();
    await closeSheet("execution-sheet-validate");
    expect(cardLabel("Abdos")).toContain("récupération 45 s");
    await tapCard("Abdos");
    expect(recoveryText()).toBe("45 s");
    expect(recoveryBackground()).not.toBe(ORANGE);

    // Modification par la feuille (seul accès) : la carte suit exactement la valeur.
    setRecoveryOneMinute();
    await closeSheet("execution-sheet-validate");
    expect(cardLabel("Abdos")).toContain("récupération 1 min");

    // Le Profil change ensuite : l'Exercice existant garde sa valeur.
    await profiles().setDefault("postActivityRecoverySecondsDefault", 20);
    await tapCard("Abdos");
    expect(recoveryText()).toBe("1 min");
    expect(recoveryBackground()).not.toBe(ORANGE);
    await closeSheet("execution-sheet-cancel");
    expect(cardLabel("Abdos")).toContain("récupération 1 min");
  }, 60000);

  it("le mode Placement (« Ajouter un arrêt ») ne propose aucune zone de récupération et ne modifie pas celle de l'Exercice", async () => {
    await profiles().setDefault("postActivityRecoverySecondsDefault", 30);
    await movements().create(movement("abdos", "Abdos"));
    await movements().create(movement("gainage", "Gainage"));
    renderApp();
    await settle();
    await useExistingMovement("Abdos", "abdos");
    await useExistingMovement("Gainage", "gainage");
    for (const name of ["Abdos", "Gainage"]) {
      await tapCard(name);
      setDuration45();
      await closeSheet("execution-sheet-validate");
    }

    fireEvent.press(screen.getByTestId("composition-add-stop-action"));
    await settle();
    expect(screen.getByTestId("composition-placement-bar")).toBeTruthy();
    expect(screen.queryAllByTestId(/^composition-placement-slot-.*-recovery$/, hidden)).toHaveLength(0);
    expect(screen.queryByLabelText(new RegExp(composition.placement.addRecoveryAccessibilityLabel.replace("{exercise}", ".*")))).toBeNull();
    // Le seul ajout possible : un Point d'arrêt entre les deux Exercices.
    fireEvent.press(screen.getByLabelText(composition.placement.addStopPointAccessibilityLabel.replace("{exercise}", "Abdos")));
    fireEvent.press(screen.getByTestId("composition-placement-bar-confirm"));
    await settle(300);
    expect(screen.queryByTestId("composition-placement-bar")).toBeNull();
    expect(cardLabel("Abdos")).toContain("récupération 30 s");
    expect(cardLabel("Gainage")).toContain("récupération 30 s");
  }, 60000);
});

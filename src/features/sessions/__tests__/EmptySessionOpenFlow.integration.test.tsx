import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { Session, SessionSummary } from "@/domain/sessions/Session";
import type {
  CatalogueSessionRecord,
  SessionRepository,
  SessionStatus,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import type { ActivityDefinition, ActivityDefinitionRepository } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";

/**
 * PRE-4 (story 1.2, P39, FR-18-20 sixième conséquence) — parcours réel
 * Catalogue → Composition sur une Séance SANS occurrence (toutes ses Copies
 * écartées par `migration010`). La Séance et son résumé ont la forme exacte
 * que renvoie `SqliteSessionRepository` pour la Séance B de la base migrée
 * (vérifiée sur `node:sqlite` par `migration010.test.ts`, PRE4-1.2/AC6 et
 * AC7). Mêmes doublures que `CatalogueCompositionEditFlow.integration.test.tsx`.
 * Une suite verte ne vaut pas recette (R-1.2-02, NFR-04).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

class EmptyBodyZoneRepository implements BodyZoneRepository {
  listAll(): Promise<readonly BodyZone[]> {
    return Promise.resolve([]);
  }
  create(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  rename(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  retire(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  isUsed(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
}

const composition = strings.screens.composition;

const EMPTY_SESSION_ID = "session-b";

const EMPTY_SESSION: Session = {
  id: EMPTY_SESSION_ID,
  ownerId: "owner-1",
  name: "Séance b",
  color: DEFAULT_SESSION_COLOR,
  labelId: null,
  status: "ACTIVE",
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  createdAt: "2026-01-04T00:00:00.000Z",
  updatedAt: "2026-01-06T00:00:00.000Z",
  cycle: {
    id: "cycle-b",
    position: 1,
    repeatCount: 1,
    tour: { id: "tour-b", position: 1, repeatCount: 2, exercises: [] },
  },
};

const EMPTY_SUMMARY: SessionSummary = {
  id: EMPTY_SESSION_ID,
  name: "Séance b",
  color: DEFAULT_SESSION_COLOR,
  labelId: null,
  activityCount: 0,
  estimatedDurationSeconds: 0,
  isEstimatedDurationApproximate: false,
  durationKind: "exact",
  tourRepeatCount: 2,
  updatedAt: "2026-01-06T00:00:00.000Z",
  categoryNames: [],
  bodyZoneNames: [],
};

class EmptySessionRepository implements SessionRepository {
  create(): Promise<Session> {
    return Promise.reject(new Error("create() must never be called by an edit flow"));
  }
  findById(sessionId: string): Promise<Session | null> {
    return Promise.resolve(sessionId === EMPTY_SESSION_ID ? EMPTY_SESSION : null);
  }
  findSessionStatus(sessionId: string): Promise<SessionStatus | null> {
    return Promise.resolve(sessionId === EMPTY_SESSION_ID ? "ACTIVE" : null);
  }
  listActive(): Promise<readonly SessionSummary[]> {
    return Promise.resolve([EMPTY_SUMMARY]);
  }
  /** PRE-8 (E.1, E.2) : lecture du Catalogue unifié — Circuit de deux tours, sans Exercice. */
  listCatalogue(): Promise<readonly CatalogueSessionRecord[]> {
    return Promise.resolve([
      {
        id: EMPTY_SESSION_ID,
        name: "Séance b",
        color: DEFAULT_SESSION_COLOR,
        labelId: null,
        status: "ACTIVE",
        archivedAt: null,
        updatedAt: EMPTY_SUMMARY.updatedAt,
        structure: { elements: [{ kind: "CIRCUIT", circuit: { id: "tour-b", repeatCount: 2, nature: "TOURS", exercises: [] } }], stopPoints: [] },
      },
    ]);
  }
  update(): Promise<UpdateSessionOutcome> {
    return Promise.reject(new Error("update() must never be called by merely opening a Session"));
  }
}

class NoopCategoryRepository implements CategoryRepository {
  listAll(): Promise<readonly Category[]> {
    return Promise.resolve([]);
  }
  create(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  rename(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  recolor(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  retire(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
  isUsed(): Promise<never> {
    return Promise.reject(new Error("not used"));
  }
}

class NoopActivityDefinitionRepository implements ActivityDefinitionRepository {
  create(): Promise<ActivityDefinition> {
    return Promise.reject(new Error("not used"));
  }
  findById(): Promise<ActivityDefinition | null> {
    return Promise.resolve(null);
  }
  listAll(): Promise<readonly ActivityDefinition[]> {
    return Promise.resolve([]);
  }
  update(): Promise<ActivityDefinition | null> {
    return Promise.reject(new Error("not used"));
  }
}

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionServiceContext.Provider
      value={new SessionService(new EmptySessionRepository(), new NoopCategoryRepository())}
    >
      <ActivityDefinitionServiceProvider
        service={
          new ActivityDefinitionService(
            new NoopActivityDefinitionRepository(),
            new NoopCategoryRepository(),
            new EmptyBodyZoneRepository(),
          )
        }
      >
        {children}
      </ActivityDefinitionServiceProvider>
    </SessionServiceContext.Provider>
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("PRE4-1.2/AC6 + AC7 — Séance sans occurrence : visible dans la liste, ouvrable sans erreur", () => {
  it(
    "la carte affiche « 0 exercice » et « 0 s » (PRE-8 E.2 : carte unique, durée D-443) ; la toucher ouvre la Composition existante, vide, sans état d'erreur",
    async () => {
      const router = renderRouter(
        {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          index: require("../../../../app/(tabs)/index").default,
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          "(creation)/composition": require("../../../../app/(creation)/composition").default,
        },
        { initialUrl: "/", wrapper: TestWrapper },
      );
      await flush();

      // AC6 : la Séance figure dans la liste (Q32) ; PRE-8 (E.2, Q-E6) : synthèse « 0 exercice »,
      // durée de séance au format D-443.
      expect(await screen.findByText("Séance b")).toBeTruthy();
      expect(screen.getByTestId("session-card-session-b-summary")).toHaveTextContent("0 exercice");
      expect(screen.getByTestId("session-card-session-b-duration")).toHaveTextContent("0 s");

      // AC7 : l'écran existant s'ouvre sur la Séance, sans Exercice et sans erreur.
      fireEvent.press(screen.getByTestId("session-card-session-b-swipe-card"));
      await flush();
      await flush();

      expect(router.getPathname()).toBe("/composition");
      expect(screen.queryByTestId("composition-edit-state")).toBeNull();
      expect(screen.getByLabelText(composition.name).props.value).toBe("Séance b");
      // Story 7.8 (D-443) : séance vide → « 0 s » dans la zone de contexte ; plus de durée de Circuit.
      expect(screen.getByTestId("composition-session-duration")).toHaveTextContent("0 s");
      expect(screen.getByLabelText(composition.addActivity)).toBeTruthy();

      // Action finale « Continuer » (Q54 ; libellé PRE-6 story 2.1) : règle existante — sans Exercice, le
      // bouton est désactivé ; l'appui ne navigue pas, n'écrit rien et ne lève pas.
      const continueAction = screen.getByLabelText(composition.saveAction);
      expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
      expect(() => fireEvent.press(continueAction)).not.toThrow();
      await flush();
      expect(router.getPathname()).toBe("/composition");
      expect(screen.getByLabelText(composition.name).props.value).toBe("Séance b");

      // Sortie par le X « Fermer » (PRE-6 story 2.1) : retour propre à la liste, la Séance y figure toujours.
      fireEvent.press(screen.getByLabelText(composition.closeAccessibilityLabel));
      await flush();
      await flush();
      expect(router.getPathname()).toBe("/");
      expect(await screen.findByText("Séance b")).toBeTruthy();
      expect(screen.getByTestId("session-card-session-b-summary")).toHaveTextContent("0 exercice");
    },
    20000,
  );
});

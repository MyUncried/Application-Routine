import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { Session, SessionSummary } from "@/domain/sessions/Session";
import type {
  SessionRepository,
  SessionStatus,
  UpdateSessionOutcome,
} from "@/domain/sessions/SessionRepository";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";

/**
 * **Correction compacte LOT_3_OF_3 — intégration Catalogue → Composition.**
 *
 * Contrairement à `CompositionScreen.test.tsx` (qui monte l'écran seul avec un
 * `SessionDraftContext` fabriqué), ce fichier utilise `renderRouter` avec les
 * VRAIES routes — `app/(tabs)/index.tsx` (Catalogue) et `app/(creation)/
 * _layout|composition.tsx` — ainsi que le vrai `SessionDraftProvider`, le vrai
 * `SessionService` et le vrai `useSessionCatalogue`. C'est le seul niveau qui
 * prouve réellement le parcours complet d'ouverture d'une Séance persistée en
 * MODIFICATION : appui sur la carte du Catalogue → navigation vers
 * `/composition?sessionId=...` → état de chargement → formulaire réhydraté avec
 * les valeurs PERSISTÉES, jamais les valeurs par défaut d'une création.
 *
 * **Portée de preuve, explicitement disclosée** : la frame transitoire que la
 * correction non-flash supprime n'est PAS observable dans un rendu de test —
 * `act()` vide les effets avant toute assertion, si bien que `editStatus` vaut
 * déjà `"loading"` au moment où l'on peut interroger l'arbre. Ces tests
 * prouvent donc le PARCOURS de bout en bout et l'absence de toute valeur par
 * défaut de création à chaque point observable ; la preuve DÉTERMINISTE de la
 * synchronicité elle-même (`sessionId` présent + `editStatus === "creating"`,
 * l'état exact du tout premier rendu) est portée par le describe « non-flash de
 * création avant hydratation » de `CompositionScreen.test.tsx`, qui reproduit
 * cet état directement et échouerait sans la garde.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const sessions = strings.screens.sessions;
const composition = strings.screens.composition;

const PERSISTED_SESSION_ID = "session-42";

/** Valeurs volontairement DIFFÉRENTES des valeurs par défaut de création (`10 s`/`5 s`, nom vide, aucune Activité). */
const PERSISTED_SESSION: Session = {
  id: PERSISTED_SESSION_ID,
  ownerId: "owner-1",
  name: "Séance persistée",
  color: DEFAULT_SESSION_COLOR,
  status: "ACTIVE",
  initialCountdownSeconds: 30,
  finalPhaseSeconds: 20,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
  cycle: {
    id: "cycle-1",
    position: 1,
    repeatCount: 1,
    tour: {
      id: "tour-1",
      position: 1,
      repeatCount: 1,
      exercises: [
        {
          id: "act-1",
          type: "EXERCISE",
          executionMode: "DURATION",
          structuralPosition: "IN_TOUR",
          position: 0,
          name: "Gainage persisté",
          durationSeconds: 90,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          instruction: null,
          // Ordre de persistance inverse de l'ordre du référentiel — la ligne
          // de Zones corporelles doit rétablir l'ordre référentiel.
          bodyZoneIds: ["dos", "epaules"],
        },
      ],
    },
  },
  categories: [],
};

const PERSISTED_SUMMARY: SessionSummary = {
  id: PERSISTED_SESSION_ID,
  name: "Séance persistée",
  color: DEFAULT_SESSION_COLOR,
  activityCount: 1,
  estimatedDurationSeconds: 315,
  isEstimatedDurationApproximate: false,
  tourRepeatCount: 1,
  updatedAt: "2026-09-05T10:00:00.000Z",
  categoryNames: [],
  bodyZoneNames: ["Épaules", "Dos"],
};

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/**
 * `findSessionStatus` est PILOTÉ par un `deferred` : tant qu'il n'est pas
 * résolu, `SessionService.getSessionForEdit` reste en vol et l'écran doit
 * afficher son état de chargement — jamais le formulaire de création.
 */
class FakeSessionRepository implements SessionRepository {
  readonly statusGate = deferred<SessionStatus | null>();

  create(): Promise<Session> {
    return Promise.reject(new Error("create() must never be called by an edit flow"));
  }
  findById(sessionId: string): Promise<Session | null> {
    return Promise.resolve(sessionId === PERSISTED_SESSION_ID ? PERSISTED_SESSION : null);
  }
  findSessionStatus(): Promise<SessionStatus | null> {
    return this.statusGate.promise;
  }
  listActive(): Promise<readonly SessionSummary[]> {
    return Promise.resolve([PERSISTED_SUMMARY]);
  }
  update(): Promise<UpdateSessionOutcome> {
    return Promise.reject(new Error("update() must never be called by merely opening a Session"));
  }
}

class NoopCategoryRepository implements CategoryRepository {
  listAll(): Promise<readonly Category[]> {
    return Promise.resolve([]);
  }
}

let repository: FakeSessionRepository;

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionServiceContext.Provider
      value={new SessionService(repository, new NoopCategoryRepository())}
    >
      {children}
    </SessionServiceContext.Provider>
  );
}

function renderCatalogueRouter() {
  return renderRouter(
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
}

/** Vide la file des microtâches — les promesses du Repository/Service se résolvent. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  repository = new FakeSessionRepository();
});

describe("Parcours Catalogue → Composition en modification (vrai navigateur, vraies routes, vrai SessionDraftProvider)", () => {
  it(
    "1. ouvre la Séance en modification en transmettant SON identifiant dans la route, jamais la Séance sérialisée",
    async () => {
      const router = renderCatalogueRouter();
      await flush();

      fireEvent.press(await screen.findByLabelText(sessions.card.openAccessibilityLabel));

      expect(router.getPathname()).toBe("/composition");
      // Seul l identifiant transite par la route — jamais la Séance sérialisée.
      const params = router.getSearchParams() as Record<string, unknown>;
      expect(params.sessionId).toBe(PERSISTED_SESSION_ID);
      // La Séance elle-même n est jamais sérialisée dans la route.
      expect(params.name).toBeUndefined();
      expect(params.exercises).toBeUndefined();
    },
    // Correctif T02 (2026-09-08) : ce premier test du fichier supporte le
    // coût réel — non lié à la logique du parcours — du tout premier rendu
    // `renderRouter` (vrai navigateur, vraie initialisation SQLite/route)
    // dans ce process Jest ; il dépassait de façon reproductible le délai
    // par défaut de 5000 ms dans cet environnement, sans qu'aucune
    // assertion n'échoue jamais une fois ce délai levé (vérifié isolément
    // avec un délai de 30000 ms). Même palier que `CategoriesSaveFlow
    // .integration.test.tsx`, déjà porté à 20000 ms pour la même raison.
    20000,
  );

  it("2. n'affiche JAMAIS le formulaire de création ni ses valeurs par défaut tant que la Séance n'est pas résolue — seul l'état de chargement est rendu", async () => {
    renderCatalogueRouter();
    await flush();

    fireEvent.press(await screen.findByLabelText(sessions.card.openAccessibilityLabel));
    await flush(); // la lecture est en vol : `findSessionStatus` n'est pas résolu

    expect(screen.getByTestId("composition-edit-state")).toBeTruthy();
    expect(
      screen.getByLabelText(composition.editStates.loadingAccessibilityLabel),
    ).toBeTruthy();

    // Aucun élément ni aucune valeur par défaut du parcours de CRÉATION.
    expect(screen.queryByLabelText(composition.name)).toBeNull();
    expect(screen.queryByLabelText(composition.addActivity)).toBeNull();
    expect(screen.queryByLabelText(composition.continueAction)).toBeNull();
    expect(screen.queryByText("00 min 10 s")).toBeNull();
    expect(screen.queryByText("00 min 05 s")).toBeNull();
    expect(screen.queryByText(composition.summary.empty)).toBeNull();
  });

  it("3. affiche le formulaire avec les valeurs PERSISTÉES une fois la Séance résolue — jamais les valeurs par défaut d'une création", async () => {
    renderCatalogueRouter();
    await flush();

    fireEvent.press(await screen.findByLabelText(sessions.card.openAccessibilityLabel));
    await flush();

    await act(async () => {
      repository.statusGate.resolve("ACTIVE");
      await Promise.resolve();
    });
    await flush();

    expect(screen.queryByTestId("composition-edit-state")).toBeNull();
    expect(screen.getByLabelText(composition.name).props.value).toBe("Séance persistée");
    // Valeurs persistées (30 s / 20 s), jamais les défauts de création (10 s / 5 s).
    expect(screen.getByText("00 min 30 s")).toBeTruthy();
    expect(screen.getByText("00 min 20 s")).toBeTruthy();
    expect(screen.queryByText("00 min 10 s")).toBeNull();
    expect(screen.queryByText("00 min 05 s")).toBeNull();
    // L'Activité persistée est bien restituée.
    expect(screen.getByText("Gainage persisté")).toBeTruthy();
    expect(screen.queryByText(composition.summary.empty)).toBeNull();
  });

  it("4. restitue les Zones corporelles de l'Activité réhydratée, dans l'ordre du référentiel, sur sa propre ligne", async () => {
    renderCatalogueRouter();
    await flush();

    fireEvent.press(await screen.findByLabelText(sessions.card.openAccessibilityLabel));
    await flush();
    await act(async () => {
      repository.statusGate.resolve("ACTIVE");
      await Promise.resolve();
    });
    await flush();

    const zones = screen.getByTestId("composition-exercise-body-zones");
    // Persistées dans l'ordre `dos, epaules` — restituées dans l'ordre du
    // référentiel (`Épaules` order 1, `Dos` order 4).
    expect(zones.props.children).toBe("Épaules · Dos");
    expect(zones.props.numberOfLines).toBe(1);
  });

  it("5. n'écrit jamais rien à la simple ouverture d'une Séance (lecture seule — `create`/`update` rejettent si appelées)", async () => {
    renderCatalogueRouter();
    await flush();

    fireEvent.press(await screen.findByLabelText(sessions.card.openAccessibilityLabel));
    await flush();
    await act(async () => {
      repository.statusGate.resolve("ACTIVE");
      await Promise.resolve();
    });
    await flush();

    // Aucune des deux méthodes d'écriture n'a été appelée : elles rejettent,
    // et aucun rejet non capturé n'a fait échouer ce test.
    expect(screen.getByLabelText(composition.name).props.value).toBe("Séance persistée");
  });
});

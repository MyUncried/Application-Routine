import { act, render, screen, waitFor } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useEffect, type ReactNode } from "react";
import { Text } from "react-native";

import { SessionServiceProvider } from "@/features/sessions/SessionServiceProvider";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS } from "@/domain/preferences/Profile";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import { createEmptyDraft, createExerciseDraft } from "@/domain/sessions/SessionDraft";
import {
  LOCAL_PROFILE_SINGLETON_KEY,
  LOCAL_USER_SINGLETON_KEY,
} from "@/infrastructure/database/constants";
import { MIGRATION_001 } from "@/infrastructure/database/migrations/migration001";
import { MIGRATION_002 } from "@/infrastructure/database/migrations/migration002";
import { MIGRATION_003 } from "@/infrastructure/database/migrations/migration003";
import { MIGRATION_004 } from "@/infrastructure/database/migrations/migration004";
import { MIGRATION_005 } from "@/infrastructure/database/migrations/migration005";
import { MIGRATION_006 } from "@/infrastructure/database/migrations/migration006";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { NodeSqliteDatabase as mockNodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Régression T01-S05 (voir T01-S05-rapport-contre-verification.md §2) :
 * `SQLiteProvider` (expo-sqlite@57.0.1) est mémoïsé avec un comparateur qui
 * ignore délibérément `children`
 * (`node_modules/expo-sqlite/src/hooks.tsx:93-122`). Ce double reproduit
 * précisément ce comportement — et rien de plus — pour que ce test échoue
 * bel et bien si `SessionServiceProvider` recommençait à faire transiter un
 * `children` variable par `SQLiteProvider`, sans dépendre d'aucun autre
 * détail (asset, Suspense, cache natif) qui ne participe pas au défaut.
 *
 * Volontairement PAS simplifié en un simple passe-plat de `children` : un
 * tel double masquerait exactement le défaut que ce test doit détecter.
 */
jest.mock("expo-sqlite", () => {
  // `require()` plutôt qu'un import statique : une factory `jest.mock` est
  // évaluée paresseusement et ne peut référencer une valeur importée
  // normalement (règle de portée de `babel-plugin-jest-hoist`) — le module
  // doit donc être chargé ici, à l'intérieur de la factory elle-même.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");

  // `unknown`, pas un alias `type` nommé dérivé de `mockNodeSqliteDatabase` :
  // le vérificateur de portée de `babel-plugin-jest-hoist` ne comprend pas
  // les déclarations `type` TypeScript comme des liaisons valides et
  // signale à tort toute référence à un tel alias comme une variable hors
  // portée, même préfixée `mock`. `unknown` évite le problème sans rien
  // perdre : ce module simulé n'est jamais vérifié par `tsc` au regard des
  // types réels d'`expo-sqlite` (seul le runtime Jest le charge).
  const SQLiteContext = ReactActual.createContext<unknown>(null);

  function SQLiteProviderNonSuspense({
    databaseName,
    onInit,
    onError,
    children,
  }: {
    databaseName: string;
    onInit?: (db: unknown) => Promise<void>;
    onError?: (error: Error) => void;
    children: ReactNode;
  }) {
    const [state, setState] = ReactActual.useState<{
      loading: boolean;
      db: unknown;
      error: Error | null;
    }>({ loading: true, db: null, error: null });

    ReactActual.useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const db = mockNodeSqliteDatabase.openInMemory();
          if (onInit) {
            await onInit(db);
          }
          if (!cancelled) {
            setState({ loading: false, db, error: null });
          }
        } catch (error) {
          if (!cancelled) {
            setState({ loading: false, db: null, error: error as Error });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
      // Reproduit exactement les dépendances réelles d'expo-sqlite
      // (databaseName, onInit — `onError`/`children` en sont absents dans
      // la source d'origine).
    }, [databaseName, onInit]);

    if (state.error != null) {
      const handler = onError ?? ((e: Error) => { throw e; });
      handler(state.error);
    }
    if (state.loading || state.db == null) {
      return null;
    }
    return ReactActual.createElement(SQLiteContext.Provider, { value: state.db }, children);
  }

  // Le comparateur exclut délibérément `children` — c'est exactement le
  // comportement du `React.memo` réel d'expo-sqlite@57.0.1 qui a causé le
  // défaut (voir hooks.tsx). Le reproduire fidèlement, plutôt que de
  // l'omettre, est nécessaire pour que ce test protège réellement contre la
  // régression.
  const SQLiteProvider = ReactActual.memo(
    SQLiteProviderNonSuspense,
    (prev, next) =>
      prev.databaseName === next.databaseName &&
      prev.onInit === next.onInit &&
      prev.onError === next.onError,
  );

  function useSQLiteContext(): unknown {
    const context = ReactActual.useContext(SQLiteContext);
    if (context == null) {
      throw new Error("useSQLiteContext must be used within a <SQLiteProvider>");
    }
    return context;
  }

  return { SQLiteProvider, useSQLiteContext };
});

/**
 * `SqliteSessionRepository` utilise par défaut `Crypto.randomUUID`
 * (`expo-crypto`) pour générer `sessionId`/`cycleId`/`tourId` — un module
 * natif, jamais disponible tel quel sous Jest. Sans ce double, cet appel
 * renvoie `undefined`, qu'`expo-sqlite`/`node:sqlite` ne peut pas lier à un
 * paramètre (`TypeError: Provided value cannot be bound to SQLite parameter
 * 1.`). Même patron que `CompositionScreen.test.tsx`/`ExerciseScreen.test.tsx`
 * — un compteur garantit ici des identifiants distincts, utile dès que
 * plusieurs lignes sont créées dans la même transaction (Séance/Cycle/Tour).
 */
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `generated-id-${++counter}`) };
});

function Consumer({
  onRender,
  onRenderActivityDefinitionService,
}: {
  onRender: (service: SessionService) => void;
  onRenderActivityDefinitionService?: (service: ActivityDefinitionService) => void;
}) {
  const service = useSessionService();
  const activityDefinitionService = useActivityDefinitionService();
  // Sans tableau de dépendances : journalise l'instance vue à *chaque*
  // rendu de ce composant, pour pouvoir prouver sa stabilité référentielle
  // entre deux rendus successifs (point 5 de la consigne).
  useEffect(() => {
    onRender(service);
    onRenderActivityDefinitionService?.(activityDefinitionService);
  });
  return <Text>app-content</Text>;
}

describe("SessionServiceProvider — régression : un children applicatif variable doit atteindre le contexte", () => {
  /**
   * Contre-vérification T01-S07 (voir T01-S07-rapport-contre-verification.md) :
   * ce test dépendait de `waitFor` en mode « vrais timers » (`setTimeout`/
   * `setInterval` réels, `asyncUtilTimeout` par défaut 1000 ms — voir
   * `node_modules/@testing-library/react-native/build/wait-for.js`), alors
   * que la chaîne asynchrone attendue (`openInMemory` → `onInit` →
   * `setState`, toutes native `node:sqlite` synchrones enveloppées dans
   * `async`/`await` — voir `NodeSqliteDatabase.ts` — aucun `setTimeout` nulle
   * part dans cette chaîne) ne dépend elle-même d'aucune horloge réelle.
   * Diagnostic : sous 26 suites en parallèle (jusqu'à 11 workers sur cette
   * machine 12 cœurs), un worker peut être suffisamment privé de temps CPU
   * par l'ordonnanceur du système pour que même le `setTimeout`/`setInterval`
   * réel interne de `waitFor` ne se déclenche pas avant le timeout global de
   * 5000 ms de Jest — pas un blocage, une fuite ou une assertion erronée : un
   * pur artefact d'attente fondée sur l'horloge murale sous contention. En
   * isolation (aucune contention), ce même test s'exécute en ~600 ms.
   *
   * Correction : timers Jest simulés (`jest.useFakeTimers()`). `waitFor`
   * détecte nativement ce mode (`jestFakeTimersAreEnabled()`) et fait
   * progresser le temps simulé de façon déterministe
   * (`jest.advanceTimersByTime` dans une boucle `act()`), sans plus jamais
   * dépendre d'un `setTimeout`/`setInterval` réel — donc insensible à la
   * contention CPU inter-processus. Les micro-tâches réelles (Promises de la
   * chaîne `async`/`await` elle-même) continuent de se résoudre normalement :
   * seuls les timers/`setImmediate` sont simulés, jamais les micro-tâches
   * natives. Aucune assertion affaiblie, aucun timeout augmenté, aucun test
   * ignoré — uniquement la source réelle de non-déterminisme supprimée.
   */
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("propage un remplacement ultérieur de children (null → contenu réel) jusqu'à SessionServiceContext, avec l'instance exacte de SessionService", async () => {
    const onReady = jest.fn();
    const onRender = jest.fn();
    // V2-CAT-01 : `ActivityDefinitionServiceProvider` expose une instance
    // réelle d'`ActivityDefinitionService`, construite depuis la MÊME
    // composition SQLite que `SessionService` — jamais une seconde connexion
    // ni un second cycle de migration. Journalisée par le même `Consumer`,
    // une fois `children` effectivement rendu (jamais avant : le contexte
    // vaudrait encore `null`).
    const onRenderActivityDefinitionService = jest.fn();

    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? (
            <Consumer
              onRender={onRender}
              onRenderActivityDefinitionService={onRenderActivityDefinitionService}
            />
          ) : null}
        </SessionServiceProvider>
      );
    }

    // 1. Monté avec children=null, exactement comme RootLayout tant que
    // fontsSettled est faux.
    const { rerender } = render(<Harness showContent={false} />);

    expect(screen.queryByText("app-content")).toBeNull();

    // 2. L'initialisation SQLite (asynchrone, simulée par le double
    // fidèle) doit se terminer : onReady est signalé, SessionService est
    // construit, indépendamment du contenu applicatif actuel.
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));

    // 3. Le composant parent (comme RootLayout lorsque fontsSettled ET
    // databaseReady deviennent vrais) remplace children=null par un
    // contenu applicatif réel — sans qu'aucune des autres props de
    // SessionServiceProvider ne change.
    act(() => {
      rerender(<Harness showContent={true} />);
    });

    // 4. Ce contenu doit désormais être visible. Avec l'ancienne
    // architecture (children variable traversant SQLiteProvider), cette
    // assertion échoue : le contenu reste invisible pour toujours, car le
    // comparateur mémoïsé de SQLiteProvider absorbe silencieusement la
    // mise à jour.
    expect(screen.getByText("app-content")).toBeTruthy();

    // 5. Le contenu a bien pu appeler useSessionService() et reçoit une
    // instance de SessionService réellement construite.
    await waitFor(() => expect(onRender).toHaveBeenCalled());
    const firstSeen = onRender.mock.calls[0]?.[0];
    expect(firstSeen).toBeInstanceOf(SessionService);

    // Un second rendu du même contenu doit exposer exactement la même
    // instance (pas une reconstruction) : preuve d'identité référentielle,
    // pas seulement structurelle.
    act(() => {
      rerender(<Harness showContent={true} />);
    });
    const lastCall = onRender.mock.calls[onRender.mock.calls.length - 1];
    const lastSeen = lastCall?.[0];
    expect(lastSeen).toBe(firstSeen);

    // V2-CAT-01 : le même `Consumer`, déjà monté ci-dessus une fois `children`
    // effectivement rendu, a également reçu une instance réelle
    // d'`ActivityDefinitionService`.
    await waitFor(() => expect(onRenderActivityDefinitionService).toHaveBeenCalled());
    expect(onRenderActivityDefinitionService.mock.calls[0]?.[0]).toBeInstanceOf(
      ActivityDefinitionService,
    );
    // Délai par test (troisième argument de `it`, pas une modification du
    // timeout global de Jest) : mesuré empiriquement, ce fichier complet
    // (chargement + exécution) peut prendre jusqu'à ~54 s sous les 26
    // suites en parallèle sur cette machine (12 cœurs, jusqu'à 11 workers),
    // contre ~1,3 s en isolation — un facteur de contention d'environ ×6,
    // pas un blocage : ce même test, une fois les timers réels remplacés
    // par des timers simulés ci-dessus, reste déterministe et rapide dès
    // qu'il obtient du temps CPU. 20000 ms couvre largement cette marge
    // observée sans dépendre d'une estimation arbitraire.
  }, 20000);
});

describe("SessionServiceProvider — câblage réel du Profil (V2-PRE-1, plan §3.2, UI-16294D4D4345)", () => {
  /**
   * Revue indépendante 5938943370 (run 36913774921, REVISE), résolue par le
   * plan round 5 (revue 5939867521, barrière 5939871764) : `SessionService`
   * est désormais construit avec `SqliteProfileRepository` en TROISIÈME
   * argument (même connexion `ExpoDatabase` que les deux autres Repository),
   * ici prouvé à travers le câblage RÉEL du provider — base migrée en
   * mémoire (double fidèle `expo-sqlite`, voir le docstring de tête de ce
   * fichier) — jamais un double de `SessionService`/`ProfileRepository`.
   *
   * Le Profil est mutilé directement en base à une valeur VOLONTAIREMENT
   * distincte de `DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS` (le seed de
   * `migration007`), afin que ce test ne puisse pas passer par coïncidence
   * si la valeur par défaut du Domaine était lue à la place du Profil
   * réellement persisté.
   */
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initialise postActivityRecoverySeconds d'une occurrence depuis le Profil persisté (valeur distincte du défaut) lors d'une création réelle via le provider", async () => {
    const onReady = jest.fn();
    const openInMemorySpy = jest.spyOn(mockNodeSqliteDatabase, "openInMemory");

    let capturedService: SessionService | null = null;
    function ServiceCapture() {
      const service = useSessionService();
      useEffect(() => {
        capturedService = service;
      }, [service]);
      return null;
    }

    // Même patron que le test de régression ci-dessus : `children` ne doit
    // appeler `useSessionService()` qu'une fois le service RÉELLEMENT prêt
    // (sans quoi le contexte vaut encore `null` et ce Hook lève). `showContent`
    // reste donc `false` jusqu'à ce qu'`onReady` ait été signalé.
    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? <ServiceCapture /> : null}
        </SessionServiceProvider>
      );
    }

    const { rerender } = render(<Harness showContent={false} />);

    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));

    act(() => {
      rerender(<Harness showContent={true} />);
    });

    await waitFor(() => expect(capturedService).toBeInstanceOf(SessionService));

    const nativeDatabase = openInMemorySpy.mock.results[0]
      ?.value as ReturnType<typeof mockNodeSqliteDatabase.openInMemory>;
    const CUSTOM_RECOVERY_SECONDS = 45;
    expect(CUSTOM_RECOVERY_SECONDS).not.toBe(DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS);
    // Valeurs entières littérales directement interpolées (même patron que
    // `SqliteBodyZoneRepository.test.ts`, "UPDATE body_zones SET is_active = 0
    // WHERE id = 'cou'") — aucun paramètre lié, aucune chaîne utilisateur :
    // les deux valeurs sont des constantes entières de ce test.
    await nativeDatabase.runAsync(
      `UPDATE profiles SET post_activity_recovery_seconds_default = ${CUSTOM_RECOVERY_SECONDS} WHERE singleton_key = ${LOCAL_PROFILE_SINGLETON_KEY}`,
    );

    const draft = {
      ...createEmptyDraft(),
      name: "Séance simple",
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
    };

    const result = await capturedService!.createSession(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // `createExerciseDraft` place l'Exercice à `DEFAULT_STRUCTURAL_POSITION`
      // (`BEFORE_TOUR`, hors du Circuit) — `cycle.beforeTour`, jamais
      // `cycle.tour.exercises` (réservé aux Activités `IN_TOUR`).
      expect(result.value.cycle.beforeTour?.[0]?.postActivityRecoverySeconds).toBe(
        CUSTOM_RECOVERY_SECONDS,
      );
    }

    openInMemorySpy.mockRestore();
  }, 20000);
});

describe("SessionServiceProvider — câblage réel des Zones corporelles et des Catégories (device check Hermann, commentaire 5948936550)", () => {
  /**
   * Le device check de Hermann a trouvé deux défauts de câblage de
   * production, tous deux reproduits ici à travers le câblage RÉEL du
   * provider (base migrée en mémoire, double fidèle `expo-sqlite` — voir le
   * docstring de tête de ce fichier) — jamais un double de
   * `ActivityDefinitionService`/`BodyZoneRepository`/`CategoryRepository` :
   *
   * 1. Les Zones corporelles étaient vides dans l'application : `ExerciseScreen`,
   *    `ActivityCard`, `ActivitySelectionScreen` et `CompositionScreen`
   *    accédaient directement à `useSQLiteContext`, qui lève TOUJOURS hors de
   *    `<SQLiteProvider>` (ces écrans sont rendus par le `children`
   *    applicatif, hors de `<SQLiteProvider>` — architecture T01-S05,
   *    préservée) — chaque écran dégradait donc silencieusement vers un
   *    référentiel VIDE.
   * 2. Les Catégories : `SessionServiceProvider` construisait
   *    `ActivityDefinitionService` SANS `CategoryRepository`, si bien que
   *    `listCategories()` levait systématiquement.
   */
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Même `Consumer` que la régression T01-S05 ci-dessus (expose les DEUX
   * services construits par le provider) — `showContent` reste `false`
   * jusqu'à `onReady`, exactement comme les tests précédents de ce fichier
   * (`useSessionService`/`useActivityDefinitionService` lèvent hors
   * provider prêt).
   */
  async function renderReadyProvider(): Promise<{
    sessionService: SessionService;
    activityDefinitionService: ActivityDefinitionService;
  }> {
    const onReady = jest.fn();
    let sessionService: SessionService | null = null;
    let activityDefinitionService: ActivityDefinitionService | null = null;

    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? (
            <Consumer
              onRender={(service) => {
                sessionService = service;
              }}
              onRenderActivityDefinitionService={(service) => {
                activityDefinitionService = service;
              }}
            />
          ) : null}
        </SessionServiceProvider>
      );
    }

    const { rerender } = render(<Harness showContent={false} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    act(() => {
      rerender(<Harness showContent={true} />);
    });
    await waitFor(() => expect(activityDefinitionService).not.toBeNull());

    return { sessionService: sessionService!, activityDefinitionService: activityDefinitionService! };
  }

  it("lists the real persisted Body Zones for application children, through the real provider wiring", async () => {
    const { activityDefinitionService } = await renderReadyProvider();

    const zones = await activityDefinitionService.listBodyZones();

    expect(zones.length).toBeGreaterThan(0);
    expect(zones.map((zone) => zone.name)).toContain("Dos");
  }, 20000);

  it("lists the real persisted Categories for application children, through the real provider wiring", async () => {
    const { activityDefinitionService } = await renderReadyProvider();

    const categories = await activityDefinitionService.listCategories();

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.map((category) => category.name)).toContain("Autre");
  }, 20000);

  it("creates a Catalogue ActivityDefinition with a Body Zone and a brand-new Category, and reads it back, through the real provider wiring", async () => {
    const { activityDefinitionService } = await renderReadyProvider();

    const zones = await activityDefinitionService.listBodyZones();
    const dos = zones.find((zone) => zone.name === "Dos");
    expect(dos).toBeTruthy();

    const createResult = await activityDefinitionService.createActivityDefinition({
      name: "Pompes",
      description: null,
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 10,
      category: { kind: "NEW", name: "Nouvelle catégorie", color: "#3B82F6" },
      bodyZoneIds: [dos!.id],
      sideMode: "UNILATERAL",
      sideRecoverySeconds: 0,
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const reloaded = await activityDefinitionService.getActivityDefinition(createResult.value.id);
    expect(reloaded?.bodyZoneIds).toEqual([dos!.id]);

    const categories = await activityDefinitionService.listCategories();
    const newCategory = categories.find((category) => category.name === "Nouvelle catégorie");
    expect(newCategory).toBeTruthy();
    expect(reloaded?.categoryId).toBe(newCategory!.id);
  }, 20000);

  /**
   * Base migrée à partir de DONNÉES HISTORIQUES réelles : `migration001` à
   * `migration006` appliquées avec des lignes déjà présentes (une
   * `ActivityDefinition` du schéma `migration006`, SANS `category_id` —
   * cette colonne n'existe pas avant `migration007` — avec une association
   * `activity_definition_body_zones` déjà persistée), `PRAGMA user_version`
   * positionné à `6`, PUIS la base est remise au double `expo-sqlite` : c'est
   * le VRAI `onInit` de `SessionServiceProvider` (`initializeDatabase` →
   * `migrateDatabase`) qui détecte la version 6 et applique SEULE
   * `migration007` par-dessus — exactement le scénario « mise à niveau d'une
   * installation existante » du plan (§3, §14.2, §16).
   *
   * `execAsync`/`runAsync` de `NodeSqliteDatabase` n'attendent ici
   * délibérément AUCUN `await` : leur corps s'exécute intégralement de façon
   * SYNCHRONE (`node:sqlite` est synchrone ; seule la valeur de retour est
   * enveloppée dans une Promise déjà résolue) — nécessaire puisque
   * `openInMemory()` lui-même doit rester synchrone (le double `expo-sqlite`
   * ne l'attend jamais).
   */
  it("edits an existing Catalogue ActivityDefinition coming from a database migrated from historical data (migrations 001-006 with rows, then 007), and shows its Category name and Zones on reopening — through the real provider wiring", async () => {
    const onReady = jest.fn();
    const originalOpenInMemory = mockNodeSqliteDatabase.openInMemory;
    const openInMemorySpy = jest
      .spyOn(mockNodeSqliteDatabase, "openInMemory")
      .mockImplementationOnce(() => {
        const db = originalOpenInMemory();
        db.execAsync(MIGRATION_001);
        // `migrateDatabase.ts` ne sème l'utilisateur local singleton
        // (`users`) qu'au passage FRAIS par la version 0 — reproduit ici à
        // l'identique puisque cette base historique n'emprunte jamais ce
        // chemin (elle démarre directement à la version 6).
        db.runAsync(
          "INSERT INTO users (singleton_key, id, created_at) VALUES (?, ?, ?)",
          [LOCAL_USER_SINGLETON_KEY, "usr_legacy", "2026-01-01T00:00:00.000Z"],
        );
        db.execAsync(MIGRATION_002);
        db.execAsync(MIGRATION_003);
        db.execAsync(MIGRATION_004);
        db.execAsync(MIGRATION_005);
        db.execAsync(MIGRATION_006);
        db.runAsync(
          `INSERT INTO activity_definitions (
             id, name, description, execution_mode, duration_seconds, repetition_count,
             series_count, pause_seconds, recovery_seconds, side_mode, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "legacy-def-1",
            "Fentes historiques",
            null,
            "DURATION",
            40,
            null,
            2,
            10,
            20,
            "UNILATERAL",
            "2026-01-01T00:00:00.000Z",
            "2026-01-01T00:00:00.000Z",
          ],
        );
        db.runAsync(
          "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES (?, ?)",
          ["legacy-def-1", "dos"],
        );
        db.execAsync("PRAGMA user_version = 6");
        return db;
      });

    let activityDefinitionService: ActivityDefinitionService | null = null;

    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? (
            <Consumer
              onRender={() => {}}
              onRenderActivityDefinitionService={(service) => {
                activityDefinitionService = service;
              }}
            />
          ) : null}
        </SessionServiceProvider>
      );
    }

    const { rerender } = render(<Harness showContent={false} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    act(() => {
      rerender(<Harness showContent={true} />);
    });
    await waitFor(() => expect(activityDefinitionService).not.toBeNull());

    const service = activityDefinitionService!;

    const beforeEdit = await service.getActivityDefinition("legacy-def-1");
    expect(beforeEdit).not.toBeNull();
    expect(beforeEdit?.bodyZoneIds).toEqual(["dos"]);
    // `migration007` : `ALTER TABLE activity_definitions ADD COLUMN category_id
    // ... DEFAULT 'autre'` — toute ligne historique hérite donc de la
    // Catégorie prédéfinie « Autre ».
    expect(beforeEdit?.categoryId).toBe("autre");
    const categories = await service.listCategories();
    expect(categories.find((category) => category.id === "autre")?.name).toBe("Autre");

    const updateResult = await service.updateActivityDefinition("legacy-def-1", {
      name: "Fentes historiques modifiées",
      description: beforeEdit!.description,
      executionMode: beforeEdit!.executionMode,
      durationSeconds: beforeEdit!.durationSeconds,
      repetitionCount: beforeEdit!.repetitionCount,
      seriesCount: beforeEdit!.seriesCount,
      pauseSeconds: beforeEdit!.pauseSeconds,
      category: { kind: "EXISTING", categoryId: "autre" },
      bodyZoneIds: beforeEdit!.bodyZoneIds,
      sideMode: beforeEdit!.sideMode,
      sideRecoverySeconds: 0,
    });
    expect(updateResult.status).toBe("UPDATED");

    const reopened = await service.getActivityDefinition("legacy-def-1");
    expect(reopened?.name).toBe("Fentes historiques modifiées");
    expect(reopened?.categoryId).toBe("autre");
    expect(reopened?.bodyZoneIds).toEqual(["dos"]);

    openInMemorySpy.mockRestore();
  }, 20000);
});

describe("SessionServiceProvider — câblage réel des Étiquettes pour la couleur de Séance (revue indépendante 5950755410, même famille que le défaut des Zones corporelles)", () => {
  /**
   * `CompositionScreen` dérivait la couleur affichée d'une Séance depuis son
   * Étiquette via `useSQLiteContext`/`SqliteLabelRepository` directement —
   * exactement le même défaut que les Zones corporelles/Catégories
   * ci-dessus (ces écrans sont rendus par le `children` applicatif, hors de
   * `<SQLiteProvider>` — architecture T01-S05, préservée) : la couleur
   * affichée restait donc TOUJOURS la présentation neutre en production,
   * même pour une Séance réellement Étiquetée. `ActivityDefinitionService`
   * porte désormais `listLabels()` (même patron que `listBodyZones()`/
   * `listCategories()` ci-dessus), construit avec `SqliteLabelRepository`
   * par `SessionServiceProvider` sur la MÊME connexion.
   */
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("derives the real persisted Label's colour for a Session associated with it, and keeps the neutral presentation for a Session without a Label, through the real provider wiring", async () => {
    const onReady = jest.fn();
    const openInMemorySpy = jest.spyOn(mockNodeSqliteDatabase, "openInMemory");

    let activityDefinitionService: ActivityDefinitionService | null = null;

    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? (
            <Consumer
              onRender={() => {}}
              onRenderActivityDefinitionService={(service) => {
                activityDefinitionService = service;
              }}
            />
          ) : null}
        </SessionServiceProvider>
      );
    }

    const { rerender } = render(<Harness showContent={false} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    act(() => {
      rerender(<Harness showContent={true} />);
    });
    await waitFor(() => expect(activityDefinitionService).not.toBeNull());

    const service = activityDefinitionService!;
    const nativeDatabase = openInMemorySpy.mock.results[0]!
      .value as ReturnType<typeof mockNodeSqliteDatabase.openInMemory>;
    openInMemorySpy.mockRestore();

    // `SqliteLabelRepository` directement sur la MÊME connexion migrée que
    // le provider réel — `ActivityDefinitionService` n'expose, à dessein,
    // que la lecture (`listLabels`), jamais la création d'Étiquette (hors
    // périmètre de cette correction).
    const labelRepository = new SqliteLabelRepository(nativeDatabase);
    const createdLabel = await labelRepository.create({ name: "Sport", color: "#2E9B62" });

    const labels = await service.listLabels();
    expect(labels.some((label) => label.id === createdLabel.id && label.color === "#2E9B62")).toBe(
      true,
    );

    // Même dérivation, en LECTURE SEULE, que `CompositionScreen.tsx`
    // (`labelsReferential.find((label) => label.id === draft.labelId)?.color
    // ?? DEFAULT_SESSION_COLOR`) — jamais une écriture de `draft.color`.
    const sessionWithLabelColor =
      labels.find((label) => label.id === createdLabel.id)?.color ?? DEFAULT_SESSION_COLOR;
    expect(sessionWithLabelColor).toBe("#2E9B62");

    const sessionWithoutLabelId: string | null = null;
    const sessionWithoutLabelColor =
      labels.find((label) => label.id === sessionWithoutLabelId)?.color ?? DEFAULT_SESSION_COLOR;
    expect(sessionWithoutLabelColor).toBe(DEFAULT_SESSION_COLOR);
  }, 20000);
});

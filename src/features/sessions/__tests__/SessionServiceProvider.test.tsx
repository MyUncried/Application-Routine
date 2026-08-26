import { act, render, screen, waitFor } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useEffect, type ReactNode } from "react";
import { Text } from "react-native";

import { SessionServiceProvider } from "@/features/sessions/SessionServiceProvider";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
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

function Consumer({ onRender }: { onRender: (service: SessionService) => void }) {
  const service = useSessionService();
  // Sans tableau de dépendances : journalise l'instance vue à *chaque*
  // rendu de ce composant, pour pouvoir prouver sa stabilité référentielle
  // entre deux rendus successifs (point 5 de la consigne).
  useEffect(() => {
    onRender(service);
  });
  return <Text>app-content</Text>;
}

describe("SessionServiceProvider — régression : un children applicatif variable doit atteindre le contexte", () => {
  it("propage un remplacement ultérieur de children (null → contenu réel) jusqu'à SessionServiceContext, avec l'instance exacte de SessionService", async () => {
    const onReady = jest.fn();
    const onRender = jest.fn();

    function Harness({ showContent }: { showContent: boolean }) {
      return (
        <SessionServiceProvider onReady={onReady}>
          {showContent ? <Consumer onRender={onRender} /> : null}
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
  });
});

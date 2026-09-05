import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { DATABASE_NAME } from "@/infrastructure/database/constants";
import { ExpoDatabase } from "@/infrastructure/database/ExpoDatabase";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { SessionService } from "@/features/sessions/SessionService";

/**
 * Câblage réel `expo-sqlite → ExpoDatabase → SqliteSessionRepository →
 * SessionService`. Seul fichier de la feature à importer `expo-sqlite` —
 * voir `SessionServiceContext.tsx` pour le contrat React pur.
 *
 * **Architecture corrigée (T01-S05, suite à contre-vérification)** :
 * `SQLiteProvider` (expo-sqlite) est mémoïsé (`React.memo`) avec un
 * comparateur qui ignore délibérément `children`
 * (`node_modules/expo-sqlite/src/hooks.tsx`). Tout `children` qui varie
 * d'un rendu à l'autre — typiquement le `<Stack>` applicatif de
 * `app/_layout.tsx`, conditionné par `fontsSettled` — serait donc
 * silencieusement absorbé s'il transitait par lui : une fois le premier
 * rendu passé (où `children` valait encore `null`), plus aucune mise à jour
 * de ce `children` n'atteindrait l'arbre réel, laissant l'application vide
 * indéfiniment après la disparition du splash.
 *
 * `SQLiteProvider` ne reçoit donc ici qu'un unique enfant interne
 * strictement stable, `SessionServiceInitializer`, dont les props ne
 * varient jamais au fil des rendus de `SessionServiceProvider` — son
 * bail-out mémoïsé reste ainsi sans conséquence. Le `children` applicatif
 * réel ne traverse jamais `SQLiteProvider` : il est enveloppé directement
 * par `SessionServiceContext.Provider` (notre propre composant, non
 * mémoïsé), rendu en dehors de `SQLiteProvider`, donc toujours à jour.
 */

/**
 * Référence de niveau module, donc stable entre rendus — condition exigée
 * par `SQLiteProvider` (`onInit`/`onError` doivent rester des références
 * stables pour ne pas rouvrir la base à chaque rendu). Pose les pragmas
 * canoniques puis exécute la migration (idempotente) avant que
 * `SQLiteProvider` ne rende le moindre enfant.
 */
async function onDatabaseInit(nativeDatabase: SQLiteDatabase): Promise<void> {
  await initializeDatabase(new ExpoDatabase(nativeDatabase));
}

export type SessionServiceProviderProps = {
  children: ReactNode;
  /**
   * Appelé une fois la base ouverte, migrée et le service construit.
   * Idempotent par nature : plusieurs appels successifs (par exemple lors
   * d'un remontage en développement) n'ont aucun effet observable au-delà
   * du premier signal de disponibilité.
   */
  onReady?: () => void;
};

type SessionServiceInitializerProps = {
  /** Remonte l'instance construite ; ne reçoit jamais de forme différente. */
  onServiceReady: (service: SessionService) => void;
};

/**
 * Unique enfant de `SQLiteProvider`. Ses props (`onServiceReady`) sont
 * garanties référentiellement stables par `SessionServiceProvider`
 * ci-dessous : `SQLiteProvider` ne reçoit donc jamais de `children`
 * différent d'un rendu à l'autre, et son bail-out mémoïsé (comparateur qui
 * ignore `children`) n'a alors aucune conséquence observable. Ne rend rien
 * visuellement — son seul rôle est de construire `SessionService` (mémoïsé
 * sur la connexion native stable) et de signaler sa disponibilité.
 */
function SessionServiceInitializer({ onServiceReady }: SessionServiceInitializerProps) {
  const nativeDatabase = useSQLiteContext();

  const sessionService = useMemo(() => {
    const database = new ExpoDatabase(nativeDatabase);
    return new SessionService(
      new SqliteSessionRepository(database),
      new SqliteCategoryRepository(database),
    );
  }, [nativeDatabase]);

  useEffect(() => {
    onServiceReady(sessionService);
  }, [sessionService, onServiceReady]);

  return null;
}

/**
 * Expose `SessionService` via `SessionServiceContext` dès qu'il est
 * construit, et relaie le `children` applicatif — qui peut varier
 * librement d'un rendu à l'autre (par ex. `null` puis `<Stack>` selon
 * `fontsSettled`) — sans jamais le faire transiter par `SQLiteProvider`.
 * L'état du service reste local à ce composant : `RootLayout` n'a besoin
 * que du signal booléen `onReady`, jamais de l'instance elle-même.
 */
export function SessionServiceProvider({ children, onReady }: SessionServiceProviderProps) {
  const [sessionService, setSessionService] = useState<SessionService | null>(null);

  const handleServiceReady = useCallback(
    (service: SessionService) => {
      setSessionService(service);
      onReady?.();
    },
    [onReady],
  );

  return (
    <>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={onDatabaseInit}>
        <SessionServiceInitializer onServiceReady={handleServiceReady} />
      </SQLiteProvider>
      <SessionServiceContext.Provider value={sessionService}>
        {children}
      </SessionServiceContext.Provider>
    </>
  );
}

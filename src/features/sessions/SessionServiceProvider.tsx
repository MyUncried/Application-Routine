import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { DATABASE_NAME } from "@/infrastructure/database/constants";
import { ExpoDatabase } from "@/infrastructure/database/ExpoDatabase";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
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
 *
 * **V2-PRE-2 (plan §6.3)** : `ProfileService` et `ReferentialService` sont
 * construits ici, sur la MÊME connexion SQLite que `SessionService` —
 * aucune seconde connexion, aucun second cycle de migration (rationale
 * d'injection SQLite déjà établie par `ActivityDefinitionService`).
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
  /**
   * V2-CAT-01 : remonte `ActivityDefinitionService`, construit à partir de
   * la MÊME connexion SQLite que `SessionService` (rationale d'injection
   * SQLite du plan) — aucune seconde connexion, aucun second cycle de
   * migration.
   */
  onActivityDefinitionServiceReady: (service: ActivityDefinitionService) => void;
  /** V2-PRE-2 : remonte `ProfileService`, même connexion SQLite. */
  onProfileServiceReady: (service: ProfileService) => void;
  /** V2-PRE-2 : remonte `ReferentialService`, même connexion SQLite. */
  onReferentialServiceReady: (service: ReferentialService) => void;
};

/**
 * Unique enfant de `SQLiteProvider`. Ses props (`onServiceReady`) sont
 * garanties référentiellement stables par `SessionServiceProvider`
 * ci-dessous : `SQLiteProvider` ne reçoit donc jamais de `children`
 * différent d'un rendu à l'autre, et son bail-out mémoïsé (comparateur qui
 * ignore `children`) n'a alors aucune conséquence observable. Ne rend rien
 * visuellement — son seul rôle est de construire les services (mémoïsés sur
 * la connexion native stable) et de signaler leur disponibilité.
 */
function SessionServiceInitializer({
  onServiceReady,
  onActivityDefinitionServiceReady,
  onProfileServiceReady,
  onReferentialServiceReady,
}: SessionServiceInitializerProps) {
  const nativeDatabase = useSQLiteContext();

  const sessionService = useMemo(() => {
    const database = new ExpoDatabase(nativeDatabase);
    return new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  }, [nativeDatabase]);

  // Correction (device check Hermann, commentaire 5948936550 ; revue
  // indépendante 5950755410) : CategoryRepository, BodyZoneRepository et
  // LabelRepository étaient omis ici, laissant `listCategories()`/
  // `listBodyZones()`/`listLabels()` lever systématiquement — le sélecteur
  // de Catégorie restait vide, chaque écran consommant les Zones (Catalogue,
  // Composition, Sélection, éditeur d'Activité) dégradait silencieusement
  // vers un référentiel VIDE, et la couleur d'une Séance Étiquetée restait
  // la présentation neutre, en production. Même connexion `database` que les
  // autres Repository, aucune seconde connexion ni second cycle de
  // migration.
  const activityDefinitionService = useMemo(() => {
    const database = new ExpoDatabase(nativeDatabase);
    return new ActivityDefinitionService(
      new SqliteActivityDefinitionRepository(database),
      new SqliteCategoryRepository(database),
      new SqliteBodyZoneRepository(database),
      new SqliteLabelRepository(database),
    );
  }, [nativeDatabase]);

  const profileService = useMemo(() => {
    const database = new ExpoDatabase(nativeDatabase);
    return new ProfileService(new SqliteProfileRepository(database));
  }, [nativeDatabase]);

  const referentialService = useMemo(() => {
    const database = new ExpoDatabase(nativeDatabase);
    return new ReferentialService(
      new SqliteCategoryRepository(database),
      new SqliteBodyZoneRepository(database),
      new SqliteLabelRepository(database),
    );
  }, [nativeDatabase]);

  useEffect(() => {
    onServiceReady(sessionService);
  }, [sessionService, onServiceReady]);

  useEffect(() => {
    onActivityDefinitionServiceReady(activityDefinitionService);
  }, [activityDefinitionService, onActivityDefinitionServiceReady]);

  useEffect(() => {
    onProfileServiceReady(profileService);
  }, [profileService, onProfileServiceReady]);

  useEffect(() => {
    onReferentialServiceReady(referentialService);
  }, [referentialService, onReferentialServiceReady]);

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
  const [activityDefinitionService, setActivityDefinitionService] =
    useState<ActivityDefinitionService | null>(null);
  const [profileService, setProfileService] = useState<ProfileService | null>(null);
  const [referentialService, setReferentialService] = useState<ReferentialService | null>(null);

  const handleServiceReady = useCallback(
    (service: SessionService) => {
      setSessionService(service);
      onReady?.();
    },
    [onReady],
  );

  const handleActivityDefinitionServiceReady = useCallback(
    (service: ActivityDefinitionService) => {
      setActivityDefinitionService(service);
    },
    [],
  );

  const handleProfileServiceReady = useCallback((service: ProfileService) => {
    setProfileService(service);
  }, []);

  const handleReferentialServiceReady = useCallback((service: ReferentialService) => {
    setReferentialService(service);
  }, []);

  return (
    <>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={onDatabaseInit}>
        <SessionServiceInitializer
          onServiceReady={handleServiceReady}
          onActivityDefinitionServiceReady={handleActivityDefinitionServiceReady}
          onProfileServiceReady={handleProfileServiceReady}
          onReferentialServiceReady={handleReferentialServiceReady}
        />
      </SQLiteProvider>
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={activityDefinitionService}>
          <ProfileServiceContext.Provider value={profileService}>
            <ReferentialServiceContext.Provider value={referentialService}>
              {children}
            </ReferentialServiceContext.Provider>
          </ProfileServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    </>
  );
}

# features/sessions

`SessionService` — orchestration applicative du cycle de vie de la Séance (§11.2, §12.4). Ne dépend que du Domaine (`@/domain/sessions/*`) et de l'interface `SessionRepository` — jamais de React, Expo, React Native ou d'une implémentation concrète du Repository, injectée par le constructeur.

Disponible depuis T01-S03/T01-S04 :

- `createSession(draft): Promise<ValidationResult<Session>>` — convertit le brouillon via `toCreateSessionInput` (Domaine) et ne délègue à `SessionRepository.create` que si la conversion réussit. Un brouillon invalide retourne les violations structurées par valeur, sans aucune tentative d'écriture. Les erreurs du Repository (techniques, ou `SessionValidationError` en défense de dernier recours) se propagent telles quelles, sans être capturées ni confondues avec ce résultat structuré.
- `updateSession(sessionId, draft): Promise<UpdateSessionResult>` — même principe : conversion du brouillon d'abord, aucun appel au Repository si elle échoue (résultat `INVALID`, y compris lorsque `sessionId` n'existe pas — la validation précède toujours la recherche). En cas de succès, délègue à `SessionRepository.update` et renvoie son résultat tel quel (`UPDATED`/`NOT_FOUND`/`ARCHIVED`). Une Séance archivée ou introuvable est un résultat métier normal, pas une exception.
- `listActiveSessions(): Promise<readonly SessionSummary[]>` — passe-plat vers `SessionRepository.listActive`, pour le futur Catalogue.
- `getSession(sessionId): Promise<Session | null>` — passe-plat vers `SessionRepository.findById`, `null` si l'identifiant n'existe pas.

**Câblage applicatif réel (T01-S05, architecture corrigée après contre-vérification)** : `SessionServiceContext.tsx` porte le contrat React pur (`SessionServiceContext`, `useSessionService()`), sans aucun import `expo-sqlite` ni infrastructure — testable isolément. `SessionServiceProvider.tsx` est le seul fichier de la feature à dépendre d'`expo-sqlite`, mais **`SQLiteProvider` ne reçoit jamais le `children` applicatif** : il n'enveloppe qu'un unique enfant interne strictement stable, `SessionServiceInitializer`, qui construit `SessionService` (mémoïsé sur la connexion native stable, une fois `onInit`/`initializeDatabase` résolu — migration exécutée avant tout rendu d'enfant, garantie structurelle) puis remonte l'instance par callback. `SessionServiceProvider` mémorise cette instance localement (`useState`) et enveloppe directement le `children` applicatif — variable, potentiellement `null` puis un contenu réel — avec `SessionServiceContext.Provider`, **en dehors** de `SQLiteProvider`.

Cette séparation n'est pas cosmétique : `SQLiteProvider` (expo-sqlite@57.0.1) est mémoïsé (`React.memo`) avec un comparateur qui ignore délibérément `children` (`node_modules/expo-sqlite/src/hooks.tsx`). Un `children` qui varie d'un rendu à l'autre — le `<Stack>` de `app/_layout.tsx`, conditionné par le règlement des polices puis par la disponibilité du service — serait silencieusement absorbé s'il transitait par lui, laissant l'application vide indéfiniment après la disparition du splash. Un test de régression dédié (`SessionServiceProvider.test.tsx`) reproduit fidèlement ce comparateur et démontre que le `children` swap atteint bien le contexte.

Monté une seule fois, dans `app/_layout.tsx` : le `<Stack>` applicatif ne s'affiche qu'une fois les polices réglées **et** `SessionService` effectivement construit (signalé par `onReady`, sans jamais remonter l'instance elle-même jusqu'à `RootLayout`).

Hors périmètre pour l'instant, séquencé explicitement :

- **T01-S06 à T01-S10** — Catalogue, Composition, Exercice, Catégories, puis réouverture/modification de bout en bout à l'écran. Aucun écran ne consomme encore `useSessionService()`.

Duplication, archivage (l'écriture du statut `ARCHIVED`), restauration et suppression restent sans sous-étape assignée à ce stade.

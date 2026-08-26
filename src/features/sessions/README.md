# features/sessions

`SessionService` — orchestration applicative du cycle de vie de la Séance (§11.2, §12.4). Ne dépend que du Domaine (`@/domain/sessions/*`) et de l'interface `SessionRepository` — jamais de React, Expo, React Native ou d'une implémentation concrète du Repository, injectée par le constructeur.

Disponible depuis T01-S03/T01-S04 :

- `createSession(draft): Promise<ValidationResult<Session>>` — convertit le brouillon via `toCreateSessionInput` (Domaine) et ne délègue à `SessionRepository.create` que si la conversion réussit. Un brouillon invalide retourne les violations structurées par valeur, sans aucune tentative d'écriture. Les erreurs du Repository (techniques, ou `SessionValidationError` en défense de dernier recours) se propagent telles quelles, sans être capturées ni confondues avec ce résultat structuré.
- `updateSession(sessionId, draft): Promise<UpdateSessionResult>` — même principe : conversion du brouillon d'abord, aucun appel au Repository si elle échoue (résultat `INVALID`, y compris lorsque `sessionId` n'existe pas — la validation précède toujours la recherche). En cas de succès, délègue à `SessionRepository.update` et renvoie son résultat tel quel (`UPDATED`/`NOT_FOUND`/`ARCHIVED`). Une Séance archivée ou introuvable est un résultat métier normal, pas une exception.
- `listActiveSessions(): Promise<readonly SessionSummary[]>` — passe-plat vers `SessionRepository.listActive`, pour le futur Catalogue.
- `getSession(sessionId): Promise<Session | null>` — passe-plat vers `SessionRepository.findById`, `null` si l'identifiant n'existe pas.

Hors périmètre pour l'instant, séquencé explicitement :

- **T01-S05** — initialisation applicative et chargement SQLite (câblage réel de `SqliteSessionRepository`/`SessionService` dans un point d'entrée).
- **T01-S06 à T01-S10** — Catalogue, Composition, Exercice, Catégories, puis réouverture/modification de bout en bout à l'écran.

Duplication, archivage (l'écriture du statut `ARCHIVED`), restauration et suppression restent sans sous-étape assignée à ce stade.

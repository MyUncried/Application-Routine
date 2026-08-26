# features/sessions

`SessionService` — orchestration applicative du cycle de vie de la Séance (§11.2, §12.4). Ne dépend que du Domaine (`@/domain/sessions/*`) et de l'interface `SessionRepository` — jamais de React, Expo, React Native ou d'une implémentation concrète du Repository, injectée par le constructeur.

Disponible depuis T01-S03 :

- `createSession(draft): Promise<ValidationResult<Session>>` — convertit le brouillon via `toCreateSessionInput` (Domaine) et ne délègue à `SessionRepository.create` que si la conversion réussit. Un brouillon invalide retourne les violations structurées par valeur, sans aucune tentative d'écriture. Les erreurs du Repository (techniques, ou `SessionValidationError` en défense de dernier recours) se propagent telles quelles, sans être capturées ni confondues avec ce résultat structuré.
- `listActiveSessions(): Promise<readonly SessionSummary[]>` — passe-plat vers `SessionRepository.listActive`, pour le futur Catalogue.
- `getSession(sessionId): Promise<Session | null>` — passe-plat vers `SessionRepository.findById`, `null` si l'identifiant n'existe pas. Constitue la capacité de lecture nécessaire avant que T01-S04 introduise la modification persistante.

Hors périmètre pour l'instant, séquencé explicitement :

- **T01-S04** — `SessionService.updateSession`, `SessionRepository.update` et son implémentation transactionnelle SQLite, conversion d'une `Session` persistée vers un `SessionDraft` modifiable.
- **T01-S05** — écrans Catalogue et Composition consommant ce service (création et véritable modification).

Duplication, archivage, restauration et suppression restent sans sous-étape assignée à ce stade.

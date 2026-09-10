# T01-S04 — Plan : Modification persistante d'une Séance simple

Document d'analyse et de planification uniquement. Aucun fichier applicatif n'a été modifié pour le produire ; rien n'est en staging ; aucun commit n'a été créé.

**Ce document intègre une passe corrective sur le contrat de résultat, l'ordre de validation, la précision des écritures et la robustesse transactionnelle, décidée avant toute implémentation.** Les changements par rapport à la version précédente sont signalés explicitement dans chaque section concernée.

---

## 0. Vérification préalable (lecture seule)

- **Branche active** : `feat/creation-seance-catalogue`, suivie par `origin/feat/creation-seance-catalogue`, aucun écart.
- **Répertoire de travail** : propre (`git status --short` vide).
- **Dernier commit** : `59bed86` — « feat: introduire SessionService pour l'orchestration applicative » (T01-S03).
- **Commits T01-S01 à T01-S03** : `bdc00ab` (persistance SQLite), `01178cb` (domaine et validations), `59bed86` (SessionService) — historique cohérent, chacun audité et confirmé lors des interventions précédentes.
- **`docs/AGENTS.md`** : rappelle uniquement de lire la documentation Expo v57 avant d'écrire du code ; sans effet direct ici.
- **`docs/PRODUCT.md`** : §3 (Séance), §7 principe 4 (« Une modification ou une suppression ultérieure ne change jamais une Exécution passée »), §9 (contraintes techniques inchangées).
- **Spécifications concernant la modification** (relues intégralement) :
  - §09.2 : « Une séance peut être modifiée, dupliquée, archivée ou restaurée. » ; « Une modification de la séance n'altère jamais les exécutions déjà présentes dans le suivi. »
  - §06 : **« Une Séance archivée est consultable mais ne peut être ni modifiée, ni exécutée, ni planifiée. »** — règle déterminante (voir §2.2).
  - §11.2 (API-SEA-04) : « Modifier une séance | ID Séance, valeurs à modifier | Séance mise à jour | La Séance doit exister ; les Exécutions historisées ne sont pas modifiées. »
  - §09.13 : `Création → Édition → Active ├─ Modifier ├─ Dupliquer ├─ Archiver → Séance archivée → Restaurer` — « Modifier » part de l'état Actif, jamais de l'état Archivé.
- **`Session`, `SessionDraft` et leurs validations** : inchangés depuis T01-S02/T01-S03. `Session.status` reste typé en dur `"ACTIVE"` — **aucune fonctionnalité d'archivage n'existe dans aucune couche du code à ce jour** ; le schéma SQL permet `status = 'ARCHIVED'` mais aucun chemin de code ne l'écrit jamais.
- **`SessionRepository`** : `create`/`findById`/`listActive`, aucune méthode de modification — à étendre par ce plan.
- **`SqliteSessionRepository` et sa transaction de création** (relue intégralement) : `create()` valide via `validateCreateSessionInput` **avant** d'ouvrir la transaction, puis exécute 3 `INSERT` suivis d'une relecture via `AGGREGATE_QUERY`, dans `withExclusiveTransactionAsync`. C'est le patron réutilisé pour `update()`.
- **`SessionService` et ses tests** : `createSession`/`listActiveSessions`/`getSession`, 9 tests avec un Repository factice, aucune dépendance SQLite — patron réutilisé pour `updateSession`.
- **Schéma SQLite réel** (`migration001.ts`) : `sessions` (`status`, `archived_at`, `updated_at`…), `cycles`, `tours`, `activities` (`UNIQUE(session_id, structural_position, position)`) — **rien ne manque** pour ce que T01-S04 doit faire.

**Absence de contradiction bloquante** confirmée. Les arbitrages précédemment ouverts (§9 de la version antérieure de ce plan) sont désormais tranchés ; seuls deux points mineurs restent notés pour mémoire (§9).

---

## 1. État existant (résumé)

| Couche | Élément | État |
|---|---|---|
| Domaine | `Session`, `CreateSessionInput`, `SessionDraft`, `SessionDraftExercise` | Types T01, inchangés |
| Domaine | `validateCreateSessionInput`, `toCreateSessionInput` | Réutilisés tels quels pour la modification, aucune nouvelle règle de bornes |
| Domaine | *(absent)* `toSessionDraft(session)` | Nécessaire à T01-S04, absent aujourd'hui |
| Domaine | `errors.ts` (`ValidationResult`, `ValidationViolation`, `SessionValidationError`) | Contrat structuré existant, réutilisé tel quel — **aucun nouveau type d'erreur** (voir §2.2) |
| Interface | `SessionRepository` | `create`/`findById`/`listActive` — **pas de `update`**, à ajouter avec un nouveau type de résultat |
| Infrastructure | `SqliteSessionRepository` | Patron de transaction transposable ; horloge (`new Date().toISOString()`) non injectable aujourd'hui — à corriger (voir §2.3) |
| Application | `SessionService` | **pas de `updateSession`**, à ajouter |
| Base SQLite | Schéma | Contient déjà tout le nécessaire — aucune migration prévue |
| Infrastructure de test | `NodeSqliteDatabase` | `openInMemory()` uniquement — extension minimale nécessaire pour un test de persistance sur fichier (voir §6.2) |

---

## 2. Décisions

### 2.1 Conversion `Session` → `SessionDraft` (inchangée)

Fonction pure, dans `src/domain/sessions/SessionDraft.ts` :

```ts
export function toSessionDraft(session: Session): SessionDraft {
  return {
    name: session.name,
    color: session.color,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    exercise: {
      name: session.cycle.tour.exercise.name,
      durationSeconds: session.cycle.tour.exercise.durationSeconds,
      instruction: session.cycle.tour.exercise.instruction,
    },
  };
}
```

- **Aucune dépendance React ou SQLite** : signature `(session: Session) => SessionDraft`, aucun import hors `./Session`.
- **Aucune perte de donnée éditable** : les sept champs éditables du brouillon sont tous copiés.
- Champs de `Session` volontairement non copiés (identité/audit non éditable, ou valeurs fixées par le contrat T01) : `id`, `ownerId`, `status`, `createdAt`, `updatedAt`, identifiants/`repeatCount` de `cycle`/`tour`, et sur l'Exercice : `id`, `type`, `executionMode`, `structuralPosition`, `position`, `repetitionCount`, `seriesCount`, `pauseSeconds`. `sessionId` est transmis séparément à `updateSession(sessionId, draft)`.
- **Distinction création/édition** : `createEmptyDraft()` pour une nouvelle Séance, `toSessionDraft(session)` pour l'édition d'une Séance existante — même type `SessionDraft` en sortie, aucun indicateur de mode porté par le type.

### 2.2 Contrat `SessionRepository.update` — **corrigé : résultats métier discriminés, plus d'exception dédiée à l'archivage**

**Changement par rapport à la version précédente de ce plan** : le traitement asymétrique (absence → `null`, archivage → exception `SessionArchivedError`) est abandonné. Une Séance archivée est un **résultat métier attendu**, pas une anomalie — elle est donc représentée dans le même type de résultat que « introuvable » et « mise à jour réussie », pas comme une exception séparée. `SessionArchivedError` **n'est pas créée**.

**Contrat côté Repository** (Domaine — cohabite avec l'interface dans `SessionRepository.ts`) :

```ts
export type UpdateSessionOutcome =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(sessionId: string): Promise<Session | null>;
  listActive(): Promise<readonly SessionSummary[]>;
  update(sessionId: string, input: CreateSessionInput): Promise<UpdateSessionOutcome>;
}
```

**Contrat côté Service** (Application — `SessionService.ts`), qui ajoute la seule branche que le Repository ne connaît pas (l'entrée elle-même invalide, tranchée avant même d'atteindre le Repository) :

```ts
export type UpdateSessionResult =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "INVALID"; readonly violations: readonly ValidationViolation[] }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };
```

`UpdateSessionOutcome` (3 branches) est un sous-ensemble structurel exact de `UpdateSessionResult` (4 branches) : `SessionService.updateSession` peut renvoyer directement la valeur résolue par `sessionRepository.update(...)` sans reconstruction, TypeScript acceptant l'affectation d'une union à une union qui contient chacun de ses membres.

**Répartition des trois familles d'erreurs demandées :**

| Famille | Mécanisme | Détail |
|---|---|---|
| Validation métier invalide | Retour `{ status: "INVALID", violations }` **côté Service**, avant tout appel Repository | `toCreateSessionInput(draft)` échoue → aucun appel à `sessionRepository.update` |
| Validation métier invalide, appelée directement sur le Repository | **Exception `SessionValidationError`** (défense en profondeur, réutilisée telle quelle) | Si un appelant contourne le Service et invoque `SqliteSessionRepository.update` avec un `CreateSessionInput` invalide construit à la main, `validateCreateSessionInput` échoue et lève — même patron que `create()` |
| Séance inexistante | Retour `{ status: "NOT_FOUND" }` | Ni le Service ni le Repository ne lèvent d'exception pour ce cas |
| Séance archivée | Retour `{ status: "ARCHIVED" }` | Résultat métier attendu, jamais une exception |
| Erreur technique SQLite | Exception non typée, propagée telle quelle | Comportement inchangé, aucune capture ni reclassement (§9.2) |

### 2.3 Sémantique de mise à jour

**Ordre de traitement — confirmé, avec une conséquence documentée explicitement :**

1. **Validation complète du brouillon par le Domaine** (`toCreateSessionInput`, côté Service) — première étape, avant toute interaction avec le Repository.
2. **Si invalide → retour `{ status: "INVALID", violations }` immédiat, sans aucun appel au Repository.**
3. **Seulement ensuite**, recherche de la Séance et mise à jour persistante (côté Repository, dans une transaction unique).

**Conséquence documentée explicitement** : un identifiant absent associé à un brouillon invalide produit `INVALID`, jamais `NOT_FOUND` — puisque la validation précède systématiquement la recherche, le Service ne découvre jamais si la Séance existe lorsque le brouillon est déjà rejeté. C'est un comportement voulu et stable, plus une question ouverte.

| Question | Réponse | Détail |
|---|---|---|
| Seuls les champs existants sont mis à jour ? | Oui | 4 champs de `sessions`, 3 champs éditables d'`activities` |
| Identifiants Session/Cycle/Tour/Activité conservés ? | Oui, tous | UPDATE en place, aucun nouvel identifiant généré (voir comparaison ci-dessous) |
| `owner_id`/`created_at` conservés ? | Oui | Absents des clauses `SET` |
| Renouvellement de `updated_at` ? | Oui, sur `sessions` **et** `activities`, via une horloge désormais injectable (§2.4) | Même valeur d'horodatage utilisée pour les deux lignes dans une même transaction |
| Séance archivée ? | `{ status: "ARCHIVED" }`, **aucune écriture** | Conforme à §06 |
| Identifiant inexistant ? | `{ status: "NOT_FOUND" }`, **aucune écriture**, aucune ligne créée | Conforme à API-SEA-04 |
| Upsert implicite ? | Explicitement absent | Testé (§6) |

**Précision d'écriture — nouveau point, corrigé** : avant toute écriture, l'identifiant exact de la ligne `activities` à modifier est relevé (via la relecture de l'agrégat existant, §4), puis l'`UPDATE` cible **cette ligne précisément** (`WHERE activities.id = ? AND activities.session_id = ?`), jamais une clause qui mettrait à jour indistinctement toutes les activités d'une séance. Sous l'invariant T01 (exactement une Activité par Séance), cette précision est redondante avec un simple `WHERE session_id = ?`, mais elle est retenue pour rester correcte sans modification le jour où plusieurs Activités existeront, et pour permettre une vérification `changes === 1` sans ambiguïté.

**Vérification de structure avant écriture — nouveau point** : la ligne existante relue avant modification est validée par `assertT01S01Row` (fonction déjà existante, réutilisée telle quelle) — si l'agrégat persisté ne respecte plus la structure T01 attendue (Cycle ×1, Tour ×1, `IN_TOUR`, position 0, Série ×1, Pause 0…), la mise à jour est refusée par une exception technique **avant** toute écriture, plutôt que d'écrire sur une structure incohérente.

**Vérification du nombre de lignes affectées — nouveau point** : chaque `UPDATE` (sur `sessions` et sur `activities`) est suivi d'une vérification `changes === 1` ; tout écart lève une exception technique **à l'intérieur de la transaction**, provoquant un `ROLLBACK` complet.

**Comparaison UPDATE en place vs suppression/recréation des enfants** (inchangée) :

| | **UPDATE en place (recommandé, confirmé)** | **Suppression/recréation** |
|---|---|---|
| Identité Session/Cycle/Tour/Activité | Strictement préservée | Recréés avec de nouveaux identifiants à chaque modification |
| Instructions SQL par mise à jour | 1 lecture (agrégat) + 2 `UPDATE` (`sessions`, `activities`) + 1 relecture — `cycles`/`tours` jamais touchés (aucun champ éditable en T01) | 1 `DELETE` (cascade) + 3 `INSERT`, 3 nouveaux UUID à chaque sauvegarde |
| Risque sur les contraintes | Nul — aucune ligne ajoutée/retirée | Doit rejouer les mêmes contraintes qu'à la création |
| Adapté au multi-Activités futur | Stratégie de diff à concevoir plus tard (hors périmètre) | Modèle plus naturel *le jour où* plusieurs Activités existeront |

**Recommandation confirmée : UPDATE en place**, limité à `sessions` et `activities`.

### 2.4 Horloge injectable — **confirmée**

`SqliteSessionRepository` reçoit un troisième paramètre de constructeur, optionnel, avec valeur par défaut :

```ts
constructor(
  private readonly database: Database,
  private readonly uuidFactory: UuidFactory = Crypto.randomUUID,
  private readonly now: () => string = () => new Date().toISOString(),
) {}
```

- **Utilisée par `create()` et par `update()`**, centralisant la production de `created_at`/`updated_at` — un seul appel à `this.now()` par opération, sa valeur réutilisée pour toutes les lignes touchées dans la même transaction (cohérence des horodatages entre `sessions` et `activities`).
- **Tous les appels existants restent compatibles** : `new SqliteSessionRepository(database)` et `new SqliteSessionRepository(database, uuidFactory)` continuent de fonctionner sans changement, `now` n'étant qu'un troisième paramètre optionnel supplémentaire.
- Objectif principal : rendre déterministe le test « renouvellement de `updated_at` » (§6.2), qui nécessite deux horodatages garantis différents entre la création et la modification — sans dépendre du temps réel écoulé entre deux appels Jest.

---

## 3. Signatures

### 3.1 Domaine

```ts
// src/domain/sessions/SessionDraft.ts (ajout)
export function toSessionDraft(session: Session): SessionDraft;
```

Aucune nouvelle fonction de validation ni nouveau type d'erreur : `validateCreateSessionInput`, `toCreateSessionInput`, `ValidationViolation` et `SessionValidationError` sont réutilisés tels quels.

### 3.2 `SessionRepository` / `SqliteSessionRepository`

```ts
// src/domain/sessions/SessionRepository.ts
export type UpdateSessionOutcome =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(sessionId: string): Promise<Session | null>;
  listActive(): Promise<readonly SessionSummary[]>;
  update(sessionId: string, input: CreateSessionInput): Promise<UpdateSessionOutcome>; // nouveau
}
```

```ts
// src/infrastructure/database/repositories/SqliteSessionRepository.ts (pseudocode, voir §4 pour le flux détaillé)
async update(sessionId: string, input: CreateSessionInput): Promise<UpdateSessionOutcome> {
  const validated = validateCreateSessionInput(input);
  if (!validated.ok) {
    throw new SessionValidationError(validated.violations); // défense en profondeur, hors transaction
  }
  const normalized = validated.value;
  const timestamp = this.now();

  let outcome: UpdateSessionOutcome = { status: "NOT_FOUND" };

  await this.database.withExclusiveTransactionAsync(async (transaction) => {
    const user = await getLocalUser(transaction);

    const existingRow = await transaction.getFirstAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
      sessionId, user.id,
    ]);
    if (!existingRow) {
      return; // NOT_FOUND — aucune écriture
    }
    if (existingRow.status !== "ACTIVE") {
      outcome = { status: "ARCHIVED" };
      return; // ARCHIVED — aucune écriture
    }

    assertT01S01Row(existingRow); // structure T01 vérifiée avant toute écriture
    const activityId = existingRow.activity_id;

    const sessionUpdate = await transaction.runAsync(
      `UPDATE sessions SET name = ?, color = ?, initial_countdown_seconds = ?,
         final_phase_seconds = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`,
      [normalized.name, normalized.color, normalized.initialCountdownSeconds,
       normalized.finalPhaseSeconds, timestamp, sessionId, user.id],
    );
    if (sessionUpdate.changes !== 1) {
      throw new Error("Expected exactly one session row to be updated.");
    }

    const activityUpdate = await transaction.runAsync(
      `UPDATE activities SET name = ?, duration_seconds = ?, instruction = ?, updated_at = ?
       WHERE id = ? AND session_id = ?`,
      [normalized.exercise.name, normalized.exercise.durationSeconds,
       normalized.exercise.instruction ?? null, timestamp, activityId, sessionId],
    );
    if (activityUpdate.changes !== 1) {
      throw new Error("Expected exactly one activity row to be updated.");
    }

    const reread = await transaction.getFirstAsync<SessionAggregateRow>(AGGREGATE_QUERY, [
      sessionId, user.id,
    ]);
    if (
      !reread ||
      reread.session_id !== sessionId ||
      reread.activity_id !== activityId ||
      reread.cycle_id !== existingRow.cycle_id ||
      reread.tour_id !== existingRow.tour_id
    ) {
      throw new Error("The updated session could not be read back coherently.");
    }

    outcome = { status: "UPDATED", session: mapSessionRow(reread) };
  });

  return outcome;
}
```

Pseudocode illustratif — l'implémentation réelle (T01-S04, pas cette intervention) suivra ce squelette avec les mêmes conventions de style que `create()`.

### 3.3 `SessionService`

```ts
// src/features/sessions/SessionService.ts
export type UpdateSessionResult =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "INVALID"; readonly violations: readonly ValidationViolation[] }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

async updateSession(sessionId: string, draft: SessionDraft): Promise<UpdateSessionResult> {
  const validated = toCreateSessionInput(draft);
  if (!validated.ok) {
    return { status: "INVALID", violations: validated.violations }; // aucun appel Repository
  }
  return this.sessionRepository.update(sessionId, validated.value);
}
```

- **Aucun appel Repository si le brouillon est invalide** : retour immédiat.
- **Aucune capture** : `SessionValidationError` (défense en profondeur côté Repository) et toute erreur technique se propagent hors de `updateSession` sans `try`/`catch`, sans transformation.

---

## 4. Flux transactionnel — **corrigé : relecture et validation à l'intérieur de la transaction**

```
SqliteSessionRepository.update(sessionId, input)
  │
  ├─ validateCreateSessionInput(input)                      [Domaine, pur, hors transaction]
  │     └─ échec → throw SessionValidationError                AUCUNE lecture/écriture SQL
  │
  └─ succès → withExclusiveTransactionAsync (BEGIN IMMEDIATE — verrou exclusif immédiat)
        │
        ├─ getLocalUser(transaction)
        ├─ SELECT (AGGREGATE_QUERY) — relecture de l'agrégat existant
        │     ├─ absent    → outcome=NOT_FOUND,  AUCUNE écriture, retour du bloc
        │     ├─ archivé   → outcome=ARCHIVED,   AUCUNE écriture, retour du bloc
        │     └─ actif     →
        │           ├─ assertT01S01Row(existingRow)            [structure T01 vérifiée AVANT écriture]
        │           ├─ activityId ← existingRow.activity_id     [identifiant exact relevé avant écriture]
        │           ├─ UPDATE sessions ... WHERE id=? AND owner_id=?      → changes doit valoir 1, sinon throw (rollback)
        │           ├─ UPDATE activities ... WHERE id=activityId AND session_id=?  → changes doit valoir 1, sinon throw (rollback)
        │           ├─ SELECT (AGGREGATE_QUERY) — relecture APRÈS écriture, DANS la transaction
        │           │     └─ absente, ou session_id/activity_id/cycle_id/tour_id incohérents
        │           │           → throw À L'INTÉRIEUR DE LA TRANSACTION (aucune erreur différée après le commit)
        │           └─ outcome=UPDATED (session mappée depuis la relecture cohérente)
        │
        └─ COMMIT (y compris pour NOT_FOUND/ARCHIVED, transactions sans écriture)
              — ou ROLLBACK automatique + rethrow si une exception est levée à n'importe quelle étape
                (structure incohérente, changes≠1, relecture incohérente, panne SQLite)
  │
  └─ return outcome   (NOT_FOUND | ARCHIVED | UPDATED — jamais construit après la fin du bloc transactionnel)
```

**Points corrigés par rapport à la version précédente** :
- La relecture finale et sa validation de cohérence se font **avant** la fin du bloc passé à `withExclusiveTransactionAsync`, jamais après. Si la relecture échoue ou ne correspond pas exactement à ce qui vient d'être écrit, l'exception est levée **dans** la transaction, garantissant un `ROLLBACK` complet — aucune situation où l'appelant recevrait une erreur alors qu'une écriture partielle serait déjà validée en base.
- `NOT_FOUND` et `ARCHIVED` sont désormais des sorties **anticipées** du bloc transactionnel (`return` sans exception), avant toute instruction `UPDATE` — la transaction se termine par un `COMMIT` trivial (rien n'a été écrit), ce qui est sans risque et plus simple que de forcer un `ROLLBACK` explicite pour un cas qui n'a rien modifié.
- Chaque `UPDATE` vérifie `changes === 1`, garantissant qu'aucune écriture indistincte ou partielle (0 ou plusieurs lignes) ne passe inaperçue.

Le patron de test existant « rolls the whole aggregate back when activity insertion fails » (pour `create()`) est repris et adapté pour `update()` — voir §6.2.

---

## 5. Fichiers concernés

| Fichier | Statut | Contenu |
|---|---|---|
| `src/domain/sessions/SessionDraft.ts` | Modifié | Ajout de `toSessionDraft` |
| `src/domain/sessions/SessionRepository.ts` | Modifié | Ajout du type `UpdateSessionOutcome` et de la méthode `update` à l'interface |
| `src/infrastructure/database/repositories/SqliteSessionRepository.ts` | Modifié | Implémentation de `update` ; ajout du paramètre de constructeur `now` (utilisé aussi par `create`) |
| `src/features/sessions/SessionService.ts` | Modifié | Ajout de `updateSession`, export de `UpdateSessionResult` |
| `src/domain/sessions/__tests__/SessionDraft.test.ts` | Modifié | Tests de `toSessionDraft` |
| `src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts` | Modifié | Tests de `update`, y compris le test de persistance sur fichier (§6.2) |
| `src/infrastructure/database/testing/NodeSqliteDatabase.ts` | Modifié | Ajout minimal d'une ouverture sur fichier réel (voir §6.2) — `close()` déjà existant |
| `src/features/sessions/__tests__/SessionService.test.ts` | Modifié | Tests de `updateSession` |
| `src/domain/README.md`, `src/features/sessions/README.md`, `src/infrastructure/database/README.md` | Modifiés | Refléter la nouvelle capacité |

**Aucune migration** (`migration001.ts` non modifié, aucun nouveau fichier `migrationNNN.ts`). **Aucun fichier sous `app/`. Aucune nouvelle dépendance** (le test de persistance sur fichier n'utilise que `node:sqlite`, déjà en usage, et les modules intégrés `node:fs`/`node:os`/`node:path` pour gérer un fichier temporaire).

---

## 6. Tests prévus

### 6.1 Domaine — `toSessionDraft` (`SessionDraft.test.ts`)

- Conversion exacte : une `Session` complète produit un `SessionDraft` dont les 7 champs correspondent exactement.
- Round-trip : `toCreateSessionInput(toSessionDraft(session))` réussit et produit un `CreateSessionInput` équivalent aux champs d'origine.
- Consigne `null` correctement reportée.

### 6.2 Infrastructure — `SqliteSessionRepository.update` (`SqliteSessionRepository.test.ts`)

- **Mise à jour réussie de tous les champs modifiables** : créer, modifier (nom, couleur, phases, nom/durée/consigne d'Exercice), relire, comparer chaque champ ; résultat `{ status: "UPDATED", session }`.
- **Conservation des identifiants** : `session.id`, `cycle.id`, `tour.id`, `cycle.tour.exercise.id` identiques avant/après.
- **Conservation de `ownerId`/`createdAt`** : identiques avant/après.
- **Renouvellement de `updatedAt`** : en injectant une horloge factice (`now: () => string`, deux valeurs distinctes contrôlées) via le nouveau paramètre de constructeur, le test devient déterministe — plus de dépendance au temps réel écoulé entre deux appels.
- **Ciblage précis de l'Activité** : vérifier par une lecture SQL directe que seule la ligne `activities` correspondant à l'identifiant attendu a été modifiée (`updated_at` changé), et qu'aucune autre ligne n'a été touchée — cohérent avec le ciblage `WHERE id = ? AND session_id = ?`.
- **`changes === 1` respecté** : test indirect via l'absence d'erreur sur le chemin nominal ; un test dédié peut vérifier qu'une tentative de mise à jour sur une base délibérément incohérente (ex. activité manuellement supprimée par SQL direct alors que la session existe toujours) déclenche l'exception de garde plutôt qu'un succès silencieux.
- **Identifiant absent** : `update()` sur un id inconnu renvoie `{ status: "NOT_FOUND" }` ; `SELECT COUNT(*) FROM sessions` inchangé.
- **Séance archivée** : passer une session en `status='ARCHIVED'` par une requête SQL directe (aucun autre moyen n'existe aujourd'hui) puis appeler `update()` → `{ status: "ARCHIVED" }`, contenu de la ligne strictement inchangé, aucune écriture.
- **Validation invalide avant écriture** : `update()` avec un `CreateSessionInput` invalide → `SessionValidationError` levée, ligne `sessions`/`activities` inchangée (`updated_at` non renouvelé) — démontrant que la validation précède toute lecture d'existence côté Repository également (défense en profondeur).
- **Rollback complet sur erreur intermédiaire** : variante du patron `FailingActivityInsertDatabase` déjà utilisé pour `create()`, adaptée pour faire échouer le second `UPDATE` (`activities`) après le premier (`sessions`) — vérifier qu'après l'erreur, une relecture montre les valeurs **d'avant** la tentative sur les deux tables.
- **Relecture incohérente provoque un rollback interne** : test simulant une relecture finale qui ne correspond pas à ce qui vient d'être écrit (via un Repository factice enveloppant qui altère la réponse de la relecture) — vérifier que l'exception est levée et que rien n'est resté écrit en base.

**Test de persistance sur fichier SQLite temporaire — nouveau, remplace l'interprétation « légère » précédemment proposée :**

```ts
it("persists an update durably across a connection close and reopen", async () => {
  const filePath = path.join(os.tmpdir(), `kodjo-t01s04-${crypto.randomUUID()}.db`);
  try {
    const writer = NodeSqliteDatabase.openFile(filePath);
    await migrateDatabase(writer);
    const repository = new SqliteSessionRepository(writer, uuidFactory());
    const created = await repository.create(validInput());
    const outcome = await repository.update(created.id, { ...validInput(), name: "Nom modifié" });
    expect(outcome.status).toBe("UPDATED");
    writer.close();

    const reader = NodeSqliteDatabase.openFile(filePath); // même fichier, nouvelle connexion
    const rereadRepository = new SqliteSessionRepository(reader);
    const reread = await rereadRepository.findById(created.id);
    expect(reread?.name).toBe("Nom modifié");
    reader.close();
  } finally {
    fs.rmSync(filePath, { force: true }); // suppression sûre, y compris si le test a échoué avant
  }
});
```

- **Étapes couvertes** : création, mise à jour, fermeture de la connexion, réouverture du **même fichier**, relecture et vérification, fermeture et suppression sûre du fichier dans un `finally`.
- **Extension minimale de `NodeSqliteDatabase`** : une méthode statique `openFile(path: string): NodeSqliteDatabase`, construite comme `openInMemory()` mais avec un chemin réel passé à `DatabaseSync` (`node:sqlite` accepte un chemin de fichier, pas seulement `:memory:`) ; `close()` existe déjà.
- **Aucune dépendance supplémentaire** : uniquement `node:sqlite` (déjà utilisé), `node:fs`, `node:os`, `node:path`, `node:crypto` — tous des modules intégrés à Node, disponibles dans l'environnement Jest actuel (`jest-expo`, exécuté sur Node), sans lien avec un appareil ou un simulateur.
- Ce test remplace la relecture sur la même connexion comme preuve de durabilité réelle au niveau du fichier SQLite, pas seulement de cohérence en mémoire.

### 6.3 Application — `SessionService.updateSession` (`SessionService.test.ts`)

Avec `FakeSessionRepository` étendu d'une méthode `update` factice (`jest.fn()`), sans dépendance SQLite :
- Brouillon invalide → `repository.update` jamais appelé, résultat `{ status: "INVALID", violations }`.
- Brouillon invalide **avec un `sessionId` qui n'existe pas** → résultat toujours `{ status: "INVALID", violations }`, jamais `NOT_FOUND` — démontrant explicitement l'ordre de traitement décidé en §2.3.
- Brouillon valide, Repository résout `{ status: "UPDATED", session }` → `repository.update` appelé une fois avec l'entrée normalisée, résultat retourné tel quel.
- Repository résout `{ status: "NOT_FOUND" }` → résultat retourné tel quel, pas d'exception.
- Repository résout `{ status: "ARCHIVED" }` → résultat retourné tel quel, pas d'exception.
- Repository rejette avec `SessionValidationError` (défense en profondeur improbable) → propagée telle quelle.
- Repository rejette avec une erreur technique → propagée telle quelle.

### 6.4 Non-régression globale

Les 73 tests existants (Domaine, `SqliteSessionRepository`, `SessionService`, i18n, migration) doivent rester verts après les ajouts ; le total attendu après T01-S04 sera annoncé dans le rapport d'implémentation, pas anticipé ici.

---

## 7. Critères d'acceptation

- `toSessionDraft` est une fonction pure du Domaine, sans import React/SQLite, testée pour l'exactitude et le round-trip.
- `SessionRepository.update` renvoie un résultat métier discriminé (`UPDATED`/`NOT_FOUND`/`ARCHIVED`) — **aucune exception dédiée à l'archivage n'existe**. `SessionValidationError` reste la seule exception structurée, levée uniquement en défense en profondeur pour une entrée invalide passée directement au Repository. Toute autre exception est une erreur technique non capturée.
- `SessionService.updateSession` renvoie `{ status: "INVALID", violations }` sans jamais appeler le Repository lorsque le brouillon est invalide — y compris lorsque l'identifiant cible n'existe pas, conformément à l'ordre de traitement documenté.
- `SqliteSessionRepository.update` : aucune écriture pour `NOT_FOUND`/`ARCHIVED` ; identifiants `Session`/`Cycle`/`Tour`/`Activité` et `ownerId`/`createdAt` strictement préservés ; `updatedAt` renouvelé sur les deux tables via l'horloge injectée ; l'`UPDATE` de l'activité cible son identifiant exact et son `session_id`, jamais une clause indistincte ; chaque `UPDATE` vérifie `changes === 1` ; la structure T01 est vérifiée avant écriture ; la relecture finale et sa validation de cohérence se font **à l'intérieur** de la transaction, toute incohérence y déclenchant un `ROLLBACK` complet.
- Le constructeur de `SqliteSessionRepository` accepte un troisième paramètre optionnel `now`, utilisé par `create()` et `update()`, sans casser aucun appel existant.
- Un test de persistance sur fichier SQLite temporaire (création, modification, fermeture, réouverture, relecture, suppression sûre) démontre la durabilité réelle, pas seulement la cohérence en mémoire.
- **Aucune migration**, aucune nouvelle dépendance, aucune classe `SessionArchivedError`.
- Tous les tests prévus en §6 passent ; `npx jest --no-cache --coverage=false`, `npx tsc --noEmit --incremental false`, `npx eslint . --no-cache`, `git diff --check` réussissent.
- Aucun écran, composant React, route, modification Figma, catégorie, ni fonctionnalité de duplication/archivage (écriture)/restauration/suppression. Le statut `ARCHIVED` n'est créé, dans toute la suite de tests, que par une requête SQL directe dans le test dédié à ce cas — aucune fonction applicative ne l'écrit.
- Aucune modification des fonctions de `calculations.ts` (`computeActivityCount`, `computeEstimatedDurationSeconds`, etc.) — non concernées par cette sous-étape.

---

## 8. Frontières (hors périmètre strict de T01-S04)

- Aucun écran, composant React, route Expo Router, modification de maquette Figma.
- Aucune nouvelle dépendance.
- **Aucune nouvelle table ni colonne** : le schéma actuel couvre déjà tout ce dont T01-S04 a besoin.
- Aucune catégorie (ni lecture, ni écriture).
- Aucune fonctionnalité de duplication, d'archivage (l'écriture du statut `ARCHIVED`), de restauration ou de suppression — `update()` ne fait que *lire* le statut pour décider s'il doit rejeter la modification, il ne l'écrit jamais.
- Aucune gestion de plusieurs Activités, aucune position `BEFORE_TOUR`/`AFTER_TOUR`.
- Câblage réel de `SessionService`/`SqliteSessionRepository` dans un point d'entrée applicatif : hors périmètre, affecté à T01-S05.

---

## 9. Points restant notés pour mémoire

Les arbitrages précédemment ouverts sont désormais tranchés par les décisions ci-dessus (§2.2 à §2.4). Deux points mineurs restent notés, sans bloquer l'implémentation :

### 9.1 Dépendance de « UPDATE en place » à l'invariant T01 (inchangé)

La recommandation repose sur le fait qu'aucun champ de `cycles`/`tours` n'est éditable en T01. Cette hypothèse est correcte **aujourd'hui** mais devra être révisée dès qu'une tranche future rendra le nombre de répétitions du Tour éditable ou introduira plusieurs Activités — non traité ici, noté pour mémoire.

### 9.2 Erreurs techniques toujours non enveloppées (rappel, hérité de T01-S03)

`updateSession` suit la même philosophie que `createSession` : aucune erreur technique n'est enveloppée dans un type applicatif dédié. Ce point, déjà signalé et non tranché à l'issue de T01-S03, reste ouvert et n'est pas rouvert spécifiquement par ce plan.

---

## 10. Séquence validée de la tranche T01

Enregistrée telle que communiquée, pour référence dans les sous-étapes suivantes :

- **T01-S04** (ce plan) — modification persistante.
- **T01-S05** — initialisation applicative et chargement SQLite.
- **T01-S06** — Catalogue.
- **T01-S07** — Composition.
- **T01-S08** — Exercice.
- **T01-S09** — Catégories et enregistrement.
- **T01-S10** — réouverture, modification et validation de bout en bout.

---

## 11. Articulation avec T01-S05

T01-S04 complète la couche applicative avec la capacité d'écriture manquante (`updateSession`), en plus de la lecture déjà disponible depuis T01-S03 (`getSession`). T01-S05 (« initialisation applicative et chargement SQLite ») pourra alors :

1. **Câbler l'instanciation réelle** de `ExpoDatabase` → `SqliteSessionRepository` → `SessionService` dans un point d'entrée unique consommé par le layout racine Expo Router (première fois qu'un fichier sous `app/` sera concerné dans cette tranche).
2. **Déclencher `migrateDatabase`** au démarrage de l'application, avant toute utilisation du Repository.
3. **Exposer `SessionService`** aux futurs écrans (probablement via un contexte React minimal ou un module partagé), sans réintroduire de logique métier dans React.
4. Ce n'est qu'à partir de T01-S06 (Catalogue) que `listActiveSessions`/`getSession` auront un consommateur visuel, et à partir de T01-S07/T01-S08 (Composition/Exercice) que `createSession`/`updateSession`, `createEmptyDraft`/`createExerciseDraft`/`toSessionDraft` seront réellement exercés par une interface.

Aucun de ces points n'est implémenté ni anticipé dans T01-S04 : cette sous-étape se limite strictement au Domaine, à `SessionRepository`/`SqliteSessionRepository` et à `SessionService`, comme demandé.

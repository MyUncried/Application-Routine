# Plan technique consolidé — V2-BILAT-01

## Verdict et bornes

- Mode : `PLAN_ONLY`
- Révision applicative analysée : `04a15580f65d2b3702776447c3574dee988e5b83`
- Baseline documentaire corrigée : `7e4f6984a8aefb6018e908e183dd7dda56e2482d`
- Décision migrations : **fermée**
  - `migration004` = T02-S02, `DATABASE_VERSION = 4`
  - `migration005` = `V2-BILAT-01`, `DATABASE_VERSION = 5`
  - `migration006` = T03 Exécution/Résultats, `DATABASE_VERSION = 6`
- Implémentation : **non autorisée**
- Verdict de planification : `PLAN_READY_FOR_INDEPENDENT_REVIEW`

La baseline documentaire et la révision applicative sont volontairement distinctes : le code est planifié depuis `04a155…`, tandis que les exigences corrigées proviennent de `7e4f698…`.

## 1. Constat de l’existant

### Domaine et brouillon

- `src/domain/sessions/Session.ts` : `Activity`, le Tour et les DTO ne portent aucun côté.
- `src/domain/sessions/SessionDraft.ts` : aucun réglage de côté ; les conversions, l’égalité et l’état modifié devront le préserver.
- `src/domain/sessions/defaults.ts` et `validation.ts` : aucun défaut ni validation des trois valeurs.
- `src/domain/sessions/composition.ts` : `duplicateActivity` copie les propriétés par étalement, mais aucune résolution propre/effective ni transition atomique du Tour.
- `src/domain/sessions/calculations.ts` : les fonctions de durée et de Séries ignorent `L = 1 | 2`.

### Présentation

- `src/features/sessions/compositionPresentation.ts` : synthèses sans bilatéralité.
- `CompositionScreen.tsx` : Tour sans contrôle `Côtés` ni confirmation.
- `ExerciseScreen.tsx` : aucun contrôle `Côtés` ni état hérité désactivé.
- `src/shared/i18n/resources/fr.ts` : aucun libellé correspondant.

### Persistance

- `DATABASE_VERSION = 4`.
- Le runner de migrations s’arrête à `migration004`.
- `migration004.ts` appartient définitivement à T02-S02 et reste intouchable.
- Le repository SQLite et ses types ne lisent ni n’écrivent `side_mode`.
- Aucun repository d’Activité de catalogue n’existe : il ne doit pas être créé ici.

### Source documentaire corrigée

Le chapitre 12 fixe : `004/T02-S02/v4`, `005/V2-BILAT-01/v5`, `006/T03/v6`, les trois `sideMode`, la persistance `side_mode`, la priorité du Tour et la séparation avec `executionSide`.

## 2. Affectation des exigences

- `BIL-001–007` : modèle, libellés, cycle, défaut, trois modes, Tour.
- `BIL-008–009` : non-régression ; aucune latéralisation des Récupérations techniques ou Zones.
- `BIL-010–024` : configuration, calculs et synthèses uniquement ; aucun passage d’Exécution.
- `BIL-025–031` : héritage du Tour, confirmation, remise atomique, résolution effective, désactivation et absence de restauration.
- `BIL-032` : duplication d’Activité conserve le côté.
- `BIL-033` : aucune duplication de Tour n’existe ou n’est définie ; ne pas la créer. Une future duplication devra conserver le côté.
- `BIL-034–048` : réservés à T03.
- `BIL-049–052` : persistance dans les Activités de Séance ; catalogue, insertion depuis catalogue et copie de Séance non inventés.
- `BIL-053–054` : modèles Activité et Tour.
- `BIL-055–056` : Plan et Résultat réservés à T03/`migration006`.
- `BIL-057–058` : tranche actuelle.
- `BIL-059–060` : séparation T03.

## 3. Périmètre exhaustif

### À créer

- `src/domain/sessions/sideMode.ts`
- `src/domain/sessions/__tests__/sideMode.test.ts`
- `src/features/sessions/SideModeControl.tsx`
- `src/features/sessions/__tests__/SideModeControl.test.tsx`
- `src/infrastructure/database/migrations/migration005.ts`

### À modifier

- `src/domain/sessions/Session.ts`
- `src/domain/sessions/SessionDraft.ts`
- `src/domain/sessions/defaults.ts`
- `src/domain/sessions/validation.ts`
- `src/domain/sessions/calculations.ts`
- `src/domain/sessions/composition.ts`
- `src/domain/sessions/index.ts`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/compositionPresentation.ts`
- `src/shared/i18n/resources/fr.ts`
- `src/infrastructure/database/constants.ts`
- `src/infrastructure/database/migrateDatabase.ts`
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts`
- `src/infrastructure/database/types/DatabaseRows.ts`
- les tests existants correspondants sous `src/domain/sessions/__tests__`, `src/features/sessions/__tests__` et `src/infrastructure/database/__tests__`.

### À supprimer

Aucun fichier.

### Intouchables

- `migration001.ts` à `migration004.ts`
- manifestes historiques
- fichiers d’Exécution, Historique, Instantané et Résultat.

## 4. Plan séquencé

1. **Source de vérité** — créer `SideMode`, valeurs, multiplicateur, cycle, résolution effective et transition pure du Tour.
2. **Modèle/brouillon** — ajouter les champs Activité/Tour/DTO, défauts, réhydratation, égalité et conversions.
3. **Validation** — accepter uniquement les trois valeurs, sans notion « latéralisable » ni dépendance aux Zones.
4. **Migration 005** — ajouter `activities.side_mode` et `tours.side_mode`, `NOT NULL DEFAULT 'UNILATERAL'`, passer à v5, sans donnée T03.
5. **Repository** — étendre requêtes, écritures et mappings ; conserver la transaction parent/enfants.
6. **Calculs** — appliquer la formule canonique, l’arrondi, les bornes, les Récupérations et empêcher le double multiplicateur.
7. **Contrôle Activité** — contrôle partagé, trois libellés, accessibilité, trois modes, visible/désactivé sous Tour bilatéral.
8. **Tour** — contrôle et confirmation ; Annuler sans effet ; Confirmer avec remise atomique des enfants ; aucune restauration.
9. **Duplication/mouvements** — conserver le côté de l’Activité ; normaliser à `UNILATERAL` lors de l’entrée sous un Tour bilatéral ; ne pas créer de duplication de Tour.
10. **Synthèses** — durée globale des côtés et direction du Tour appliquée une seule fois, sans concept d’Exécution.

## 5. Tests obligatoires

- valeurs, cycle, multiplicateur, priorité, remise atomique, absence de restauration ;
- duplication et déplacement ;
- trois modes, formules `L=1/L=2`, arrondi, bornes, Récupération, absence de double multiplicateur ;
- migration v4→v5, installation v0→v5, versions supportées, défaut, valeurs invalides, rejeu idempotent, absence de colonnes T03, rollback ;
- repository create/read/update ;
- libellés/accessibilité, contrôle désactivé, confirmation Annuler/Confirmer, sauvegarde/réouverture, synthèses ;
- Jest complet, TypeScript, lint, scope ;
- inspection manuelle limitée aux contrôles Activité/Tour et à la confirmation.

## 6. Critères essentiels

| Exigence | Preuve |
|---|---|
| Modèle exact | Tests `SideMode` + TypeScript |
| Défaut historique | Tests `migration005` |
| Persistance | Tests repository |
| Duplication | Test `duplicateActivity` |
| Priorité du Tour | Tests `resolveEffectiveSideMode` |
| Confirmation atomique | Tests écran + rollback |
| Enfants | Rendu visible/désactivé |
| Calculs | Table `L=1/L=2`, arrondi, bornes, Récupération |
| Pas de double multiplicateur | Test Activité sous Tour bilatéral |
| Séparation T03 | Aucun fichier Exécution/Résultat, aucune `execution_side` en v5 |
| Historique | Aucun changement migrations 001–004 ou manifestes |

## 7. Risques et questions

Risques encadrés : formule historique de Pause terminale, atomicité parent/enfants, double multiplicateur, migration contrainte, déplacement dans un Tour bilatéral.

Aucune question métier bloquante. Catalogue d’Activités, insertion depuis catalogue, copie de Séance et duplication de Tour restent hors périmètre et ne doivent pas être inventés.

## 8. Scope autorisé proposé

- `src/domain/sessions/**`
- `src/features/sessions/**`
- `src/infrastructure/database/constants.ts`
- `src/infrastructure/database/migrateDatabase.ts`
- `src/infrastructure/database/migrations/migration005.ts`
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts`
- `src/infrastructure/database/types/DatabaseRows.ts`
- tests SQLite correspondants
- `src/shared/i18n/resources/fr.ts`

Exclusions absolues : migrations 001–004, Exécution, Historique et manifestes clôturés.

`PLAN_READY_FOR_INDEPENDENT_REVIEW`

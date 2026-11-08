# PRE9-SUPERSET-LIMITE — Superset limité à deux Exercices dans la Composition

## Identifiant et objectif

- **Mission** : PRE9-SUPERSET-LIMITE (recette du 08/11/2026 au soir).
- **Demande de Hermann (08/11/2026), verbatim** : « Superset : il est possible dans le circuit de la composition de séance d'ajouter un troisième exercice, ça ne doit pas être autorisé. »
- **Objectif** : trouver tous les chemins par lesquels un Circuit issu du Format Superset peut recevoir un troisième Exercice dans la Composition, et les interdire de façon cohérente avec les refus existants, sans créer d'autre règle.

## Branche et commit de départ

- Branche : `feat/pre9-catalogues-cartes-badge-20261106`.
- Commit de départ : `7cc8d6b9` (arbre propre au départ).
- Consigne : ne pas committer, ne pas pousser. Un autre agent travaille en parallèle sur le même arbre (buy-in / buy-out multiples : `formatModels.ts`, `formatReedit.ts`, `FormatModelScreen.tsx`, ch07, référence Formats, `06 – Ecrans…`, `formatTimeline.ts`) ; ses modifications ne font pas partie de cette mission.

## Périmètre demandé / réellement traité

- Demandé : règle écrite (deux mouvements ?), classe A/B, tous les chemins d'entrée d'un troisième membre, interdiction cohérente, tests qui échouent sans la correction, ch07 et référence Formats, rapport.
- Traité : tout ce qui précède. Ni Figma, ni migration, ni `FormatModelScreen.tsx`, ni `formatModels.ts` / `formatReedit.ts` n'ont été touchés.

## Constats

### Règle écrite — classe B

La règle écrite **autorisait** le troisième Exercice :

- référence Formats §9.4 (complément du 5 novembre ; recopié en ch13) : « Après l'enregistrement, le Circuit est un Circuit standard : un troisième Exercice peut y être ajouté depuis la Composition » ; paragraphes « Réouverture » (« y compris un troisième ajouté depuis la Composition ») et « Troisième membre ajouté depuis la Composition » ;
- résumé « Superset — cible du 5 novembre » (INDEX, PRODUCT, Composition-conteneurs, ch04, ch07, ch08, ch10, ch11) : « Réouverture avec les membres actuels, y compris un troisième ».

Seule la création était limitée à deux (questionnaire : « + Ajouter » désactivé, message « Deux exercices au maximum », ch07 l. 1545). La demande de Hermann remplace donc une règle écrite : **classe B (évolution validée)**.

### Chemins d'entrée d'un membre dans un Circuit (inventaire)

Un Superset est un Circuit de la disposition générale (Modèle d'origine `SUPERSET`, `circuit.format` nul) ; il n'existe jamais dans l'ancien modèle (`legacyFromStructure` renvoie `null` dès qu'un Circuit porte un Modèle d'origine, `structure.ts`).

| Chemin | Avant | Après |
|---|---|---|
| Glisser une carte venue d'ailleurs (Séance, Cycle, autre Circuit, autre Superset), Superset déployé (`layoutDropCandidates` / `resolveLayoutDrop`) | emplacements proposés, dépose acceptée | **aucun emplacement proposé** dans un Superset à deux ; la carte va à l'emplacement admis le plus proche (comme les emplacements interdits par le buy-in) |
| Glisser au-dessus d'un Superset **replié** (fin seule, déploiement à l'arrêt) | fin proposée, ouverture du Circuit | fin non proposée, pas de déploiement |
| Dépose effective (`moveLayoutItem`) | appliquée | **refusée sans altération** (`REFUSED` / `MEMBER_LIMIT`, garde du domaine) |
| « Monter » / « Descendre » (VoiceOver, `stepLayoutItem`) | la carte entrait dans le Superset | **le Superset est franchi** (même traitement que `PASSAGE_FIXED`) |
| « Dupliquer » un membre (`duplicateLayoutExercise`, copie insérée dans le même Circuit) | troisième membre créé | **refusé** (`MEMBER_LIMIT`) ; bouton du balayage **grisé** (`disabled`, `accessibilityState.disabled`), action accessible « Dupliquer » retirée |
| Déplacement vers un Circuit (`moveExerciseToCircuit`, opération de domaine, utilisée par les tests seulement) | appliqué | **refusé** (`MEMBER_LIMIT`) |
| Nouvel Exercice (menu Créer, catalogue, création de mouvement : `insertIntoRichLayout`) | déjà placé **hors** d'un Circuit issu d'un format (recette du 04/11/2026, constat a) | inchangé — test de non-régression ajouté |
| Mode enveloppe « Ajouter un circuit » / « Ajouter un cycle », extension d'un périmètre (`envelopeCandidates`, `wrapSpansInContainers`) | ne fait entrer aucun contenu dans un Circuit existant (contenus éligibles : Exercices libres, Circuits pour un Cycle) | inchangé, non concerné |
| Dupliquer un Circuit entier (`duplicateLayoutCircuit`) | copie de deux membres | inchangé, non concerné |
| Remplacer un Exercice, changer de Rôle, réordonner les membres | nombre de membres inchangé | inchangé |
| Réouverture du format (`FormatModelScreen`) | « + Ajouter » déjà désactivé à deux | inchangé (fichier hors périmètre) |

### Historique (règle CLAUDE.md « Diagnostic historique ») — non applicable

Ce n'est pas une régression : le comportement était conforme à la règle écrite du 05/11 (§9.4) et la demande la change. Pas de dernier succès / premier échec à comparer.

## Modifications réalisées

Liste `PRESERVE / CHANGE / FORBIDDEN` :

- **PRESERVE** : réordonnancement interne d'un Circuit, sortie et suppression d'un membre, toutes les règles de dépose existantes (imbrication, buy-in / buy-out, Rôles, Points d'arrêt, adaptation au N), insertion des nouveaux Exercices, mode enveloppe, duplication de Circuit, Circuits autres que Superset.
- **CHANGE** : entrée d'un membre supplémentaire dans un Superset à deux.
- **FORBIDDEN** : Figma, migrations, `FormatModelScreen.tsx`, `formatModels.ts`, `formatReedit.ts`.

Fichiers :

- `src/domain/sessions/circuitMemberLimit.ts` (nouveau) : `SUPERSET_MEMBER_LIMIT = 2`, `circuitMemberLimit`, `circuitAtMemberLimit`, `entryExceedsMemberLimit`.
- `src/domain/sessions/layoutMoves.ts` : refus `MEMBER_LIMIT` (type `LayoutItemMoveRefusal`) dans `moveLayoutItem` ; franchissement dans `stepLayoutItem` ; refus dans `duplicateLayoutExercise`.
- `src/domain/sessions/layoutOperations.ts` : refus `MEMBER_LIMIT` dans `moveExerciseToCircuit`.
- `src/features/sessions/layoutDrop.ts` : `withoutFullCircuits` — emplacements d'un Circuit plein retirés pour un Exercice non membre ; un Point d'arrêt saisi (repère fictif absent de la disposition) n'est pas concerné.
- `src/features/sessions/CompositionScreen.tsx` : prop `canDuplicate` de `CompositionActivityRow` (bouton grisé, désactivé, action accessible retirée), calculée dans `LayoutExerciseRow` ; style `activityRowDuplicateLabelDisabled` (`colors.disabled`, couleur des actions indisponibles existantes).
- `src/shared/i18n/resources/fr.ts` : `layoutMove.refused.MEMBER_LIMIT` = « Deux exercices au maximum dans un Superset » (reprend le message du questionnaire ; annoncé seulement à VoiceOver, et en pratique jamais atteint puisque l'emplacement n'est pas proposé — formulation à valider).
- Tests (nouveaux) : `src/domain/sessions/__tests__/supersetLimit.recette0811.test.ts`, `src/features/sessions/__tests__/layoutDrop.supersetLimit.test.ts`, `src/features/sessions/__tests__/CompositionScreen.supersetLimit.test.tsx`.
- Documentation (classe B, texte d'origine conservé, annotations datées) :
  - ch07 : nouvelle section « Recette du 08/11/2026 au soir — Superset limité » (demande verbatim, classe, cause, correction, À clarifier), juste avant « Catalogues, cartes et validation des modales — 5 et 6 novembre 2026 » ; annotation du résumé « Superset — cible du 5 novembre » (l. 1616) ;
  - référence Formats §9.4 : « Deux mouvements à la création » (formulation remplacée), « Réouverture », « Troisième membre ajouté depuis la Composition » ;
  - ch13 (copie du §9.4) : mêmes trois paragraphes ;
  - résumé « Superset — cible du 5 novembre » : INDEX, PRODUCT, KODJO-Composition-conteneurs, ch04, ch08, ch10, ch11.
  - Non modifiés : `docs/sources/**`, `docs/archives/**`, `docs/preparation/**` (sources figées), scénario de contrôle « Superset rouvert avec trois membres » (ch10, toujours valable pour un Superset antérieur).

## Preuves et tests

- Tests ciblés (après correction) : `npx jest src/domain/sessions/__tests__/supersetLimit.recette0811.test.ts src/features/sessions/__tests__/CompositionScreen.supersetLimit.test.tsx src/features/sessions/__tests__/layoutDrop.supersetLimit.test.ts --testPathIgnorePatterns "\.claude" -w 2` → **3 suites, 26 tests PASS**.
- Sans la correction (règle neutralisée temporairement : `circuitMemberLimit` ne renvoyait jamais de maximum, fichier restauré ensuite) : **16 échecs, 10 réussites** (les réussites sont les témoins : Circuit standard, réordonnancement, Superset à un membre, Point d'arrêt saisi, non-régression d'insertion).
- `npx tsc --noEmit` : **aucune erreur**.
- `npx eslint` sur les fichiers touchés : **12 erreurs, toutes `react-hooks/refs` antérieures** dans `CompositionScreen.tsx` (l. 1164, 1186, 2620, 2621, 4915 — aucune sur les lignes modifiées) ; aucune erreur dans les autres fichiers.
- `npx jest src/domain/sessions --testPathIgnorePatterns "\.claude" -w 2` → **40 suites, 866 tests PASS**.
- `npx jest src/features/sessions/__tests__/CompositionScreen src/features/sessions/__tests__/layoutDrop --testPathIgnorePatterns "\.claude" -w 2` → **24 suites, 630 tests PASS** (aucun échec ; avertissements `act(...)` habituels du harnais).

## Hypothèses non démontrées

- Le « Superset » est identifié par le Modèle d'origine `SUPERSET` du Circuit (`originModel`, posé par `buildModelElements`). Un Circuit dont le Modèle d'origine aurait été effacé ne serait plus limité ; aucun chemin connu ne l'efface.
- Tous les membres du Circuit sont comptés (deux membres au plus), y compris un éventuel contenu qui ne serait pas de type Exercice.

## À CLARIFIER (non décidé, non inventé)

1. **Superset existant à trois Exercices** (créé avant cette règle, la règle du 05/11 l'autorisait) : laissé tel quel — réordonnable, réductible, jamais agrandi ; réouverture du format inchangée. Faut-il le signaler, bloquer son enregistrement ou le corriger ?
2. **Nombre minimal dans la Composition** : un membre peut toujours sortir ou être supprimé et laisser un Superset d'un seul Exercice (le minimum de deux n'est écrit que pour le questionnaire). Faut-il l'interdire ?
3. **Message** « Deux exercices au maximum dans un Superset » : annonce VoiceOver seulement, formulation à valider ; aucun message visible n'est affiché pendant le glisser (comme pour les emplacements interdits par le buy-in).

## Vérifications restant à faire sur iPhone

- Glisser une carte de la Séance (ou d'un autre Circuit / Cycle) vers un Superset à deux, déployé puis replié : aucune place ne s'ouvre dans le Superset, le Superset replié ne se déploie pas, la carte se pose hors de lui.
- Réordonner les deux membres du Superset par glisser : toujours possible ; sortir un membre : possible, puis une autre carte peut y entrer.
- Balayer un membre du Superset : « Dupliquer » grisé, sans effet ; « Supprimer » actif. Membre d'un Circuit standard : « Dupliquer » actif.
- VoiceOver : « Monter » / « Descendre » d'une carte voisine franchit le Superset ; l'action « Dupliquer » n'est pas proposée sur ses membres.
- Ajouter un Exercice (menu Créer) quand le dernier Exercice affiché est dans un Superset : il se place après le Superset.

## Synchronisation code / documentation

Classe **B** — sources mises à jour : référence Formats §9.4, ch13, ch07 (nouvelle section + annotation), résumés INDEX / PRODUCT / Composition-conteneurs / ch04 / ch08 / ch10 / ch11. Aucune correction préparée non appliquée.

## Fichiers modifiés (par cette mission)

- `src/domain/sessions/circuitMemberLimit.ts` (nouveau)
- `src/domain/sessions/layoutMoves.ts`
- `src/domain/sessions/layoutOperations.ts`
- `src/features/sessions/layoutDrop.ts`
- `src/features/sessions/CompositionScreen.tsx`
- `src/shared/i18n/resources/fr.ts`
- `src/domain/sessions/__tests__/supersetLimit.recette0811.test.ts` (nouveau)
- `src/features/sessions/__tests__/layoutDrop.supersetLimit.test.ts` (nouveau)
- `src/features/sessions/__tests__/CompositionScreen.supersetLimit.test.tsx` (nouveau)
- `docs/KODJO-Formats-entrainement-2026-11-02.md`, `docs/INDEX.md`, `docs/PRODUCT.md`, `docs/KODJO-Composition-conteneurs-2026-10-28.md`
- `docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md`, `07 – Registre des décisions de conception.md`, `08 – Conception fonctionnelle détaillée.md`, `10 – Processus métier et règles métier transverses.md`, `11 – API fonctionnelles.md`, `13 – Contrats d’écran.md`
- `.github/orchestration/reports/2026-11-08_PRE9-SUPERSET-LIMITE.md` (ce rapport)

## Commit final et état Git

- **Aucun commit** : consigne explicite de la mission (« NE COMMITTE PAS, NE POUSSE PAS »). Le rapport et les modifications restent dans l'arbre de travail, non indexés ; le commit (avec ce rapport) reste à faire par l'appelant, de préférence séparément des modifications de l'autre agent (buy-in multiples).
- HEAD inchangé : `7cc8d6b9`. État Git : modifications non indexées listées ci-dessus, mêlées dans l'arbre à celles de l'autre agent (`formatTimeline.ts`, `FormatModelScreen.tsx`, `FormatModelScreen.c3.test.tsx`, `06 – Ecrans…`, parties « buy-in » de ch07 / référence Formats / ch08, rapport `2026-11-08_PRE9-BUYIN-MULTIPLES.md`, `formatModels.buyinMultiples0811.test.ts`).

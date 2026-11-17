# 2026-11-10 — CATALOGUE-AUTONOME — CA-3 : registre d'installation et services de chargement

## Identifiant et objectif

- **CATALOGUE-AUTONOME, tranche CA-3** : préparer les états, les décisions et les services du chargement d'un catalogue autonome. Le registre d'installation est placé dans une base SQLite distincte.
- L'interface relève de CA-4.
- Autorisation de Hermann (10/11), verbatim :
  > « Je valide les trois propositions pour CA-3, avec les précisions suivantes. 1. Base SQLite : conserver provisoirement kodjo-catalogue-registry.db, indépendante de la base principale. Son intégration éventuelle sera réévaluée après PRE-10, sans engagement automatique. Garantir la cohérence et la reprise après interruption, sans complexité excessive. 2. Conflits : conserver systématiquement les modifications locales et reporter la nouvelle révision. Aucun écrasement, refus ou remplacement automatique. La décision appartient au destinataire. 3. Acceptation : procéder fiche par fiche. Présenter systématiquement un résumé des changements avant acceptation, y compris lorsqu'il n'existe aucun conflit. La comparaison détaillée champ par champ doit être accessible à la demande et permettre d'identifier précisément les conflits. Le suivi doit couvrir toutes les propriétés éditoriales, pas uniquement les champs de Movement. Pour CA-3, préparer les états, les décisions et les services nécessaires. L'interface utilisateur correspondante relève de CA-4. Ne pas ajouter de mécanisme de fusion automatique. L'administration Web OVH reste inchangée dans cette tranche. Tu peux développer CA-3 dans le worktree catalogue indépendant, avec les tests nécessaires. Ne modifie pas PRE-10, ne lance aucune build ou OTA et ne fusionne rien dans main. Présente les résultats de qualification avant de passer à CA-4. »

## Branche et commit de départ

- `catalogue/integration-60-main-20261109`, worktree `C:/Dev/KODJO-CAT60-MAIN`.
- Départ : `7684cec1`.

## Périmètre

- **Traité** :
  - classification pure (états, résumé, comparaison détaillée, conflits) ;
  - registre SQLite distinct ;
  - service de chargement (`prepare`, `accept`, `defer`, `refuse`, reprise après interruption) ;
  - lecture fraîche des Mouvements locaux ;
  - tests purs et sur SQLite réelle ;
  - CI de branche ;
  - spécification.
- **Non traité** :
  - écran et raccordement à l'application (CA-4) ;
  - retrait du corpus embarqué (CA-5) ;
  - recette iPhone (CA-6) ;
  - administration Web OVH, inchangée.

## Réalisation

| Unité | Rôle | Réemploi |
|---|---|---|
| `src/domain/catalogue/catalogueLoadPlan.ts` | Classification **pure** de chaque fiche : 10 états, empêchements, résumé systématique, comparaison détaillée de toutes les propriétés éditoriales, conflits sur les 5 champs projetés, proposition `DEFER` en conflit | `projectSheetToMovement`, `sheetFingerprint`, `canonicalJson` (exporté de CA-1), `normalizeMovementName`, `decodeInstructionSteps` |
| `src/infrastructure/catalogue/SqliteCatalogueRegistry.ts` | Registre dans `kodjo-catalogue-registry.db` : 4 tables, `user_version` = 1, transactions exclusives | Interface `Database`, `withExclusiveTransactionAsync` |
| `src/infrastructure/catalogue/openCatalogueRegistry.ts` | Ouverture de la base distincte (utilisée en CA-4) | `openExpoDatabase`, `STANDARD_PRAGMAS` |
| `src/features/catalogue/CatalogueLoadService.ts` | `prepare` (validation, reprise, plan, sans écriture de Mouvement), `accept` (choix explicite par champ en conflit), `defer`, `refuse`, `recoverInterrupted` | `parseMovementCatalogueFile`, `MovementCatalogueService.createIndependent` et `update` |
| `src/features/catalogue/readLocalMovements.ts` | Lecture des Mouvements locaux dans une transaction | `MovementCatalogueService.listEntries` sur le `SqliteMovementRepository` de la transaction |

Aucune dépendance nouvelle, aucune migration ni modification de la base principale, aucun fichier de `src/infrastructure/database`, `src/domain/activities` ou `src/features/activities` modifié.

### Décisions mises en œuvre

- **Aucune fusion automatique**.
  - `prepare` n'écrit aucun Mouvement.
  - Toute écriture résulte d'un `accept` explicite sur **une** fiche.
  - En conflit, `accept` sans choix pour chaque champ concerné renvoie `RESOLUTION_REQUIRED` et n'écrit rien.
  - `KEEP_LOCAL` sur tous les conflits met à jour le registre seul.
  - `TAKE_INCOMING` sauvegarde d'abord la valeur locale au registre.
- **Modifications locales conservées** : un champ modifié localement et non par le fichier garde sa valeur. Médias, phases, famille et archivage locaux ne sont jamais modifiés.
- **Résumé systématique** (`summary`), même sans conflit, et **comparaison détaillée** à la demande (`comparison`) sur toutes les propriétés : provenance, contenu, classification, sources, validation, médias.
- **Cohérence et reprise après interruption**, sans transaction commune entre les deux bases :
  - l'écriture d'un Mouvement est précédée d'une opération en cours inscrite au registre, puis confirmée en une transaction ;
  - au chargement suivant, ce qui a été écrit est confirmé et ce qui ne l'a pas été est abandonné, sans écriture de Mouvement ;
  - une décision est recalculée sur l'état courant (`freshItem`), jamais sur un plan ancien.

## Constat pendant le développement (preuve conservée)

Le test « connexion principale en retard » (double de l'incident iPhone du 9/11) a **échoué** dans la première version : juste après l'installation d'une fiche, `prepare` la classait `WITHDRAWN_LOCALLY` au lieu de `UP_TO_DATE` (Received `"WITHDRAWN_LOCALLY"`).

Sur iPhone, ce défaut aurait :
- affiché à tort « retirée localement » ;
- pu faire abandonner une opération à reprendre.

Correction : `freshLocalMovementReader` exécute la lecture dans une transaction, avec le service existant. Le test passe depuis. C'est le même mécanisme que le correctif de la PR #436.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx jest src/domain/catalogue/__tests__/catalogueLoadPlan.test.ts` | PASS, 16 tests (classification pure) |
| `npx jest src/features/catalogue` | PASS, 13 tests (SQLite réelle, deux bases) |
| `npx jest --runInBand src/domain/catalogue src/features/catalogue tools/catalogue` | PASS, 79 tests |
| Non-régression : importeur actuel, commande, Catalogue, repository Mouvement, migrations, schéma, catalogue (25 suites) | PASS, 333 tests |
| `npx tsc --noEmit` ; `npx eslint` (catalogue) | OK |
| `git merge-tree origin/main HEAD` | sans conflit |
| Fichiers en commun avec `origin/pre10-bmad/dev` | aucun |

Scénarios couverts sur SQLite réelle :
1. **CA-6 (1)** : pilote sur une base contenant les 60 Mouvements → 60 `ADOPTABLE`, puis 60 `ADOPTED`. La base principale est **identique octet pour octet** (toutes les tables comparées).
2. **CA-6 (2)** : rechargement → 60 `UP_TO_DATE`, aucune écriture dans aucune des deux bases.
3. **CA-6 (3)** : fichier édité (une fiche révisée, une fiche créée directement dans le fichier) :
   - 59 `UP_TO_DATE`, 1 `NEW_REVISION`, avec un résumé (étapes modifiées, une source modifiée) et sans conflit ;
   - 1 `NEW`, installée sous un nouvel identifiant ;
   - la révision est **reportée** (reproposée, avec la marque de report), puis **refusée** (écartée, `accept` → `NOT_APPLICABLE`, Mouvement intact) ;
   - la révision 3 est **acceptée** (`UPDATED`, décisions levées) ; un nouveau chargement donne tout `UP_TO_DATE`.
4. **Modification personnelle sans conflit** : l'alias local est conservé, et la nouvelle étape est appliquée.
5. **Conflit** sur les étapes :
   - `RESOLUTION_REQUIRED` ; aucune écriture ;
   - `KEEP_LOCAL` → registre seul, consigne locale intacte ;
   - révision suivante + `TAKE_INCOMING` → Mouvement mis à jour et valeur locale sauvegardée au registre.
6. **Mouvement archivé** : `WITHDRAWN_LOCALLY`, aucune écriture.
7. **Interruption après l'écriture du Mouvement** : reprise → confirmée, pas de doublon.
8. **Interruption avant l'écriture du Mouvement** : reprise → abandonnée, fiche de nouveau `NEW`.
9. **Perte du registre** : pilote `ADOPTABLE` de nouveau ; la fiche installée sous un identifiant aléatoire et la fiche révisée passent `TO_RECONCILE`, avec un conflit explicite ; aucune écriture.
10. **Connexion principale en retard** : installation puis classification correctes.
11. **Fichier invalide** (catalogue publiable avec un propriétaire inconnu) : refusé en entier, aucune lecture ni écriture.
12. **Registre** : base distincte, schéma versionné, réouverture idempotente, version future refusée, base principale inchangée.
13. **Projection installée** = projection de la fiche.

Tests purs : un test par cas du plan (§ 5), plus la convergence, le report et le refus par révision, les empêchements, l'ordre des Zones (indifférent) et l'ordre des étapes (significatif), et une fiche absente du fichier jamais proposée à la suppression.

## Hypothèses non démontrées

- Le comportement sur iPhone n'est pas démontré : expo-sqlite réel, deux fichiers de base, interruption réelle de l'application. Il sera vérifié en recette CA-6, après CA-4.
- Le double « connexion en retard » reproduit l'incident observé le 9/11 ; il ne prouve pas l'absence d'autres effets de concurrence d'expo-sqlite.

## Synchronisation code / documentation

Classe **B** (décision explicite de Hermann du 10/11, recopiée).

- `docs/KODJO-Format-catalogue-mouvements-v1.md` :
  - nouveau § 9 « Chargement d'un catalogue (CA-3) », avec la décision verbatim, le registre, les états, le résumé et la comparaison, et les décisions ;
  - § 8 annoté.
- Plan, révision 2, § 6 : CA-3 annoté comme développé.
- Aucune règle fonctionnelle d'écran existante n'est modifiée ; Figma est inchangé ; l'écran relève de CA-4.

## Hors périmètre / non corrigé

- CA-4 (écran « Charger un catalogue »), CA-5, CA-6.
- Administration Web OVH : inchangée.
- Intégration du registre au schéma principal : à réévaluer après PRE-10, sans engagement.
- Export ou sauvegarde du registre : tranche future (plan, § 5).
- PR #436 : en attente de la validation de la build `6987d086` sur iPhone.

## Vérifications restant à faire sur appareil réel

- CA-6, après CA-4 : les trois chargements de la recette (pilote → 60 adoptés ; rechargement → rien ; fichier édité → une installation et une révision, testée en accepter / refuser / reporter, avec une modification personnelle préservée), plus une interruption réelle pendant un chargement.

## Fichiers modifiés

- `src/domain/catalogue/catalogueLoadPlan.ts` (nouveau)
- `src/domain/catalogue/__tests__/catalogueLoadPlan.test.ts` (nouveau)
- `src/domain/catalogue/MovementCatalogueFile.ts` (export de `canonicalJson`)
- `src/infrastructure/catalogue/SqliteCatalogueRegistry.ts` (nouveau)
- `src/infrastructure/catalogue/openCatalogueRegistry.ts` (nouveau)
- `src/features/catalogue/CatalogueLoadService.ts` (nouveau)
- `src/features/catalogue/readLocalMovements.ts` (nouveau)
- `src/features/catalogue/__tests__/CatalogueLoadService.sqlite.test.ts` (nouveau)
- `.github/workflows/kodjo-catalogue-import-recette.yml` (tests CA-3)
- `docs/KODJO-Format-catalogue-mouvements-v1.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PLAN.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-CA3.md`

## Commit final et état Git

Commit de livraison de CA-3 contenant ce rapport, poussé sur `catalogue/integration-60-main-20261109` ; hash et CI communiqués dans le compte rendu de session. Aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`.

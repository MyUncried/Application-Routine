# PRE-3 — Seconde revue indépendante du plan corrigé (opération #340)

Rapport machine : [2026-10-09_revue-passe2-claude.json](2026-10-09_revue-passe2-claude.json)

| Élément | Valeur |
|---|---|
| Révision revue | `c0c900f50879ea955c7ca1b1a5f5961eb949c438` (tête de branche au départ : `aa004d19`, sans changement dans `passe2/`) |
| SHA-256 du manifeste | `04505e969144e9660c8afab4cb1a2e3cc2d0d50800e467eb47ff8ac98a4deb22` |
| Intégrité | `verifier-passe2.cjs` **PASS**, 1626 contrôles (worktree détaché, sans conversion CRLF) |
| Verdict | **REVISE** — 11 RESOLVED, 2 OPEN, 2 régressions causées par les corrections |

Ce verdict ne valide pas le plan au nom du propriétaire et n'autorise aucun développement. Les tests cités sont des obligations futures. Aucun code applicatif n'est présenté comme testé.

## Résultat par constat

| Constat | Statut | Preuve principale |
|---|---|---|
| FND-22dc | RESOLVED | 10 assertions INTERACTION (FUNCTIONAL, FUNCTIONAL_TEST) ; `INTERACTION/wheel` ↔ `SwiftUI.Picker.wheel`, confirmé par le blob de `DurationWheelPicker.tsx` |
| FND-2aa5 | RESOLVED | Valeurs d'acceptation séparées (`001..008`, `reps 100`, `count 99`, `402 x 36 / separator 330`, `alpha 0.34`, `touch 44`) ; Décision A respectée. Résidus typographiques dans le texte du plan, §9 l.75-76 |
| FND-45a2 | RESOLVED | 85 FUNCTIONAL / 5 PRESERVATION REQUIRED / 3 DATA / 2 UI, plus 8 MIGRATION et 1 DATA canonique |
| FND-50bc | RESOLVED | 8 migrations SQLite réelles ; 13 fixtures identiques à l'oracle, recalculées à la main ; 276 phrases identiques à l'oracle (texte, gras, montant) |
| FND-50fd | RESOLVED | 156/156 blobs identiques aux objets Git de `1ddfb6d1` ; aucun importeur direct sans observation |
| FND-5b6a | **OPEN** | 10 obligations par surface, mais 8 d'entre elles ont exactement le même attendu : le contrôle agrégé est simplement recopié |
| FND-6bcf | RESOLVED | `reference_policy` : métadonnées vectorielles et de compositing en contexte de source ; contour et forme rendus comparés sur PNG |
| FND-8b2f | RESOLVED | `calculations.test.ts` et 5 autres suites en ADAPT, avec une attente de conservation |
| FND-aa97 | RESOLVED | Scan indépendant : 146 importeurs directs des cibles MODIFY, tous couverts (ADAPT ou RUN_EXISTING) |
| FND-c3c9 | **OPEN** | La feuille ne teste plus que son rendu, mais les propriétaires sont attribués par scope et non par assertion (REG-01), et les propriétaires i18n/tokens sont de nouveaux fichiers parallèles (REG-02) |
| FND-d9a6 | RESOLVED | REQ-30b44b8b → P3-14/P3-12, rendu en P3-20 ; capture 6423-9953 consultée ; les 41 frames restent liées à P3-20 |
| FND-f5a1 | RESOLVED | 71 intents identiques à la source ; tokens et i18n réécrits pour leur propre fichier ; aucune géométrie de feuille ailleurs |
| FND-f86f | RESOLVED | `P3-14/inverse-explicit` sur `executionCalculations.test.ts` : plus proche, égalité vers N supérieur, message conditionnel. Réserve : T et P à expliciter |

## Régressions causées par les corrections

**REG-01 — propriétaires de tests attribués par scope (causalité démontrée).** Les obligations réécrites donnent à chaque assertion tous les tests de son scope, au lieu des `proposedTestPaths` de la source. Ces chemins sont pourtant conservés à l'identique dans `requirements.json#/assertions` : 51 assertions sur 59 divergent.

Conséquences :
- **Preuves SQLite retirées.** P3-15/no-storage et P3-03/reference-retired (toutes deux PRESERVATION REQUIRED), P3-16/failure-doubletap, P3-18/copy-complete, P3-05/equal-variable, P3-06/commit-hidden, P3-08/restoration-N1 et P3-23/file-preservation perdent leurs tests de repository réels.
- **Attentes de rendu chez des non-propriétaires.** Elles sont placées dans des tests Domaine, de stepper ou de roulette : P3-15/long-phrase sur `executionPhrase.test.ts`, P3-19/exclusive-scroll sur `ProfileStepper.test.ts`, P3-20/sheet-specific sur les sélecteurs.

Correction attendue : propriétaire = `proposedTestPaths` de chaque assertion.

**REG-02 — tests i18n/tokens parallèles (causalité démontrée).** `src/shared/i18n/__tests__/index.test.ts` et `src/shared/ui/__tests__/tokens.test.ts` sont créés par la seconde passe. Or les vrais propriétaires existent à la baseline et restent NO_CHANGE : `src/shared/i18n/index.test.ts` et `src/shared/ui/__tests__/tokensSpecification.test.ts` (contrat tokens ↔ chapitre 12).

Correction attendue : passer ces deux suites existantes en ADAPT, et ne pas créer les deux nouveaux fichiers.

## Correction minimale pour FND-5b6a

Donner un attendu propre à chaque surface, à partir des sources existantes :
- **Médias :** Retirer/Monter/Descendre accessibles, états Importation et erreur annoncés, Réessayer atteignable.
- **Stepper :** rôle ajustable, incrément/décrément et valeur courante.
- **Roulette :** valeur annoncée par la primitive native.
- **Feuille ✓/✕ :** message nommant la Série incomplète, focus placé sur la correction.
- **Catégorie / Zones :** état sélectionné, Ajouter désactivé sans message d'erreur.

## Limites

- **Aucune exécution.** Aucun code, appareil ou navigateur n'a été lancé, et aucune preuve visuelle n'est déclarée.
- **Figma.** Une seule capture PNG a été consultée. `ui-elements.json` a été revu par sa structure, pas élément par élément.
- **Évaluations natives.** Les quatre évaluations AVAILABLE ne sont pas énumérées dans le dossier.
- **Scan des imports.** Il repose sur des expressions régulières : ni les accès dynamiques ni les écritures SQL ne sont couverts.
- **Vérificateur sous Windows.** `verifier-passe2.cjs` signale une fausse dérive lorsque `core.autocrlf=true`.

Le détail figure dans le rapport JSON.

# 2026-10-09 — PRE3-340-PASSE2-REVUE-CLAUDE

## Identifiant et objectif

- Mission : seconde revue indépendante du plan technique PRE-3 corrigé (opération #340), définie par `docs/preparation/PRE-3/planification/passe2/mission-claude.md`.
- Objectif : vérifier les corrections des 13 constats initiaux et publier un rapport JSON et sa synthèse sous `passe2/reviews/`.
- Type : revue sans correction. Aucun fichier applicatif modifié, aucun développement lancé.

## Branche et commit de départ

- Branche : `plan/pre3-vnext-20261008`.
- Révision revue : `c0c900f50879ea955c7ca1b1a5f5961eb949c438` (commit exact demandé).
- Tête distante au départ et à la publication : `aa004d19a324fe068b048bb31de3fa39735aa665`. Elle ne fait qu'ajouter un renvoi dans `plancontract-publie.md` ; le diff sur `passe2/` est vide.
- Worktree détaché distinct, dans le dossier temporaire de session. `C:\Dev\Application-routine` n'a pas été modifié.

## Périmètre demandé / réellement traité

- **Demandé :** les 13 constats exacts, plus les régressions causées par leurs corrections. Pas de revue globale, pas de décision produit.
- **Traité :** les 13 constats et deux régressions causales (REG-01, REG-02). Aucune autre zone n'a été rouverte.

## Constats

- Verdict : **REVISE**.
- **RESOLVED (11) :** FND-22dc, FND-2aa5, FND-45a2, FND-50bc, FND-50fd, FND-6bcf, FND-8b2f, FND-aa97, FND-d9a6, FND-f5a1, FND-f86f.
- **OPEN (2) :**
  - FND-5b6a : attendus d'accessibilité identiques sur 8 surfaces sur 10.
  - FND-c3c9 : propriétaires de tests incorrects.
- **REG-01 :** obligations de test attribuées par scope et non par assertion ; 51 assertions sur 59 divergent de la source. Des preuves SQLite sont retirées d'exigences PRESERVATION et DATA.
- **REG-02 :** propriétaires i18n/tokens créés en fichiers parallèles (`src/shared/i18n/__tests__/index.test.ts`, `src/shared/ui/__tests__/tokens.test.ts`), alors que les suites baseline existent : `src/shared/i18n/index.test.ts` et `src/shared/ui/__tests__/tokensSpecification.test.ts`.

## Preuves et tests

- `node docs/preparation/PRE-3/planification/passe2/verifier-passe2.cjs` → PASS, 1626 contrôles. Manifeste SHA-256 : `04505e969144e9660c8afab4cb1a2e3cc2d0d50800e467eb47ff8ac98a4deb22`.
- **Incident d'intégrité :** un premier worktree, créé avec `core.autocrlf=true`, a échoué (« Dossier drift: baseline-blobs.json »). Cause démontrée : conversion CRLF au checkout ; les objets Git ont exactement les SHA du manifeste. Le worktree a été recréé sans conversion.
- **Blobs baseline :** décodés hors dépôt. Les 156 blobs ont été vérifiés contre `git ls-tree` et `git cat-file` à `1ddfb6d1`.
- **Fixtures :**
  - les 13 fixtures numériques sont identiques à `attendus-numeriques.json` et ont été recalculées à la main ;
  - les 276 phrases sont identiques à `attendus-phrases-276.json`.
- **Scan indépendant des imports** à la baseline : 146 importeurs directs des cibles MODIFY, tous couverts par une obligation.
- **Diff de propriété des tests :** pour chaque assertion, comparaison entre `assertions-recette.json` et les obligations de passe2.
- **Capture Figma** `6423-9953.png` consultée.
- **Tests applicatifs :** non applicables. La mission est une revue de plan et le développement n'est pas autorisé.

## Hypothèses non démontrées

- Les quatre évaluations natives AVAILABLE de l'UIContract historique ne sont pas énumérées dans le dossier ; leur rattachement n'est vérifié qu'au niveau du champ.
- La causalité de REG-01 est établie par rapport à la source figée (`assertions-recette.json`), car les obligations du PlanContract initial ne sont pas matérialisées dans le dossier.

## Modifications réalisées

Documentaires uniquement :
- `docs/preparation/PRE-3/planification/passe2/reviews/2026-10-09_revue-passe2-claude.json` (rapport machine) ;
- `docs/preparation/PRE-3/planification/passe2/reviews/2026-10-09_revue-passe2-claude.md` (synthèse) ;
- ce rapport de mission.

## Éléments non corrigés / hors périmètre

- **Corrections du plan :** aucune n'est appliquée ; la mission l'interdit. Le pilote ChatGPT reprend les constats.
- **Observations hors nouveaux constats** (détail dans le JSON) :
  - `ProfileStepper.test.ts`, chemin hérité du plan initial ;
  - résidus typographiques de séparateurs dans le récit du plan, §9 ;
  - faux positif CRLF de `verifier-passe2.cjs` sous Windows.
- **Diagnostic historique VNext :** non applicable, car il ne s'agit pas d'un échec de parcours VNext.

## Vérifications restant à effectuer sur appareil réel

Aucune pour cette revue. Les vérifications sur appareil prévues par le plan (photothèque, VoiceOver, maintien, redémarrage) relèvent du développement futur.

## Fichiers modifiés

Les trois fichiers listés dans « Modifications réalisées ».

## Commit final et état Git

- **Commit :** commit documentaire unique sur `plan/pre3-vnext-20261008`, parent `aa004d19`. Son hash est communiqué dans la réponse de clôture, car il ne peut pas figurer dans le fichier qu'il contient.
- **Publication :** push en avance rapide uniquement, sans réécriture de l'historique.
- **Worktree de revue :** propre après le commit.

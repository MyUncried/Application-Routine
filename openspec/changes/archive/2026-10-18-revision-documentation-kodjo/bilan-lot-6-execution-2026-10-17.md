# Bilan — lot 6, exécution de la restructuration documentaire (17/10/2026)

## Objectif

Exécuter le lot 6 selon `lot6/plan-restructuration.md`, après la validation par Hermann des décisions QR-1 à QR-9 (option C révisée ; QR-8 : restructuration immédiate). Les étapes documentaires s'enchaînent, avec contrôles, commit et push après chacune, sur `docs/openspec-revision` seulement. Aucun merge dans `main`.

## Branche et commits

| Élément | Valeur |
|---|---|
| Départ | `cefc9b99` (= `origin/docs/openspec-revision`, vérifié) |
| Commits | `3789f1de` (6B) → `444e5822` → `cc5c6ff2` → `2cf0b27a` → `a23770be` → `681babf6` → `7b43cb7c` → `4b6c2c3c` → `c2625d02` → `383bdeeb` → `ff9fd738` → `4d6d9722` → `aa9cd0bd` (6K), puis le commit de ce bilan |
| `main` | `6656fefc`, inchangé ; aucun merge |
| PR | #363 `d2386c8d`, #370 `6cf3634a` et #371 `2c050d0e` inchangées ; conflits de fusion simulés consignés dans le rapport de conservation |

## Livrables

- **Documentation restructurée :** `docs/Specifications-fonctionnelles/`, soit les 13 chapitres et 3 annexes. S'y ajoutent `docs/INDEX.md` ; `docs/PRODUCT.md` (§ 13) ; `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md` (renvoi) ; 1 lien dans `docs/DSF-CIRCUITS-CONTROLES-2026-10-12.md`.
- **Matrice de correspondance actualisée :** [lot6/correspondance-actualisee.tsv](lot6/correspondance-actualisee.tsv). Elle donne la place, le titre, l'ancre et l'état de chacune des 998 sections. Elle est publiée dans la documentation sous la forme de l'annexe « Correspondance des sections ».
- **Rapport de conservation :** [lot6/rapport-conservation-lot6.md](lot6/rapport-conservation-lot6.md).
- **Dossier d'arbitrage groupé :** [lot6/arbitrages-lot6.md](lot6/arbitrages-lot6.md).
- **Journaux d'étape :** `lot6/execution/`.

## Constats et preuves

- **Contrôle final contre la base, C1 à C7 : réussi.**
  - Identifiants : les 782 sont conservés ; D-402 est justifié.
  - Lignes : 7 015 lignes distinctes, 0 absente.
  - Registre : 393 décisions inchangées.
  - Portée, autorité, références : 0 écart.
- **Placement :** 998 sections sur 998 sont à leur place.
- **Liens :** 2 anomalies historiques, inchangées.
- **Rédaction :** 157 corrections, 0 non rédactionnelle.
- **Design tokens :** rangs identiques. Le test n'a pas été exécuté, faute de Jest dans ce clone.
- **Validation OpenSpec :** stricte, réussie.
- **Affectations corrigées pendant l'exécution :** 7 règles, détaillées dans le rapport de conservation. L'une a été déclenchée par un échec réel de C1 sur les RM-FMT pendant un essai à blanc ; il a été corrigé avant l'exécution.

## Hypothèses non démontrées

- Le rapport de revue sur les affectations de défauts structurels n'était pas disponible dans le dépôt. Les corrections faites découlent du réexamen ; elles sont à confronter à ce rapport.
- La lecture du résultat a été échantillonnée (plans des ch. 06, 08, 10 et 13, renvois, sommaires), pas exhaustive.

## Hors périmètre ou non fait

Voir le rapport de conservation, § « Ce qui n'a pas été transformé » :
- 214 lignes de R-06 ;
- alias de version ;
- RM-131 et ch. 08 l. 1573 (en attente des PR) ;
- autres DSF ;
- matrice besoin → règle → contrat → recette et rubriques « Règles applicables » ;
- corrections rédactionnelles non mécaniques ;
- rapprochement des copies partielles ;
- 204 divergences à arbitrer.

Ni le code, ni Figma, ni `.github/`, ni les autres clones, ni les copies figées PRE-4 (`docs/preparation/**`) n'ont été modifiés.

## État Git

Push sur `docs/openspec-revision` uniquement. Les 4 ZIP non suivis de `openspec/changes/` restent hors commit.

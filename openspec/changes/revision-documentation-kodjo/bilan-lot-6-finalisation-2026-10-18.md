# Bilan — finalisation du lot 6 (17–18/10/2026)

## Objectif

Terminer la fiabilisation de la documentation restructurée au lot 6, après la revue ChatGPT (PARTIELLEMENT CONFORME). Six axes : identifiants, duplications, contradictions, traçabilité, qualité rédactionnelle, DSF et sources transverses. Il fallait aussi préparer l'intégration des PR concurrentes, mener un contrôle final indépendant et produire le dossier de conformité.

## Branche, départ, état de reprise

- **Branche :** `docs/openspec-revision`.
- **Départ :** `e8afc61b` (= `origin/docs/openspec-revision`, vérifié).
- **`main` :** `6656fefc`, inchangé ; aucun merge.
- **PR :** #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e` (brouillon), toutes ouvertes et inchangées ; aucune n'a été modifiée ni commentée.
- **Commits :** voir [rapport final](lot6/finalisation/rapport-final-conformite.md) §1 (F1 à F8, puis le commit de ce bilan). Le SHA final est communiqué en fin de session.
- **Reprise :**
  - corrections : `constats/FIN-*-applique.json` (dans l'ordre du §4 du rapport) ;
  - écarts : `lot6/finalisation/ecarts/` ;
  - contrôles : `lot6/finalisation/controles/` ;
  - pour un nouveau lot, `outils/appliquer-finalisation.mjs` puis `outils/controler-finalisation.sh <nom> HEAD <json>`.

## Périmètre

**Traité :** les six axes et les PR concurrentes, avec la seconde passe indépendante. Voir le rapport final §2 à §4.

**Hors périmètre, non modifiés :**
- code, `.github/`, workflows, EAS, Figma, BMAD et VNext ;
- les copies figées de PRE-4 et PRE-5 (`docs/preparation/**`) et les autres clones ;
- `openspec/specs/` ;
- l'archivage du change.

## Constats et preuves

- **R-06 :** 214 lignes examinées ; 10 restaurations prouvées par Git ; aucune restauration incertaine appliquée.
- **Copies :** sur 170 éléments, 61 remplacements par un renvoi, uniquement en cas d'équivalence complète.
- **Divergences :** 204 paires, dont 125 résolues par une décision explicite et 48 en arbitrage.
- **Contradictions encore actives :** 22 trouvées par la seconde passe, dont 20 corrigées et 2 en arbitrage.
- **Conservation :**
  - de bout en bout depuis `cefc9b99`, vérifiée : identifiants, lignes, registre, portée, autorité, références ;
  - depuis `e8afc61b` : les 578 corrections sont rejouées exactement.
- **Liens et noms Unicode :** liens conformes (2 mentions historiques connues) ; noms Unicode conservés ; OpenSpec `--strict` réussi.

## Hypothèses non démontrées

- La vérification sémantique repose sur des agents en lecture seule. Elle couvre l'ensemble des alignements fonctionnels (127), mais seulement un échantillon des déplacements (40 sur 262).
- La recherche des contradictions actives procède par mots-clés : elle n'est pas exhaustive.
- Les rattachements PROBABLE ne sont pas confirmés.

## Modifications

- **Documents produit :** les 13 chapitres ; l'annexe historique ; une nouvelle annexe générée, « Matrice de traçabilité » ; PRODUCT.md, INDEX.md, README.md ; 3 DSF (renvois de transfert).
- **Change :**
  - `tasks.md` ;
  - `lot6/arbitrages-lot6.md`, réécrit ;
  - `lot6/correspondance-actualisee.tsv`, colonne `finalisation` ;
  - `lot6/finalisation/**` ;
  - `constats/FIN-*` ;
  - outils : `appliquer-finalisation`, `annuler-corrections`, `controler-finalisation`, `justifier-corrections`, `justifier-transitif`, `verifier-hors-chapitres`, `reporter-pr`, `tracabilite` ;
  - corrections de `verifier-conservation`, `verifier-corrections-json` et `verifier-redaction`.

## En attente

- Revue indépendante finale.
- Arbitrages AR-01 à AR-26 et points AD-01 à AD-10.
- Report des PR : 11 blocs à reporter à la main.
- Coordination du signalement à la PR #371.
- Fusion dans `main` : sur décision de Hermann, après revue et résolution des dépendances Git.

# Rapport de conformité — intégration de la spécification v3.0 des paramètres d’exécution

- **Branche** : `docs/openspec-revision`. **Départ** : `b6ca2321` (lot 6 finalisé, F9). **Change** : `integration-parametres-execution-v3`.
- **Source** : [spécification v3.0 du 18/10/2026](source/KODJO_Charge_Specification_2026-10-18.md), SHA-256 `9670dc09759459a5214223a348bd632306b5f6b9eb25f56209938929f9d60c30`, lue intégralement (CH-01 à CH-09, CO-01, CA-01, DU-01, CV-01, AR-01, GR-01, RO-01, PR-01 à PR-05, AC-01 à AC-26, §11.2, §11.3, §12).
- **Statut** : intégration terminée et contrôlée ; **non close** avant la revue indépendante ChatGPT. Rien n’est fusionné dans `main`, le change n’est pas archivé.

## 1. Ce qui a été fait

| Étape | Résultat | Fichiers |
|---|---|---|
| Décisions | D-403 à D-413 au registre, section « Paramètres d’exécution — décisions du 18 octobre 2026 » (ancre `parametres-execution-20261018`). Chaque décision nomme ce qu’elle remplace ; les exclusions de §11.3 sont listées en tête de section | ch. 07 |
| Règles | RM-235 à RM-250, seule source normative des règles nouvelles, section « Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026 » | ch. 10 |
| Décisions remplacées | Statut complété pour 17 décisions (D-143, D-148, D-149, D-151, D-154, D-219, D-247, D-249, D-251, D-308, D-321, D-339, D-341, D-377, D-384, D-396, D-397) ; texte des décisions inchangé (C4) | ch. 07 |
| Propagation | 341 corrections dans 25 fichiers : ch. 01 à 13, 10 DSF, PRODUCT, INDEX. Les autres chapitres citent les RM et D par identifiant | [corrections/](corrections/), [constats/](constats/) |
| Captures | 20 frames actuelles de la feuille exportées sans retouche (402 × 874) dans `images/parametres-2026-10-18/` ; elles remplacent au ch. 06 les 19 états du 12/10 et du 13/10 (4 frames n’existent plus ; anciennes images conservées pour les matrices datées) | ch. 06 |
| Index | B-092, D-403 à D-413, RM-235 à RM-250 ajoutés à l’annexe générée « Index des identifiants » ([outils/completer-index.mjs](outils/completer-index.mjs)) | annexe |
| Couverture | 90 éléments : 67 intégrés, 9 partiels, 1 restant, 9 exclus (§11.3), 4 écarts Figma signalés | [matrice-couverture.md](matrice-couverture.md) |

### Choix d’intégration

1. **Concepts conservés, libellés visibles remplacés** : « Ordre des côtés », « Bip de cadence » et « Durée totale » restent les noms des concepts (titres, ancres, calculs) ; les libellés visibles deviennent Enchainement, Cadence et Durée de l’exercice (PR-01, DU-01). Le texte « Durée totale : » de la phrase de synthèse n’est pas modifié (Q-V3-13).
2. **Côtés** : choix anatomique supprimé, bilatéralité Avec / Sans, « côté 1 / côté 2 » dans les phrases, l’exécution et les annonces ; séquences de calcul D1…G3 réécrites en prose, sans nouvelle notation ; données D→G / G→D lues Avec.
3. **Charge** : exception explicite, propre à la charge, à l’absence de correction silencieuse et à la convention stepper/roulette (D-405) ; conservation des valeurs désactivées, propre à la charge (D-403).
4. **Phases** : non introduites (PR #370). Les points CV-01, GR-01 et RO-01 qui les concernent sont décidés au registre et marqués partiels.
5. **Points non tranchés par la spécification** : énoncé de ce qui est décidé et renvoi au [dossier de questions](questions-hermann.md), sans règle inventée.

## 2. Contrôles

Résultat complet : [controles/FINAL.txt](controles/FINAL.txt), lancé par [outils/controler.sh](outils/controler.sh) depuis `b6ca2321`.

| Contrôle | Résultat |
|---|---|
| Rejeu exact | OK : 341 corrections rejouées sur `b6ca2321` donnent exactement l’état des 25 fichiers ; aucun fichier modifié hors corrections déclarées |
| Conservation C1–C7 | CONSERVATION VÉRIFIÉE : 7 124 lignes distinctes, 0 absente, 307 justifiées par une correction et sa décision ; nouveaux identifiants justifiés ([justifications-identifiants.tsv](justifications-identifiants.tsv)) ; C4 (texte des 394 décisions) 0 ; C5 portée 0 ; C6 autorité 0 ; C7 références 0 |
| C4 adapté | La copie [outils/verifier-conservation-v3.mjs](outils/verifier-conservation-v3.mjs) compare la seule colonne Décision : la mention « remplacée par » dans la colonne Statut est exigée par la gouvernance. Le contrôle du lot 6 est inchangé |
| Rédaction (C10) | OK (aucune correction de motif REDACTION) |
| Liens | 82 fichiers, 2 mentions historiques admises (inchangées) ; 104 liens ajoutés vérifiés un à un (fichier et ancre) |
| K1 (rangs des tokens), K2 (noms des chapitres) | Identiques ; aucun token modifié |
| OpenSpec `--strict` | Les deux changes sont valides |
| Formulations résiduelles | Plus aucune prescription active de D→G/G→D, « Côté droit/gauche », chevron indépendant, stepper Bip, « Inverser D/G » ; les occurrences restantes sont des mentions de compatibilité, d’historique ou de retrait |
| Unicode | Apostrophes typographiques dans le texte ajouté ; les apostrophes droites restantes appartiennent à des titres et ancres existants |
| PR #363, #370, #371 | Correctifs recalculés ; `git apply --check` réussi sur l’état final, seul et en séquence ([dependances-pr.md](dependances-pr.md)) |

**Limites des contrôles**
- La conservation prouve qu’aucune ligne ne disparaît sans correction déclarée. Elle ne prouve pas l’équivalence de sens : celle-ci repose sur la relecture des blocs (propositions d’agents relues avant application).
- L’annexe « Matrice de traçabilité » n’est pas régénérée : l’outil du lot 6 ne reconnaît pas les règles écrites en titres et retirerait RM-235 à RM-250 des contrats. Les lignes « Règles applicables » des contrats ont été complétées à la main.
- Aucune recette applicative n’est exécutée : il s’agit d’une mise à jour documentaire.

## 3. Figma (lecture seule, non modifié)

43 frames de modales listées, 25 inspectées ; 16 scénarios de §11.2 retrouvés ; 21 frames d’exécution examinées ; 25 captures du ch. 06 comparées (16 obsolètes, 4 supprimées, 5 à jour). Écarts : voir [questions-hermann.md](questions-hermann.md#écarts-figma-relevés-lecture-seule-figma-non-modifié) — notamment « A la cible » sans accent partout, libellé mixte « A la cible età l’échec », clavier sans séparateur décimal, frame de phase sur une cellule variable, « Côté droit » dans l’exécution, charge en exécution et saisie de charge commune non illustrées.

## 4. Points résiduels

- **Questions Q-V3-01 à Q-V3-18** pour Hermann, dont les plus structurantes : place de la charge dans la phrase (Q-V3-01), formulations côté 1 / côté 2 (Q-V3-02), contrôle des cellules Pause/Répétitions sans pied ± (Q-V3-05), roulette Répétitions en séries identiques (Q-V3-06), lecture « segmentés » de D-413 (Q-V3-14).
- **PR #370** : passages des phases à adapter à D-410, D-412 et D-413 lors du report ; **PR #371** : deux phrases sur le pied commun à retirer.
- **Revue indépendante ChatGPT** avant toute fusion ; fusion dans `main` sur décision de Hermann.

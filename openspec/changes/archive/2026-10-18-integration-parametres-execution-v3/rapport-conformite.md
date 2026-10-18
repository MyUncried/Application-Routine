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
| Couverture | 101 éléments (après les §5 à §7) : 86 intégrés, 2 partiels (tokens de la feuille, chantier DSF), 9 exclus (§11.3), 4 écarts Figma signalés | [matrice-couverture.md](matrice-couverture.md) |

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

- **Questions** : toutes arbitrées le 18/10/2026 (§5 et §6). Coordinations : tokens avec le chantier DSF (Q-V3-10), phases avec le chantier #370 (Q-V3-17), corpus de recette v15 des phrases (Q-V3-02).
- **PR #363, #370, #371** : intégrées et fermées (§7).
- **Revue indépendante ChatGPT** avant toute fusion ; fusion dans `main` sur décision de Hermann.

## 5. Arbitrages de Hermann du 18/10/2026 (seconde version)

| Question | Décision | Effet documentaire |
|---|---|---|
| Q-V3-01 | D-414 : `(charge : 20 kg)`, `(charges : 20, 12, 13 kg)`, `(charges : 20, 12 kg, ...)`, aucune mention sans charge | RM-240 réécrite ; grammaire v15 (ordre et ligne de tableau) ; CE-UI-10 rendu de la phrase ; recettes CE-UI-10 et CE-T03-04 |
| Q-V3-04 | D-415 : à N = 1, ligne Enchainement absente ; Avec / Sans disponible | RM-242 ; statut de D-250 ; ch. 08 (N=1, tableau) ; CE-UI-10 (ligne 8) ; note de la capture `8328:39072` |
| Q-V3-03 | D-416 : Condition d’arrêt À la cible par défaut | RM-248 ; ch. 08 ; CE-UI-10 (ligne 2, création) |
| Q-V3-05 | D-417 : sélecteur existant de chaque champ pour chaque cellule | RM-250 ; ch. 08, 10 ; CE-UI-10 (ligne 5) ; DSF Circuits |
| Q-V3-06 | D-418 : roulette Répétitions sans À l’échec en séries identiques | RM-250 ; conventions v13 ; ch. 06, 08, 12 ; PRODUCT ; DSF Deux modes ; portée de D-412 |
| Q-V3-07 | D-419 : durée numérique masquée à l’échec commun | RM-248, RM-250 ; CE-UI-10 |
| Q-V3-08 | D-420 : aucune mémorisation personnalisée de la cadence | RM-245 |
| Q-V3-15 | D-421 : évolutions v3.0 incluses dans le MVP | ch. 05 (complément MVP) ; B-092 |
| Dix autres | Décisions existantes appliquées ; Q-V3-16 rouverte par la seconde passe (présentation de la Condition d’arrêt dans un format) | [questions-hermann.md](questions-hermann.md) |

**Seconde passe de contrôle indépendante** (lecture seule, 10 écarts) : corrigés par le lot `V3-12-seconde-passe` (21 corrections) :
- la place de la mention de charge était attribuée à D-414, qui ne la fixe pas : elle est désormais présentée comme lecture proposée, non arbitrée (Q-V3-19) ; la présentation d’une série à zéro dans la liste est soumise à Hermann (Q-V3-20) ;
- « aucun stepper dans les cellules » (CE-UI-10) aligné sur D-417 ; D-417 cite D-413 exactement et nomme la source de chaque sélecteur existant (D-219, D-385, RM-234, D-405) ;
- deux renvois à la roulette Répétitions alignés sur D-418 (ch. 10, ch. 13 §4.6) ; statut de D-219 complété ;
- la règle ajoutée pour CE-FMT-04 s’appuyait sur RM-247 et sur une frame en écart : retirée, Q-V3-16 rouverte ;
- D-415 « remplace sur ce point » D-250 ; la règle d’ellipse de la grammaire v15 est limitée aux cibles ; fourchette D-403 à D-421 ; portée de D-421 pour les phases ; le registre ne renvoie plus à un fichier du change.

B-073 et B-074 ne reçoivent pas la mention MVP : B-073 vise aussi le Circuit et le chapitre 05 porte la version (D-421).

**Contrôles** ([controles/FINAL-3.txt](controles/FINAL-3.txt), depuis `b6ca2321`) : rejeu exact des 402 corrections (341 + 40 + 21) ; conservation vérifiée ; C4 à C7 à 0 ; liens, K1, K2, OpenSpec `--strict` réussis. Correctifs des PR recalculés : #370 compte un bloc de plus résolu par déclaration (section des phases du ch. 08 après le paragraphe N=1) ; `git apply --check` réussi, seuls et en séquence.

**Seconde passe Figma** (lecture seule) : nouveaux écarts — `8328:36923` sans Condition d’arrêt sélectionnée (D-416) ; `8328:39072` Avec désactivé (D-415) ; `8598:30059` (Tabata) sans Nombre de séries, Pause ni Condition d’arrêt ; aucune frame pour les états de D-414, D-415, D-418, D-419. Variables liées relevées pour Q-V3-10.

## 6. Derniers arbitrages de Hermann (18/10/2026)

| Question | Décision | Effet documentaire |
|---|---|---|
| Q-V3-19 | D-422 : mention de charge après la valeur par série | RM-240 ; grammaire v15 (ordre et ligne de tableau) ; ch. 10 « Phrase de synthèse des paramètres d’exécution » ; CE-UI-10 rendu de la phrase |
| Q-V3-20 | D-423 : une série à zéro apparaît avec 0, par exemple `(charges : 0, 10, 15 kg)` | RM-240 ; grammaire v15 ; recette CE-T03-04 |
| Q-V3-16 | D-424 : Condition d’arrêt À la cible présentée grisée dans un format à cible chiffrée imposée | CE-UI-10, complément Formats ; écart Figma `8598:30059` |

Lot `V3-13-arbitrages-hermann-2` (11 corrections) ; les mentions « non arbitrée » de la seconde passe sont remplacées. Contrôles : [controles/FINAL-4.txt](controles/FINAL-4.txt).

## 7. Intégration des PR #363, #370 et #371 (18/10/2026)

- Têtes inchangées depuis les 15 et 16/10 (`d2386c8d`, `6cf3634a`, `2c050d0e`). Contenu reporté par corrections tracées (motif `INTEGRATION-PR:#n`), sans fusion de branche : #363 5 blocs et 4 images ; #370 25 blocs (chapitres et DSF) ; #371 16 blocs. Adaptations aux décisions D-403 à D-424 et à la gouvernance : 28 corrections (`V3-19`), 2 renvois (`V3-20`). Alignement de #371 sur les décisions PRE-4 Q8, Q17, Q18 et Q25 du 16/10 (signalement X-06/X-07 jusque-là non publié) : 5 corrections (`V3-21`).
- Complétude : toutes les lignes ajoutées par les PR sont présentes, ou adaptées et justifiées dans [pr/traitement-pr.md](pr/traitement-pr.md) (#363 : 0 ; #370 : 13 ; #371 : 11).
- Phases d’exercice : D-370 à D-375 au registre ; ligne « Phases de l’exercice » intégrée aux quatre cadres (CE-UI-10, ch. 06) ; deux captures de phases ajoutées.
- Contrôles ([controles/FINAL-6.txt](controles/FINAL-6.txt), depuis `b6ca2321`) : rejeu exact, conservation vérifiée, liens, K1, K2, OpenSpec.
- Limite : PRE-4 Q21/Q36 (pas de la cible Durée) non intégrée, décision Q33 à Q44 déjà consignée hors périmètre.

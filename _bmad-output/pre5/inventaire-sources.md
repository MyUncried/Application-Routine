# PRE-5 — Inventaire des sources normatives

Relevé en lecture seule, le 19/10/2026, dans le clone `C:\Dev\KODJO-BMAD-PRE5`, branche `bmad/pre5-depuis-pre4`, HEAD `52382b04`. Ce HEAD repose sur `origin/main` = `5e14a65e`. Les trois commits locaux ne touchent ni `docs/` ni `openspec/` : `git diff 5e14a65e HEAD` se limite à `CLAUDE.md`, `AGENTS.md` et deux rapports `.github/`. Le merge PRE-4 `1116586b` est bien un ancêtre de `origin/main`.

Périmètre de référence : le cadrage de Hermann du 18/10/2026 (`KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md`, téléversé dans la conversation). Il couvre l’éditeur d’Exercice et la feuille Paramètres d’exécution. Sont hors périmètre : le moteur d’exécution, les médias, les référentiels, le catalogue, la composition, la planification et les formats.

Conventions de citation : `ch. NN l. X` renvoie à `docs/Specifications-fonctionnelles/NN – ….md` à l’état `5e14a65e`. `spec v3 l. X` renvoie à `openspec/changes/archive/2026-10-18-integration-parametres-execution-v3/source/KODJO_Charge_Specification_2026-10-18.md`. Les numéros de ligne sont ceux du fichier extrait, avec CR retirés.

---

## 1. Sources présentes

### 1.1 Sources normatives du dépôt (`main` = `5e14a65e`)

| Source | Révision | Statut | Couverture PRE-5 |
|---|---|---|---|
| `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | Dernière modification `5e14a65e`. Introductions : D-370 à D-375 par `b36e4654` (18/10, intégration de la PR #370) ; D-403 à D-413 par `69c45e4e` (18/10) ; D-414 à D-421 par `135a40bb` ; D-422 à D-424 par `5caa1b8c` ; D-425 par `b5a491b4` (19/10) ; D-426 par `d31d5bd9` (19/10) ; D-427 à D-429 par `5e14a65e` (19/10) | Normatif ; les décisions remplacées gardent leur texte (l. 687) | Toutes les décisions PRE-5 : phases (l. 739-752), paramètres v3.0 (l. 684-714), Description en étapes (l. 715), couverture MVP de Figma (l. 716) |
| `10 – Processus métier et règles métier transverses.md` | Dernière modification `5e14a65e` ; RM-235 à RM-250 introduites par `69c45e4e` | Normatif | Phases (l. 268-286), éditeur (l. 288-317), RM-235 à RM-250 (l. 329-421), ordre de la phrase et mention de charge (l. 491, 507), phrase des côtés (l. 515), roulette Répétitions (l. 523) |
| `08 – Conception fonctionnelle détaillée.md` | `5e14a65e` | Normatif | Éditeur (l. 180-186), brouillon (l. 211-229), Phases MVP (l. 231-347), table des champs de l’Exercice (l. 355-389), implantation (l. 432) |
| `13 – Contrats d’écran.md` | `5e14a65e` | Normatif | CE-T03-04 (l. 769-891), CE-UI-10 (l. 1009-1180), règles communes de l’éditeur de paramètres (l. 1183-1228), rendu de la phrase (l. 1237-1245), inventaire des frames (l. ~200-258) |
| `09 – Modèle de données fonctionnel.md` | `5e14a65e` | Normatif | Description (l. 332), charge (l. 344-347), phases (l. 370-380), copie (l. 242, 430, 450) |
| `11 – API fonctionnelles.md` | `5e14a65e` ; `14caad44` pour la description structurée | Normatif | API-ACT-01 (l. 100), contrats internes des phases (l. 107-118), API-ACT-COPY-01 (l. 125), validation, phrase et copie (l. 138-153) |
| `04 – Modèle fonctionnel.md` | `5e14a65e` | Normatif | Charge (l. 165, 259), Description structurée (l. 253), phases internes (l. 279-283) |
| `05 – Versions du produit.md` | `5e14a65e` ; `31ced438` pour D-426 | Normatif | Phases au MVP (l. 130), complément v3.0 au MVP (D-421, l. 276-282), couverture Figma (l. 342) |
| `06 – Ecrans et navigation de la V1.md` | `04f0fb13` (19/10) | Normatif pour la navigation ; les captures sont des références visuelles | Éditeur (l. 555-647), phases (l. 649-671), 20 états de la feuille (l. 673-833), références manquantes (l. 839) |
| `docs/PRODUCT.md` | `5e14a65e` | Synthèse produit | Côtés (l. 52), couverture de Prototype MVP par D-426 (l. 297), copie de la description en étapes (l. 401) |
| `docs/DSF-CIRCUITS-CONTROLES-2026-10-12.md` | `b36e4654` (18/10) | DSF actif, « à lire avec sa mise à jour du 18/10 » (ch. 06 l. 565) | Mesures du tableau et des contrôles de la feuille |
| `docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md` | `401ead8b` (18/10) | DSF actif, section Phases citée par CE-UI-10 l. 1081 | Sélecteur de cible, phases |
| Captures `docs/Specifications-fonctionnelles/images/parametres-2026-10-18/` et `images/circuits-2026-10-12/` | Exports du 18/10 et du 12/10 | Références visuelles, sans valeur de règle (D-255, D-300) | Voir §4 |

### 1.2 Sources archivées du dépôt (change OpenSpec `2026-10-18-integration-parametres-execution-v3`, archivé par `1b3b7362`)

| Source | Révision | Statut | Couverture PRE-5 |
|---|---|---|---|
| `source/KODJO_Charge_Specification_2026-10-18.md`, version 3.0 du 18/10/2026 | Introduite par `69c45e4e`, archivée par `1b3b7362`. SHA-256 après retrait des CR : `9670dc09…9d60c30`, identique à l’empreinte de `proposal.md` et à la copie téléversée `3ac3e613-KODJO_Charge_Specification_2026-10-18.md`. Le fichier extrait sous Windows est en CRLF : son empreinte brute diffère. | Source d’origine, intégrée au registre (D-403 à D-424) et au ch. 10 (RM-235 à RM-250). Le registre ne crée pas de source concurrente (proposal) : en cas d’écart, les chapitres priment. | CH-01 à CH-09, CO-01, CA-01, DU-01, CV-01, AR-01, GR-01, RO-01, PR-01 à PR-05, AC-01 à AC-26, §11.2 (scénarios), §11.3 (propositions écartées), §12 (clôture) |
| `questions-hermann.md` | `1b3b7362` | Historique des arbitrages Q-V3-01 à Q-V3-20 | Statut des questions : voir §5 |
| `bilan-integration-v3-2026-10-18.md` | `1b3b7362` | Historique | Il ne reste aucune question produit ouverte ; trois coordinations subsistent : Q-V3-02, Q-V3-10 et Q-V3-17 (l. 21) |
| `dependances-pr.md`, `pr/traitement-pr.md`, `pr/rapports-pr/PR370-2026-10-16_PHASES_DOCUMENTATION.md` | `1b3b7362` | Historique, traçabilité de l’intégration des PR #363, #370 et #371 | Adaptations des phases (D-410, D-413) et limites restantes (traitement-pr l. 50) |
| `matrice-couverture.md`, `rapport-conformite.md` | `1b3b7362` | Historique | Couverture CH, CO, CA, DU, CV, AR, GR, RO et AC |

### 1.3 Sources hors dépôt

| Source | Emplacement | Statut | Couverture PRE-5 |
|---|---|---|---|
| `KODJO_Registre_Modifications_Creation-activite_2026-10-10.md`, 2 486 lignes, SHA-256 `8fb60fe2…df2d7963`, doublon `_1.md` identique | `C:\Users\hadjo\Downloads\` | Hors dépôt. C’est un journal d’opérations Figma du 10/10 (sélecteurs, mesures, volumétrie), pas une spécification. D-425 renvoie à sa demande 10 (« solution A retenue »). Sa version documentaire finale est D-425 (ch. 07 l. 715). | Description en étapes (demande 10, l. 201-243) ; titres de section (demande 1, l. 37-57) ; retrait de la pastille Durée et du groupe Compte à rebours / Fin de la carte (demande 2, l. 59-73) ; ordre des sections (demande 3, l. 75-88) ; libellé « Modalités d’exécution » (demande 4, l. 90-107) ; corps de texte (demandes 5 et 17) ; classification Catégorie / Zones (demandes 11 à 14 et 18) ; cadres (demande 21) ; Terminer à y802 (demande 20, l. 598-612) |
| Cadrage PRE-5 du 18/10/2026 | `C:\Users\hadjo\.claude\uploads\1ce08cda-…\bd054f2c-KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md` | Mandat de Hermann. Il définit le périmètre, pas des règles détaillées. | Exigences PRE-5, clarifications 1 à 7 (l. 42-49) |

### 1.4 Ce que `5e14a65e` ajoute réellement

Le commit `5e14a65e`, intitulé « arbitrages PRE-5 — évaluations et résultats d’exécution », ajoute D-427 à D-429 (ch. 07 l. 8-15) et RM-PRE5-01 à RM-PRE5-03 (ch. 10). Ces décisions portent sur la douleur et l’effort en synthèse, les répétitions partielles et le résultat de série. Elles relèvent du moteur d’exécution et de la synthèse, **hors du périmètre éditeur du cadrage**. Le dépôt utilise donc le nom « PRE-5 » pour un autre contenu que le cadrage. Elles ne sont pas reprises au §3.

Les commits qui portent sur l’éditeur sont `b5a491b4` (D-425, Description en étapes, ch. 07, 08, 09, 13), `14caad44` (API : entrée et copie de la description structurée) et `31ced438` (alignement du ch. 05 et du ch. 08 sur D-425 et D-426).

### 1.5 Hors sources

Les artefacts BMad déjà présents dans `_bmad-output/planning-artifacts` et `_bmad-output/implementation-artifacts` (PRD PRE-4 du 16/10, epics, specs 1-1 à 4-6) relèvent de PRE-4 et ne sont pas des sources PRE-5.

---

## 2. Sources mentionnées par le cadrage mais absentes

| Source | Recherches effectuées | Constat |
|---|---|---|
| `KODJO-Phases-specification-consolidee-2026-10-15.md` (« version interne consolidée du 16 octobre, version de fichier 1 », cadrage l. 15) | `git ls-tree -r origin/main` ; `git log --all` sur les noms contenant « phase » ; `find` sur tout `C:\Users\hadjo` (Downloads, Documents, uploads) ; `C:\Dev` jusqu’à la profondeur 7 ; `C:\Dev\KODJO-OPENSPEC-DOCS` | **Absent.** Seul le rapport de la PR #370 le nomme comme base de consolidation (`pr/rapports-pr/PR370-2026-10-16_PHASES_DOCUMENTATION.md` l. 3). Son contenu a été intégré aux chapitres par la PR #370, reportée le 18/10 (lots V3-15 et V3-16, `b36e4654`) : D-370 à D-375 (ch. 07 l. 743-748), ch. 08 « Phases d’un exercice — MVP » (l. 231-347), ch. 10 l. 268-286, ch. 09 l. 370-380, ch. 11 l. 107-118, CE-UI-10. Le rapport PR370 donne la matrice de couverture point par point (l. 7-33). **Sans le fichier, il est impossible de vérifier que ses sections 1 à 4.1 sont intégralement couvertes.** Les formulations du cadrage (clarification 4 : 0 à 6 phases, libellé de 20 caractères, durée positive en secondes, zéro temporaire normalisé) correspondent à D-370, D-373 et ch. 08 l. 241-259. |
| Version documentaire finale du « registre de modification de création d’exercice » | Dépôt et disque | Le registre du 10/10 est présent hors dépôt (§1.3). Sa décision sur la Description est raccordée au dépôt par D-425 (`b5a491b4`). Aucune autre version datée n’a été trouvée. |
| « Audit indépendant PRE-4 du 18 octobre » (cadrage l. 16) | `git ls-tree` (« audit ») ; Downloads et Documents | Absent du dépôt et du disque. Il n’est pas nécessaire à l’inventaire des règles. |
| `KODJO_Charge_Specification_2026-10-18(1).md` | — | Présent sous un autre nom, contenu identique (§1.2). |

---

## 3. Règles par thème

Les décisions closes ne doivent pas être redemandées. Les remplacements sont nommés par le registre lui-même.

### 3.1 Phases

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-370 | Phases au MVP ; 0 à 6 phases ordonnées ; libellé de 20 caractères maximum ; uniquement en Durée chiffrée et séries identiques ; une série joue une fois le motif, sans pause interne | ch. 07 l. 743 ; ch. 08 l. 241-247 ; ch. 10 l. 276-277 | Close |
| D-371 | « Aucune » crée une phase reprenant la durée de série ; chevron seulement avec phases ; un ajout libre copie la dernière durée ; supprimer la dernière phase conserve sa durée comme durée de série | ch. 07 l. 744 | **Remplacée sur la présentation par D-410 et D-413** (ch. 07 l. 752) : Avec / Sans, « Aucune » devient Sans, chevron intérieur à Avec, pas de pied ni de boutons +/−. Les règles de durée restent applicables. |
| D-372 | Durée de travail imposée par un format : la dernière phase est calculée ; ajout à 0 ; déplacement et suppression transférés à la dernière | ch. 07 l. 745 ; ch. 08 l. 287-307 | Close. Applicable seulement si le parcours format existe (cadrage l. 81). |
| D-373 | À la validation, retrait silencieux des phases à 0 s ; libellé vide remplacé par « Phase n » | ch. 07 l. 746 ; ch. 08 l. 257-259 ; CE-UI-10 l. 1132 | Close ; le cas des arrondis à zéro reste ouvert (§5) |
| D-374 | Adaptation proportionnelle à l’intégration dans un format, message informatif, catalogue intact | ch. 07 l. 747 ; ch. 08 l. 309-317 | Hors éditeur (composition et formats) |
| D-375 | Bip continu, annonces de phases | ch. 07 l. 748 | Hors périmètre (moteur) |
| Ch. 08 | Avec crée la première phase avec la durée actuelle de la série et le libellé « Phase 1 » ; le tableau Libellé / Durée reprend les conventions du tableau des séries (déplacement, numéro, suppression, ligne active), sans pied ni +/− ; toucher le libellé ouvre la saisie de texte ; toucher la durée ouvre son contrôle de durée ; un ajout libre reprend la dernière durée ; pas de septième ligne | ch. 08 l. 251-255 ; CE-UI-10 l. 1118, 1126 | Close |
| Ch. 08 | Durée de série D = somme des phases, calculée et non modifiable, sans arrondi au pas (6 + 3 = 9 s) ; T = N × (D + P) ; exemple : 72 s | ch. 08 l. 269-279 ; ch. 10 l. 278 | Close |
| Ch. 08 | Phases incompatibles avec Répétitions, À l’échec et séries variables ; choix incompatibles indisponibles tant que des phases existent ; aucune conversion destructive | ch. 08 l. 244-246 ; CE-UI-10 l. 1067 | Voir la contradiction C-1 |
| Ch. 09 | Liste ordonnée facultative ; identité stable ; libellé de 1 à 20 caractères après normalisation ; durée positive ; versionnement des sérialiseurs ; ancienne version lisible ; ne jamais rabattre sur une durée scalaire | ch. 09 l. 374-380 ; ch. 11 l. 118 | Close |
| D-410, D-413 (phases) | Ligne « Phases de l’exercice » Avec / Sans en tête du cadre Séries ; chevron intérieur à Avec | ch. 07 l. 700, 703 ; CE-UI-10 l. 1059 ; règles communes l. 1191 | Close |
| D-412 (phases) | « La roulette propre à une phase d’exercice n’est pas modifiée » | ch. 07 l. 702 ; RM-250 l. 421 ; spec v3 l. 256 | Voir la contradiction C-1 |

### 3.2 Charge

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-403, RM-235, RM-236 | Charge facultative et informative en kg ; Sans par défaut ; un exercice sans le paramètre est lu Sans, jamais 0 kg ; l’activation est distincte des valeurs ; Sans conserve les valeurs, Avec les restaure ; copie, duplication et instantané les transportent ; aucune valeur par côté ; aucun effet sur les calculs | ch. 07 l. 693 ; ch. 10 l. 335, 339 ; CH-01, CH-02, CH-06, CH-07 | **Remplace l’exclusion « Cibles d’intensité (charge…) » du ch. 04 pour la seule charge.** La conservation des valeurs désactivées est propre à la charge ; D-249 reste applicable aux autres paramètres. |
| D-404, RM-237, RM-238 | Identiques : ligne Charge après la Pause ; Avec ouvre directement la saisie ; la valeur remplace Avec (« 20 kg »). Variables : ligne Avec / Sans sous le tableau ; colonne masquée sous Sans, valeurs conservées ; titre de colonne non interactif ; la charge suit sa série ; règles communes des champs de série, sans propagation propre | ch. 07 l. 694 ; ch. 10 l. 343, 347 ; ch. 08 l. 227 | Complète D-247 et D-249 |
| D-405, RM-239 (**CH-05, clos**) | Saisie au clavier numérique décimal, sans fenêtre intermédiaire, tableau visible au-dessus du clavier ; pas de 0,25 kg ; aucun plafond ; arrondi au multiple supérieur, sans message, à la sortie du champ ou à la validation, jamais pendant la frappe (1,3 → 1,5 ; 0,01 → 0,25) ; valeur négative refusée ; zéro = sans charge (désactive en identiques ; vaut pour la seule série en variables ; toutes les séries à zéro → Sans) ; première activation à 0,25 kg avec saisie ouverte ; réactivation : valeurs restaurées, zéros compris, ou 0,25 kg partout si toutes valent zéro | ch. 07 l. 695 ; ch. 10 l. 351-356 ; spec v3 l. 49-59, 469-488 | **Exception, pour la seule charge, à la saisie par stepper ou roulette (D-219) et à l’interdiction de correction silencieuse (CE-UI-10 §14).** Arbitrages clos : ne pas les redemander (cadrage, clarification 3). |
| D-414, D-422, D-423, RM-240 | Phrase : `(charge : 20 kg)` ; `(charges : 20, 12, 13 kg)` jusqu’à trois séries ; `(charges : 20, 12 kg, ...)` au-delà ; placée après la valeur par série ; une série à zéro apparaît avec 0 ; aucune mention avec Sans ; segments `{texte, gras}` non persistés | ch. 07 l. 704, 712, 713 ; ch. 10 l. 360-369, 491, 507 ; CE-T03-04 l. 879 | Close |
| D-421 | Les évolutions v3.0 sont incluses au MVP | ch. 07 l. 711 ; ch. 05 l. 276-282 | Close |
| RM-241 | Affichage de la charge en exécution | ch. 10 l. 373 | **Hors PRE-5** (moteur, cadrage clarification 6). Il faut seulement transmettre la donnée dans les copies et les instantanés existants. |

### 3.3 Côtés

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-406, RM-242 | Changement de côté Avec (à gauche) / Sans (à droite), sans choix Droite puis gauche ou Gauche puis droite ; Avec rend disponibles Enchainement (deux stratégies) et Pause entre les côtés ; chevron intérieur à Avec ; aucune restriction nouvelle selon N | ch. 07 l. 696 ; ch. 10 l. 377 | **Remplace le choix de direction de D-143 et de D-247, ainsi que les valeurs `Aucun`, `D→G`, `G→D` (RM-143, RM-212).** L’Ordre des côtés reste le concept, avec le libellé visible Enchainement. |
| D-407, RM-243 | Désignation neutre « côté 1 » / « côté 2 » dans les phrases, instructions, annonces et l’indicateur de carte ; notation Figma à flèches conservée pour l’Enchainement | ch. 07 l. 697 ; ch. 10 l. 381, 515 | **Remplace D-148, D-149, RM-148, RM-151, RM-152 et les formes « côté droit puis le gauche ».** |
| RM-244 | Les valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` valent Avec ; l’Ordre des côtés enregistré est conservé, sans réinterprétation ; pas de réécriture d’historique sans nécessité ; stratégie technique selon le schéma réel | ch. 10 l. 385 ; ch. 10 l. 307 | Close |
| D-415 | À N = 1, la ligne Enchainement n’est pas affichée ; Avec / Sans reste disponible ; la normalisation N1 est conservée | ch. 07 l. 705 ; ch. 08 l. 229 | **Remplace D-250 sur ce point.** L’état Figma « Avec désactivé » (`8328:39072`) n’est pas une règle. |
| Spec v3 PR-05, §9.3 | Pas de notation C1S1 / C2S1 ; les deux stratégies sont conservées | spec v3 l. 299, 409 ; ch. 07 l. 686 | Proposition rejetée ; ne pas réintroduire |

La spécification des phases (absente) emploie encore des formulations anatomiques. D-406 et D-407 priment (cadrage, clarification 5).

### 3.4 Condition d’arrêt

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-411, RM-248 | Ligne « Condition d’arrêt », options « À l’échec » (à gauche) et « À la cible » (à droite) ; en séries identiques, choix sélectionnable qui s’applique à toutes les séries ; « Définie » est obsolète ; le type de cible par série reste la seule donnée | ch. 07 l. 701 ; ch. 10 l. 401 | Remplace les libellés Cible puis Arrêt. D-111 est supersédée sur le troisième mode (ch. 07 l. 152). |
| D-411, RM-249 (**AR-01**) | En séries variables, le résultat est dérivé et non modifiable : À la cible si toutes les séries sont chiffrées, À l’échec si toutes sont à l’échec, sinon une seule option « À la cible et à l’échec » ; jamais trois boutons ni de Mixte persisté ; une cellule vide n’est comptée nulle part ; sémantique accessible de valeur non modifiable | ch. 07 l. 701 ; ch. 10 l. 405-413 ; spec v3 l. 209-227 | Close. Le libellé décidé est « À la cible et à l’échec », pas « À l’échec et à la cible » (cadrage, clarification 2). |
| D-416 | À la cible par défaut à la création | ch. 07 l. 706 | Close |
| D-419 | Condition commune À l’échec : saisie de « Durée d’une série » masquée | ch. 07 l. 709 ; ch. 10 l. 417 | Close |
| D-412, D-418, RM-250 | Identiques : roulette Durée d’une série numérique seule ; roulette Répétitions sans « Aucune répétition, à l’échec ». Cellule variable : durée numérique ou « À l’échec » pour cette série (jamais une durée nulle) ; option À l’échec conservée en tête de la roulette Répétitions ; chaque modification actualise la Condition d’arrêt | ch. 07 l. 702, 708 ; ch. 10 l. 417-421 | D-412 **remplace l’option « Aucune durée, à l’échec » pour la durée commune.** D-418 **remplace l’option en tête de la roulette Répétitions (PRE-4 Q8, D-385) en séries identiques.** |
| D-424 | Dans un format à cible imposée, À la cible est grisée | ch. 07 l. 714 | Hors PRE-5 (formats) ; point de non-régression |

### 3.5 Saisie numérique

| ID | Énoncé court | Source | Statut |
|---|---|---|---|
| D-405, RM-239 | Saisie au clavier propre à la charge ; « Cette saisie au clavier ne s’étend pas aux autres paramètres numériques » | ch. 10 l. 351 ; ch. 07 l. 686 (« généralisation de la saisie au clavier aux autres nombres » écartée) ; spec v3 l. 303, 448 | Close |
| D-408, RM-245 | Cadence « Autre » : « mécanisme numérique existant » du Bip, ± par pas de 1 s, bornes 0..10, sans accélération | ch. 10 l. 389 ; CE-UI-10 l. 1107 ; règles communes l. 1214 | Close |
| D-417 | Chaque cellule du tableau variable utilise le sélecteur existant de son champ : roulette de durée, roulette Répétitions, stepper de Pause, clavier décimal pour la charge | ch. 07 l. 707 ; ch. 10 l. 418 | Close |
| Phases | Libellé : saisie de texte ; durée : « contrôle de durée » (type non précisé) | ch. 08 l. 253 ; CE-UI-10 l. 1126 | Voir §5 (P-3) |
| CE-UI-10 §10 | Clavier de la charge : tableau entièrement visible au-dessus, avec une marge de 12 px dans `9292:18077` ; le clavier du libellé de phase ne masque ni le champ actif ni les actions | ch. 13 l. 1085, 1087 | Close |

Dans les sources, la seule saisie numérique au clavier concerne donc la charge, plus le texte du libellé de phase. Le cadrage (l. 34) demande d’« identifier les champs » sans remplacer toutes les roulettes, ce qui reste cohérent avec ces règles (§5, P-1).

### 3.6 Présentation de la feuille

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-413 (**GR-01, PR-01 à PR-04**) | Quatre cadres gris arrondis, espacés de 8 px dans la référence 402 × 874 : 1 Exécution (Mode, Condition d’arrêt) ; 2 Séries (Phases de l’exercice et tableau, Nombre de séries, Type de série, Durée ou Répétitions et Pause, ou tableau variable, Charge) ; 3 Côtés ; 4 Cadence et durée. Libellés fixés ; contrôles segmentés à droite, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− ; la feuille s’adapte au contenu ; un repli ne laisse pas d’espace vide ; le tableau reste visible avec le clavier ; valeurs des captures illustratives | ch. 07 l. 703 ; CE-UI-10 l. 1059, 1071-1081 ; règles communes l. 1187-1202 | **Remplace la présentation par popovers de D-377 et des DSF du 12/10 et du 13/10** pour Mode, Type de série et Changement de côté, ainsi que le pied commun ± et les steppers de cellules. **D-339 n’a plus d’objet** pour ces lignes. D-341 est remplacée (ch. 07 l. 563). |
| D-410, RM-247 (**CV-01**) | Chevrons à l’intérieur de Variables, d’Avec (côtés) et d’Avec (phases), centrés verticalement ; vers le haut si déployé, vers le bas si replié ; le repli conserve valeurs et mode ; une option non modifiable garde sa valeur réelle | ch. 07 l. 700 ; ch. 10 l. 397 | **Remplace le « chevron indépendant » de D-251.** |
| D-408, D-420, RM-245 (**CA-01**) | Cadence : Autre, 5 s, 2 s, 1 s, Sans, dans cet ordre ; l’option reflète la valeur ; aucun champ par raccourci ; aucune mémorisation de valeur personnalisée (Sans puis Autre ne restaure rien) | ch. 07 l. 698, 710 ; ch. 10 l. 389 | **Remplace la présentation de D-308.** Bornes 0..10 et pas D-312 inchangés. |
| D-409, RM-246 (**DU-01**) | Libellé « Durée de l’exercice » ; chevron à 12 px du libellé ; replié par défaut, il masque Compte à rebours et Fin d’exercice sans les désactiver ; sans ligne de durée, les signaux sont directement visibles ; un exercice ouvert depuis une Séance ne réintroduit pas ses signaux (RM-218) | ch. 07 l. 699 ; ch. 10 l. 393 | **Remplace le libellé visible « Durée totale »** et l’ordre « Bip juste au-dessus du total ». D-384, D-396 et D-397 sont inchangées. |
| D-396, D-397, D-384 | Ligne de durée affichée à N = 1, avec « — » si une cible manque, masquée si aucune durée n’est calculée | ch. 07 l. 641, 661, 668 | Close, non-régression |
| D-389, D-398, D-337 | Valeur obligatoire absente : fond rouge pâle, sans contour orange ; ✓ indisponible ; aucun message | ch. 07 l. 559, 654, 669 ; règles communes l. 1220 | Close, non-régression |
| CE-UI-10 §12 | Une seule roulette ouverte ; ✓ et ✕ de roulette, puis ✓ et ✕ de feuille ; Terminer seul persiste | ch. 13 l. 1101-1116, 1204 | Close, non-régression |

### 3.7 Description en étapes

| ID | Énoncé court | Source | Remplacements, statut |
|---|---|---|---|
| D-425 | Saisie fluide en étapes numérotées (solution A) ; état vide « 1. Décrivez la première étape » ; Entrée crée l’étape suivante, avec l’invite « Étape suivante » ; aucun bouton « Ajouter une étape » ; la séquence remplace la saisie libre multiligne ; ↑ ferme le clavier sans valider l’Exercice | ch. 07 l. 715 ; ch. 08 l. 366 ; CE-T03-04 l. 797, 813, 817, 841 ; registre du 10/10, demande 10 | **Supersède la règle « Retour = simple retour à la ligne » de D-351** (ch. 07 l. 587). Le bouton ↑ de D-351 est maintenu. |
| Ch. 09, ch. 11 | Liste ordonnée ; ordre et texte conservés ; copiée par API-ACT-01 et API-ACT-COPY-01 et à l’insertion dans une Séance | ch. 09 l. 332 ; ch. 11 l. 100, 125 ; PRODUCT l. 401 | Structure de stockage À CLARIFIER (§5) |
| D-349 | Clavier ouvert : Terminer reste en bas, sans remonter ; la Description se place juste au-dessus du clavier, curseur visible | ch. 07 l. 578 | Close ; s’applique aux étapes |
| Registre du 10/10 | Modèle A retenu (`7867:14511`), B écarté (`7867:14580`, réorganisable) ; numéro Inter Medium, largeur fixe 16, aligné à droite ; libellé Regular ; invite `#AEB3BA` ; corps 14 (demande 17) | Downloads, l. 203-226, 432 | Le registre est un journal Figma : ses mesures sont des propriétés visuelles, pas des règles. |

### 3.8 Résumé de la carte et Terminer

| ID | Énoncé court | Source | Statut |
|---|---|---|---|
| D-413, CE-T03-04 §7-8 | Compte à rebours et Fin relèvent de CE-UI-10 ; ce ne sont pas des lignes autonomes du formulaire principal | ch. 13 l. 813, 817 ; ch. 08 l. 432 ; registre du 10/10, demande 2 (suppression de la pastille « Durée », du groupe Compte à rebours / Fin et du filet) | Close. Retrait de présentation seulement : données et fonctions conservées (cadrage l. 26). Voir C-3. |
| PRE-4 Q23 (D-385) | Pas de champ Mode à droite du titre de la carte ; une seule zone touchable ; Mode visible dans la phrase | ch. 13 l. 807-809 | Close, non-régression |
| Ch. 10 l. 317 | La phrase exclut nom, Compte à rebours, Fin d’exercice et Récupération | ch. 10 l. 317 | Close |
| CE-T03-04 §14 | Terminer inactif : fond `color/disabled` `#BEC2CC` ; actif : `color/primary` `#0508E5` | ch. 13 l. 849 ; ch. 06 l. 559 | Close |
| D-349 | Terminer ne remonte pas avec le clavier | ch. 07 l. 578 | Close |
| Cadrage | « Abaisser Terminer conformément à Figma » et préserver une zone de protection au-dessus, clavier ouvert ou fermé | cadrage l. 27 ; registre du 10/10, demande 20 (`Action finale` en position absolue à y790, 84 px de haut, bouton à y802) | Demande de Hermann **sans décision D-xxx** ni contrat chiffré ; référence visuelle seulement (§4, §5 P-6) |

### 3.9 Titre, contexte et sections

| ID | Énoncé court | Source | Statut |
|---|---|---|---|
| Ch. 08 | Titre « Créer un exercice » ou « Modifier un exercice » ; le Nom (1 à 80 caractères) est le premier élément du bandeau bleu ; Catégorie : exactement une ; Zones : au moins une | ch. 08 l. 362-365 ; ch. 10 l. 290, 295 | Close |
| CE-T03-04 §7 | Structure : en-tête fixe → bandeau (nom, Catégorie, Zones) → carte Paramètres → Description → Média → Terminer | ch. 13 l. 813 | Voir C-2 |
| Registre du 10/10 | Titres de section Inter Regular 11, `color/text-secondary`, à 4 du cadre (demande 1) ; classification glyphe 18 + libellé 13, voile blanc à 35 % à renseigner, sans fond une fois renseignée, glyphe catégorie teinté (demandes 13, 14, 18) ; cadre `#F9FAFC` rayon 12 sur le seul bloc des modalités (demande 21) | Downloads, l. 37-57, 307-480, 542-596 | Propriétés visuelles, à confronter au Figma courant (§4) |
| D-426 | Tous les écrans et états de Prototype MVP sont au MVP ; le ch. 06 n’en garde qu’une sélection | ch. 07 l. 716 | Close |

### 3.10 Contradictions réelles entre sources

- **C-1 — Phases et option À l’échec.** Ch. 08 l. 244 : « Elles sont incompatibles avec le mode Répétitions, une cible À l’échec et les séries variables. » CE-UI-10 l. 1067 : « Mode incompatible, cible À l’échec et régime variable indisponibles tant que les phases existent. » En face, D-412 (l. 702) : « La roulette propre à une phase d’exercice n’est pas modifiée », et spec v3 l. 256 : « ne pas retirer son option À l’échec par généralisation ». `dependances-pr.md` l. 28 avait relevé le point (« La roulette propre à une phase garde son option À l’échec ; incompatibilité à confronter : Q-V3-17 »). Q-V3-17 reste une « Coordination » (questions-hermann). Aucune décision ne dit si le contrôle de durée d’une phase propose « À l’échec ».
- **C-2 — Ordre Description / Paramètres et libellé de section.** Ch. 13 l. 813, ch. 08 l. 366 (« Sous les paramètres d’exécution ») et ch. 08 l. 432 placent la carte Paramètres **avant** la Description. Le registre du 10/10 (demande 3) et les captures actuelles `8328:35698`, `8328:36853` et `8328:37022` montrent l’ordre inverse : « Description de l’exercice » **puis** « Modalités d’exécution », puis Média. Le titre visible de la section est « Modalités d’exécution », placeholder « Appuyez pour définir les séries et les durées ». Pourtant CE-T03-04 §6 (l. 807) liste « Paramètres d’exécution » comme libellé statique. Le titre de la feuille est « Paramètres d’exécution » dans les deux cas.
- **C-3 — Compte à rebours / Fin dans le rendu de la phrase.** CE-T03-04 l. 813 les retire du formulaire (D-413). Mais la section « Rendu et accessibilité de la phrase » (ch. 13 l. 1241, 1243) dit encore : « Le titre et les lignes Compte à rebours/Fin gardent leur hiérarchie » et « sans rogner Compte à rebours/Fin ».
- **C-4 — Typographie et position de la phrase.** Ch. 13 l. 823 et 1241 : Inter 13, interligne 20, x39, largeur 324. Ch. 10 l. 317 : « Style `KODJO / Body` (`14/20`) » et « placé en bas du contenu à `spacing/24` de l’action finale ». Registre du 10/10 (demandes 17 et 21) : corps 14, phrase de x48 à x354, cadre `#F9FAFC`. Selon les captures, la carte n’est pas en bas du contenu : elle est suivie du Média.
- **C-5 — Steppers permanents ou révélés.** Ch. 08 l. 371 (Pause : « Stepper permanent en séries identiques ») et l. 372 (Nombre de séries : « Commandes − / valeur / + permanentes ») contredisent CE-UI-10 l. 1063 (« Valeur numérique au repos, ± au toucher »), les règles communes l. 1192 (« appui révèle ± ») et l. 1204 (« les boutons ± apparaissent à l’appui »). Les captures `9289:17849` et `9207:18817` montrent des valeurs en pastille, sans ±.
- **C-6 — Accès Catégorie et Zones.** Ch. 10 l. 295 : « une icône `+` séparée de leur libellé ». Ch. 08 l. 364 : « pilule avec le nom après sélection ». Ch. 13 l. 825 : « états contour/plein de la planche 7245:13718 ». En face, le registre du 10/10 (demandes 13, 14 et 18 : une seule forme, glyphe plein `7287:13718`, sans fond une fois renseigné, composants « contour » à retirer) et la capture `8328:35698` (glyphe et libellé dans un voile, sans `+` séparé).
- **C-7 — Cadre « à l’échec » obsolète.** Ch. 10 l. 305 conserve « l’ordre `Séries` → cadre informatif transparent bordé `à l’échec` → `Pause` ». Pour la feuille, cette disposition est remplacée par D-419 (durée masquée) et par l. 297 du même chapitre (« Cette ancienne disposition ne définit plus l’éditeur actif »).

Pour C-3 à C-7, la règle d’ordre de lecture (ch. 07 → … → ch. 13 → Figma pour le visuel, AGENTS.md) et D-413 permettent de trancher sans nouvelle règle métier. Ce sont des résidus de texte. C-1 et C-2 demandent une confirmation (§5).

---

## 4. Références visuelles

Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP (`510:101`). Figma n’a pas été relu dans cette mission : les états décrits viennent du ch. 06, du ch. 13 et des captures du dépôt. Aucune valeur chiffrée n’est une règle (D-255, D-300).

### 4.1 Écran principal de l’éditeur (CE-T03-04)

| Nœud | État représenté | Capture du dépôt |
|---|---|---|
| `8328:35698` | Ajouter un exercice — Initial : invite « 1. Décrivez la première étape », « Modalités d’exécution » vide, Terminer gris | `images/circuits-2026-10-12/8328-35698.png` (ch. 06 l. 581-585) |
| `8328:35740` | Nom, Description et Média renseignés | `circuits-2026-10-12/8328-35740.png` (non affichée au ch. 06) |
| `8328:36278` | Catégorie renseignée (régime intermédiaire) | `circuits-2026-10-12/8328-36278.png` |
| `8328:36853` | Paramètres — Champ vide : 4 étapes, invite « 5. Étape suivante » | `circuits-2026-10-12/8328-36853.png` (ch. 06 l. 569-573) |
| `8328:37022` | Résumé affiché : phrase sans Compte à rebours / Fin, Terminer actif | `circuits-2026-10-12/8328-37022.png` |
| `4734:6342` | Modifier un exercice | `parametres-2026-10-18/figma-4734-6342.png` |
| `8328:36781` | Abandon (confirmation) | `circuits-2026-10-12/8328-36781.png` |
| `7867:14511` / `7867:14580` | Modèles A (retenu) et B de la Description (planches d’arbitrage) | Aucune ; registre du 10/10 l. 205 |
| `7119:27855` | Phrase longue de 224 caractères | Aucune ; ch. 13 l. 827 |
| Historiques (ch. 13 l. 773, 821) | `3943:6064`, `4217:6980`, `5088:6398`, `3542:4656`, `6407:9458`, `6407:9702`, `6665:27862` et `6665:28050` | Références de shell antérieures au 12/10 |

### 4.2 Feuille Paramètres d’exécution (CE-UI-10), relevé du 18/10 (ch. 06 l. 673-833)

`8328:36923` champs vides · `8328:37092` Mode segmenté · `8328:37760` série en durée · `8328:37862` roulette de série numérique seule · `8328:38084` roulette Durée de l’exercice · `8328:37972` côté replié · `8328:38193` côté déployé · `8328:38409` message de durée ajustée · `8328:38513` Mode au-dessus d’un tableau variable · `8328:38632` Répétitions avec cadence · `8328:38741` Répétitions sans cadence (signaux directement visibles) · `8328:38848` tableau replié · `8470:13303` cas mixte · `9232:44646` roulette de cellule variable (nommée à tort « Durée d’une phase ») · `8328:39072` une seule série · `8328:39279` déplacement · `9289:17849` charge commune · `9290:17953` séries variables avec charge · `9292:18077` clavier numérique · `9307:18208` Durée de l’exercice déployée. Phases : `8982:15172` phases verrouillées (séries variables, tout à l’échec) et `9207:18817` tableau de trois phases. Captures dans `images/parametres-2026-10-18/`.

### 4.3 Écarts Figma déjà relevés (ce ne sont pas des règles)

« A la cible » sans accent sur toutes les frames ; `8470:13303` affiche « A la cible età l’échec ». `9292:18077` montre un clavier sans séparateur décimal, avec la Durée en surbrillance au lieu de la charge. `8328:39072` montre Avec désactivé (contraire à D-415). `8328:36923` n’a pas de Condition d’arrêt sélectionnée (contraire à D-416). `8328:37092` montre Valider actif (contraire à D-337). `9207:18817` porte un nom hors convention et une barre bleue résiduelle. `9232:44646` est mal nommé. Sources : ch. 06 l. 675-827 et questions-hermann, « Écarts Figma relevés ».

### 4.4 États sans référence visuelle (ch. 06 l. 839, CE-UI-10 l. 1017)

Saisie de la charge en séries identiques ; clavier décimal ; séries identiques à l’échec avec durée masquée (D-419) ; roulette Répétitions des séries identiques sans À l’échec (D-418) ; N = 1 avec Avec et sans Enchainement (D-415) ; phrase avec mention de charge (D-414) ; trois écrans dédiés aux phases (« Phases (aucune) », « Phases (définies) », « Phases verrouillées ») encore à reporter dans Prototype MVP ; roulette de durée d’une phase ; ajout d’une phase ; passage de Avec à Sans avec des phases existantes ; Description en modification (suppression ou édition d’une étape) ; éditeur avec clavier ouvert sur une étape et zone de protection de Terminer.

### 4.5 Propriétés manquantes pour implémenter (à relever dans Figma, sans en déduire de règle)

- Écran principal : variables liées et tailles exactes du titre d’en-tête, des titres de section, du nom, de la classification, du numéro et du texte d’étape et de la phrase. Le ch. 13 dit 13, le registre dit 14 (C-4). Il manque aussi la gouttière de numérotation et le fond de la carte des modalités, ainsi que la marge de la zone de protection au-dessus de Terminer et son comportement avec le clavier.
- Feuille : Q-V3-10 a relevé les variables de `9290:17953` (surface `#F5F7FA`, bordure `#E0E3E8`, texte secondaire `#595E66`, désactivé `#BEC2CC`, primaire `#0508E5`, valeur Inter Semi Bold 13, libellé Inter Regular 14). En revanche, « le gris des cadres et le violet de sélection ne sont liés à aucune variable » et les tokens du ch. 12 restent inchangés. Or `tokens.ts` est verrouillé par `tokensSpecification.test.ts`. Restent aussi à relever : les dimensions des options segmentées, la taille du chevron, le style du résultat dérivé non modifiable (« violet atténué, texte blanc », spec v3 l. 225), le rendu d’une valeur en cours de saisie dans une cellule de charge et la marge du clavier.
- Phases : le contrôle d’ajout d’une phase (aucun +/− dans `9207:18817`) ; le rendu de la durée de série calculée. `9207:18817` affiche « 1 min 30 s » en pastille, comme une valeur modifiable, alors que ch. 08 l. 269 la dit non modifiable.

---

## 5. Points réellement non résolus

### 5.1 Points bloquants pour un changement

| ID | Point | Sources | Ce qu’il bloque |
|---|---|---|---|
| P-2 | **Reprise de l’ancienne Description en texte libre** dans la structure en étapes, « sans découpage destructif arbitraire » (cadrage l. 25). Aucune source ne fixe la règle de conversion. Structure de stockage technique À CLARIFIER. | ch. 09 l. 332 ; D-425 | Lot 4 : modèle et migration de la Description |
| P-3 | **Étapes vides et limite de 1 000 caractères** dans une séquence (par étape ou au total), restées À CLARIFIER. Il faut aussi savoir comment supprimer ou fusionner une étape (retour arrière sur une étape vide). | ch. 07 l. 715 ; ch. 08 l. 366 ; CE-T03-04 l. 841 | Lot 4 : saisie, modification et validation |
| P-4 | **C-1 : le contrôle de durée d’une phase propose-t-il « À l’échec » ?** D-370 et ch. 08 l. 244 contre D-412 et spec v3 l. 256 ; coordination Q-V3-17 jamais close. | §3.10 | Lot Phases : contrôle de durée |
| P-5 | **Compléments phases du ch. 08 l. 342-343** : la durée minimale et le pas d’une phase ne sont pas arbitrés (« il serait incorrect de lui appliquer mécaniquement la borne minimale documentaire de 5 s ») ; la création sans durée de série préexistante (Avec alors que la durée vaut « — ») n’est pas réglée ; le retour après une liste entièrement nulle non plus. Le passage d’Avec à Sans lorsque des phases existent et l’ajout d’une phase sans boutons +/− ne sont pas décrits (`pr/traitement-pr.md` l. 50). | ch. 08 l. 340-347 ; CE-UI-10 l. 1132 | Lot Phases : édition et normalisation |
| P-6 | **Phrase de synthèse avec phases** : « les nouveaux textes restent à valider » ; le corpus de 276 cas ne les couvre pas. | CE-UI-10 l. 1047 ; ch. 11 l. 116 ; ch. 08 l. 344 | Adaptation de la synthèse aux phases (cadrage l. 30) |
| P-7 | **C-2 : ordre Description / Paramètres et titre de section** (« Modalités d’exécution » ou « Paramètres d’exécution »). Figma (captures du 18/10) et ch. 13 et 08 divergent. Par la règle d’ordre de lecture, Figma tranche le layout, mais la structure §7 du contrat est une prescription écrite. | §3.10 | Lot 5 : conformité de l’écran principal |

### 5.2 Points non bloquants

- **P-1 — Champs en saisie numérique.** Selon les sources, le clavier est réservé à la charge (RM-239, D-405, spec v3 §11.3). La cadence « Autre » garde le mécanisme ± (RM-245). Il faut seulement que Hermann confirme que le cadrage (l. 34) ne vise rien d’autre. Si l’extension visait d’autres champs, une décision nouvelle serait nécessaire, et le point deviendrait bloquant pour ces champs.
- **P-8 — Terminer abaissé et zone de protection.** Ces demandes n’ont pas de décision ni de mesure contractuelle. Les références sont D-349, la demande 20 du registre (y802) et Figma.
- **Corrections textuelles C-3 à C-7** : elles se tranchent par D-413 et Figma.
- **Q-V3-02** (corpus de recette v15 des phrases de côtés à mettre à jour) : coordination de recette ; la forme « côté 1 / côté 2 » est décidée par D-407.
- **Q-V3-10** (tokens de la feuille non liés) : coordination DSF. Elle ne bloque que si un nouveau token est requis, ce qui casserait `tokensSpecification.test.ts` par conception.
- **PRE-4 Q36** : position initiale de la roulette sur une valeur historique hors bornes, À CLARIFIER (ch. 13 l. 1228). Non-régression.
- **Ch. 08 l. 345** : écart préexistant entre le code (1..5999 s) et la documentation (5..3535 s), signalé « à rattacher au bon lot ». À vérifier dans le code PRE-4 livré.
- **Arrondis à zéro de l’adaptation proportionnelle** (D-373, ch. 08 l. 342) : relèvent des formats, hors éditeur.
- **D-427 à D-429** (configuration de l’option Programme, déclencheur de la modale Résultat de série) : hors périmètre PRE-5 éditeur.

### 5.3 Questions Q-V3 : état

Les questions Q-V3-01, 03 à 08, 15, 16, 19 et 20 sont closes par D-414 à D-424. Les questions Q-V3-02, 09, 11 à 14 et 18 sont closes par des décisions existantes. Restent ouvertes, comme coordinations seulement : Q-V3-02, Q-V3-10 et Q-V3-17 (`questions-hermann.md`, bilan l. 21). Seule Q-V3-17 touche une règle PRE-5 : c’est P-4.

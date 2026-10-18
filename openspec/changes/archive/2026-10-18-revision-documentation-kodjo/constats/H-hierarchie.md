# H — Hiérarchie des sources normatives et remplacements

Dépôt lu en lecture seule : `C:\Dev\KODJO-OPENSPEC-DOCS\docs` (branche docs/openspec-revision, base main 6656fefc). Chemins abrégés : `chNN` = `docs/Specifications-fonctionnelles/NN – ….md` ; les autres chemins sont relatifs à `docs/`. Les numéros de ligne ont été vérifiés par `grep -n` sur les fichiers tels qu'ils sont sur le disque. Certains fichiers racine ont une ligne vide entre chaque paragraphe, d'où des numéros impairs.

PRE-4 figé (rappel) : ch01, ch04–ch13, DSF-INTERFACE-GENERALE-2026-10-08, DSF-CIRCUITS-CONTROLES-2026-10-12, DSF-DEUX-MODES-ECHEC-2026-10-13, DSF-PHRASES-V15-2026-10-07, MATRICE-DEUX-MODES-ECHEC-2026-10-13 (signalés **[PRE-4]** dans l'inventaire).

---

## 1. Inventaire des sources et statut déclaré

Méthode : lecture des 30 premières lignes de chaque fichier, puis grep `normatif|référence|historique|remplac|autorité|prévaut|fait foi`. La colonne « nb » donne le nombre de lignes du fichier qui contiennent ces mots.

### 1.1 Chapitres et pages d'entrée

| Source | Statut déclaré (citation exacte, ligne) | nb | Remarque |
|---|---|---|---|
| INDEX.md | l.3 « La documentation de référence forme un ensemble unique de treize chapitres. Les règles métier, calculs et comportements sont définis ici » | 2 | Aucune règle d'ordre entre les chapitres ; ne cite ni DSF ni matrice. |
| README.md | l.11 « Les spécifications définissent les règles métier ; Figma définit le layout et le rendu des états. » ; l.65 « [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice courante Figma](…) » ; l.68 « v12 et v10.2 sont historiques ; leurs règles remplacées ne doivent pas être utilisées pour la cible. » | 8 | Désigne comme « courants » un DSF et une matrice qui se déclarent eux-mêmes antérieurs (H-15). |
| PRODUCT.md | l.432 « `PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées. » ; l.434–442 : ordre de référence en 7 rangs ; l.3 « **Référence courante — évolutions v15 :** » | 44 | Synthèse déclarée qui contient pourtant des règles (H-16). |
| ch01 [PRE-4] | aucun statut global. l.169 « La référence active est [Paramètres en modale v13](…#parametres-exercice) » ; l.371 « Référence normative ciblée : [DSF — Cartes, icônes et appuis]… Ces règles finales prévalent sur les anciennes formulations d'affichage du présent chapitre » | — | Contient le glossaire (INDEX l.21). |
| ch02 | aucun statut déclaré (l.5 « Ce chapitre décrit les utilisateurs visés ») ; l.233 « Référence normative : [v13](…) » | — | |
| ch03 | aucun statut déclaré (l.7 « Cette note décrit les objectifs ») ; l.530 même bloc « Référence normative ciblée : [DSF — Cartes…] » | — | |
| ch04 [PRE-4] | aucun statut déclaré (l.5 « Il décrit le fonctionnement général ») ; l.411 bloc DSF-Cartes « prévalent » | — | |
| ch05 [PRE-4] | aucun statut déclaré ; l.258 bloc DSF-Cartes « prévalent » ; l.270 « Référence normative : [v13] » | — | |
| ch06 [PRE-4] | aucun statut global ; l.232 « Ces règles communes prévalent sur les coordonnées des captures. » ; l.2275 bloc DSF-Cartes | — | |
| ch07 [PRE-4] | l.1 « Ce document devient le registre permanent des décisions de conception du produit. » | — | Colonne « Statut » par décision (cf. §3). |
| ch08 [PRE-4] | l.9 « Il constitue la référence fonctionnelle utilisée pour le développement. » ; l.33 « Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. » ; l.60 « En cas de divergence entre un wireframe et le présent document, la spécification fonctionnelle prévaut. » | — | |
| ch09 [PRE-4] | l.9 « Il définit les principales entités métier… » ; l.1130 bloc DSF-Cartes | — | |
| ch10 [PRE-4] | l.7 « Ce chapitre rassemble les règles fonctionnelles qui s'appliquent à plusieurs écrans ou parcours. Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06. » | — | |
| ch11 [PRE-4] | l.5 « Ce chapitre définit les API fonctionnelles internes » ; l.339 bloc DSF-Cartes | — | |
| ch12 [PRE-4] | l.3 « Ce chapitre définit l'architecture technique du MVP. » ; l.1519 bloc DSF-Cartes | — | |
| ch13 [PRE-4] | l.7 « ## 1. Objet et statut normatif » ; l.19–25 « Sources et ordre d'application » ; l.4057 « ## Clarification d'autorité et de portée » | — | |

### 1.2 DSF

| Source | Statut déclaré (citation exacte, ligne) | nb |
|---|---|---|
| DSF-CADENCE-2026-10-06 | l.1 « # DSF courant — Cadence et corrections du05/10 intégrées le06/10/2026 » ; l.3 « [DSF Deux modes…] remplace les références à trois modes » ; l.5 « Référence de layout, tokens et qualification documentaire ; aucune règle de calcul issue de Figma… Le présent état supersède les valeurs incompatibles des inventaires DSF antérieurs » | 22 |
| DSF-PAUSES-ICONES-2026-10-07 | l.3 « Complète [DSF Cadence](…), avec priorité sur ses prescriptions incompatibles. » | 3 |
| DSF-BIP-CADENCE-2026-10-07 | l.3 « [DSF Deux modes…] remplace les références à deux modes » ; l.5 « [DSF Circuits…] fait autorité sur les nouveaux contrôles de séries » ; l.7 « Complément courant à DSF Cadence et DSF Pauses/icônes ; remplace uniquement leurs dispositions incompatibles. » | 4 |
| DSF-CARTES-DUREE-2026-10-07 | l.3 « Ce complément remplace les anciennes dispositions de badge de durée Catalogue » | 8 |
| DSF-CARTES-ICONES-APPUIS-2026-09-30 | l.3 « Actualisation 08/10 : les règles générales d'interface sont définies dans [DSF-INTERFACE-GENERALE…] » ; l.6 « État courant06/10 : [DSF Cadence…] … Les mesures/captures datées ci-dessous restent historiques lorsqu'elles sont remplacées » | 31 |
| DSF-PHRASES-V15-2026-10-07 [PRE-4] | aucun statut déclaré (l.3 « Complément ciblé à DSF Bip/Cartes/Pauses ; aucun nouveau shell. ») | 5 |
| DSF-SEGMENTES-TITRES-2026-10-07 | aucun statut déclaré (l.3 « Complément au DSF Cadence ; aucune refonte de shell. ») | 7 |
| DSF-INTERFACE-GENERALE-2026-10-08 [PRE-4] | l.3 « [DSF Circuits…] fait autorité sur les nouveaux contrôles de séries… » ; l.5 « Elles modifient le rendu ; les règles métier restent portées par les spécifications. » | 7 |
| DSF-CIRCUITS-CONTROLES-2026-10-12 [PRE-4] | l.5 « Référence courante pour les éléments ci-dessous… remplace les anciennes descriptions d'interrupteur de régime, de steppers permanents par cellule… Ne change ni shells ni règles métier. » | 6 |
| DSF-DEUX-MODES-ECHEC-2026-10-13 [PRE-4] | l.3 « Référence courante pour les composants ci-dessous… Les règles métier sont dans la [spécification](09…#cibles-typees) » | 4 |
| DSF-FORMATS-SEANCES-2026-10-14 | l.3 « Statut : extension documentaire du DSF courant. » | 3 |
| DSF-SERIES-VARIABLES-2026-10-02 | l.3 « [DSF Circuits…] fait autorité » ; l.6 « État courant06/10 : [DSF Cadence…] » | 7 |
| DSF-PARAMETRES-MODALE-2026-10-01 | l.1 « — référence historique » ; l.9 « Remplacé pour les paramètres, les pauses et les côtés par la cible du 02/10/2026. » ; l.13 « [Spécification normative v12](08…#parametres-exercice) » | 5 |
| DSF-V2-MOTIFS-LOT-3 | l.3 « **Statut :** relevé documentaire validé pour la PR #247. » ; l.4 « **Référence fonctionnelle active :** `…SPECIFICATION-PARAMETRES-MODALE-v12.md`. La documentation fonctionnelle et le classeur v10 déterminent les règles de gestion » | 8 |

### 1.3 Matrices, inventaires, journaux

| Source | Statut déclaré (citation exacte, ligne) | nb |
|---|---|---|
| MATRICE-CADENCE-FIGMA-2026-10-06 | l.1 « # Matrice courante — Figma, Cadence, captures et contrats » ; l.3 « **État antérieur au lot Bip de cadence.** » ; l.5 « **Inventaire historique du 06/10.** » | 10 |
| MATRICE-FIGMA-2026-10-07 | l.1 « # Inventaire courant des références Figma » ; l.6 « **Relevé historique du lot précédent.** La [matrice v15] porte la référence courante » | 8 |
| MATRICE-BIP-FIGMA-2026-10-07 | « **Relevé historique du lot précédent.** » ; « **État historique supersédé :** la [matrice cartes/phrases] remplace ce bilan. » | 6 |
| MATRICE-CARTES-PHRASES-2026-10-07 | « **Relevé historique du lot précédent.** » ; l.5 « Les décisions explicites du propriétaire priment sur les contradictions des prompts. » | 16 |
| MATRICE-EVOLUTIONS-V15-2026-10-07 | aucun statut propre ; renvoie vers des lots postérieurs pour les captures (« Les preuves de ce lot restent datées ») | 11 |
| MATRICE-VOILE-MODAL-2026-10-07 | aucun statut déclaré ; contient une « ## Règle consolidée » (voile unique) | 4 |
| MATRICE-COMPLEMENTS-2026-10-07 | aucun statut déclaré ; « Les spécifications définissent le comportement ; Figma fournit les titres et le layout. » | 3 |
| MATRICE-COUVERTURE-FIGMA-CHAPITRE-06 | l.3 « Actualisation ciblée du 12/10 » ; l.6 « État antérieur au lot Bip » ; l.8 « **Inventaire historique.** » ; l.10 « **Inventaire courant :** [matrice06/10] » | 30 |
| MATRICE-ECRANS-CARTES-2026-09-30 | mêmes bandeaux : « inventaire historique » / « État antérieur » / « Inventaire courant : matrice06/10 » | 13 |
| MATRICE-SERIES-VARIABLES-2026-10-02 | l.1 « complété et remplacé pour les références Figma par [l'état des lieux du03/10]… preuve historique » | 7 |
| MATRICE-PLANIFICATION-2026-10-08 | l.3 « Cette matrice ne vaut ni recette de l'application ni validation du prototype interactif. » | 3 |
| MATRICE-CIRCUITS-2026-10-12 | aucun statut déclaré (propagation) | 2 |
| MATRICE-DSF-CIRCUITS-2026-10-12 | aucun statut déclaré (traçabilité) | 2 |
| MATRICE-DEUX-MODES-ECHEC-2026-10-13 [PRE-4] | aucun statut déclaré (« inventaire, propagation et vérification ») | 5 |
| MATRICE-FORMATS-SEANCES-2026-10-14 | l.3 « « Documenté » ne signifie pas « implémenté » » | 16 |
| MATRICE-TRACABILITE-BILATERALITE | l.1 « — référence historique » ; « Remplacé pour les paramètres, les pauses et les côtés » | 4 |
| MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE | idem | 4 |
| MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES | l.1 « — référence historique » ; l.7 « Remplacé pour les paramètres… » | 4 |
| INVENTAIRE-DSF-CIRCUITS-2026-10-12 | « Relevé effectué avant les modifications documentaires de ce lot » (inventaire préalable) | 4 |
| ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03 | l.3 « **Inventaire courant :** [matrice06/10] … Cadence/phrase/DSF actifs : paramètres v13, Phrase v1 et DSF-CADENCE-2026-10-06. » | 17 |
| JOURNAL-DSF-COMPLEMENTS-2026-10-07 | l.3 « Suivi courant du journal du05/10 archivé ; les mesures historiques ne sont pas réécrites. » | 1 |

### 1.4 Rapports, revues, sources, arbitrages, conception, divers

| Source | Statut déclaré (citation exacte, ligne) | nb |
|---|---|---|
| ARBITRAGES-CONTRATS-2026-09-30 | l.1 « — référence historique » ; l.3 « Remplacé pour les paramètres… » ; l.6 « [Spécification normative v12](…SPECIFICATION-PARAMETRES-MODALE-v12.md) » | 2 |
| BACKLOG-SEGMENTS-CATALOGUE-2026-10-07 | l.3 « Statut : **spécifié, à développer et à vérifier dans le code**. » | 0 |
| CLOTURE-CAPTURES-PHRASES-2026-10-07 | l.3 « **Relevé historique du lot précédent.** » | 3 |
| CONCEPTION-EXECUTION-MEDIA | l.6 « Statut fonctionnel : **conception validée** » ; citée par ch08 l.1778 « Référence normative détaillée » | 2 |
| CORRECTION-PHASES-EXERCICE-SEANCE-2026-10-12 | aucun statut déclaré ; contient une « ## Règle » (D-214 révisée) | 3 |
| ETAT-DES-LIEUX-… | voir §1.3 | |
| RAPPORT-CONFORMITE-BILATERALITE | l.1 « — référence historique » ; l.6 « [Spécification normative v12] » | 2 |
| RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE | l.1 « — référence historique » ; « [Spécification normative v13] » | 2 |
| RAPPORT-CORRECTION-CONTRATS-2026-09-30 | aucun statut déclaré (« 29 contrats actifs ») | 6 |
| RAPPORT-ECRANS-MODIFIES-2026-09-30 | l.1 « # Écrans modifiés — liste de référence » | 11 |
| RAPPORT-MISE-A-JOUR-CADENCE-2026-10-06 | l.7 « Références actives : [Paramètres v13](…), [Cadence v1](…), [Phrase v1](…), [DSF courant](DSF-CADENCE…) » | 13 |
| RAPPORT-MISE-A-JOUR-PARAMETRES-2026-10-01 | aucun statut déclaré | 2 |
| RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02 | l.1 « complété et remplacé pour les références Figma » ; « Cible : [v12](…) » | 47 |
| RAPPORT-RECONCILIATION-DOCUMENTAIRE-247-271 | aucun statut déclaré (« Les identifiants historiques de #247 sont conservés ») | 7 |
| REPORT-BIP-2026-10-07 | l.3 « **État historique supersédé :** » | 5 |
| REPORT-MAJ-2026-10-07 | aucun statut ; l.5 « Les décisions explicites prévalent, Figma gouverne le layout et Excel seulement les formulations. » | 3 |
| REVUE-COHERENCE-FORMATS-2026-10-14 | aucun statut déclaré (analyse) | 2 |
| SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01 | l.3 « Source historique du 01/10. Les valeurs de voile décrites ci-dessous sont supersédées » | 5 |
| SOURCE-SERIES-VARIABLES-2026-10-02 | l.3 « La source du01/10 reste inchangée, historique. » ; l.5 « Consolidation normative : [v12](…) » | 3 |
| KODJO-V2-CERTIFICATION-RESUME-DELTA-2026-09-12 | « **CERTIFIÉ — PASS** » (outillage, pas une spécification produit) | 2 |
| KODJO-V2-LEAN-OPERATING-CONTRACT | « Version : 0.6.18 », « Principe opposable » (outillage) | 2 |
| kodjo-v2-e2e-proof / -e2e-task / -final-task / -final2-task / -lint-fix-task | aucun statut déclaré (artefacts de test d'outillage) | 0 |
| AGENTS.md | aucun statut déclaré (consigne Expo) | — |
| CONTROLES-FORMATS-2026-10-14.json | aucun statut déclaré | 0 |
| CORPUS-PHRASES-FORMATS-2026-10-14.json | l.2 `"scope": "Extension Formats ; ne remplace pas le corpus Excel des phrases d'exercice"` | 1 |
| VERIFICATION-BIP / -CARTES-PHRASES / -COMPLEMENTS / -DOCUMENTAIRE / -EVOLUTIONS-V15 / -VOILE-MODAL (07/10) .json | aucun statut déclaré (preuves de lot) | 0–1 |

---

## 2. Règles de priorité écrites

| # | Source | Règle (verbatim) |
|---|---|---|
| R1 | INDEX.md:3 | « Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles » (aucun ordre entre chapitres) |
| R2 | README.md:11 | « Les spécifications définissent les règles métier ; Figma définit le layout et le rendu des états. » |
| R3 | README.md:68 | « v12 et v10.2 sont historiques ; leurs règles remplacées ne doivent pas être utilisées pour la cible. » |
| R4 | PRODUCT.md:434–442 | « En cas de contradiction, l'ordre de référence est : 1. registre des décisions de conception et arbitrages explicitement supersédants ; 2. glossaire, modèle fonctionnel et modèle de données ; 3. conception fonctionnelle détaillée ; 4. écrans et navigation ; 5. contrats d'écran du chapitre 13 ; 6. versions du produit et vision générale ; 7. documents de travail, historiques et revues externes. » |
| R5 | ch13:19–25 | « 1. décisions validées dans le chapitre 07, jusqu'à D-255, avec priorité aux décisions explicitement supersédantes ; … 2. modèle fonctionnel / modèle de données / règles métier ; 3. API fonctionnelles ; 4. architecture technique ; 5. chapitre 06 … ; 6. présent chapitre 13 ; 7. Figma pour le rendu visuel » |
| R6 | ch13:4059 | « Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios… Les shells, composants, DSF et contrats existants permettent de décliner des états » |
| R7 | ch08:33 / ch08:60 | « Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. » / « En cas de divergence entre un wireframe et le présent document, la spécification fonctionnelle prévaut. » |
| R8 | ch10:7 | « Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06. » |
| R9 | ch01:371 (et ch03:530, ch04:411, ch05:258, ch06:2275, ch08:1820, ch09:1130, ch10:293, ch11:339, ch12:1519) | « Référence normative ciblée : [DSF — Cartes, icônes et appuis](…). Ces règles finales prévalent sur les anciennes formulations d'affichage du présent chapitre dans ce périmètre uniquement. » |
| R10 | ch06:232 | « Ces règles communes prévalent sur les coordonnées des captures. » |
| R11 | ch08:1836 | « [Règles détaillées](10…#resultats-temporels) fait autorité sur les signaux, Pause/Reprise, reset, temps réel, arrière-plan et seuil de sécurité ; paramètres v13 pour pauses/côtés/Récupération, phrase v1 pour le texte. » |
| R12 | ch01:277, ch10:135, ch10:194 | « Bip v2 gouverne calculs et périmètres. » |
| R13 | ch07:378 (D-255), ch07:448 (D-300) | « Spécifications et arbitrages déterminent calculs et comportements ; Figma définit uniquement le layout/rendu. » |
| R14 | ch07:559 | « Les décisions récentes prévalent, dans leur portée, sur les présentations antérieures (maquette figée du 08/10 comprise). » |
| R15 | ch07:510 | « Le montant330s et le trait hors placement priment sur les passages contradictoires de la source. » |
| R16 | ch13:4087 | « Le DSF du12/10 et Deux modes du13/10 supersèdent cette présentation pour la prochaine tranche » |
| R17 | DSF-PAUSES:3, DSF-BIP:7, DSF-CIRCUITS:5, DSF-CADENCE:5 | « avec priorité sur ses prescriptions incompatibles » / « remplace uniquement leurs dispositions incompatibles » / « remplace les anciennes descriptions… » / « supersède les valeurs incompatibles des inventaires DSF antérieurs » |
| R18 | MATRICE-CARTES-PHRASES:5, REPORT-MAJ:5 | « Les décisions explicites du propriétaire priment sur les contradictions des prompts. » / « Les décisions explicites prévalent, Figma gouverne le layout et Excel seulement les formulations. » |

**Règles incompatibles entre elles :**
- R4 et R5 se contredisent sur le rang de ch08 face à ch13, et sur la place de l'API et de l'architecture (R4 ne les cite pas). R7 (ch08:33) donne en plus à ch13 les « champs, contrôles et comportements » des écrans, et la préparation PRE-4 s'appuie sur cette ligne pour faire prévaloir ch13 sur ch08 (P11, P19). R8 donne les interactions écran par écran à ch06. Voir H-01.
- R5 borne la priorité des décisions à D-255 ; R4 n'a pas de borne. Voir H-02.
- R9, R16 et R17 donnent à des DSF une priorité sur des chapitres ou sur des décisions. Or R4 range implicitement les DSF au rang 7 ou ne les cite pas du tout, et R5 ne les nomme pas. Voir H-03.
- R14 pose un critère de récence. Il s'oppose au principe du rang 1 de R4 (« explicitement supersédants »). Voir H-14.
- R12 et R11 délèguent l'autorité à des noms de documents (« Bip v2 », « v13 », « phrase v1 ») qui n'existent plus comme fichiers. Voir H-07.

---

## 3. Chaînes de remplacement dans le ch07

### 3.1 Inventaire mécanique

- 365 lignes de tableau commencent par un identifiant D-xxx. Aucun D-xxx n'est défini deux fois.
- Identifiants absents : D-097, D-205, D-334, D-335. Seuls D-003, D-009 et D-010 sont déclarés « Non utilisé » (ch07:16–18). D-334 et D-335 sont utilisés dans `docs/preparation/PRE-3/…`, par exemple `plan-technique-corrige.md:64` « ## 8. Médias : architecture proposée et décisions D-334/D-335 ».
- D-046 et D-047 ne figurent que dans le tableau d'exemple « # Format » (ch07:7–8). D-047 n'est cité nulle part ailleurs.
- 24 décisions ont pour seul texte « Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git. » : D-237, D-252, D-268–271, D-274–277, D-279–286, D-288, D-292, D-295, D-296, D-302, D-305.
- 7 décisions sont « Supersédée sur ces points le 02/10/2026 » avec la mention « référence active v12 » : D-040, D-041, D-144, D-156, D-232, D-242, D-246. D-208 porte aussi cette mention dans sa colonne de traçabilité.
- D-357 à D-369 (ch07:618–630) n'ont pas de colonne Statut. CIR-01 à CIR-12 (ch07:589–600) forment un espace de noms distinct, sans statut par ligne (« toutes les lignes ci-dessous sont validées », l.585). Note : la PR #370 ajoute D-370 à D-375 sans statut, sur le même modèle.

### 3.2 Chaînes de remplacement (extraits significatifs)

| Décision | Statut écrit | Remplaçant | État du remplaçant | Encore citée comme applicable ? |
|---|---|---|---|---|
| D-204 | « Supersédée ; D-232 fait foi. » (l.260) | D-232 | « Supersédée sur ces points le 02/10/2026 » (l.312) | La chaîne aboutit à une décision elle-même supersédée. |
| D-215, D-231 | « Supersédée par D-232 / v10.2 » (l.290, 311) | D-232 et v10.2 | v10.2 est « historique » selon README:68 | — |
| D-232 | « Supersédée sur ces points le 02/10 » ; « référence active v12 » | D-246 puis D-247–D-253/v12 | v12 est historique (README:68) | Oui : ch04:399, ch08:1573, ch08:1595, ch09:1116, ch13:3099. Elle est aussi corrigée après coup en ch07:610 (« D-232, RM-234 et les contrats sont corrigés »). |
| D-246 | « Supersédée sur ces points le 02/10 » | D-247–D-253 | Validées | Oui : ch08:1573 « les valeurs initiales D-246 » ; ch13:3071. |
| D-208, D-209, D-217, D-238 | « …incompatibles remplacés par D-302–D-307 » | D-302 et D-305 | Textes vidés (« Prescription courante : Bip v2… ») | ch13:650 « selon D-305 » ; ch13:1318 « D-302 confirme… » |
| D-237 | « Révisée le07/10 — seconde clarification » (l.329) | Bip v2 / D-308–313 | Sans rapport avec les appuis | Oui, environ 15 fois (ch06:89, ch08:1822, ch13:412…) |
| D-111 | « Validée post-Figma » (l.143) ; texte : « Disposition historique supersédée le13/10 par EC-01/02 » | EC-01/02 | Défini nulle part dans docs/ | P20 (préparation PRE-4) |
| D-222 et D-228 | « Révisée 08/10/2026 » / « Validée DSF » | D-343 (l.554), D-355 (l.580) | Validées le 12/10 | Oui : RM-200 (ch10:69), ch08:1592, PRODUCT:304 |
| D-251 | « Validée » (l.374) : « cellule et message en ligne » | D-337 (l.548), qui « remplace le message en ligne de chapitre 08 » sans nommer D-251 | Validée | D-251 n'est pas mise à jour |
| D-298 | « Validée, consolidation » : « phrases de pauses fixées par les276 cas v14 » | D-315 (l.495), puis D-321 (v15) | Validées | D-298 garde la mention v14 |
| D-311 | « Supersédée par D-314 » | D-314 | Validée | Pas de citation résiduelle trouvée |
| D-339, D-341 | « Validée, Hermann 12/10 » | ch13:4087 : « Le DSF du12/10 et Deux modes du13/10 supersèdent cette présentation » | DSF | Remplacement fait par un DSF sans décision Dxxx (P9) |

Grep des autres décisions supersédées (D-006, 015, 016, 021, 062, 104, 106–109, 117–122, 126, 135, 137, 138, 145, 146, 152, 153, 155, 164, 166, 173, 181, 186, 201, 204, 207, 215, 231, 311) dans les chapitres hors ch07 et dans PRODUCT.md : aucune citation, sauf D-119 en ch05:211 (« retirée avec D-119/D-328 », citation historique correcte). D-242 est cité 9 fois, toujours avec « retiré » ou « supersédée » : correct.

### 3.3 Règles RM, ED, EC, CE, RG

- RM : 180 identifiants définis, tous dans ch10. Aucun n'est défini deux fois. RM-203 est défini par un titre et des sous-règles (`## RM-203`, l.236–248) plutôt qu'en tableau. Plusieurs plages ne sont pas utilisées (121–122, 133–142, 165–187, 193–205, 224–230) et aucune n'est déclarée réservée. RM-071, 072, 075, 125 et 126 contiennent une référence tronquée : « Hors règles propres des formats (RM-et RM-) » (H-13).
- ED-xx : aucune occurrence dans docs/ hors préparation. EC-01, EC-02 et EC-05 ne sont cités qu'en ch07 (l.143, 446) et ne sont définis nulle part (H-08).
- CE-xx : les doublons trouvés entre ch13:216–245 et MATRICE-CARTES-PHRASES:70–99 sont des index de traçabilité, pas des définitions concurrentes. ch13:13 annonce « Les 40 contrats actifs », alors que 37 titres CE-… distincts ont été comptés dans ch13 ; README:66 annonce « 30 contrats ». Cet écart de comptage relève d'une autre dimension et n'est signalé ici que pour mémoire.
- RG-1 à RG-13 : définis dans DSF-CARTES-ICONES-APPUIS:114–126 et résumés dans 10 chapitres (H-19).

---

## 4. Contenus normatifs résiduels hors chapitres (synthèse)

- **README « Références actives »** (l.60–68) : désigne DSF-CADENCE comme « DSF courant » et MATRICE-CADENCE comme « matrice courante » (H-15).
- **PRODUCT.md** : formules de durée (l.62, 64, 187), pause de sécurité (l.219), règle de sélection des référentiels (l.304), §13 de gouvernance, « Références actives » (l.518) (H-16).
- **DSF-CARTES-ICONES-APPUIS** : RG-1 à RG-13, qualifiées de « règles de gestion » (l.12), dont RG-10, qui définit une donnée de Profil (H-19).
- **DSF-CADENCE §4** (l.96–100) : rappelle des règles métier (« ligne commune aux trois modes », Circuit et Tour, segments du Catalogue) (H-19).
- **DSF-V2-MOTIFS-LOT-3:4** : « Référence fonctionnelle active » v12 et « classeur v10 détermin[e] les règles de gestion », sans bandeau historique (H-18).
- **MATRICE-VOILE-MODAL:7** « Règle consolidée », **CORRECTION-PHASES:5** « Règle » : règles déjà intégrées aux chapitres, donc des doublons à risque. Elles n'ont pas été comparées ligne à ligne.
- **CONCEPTION-EXECUTION-MEDIA** : présenté par ch08:1778 comme « Référence normative détaillée ». C'est un document hors chapitres qui conserve un rang normatif, alors que INDEX:21 affirme que les annexes ont été réintégrées.

---

## 5. Constats

### H-01 — Trois ordres de priorité écrits, incompatibles entre eux
- qualification : CONTRADICTION_REELLE
- gravité : bloquant
- passages :
  - `PRODUCT.md:438` — « 3. conception fonctionnelle détaillée ; »
  - `PRODUCT.md:440` — « 5. contrats d'écran du chapitre 13 ; »
  - `ch13:19` — « 1. décisions validées dans le chapitre 07, jusqu'à D-255 … ; D-247 à D-255 et la section Paramètres et brouillon du chapitre 08 pour l'éditeur ; »
  - `ch13:24` — « 6. présent chapitre 13 ; »
  - `ch08:33` — « Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. »
  - `ch10:7` — « Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06. »
- analyse : les deux listes ordonnent le même objet, les chapitres 01 à 13 en cas de conflit, sur le même périmètre, la cible MVP.
  - PRODUCT place ch08 (rang 3) au-dessus de ch13 (rang 5). ch13 §2 ne retient de ch08 que la section éditeur, ajoute l'API et l'architecture (rangs 3 et 4) et place ch13 au dernier rang des chapitres.
  - ch08:33 attribue au ch13 les « champs, contrôles et comportements », et la préparation PRE-4 s'en sert pour faire prévaloir ch13 sur ch08 (P11, P19). PRODUCT impose l'inverse.
  - PRODUCT range le « glossaire » au rang 2 et la « vision générale » au rang 6. Or le glossaire est intégré au ch01 (INDEX:21) : le même chapitre se trouve donc à deux rangs.
  - ch10:7 et ch08:33 donnent les interactions écran par écran à deux chapitres différents (ch06 et ch13).
  
  Ce n'est pas une DIFFERENCE_PERIMETRE : ch13 §2 vaut « pour les contrats actifs », c'est-à-dire tous les comportements d'écran, que PRODUCT couvre aussi.
- proposition : un seul ordre, écrit dans INDEX.md, la page d'entrée normative, et repris par renvoi seulement dans PRODUCT §13 et ch13 §2. Ordre suggéré : ch07, avec les décisions supersédantes explicites ; puis ch09/ch04/ch10 ; puis ch08 ; puis ch13 pour les champs et contrôles d'écran ; puis ch06 ; puis ch11/ch12 ; puis ch01 (glossaire au même rang que ch09) ; puis ch05 ; puis DSF (rendu) ; puis Figma. Remplacer PRODUCT:434–442 par un renvoi. Fixer explicitement la règle ch08 contre ch13 : ou bien « ch13 prévaut pour les champs d'écran » (lecture P11/P19), ou bien l'inverse.
- statut PR/décisions : couvert partiellement par P4, P11 et P19 de la préparation PRE-4 BMAD. Ce sont des lectures de Claude, pas des décisions de Hermann.
- touche_PRE4 : oui
- question à Hermann : en cas de conflit entre une règle de comportement de ch08 et un champ ou un état d'un contrat ch13, lequel fait foi ? Le glossaire du ch01 a-t-il le rang du modèle de données ?

### H-02 — L'ordre d'application du ch13 s'arrête à D-255
- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `ch13:19` — « 1. décisions validées dans le chapitre 07, jusqu'à D-255, avec priorité aux décisions explicitement supersédantes »
  - `ch13:4100` — « aucun message en ligne (D-337, 12/10 : remplace le message nommant la Série à renseigner) »
- analyse : D-256 à D-369, dont D-337, D-339, D-343, D-349 et D-354, décisions de Hermann appliquées à CE-UI-09, CE-UI-10 et CE-T03-04, sont hors de la borne du rang 1. Lu à la lettre, ch13 §2 relègue ces décisions sous le ch13 lui-même. Pourtant la préparation PRE-4 (P4) utilise ce même §2 pour faire prévaloir D-337. La borne n'est qu'un reste de la date de rédaction, mais elle rend la règle fausse pour plus de 110 décisions.
- proposition : supprimer « jusqu'à D-255 » et le remplacer par « toutes les décisions validées du chapitre 07 ». Ajouter un renvoi vers la règle unique de H-01.
- statut PR/décisions : couvert implicitement par P4, qui lit la règle sans tenir compte de la borne.
- touche_PRE4 : oui
- question à Hermann : non nécessaire (correction rédactionnelle).

### H-03 — Les DSF n'ont pas de rang, mais prévalent sur des chapitres et sur des décisions
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch01:371` — « Référence normative ciblée : [DSF — Cartes, icônes et appuis](…). Ces règles finales prévalent sur les anciennes formulations d'affichage du présent chapitre dans ce périmètre uniquement. » (bloc identique dans 10 chapitres, R9)
  - `ch13:4087` — « Le DSF du12/10 et Deux modes du13/10 supersèdent cette présentation pour la prochaine tranche »
  - `PRODUCT.md:442` — « 7. documents de travail, historiques et revues externes. »
- analyse :
  - PRODUCT et ch13 §2 ne nomment pas les DSF. Le seul rang possible dans PRODUCT est le rang 7, soit le dernier.
  - Dix chapitres déclarent pourtant DSF-CARTES-ICONES-APPUIS « normatif » et prévalant sur leur propre texte. Ce DSF n'est pas dans la liste figée PRE-4 et contient des règles de gestion (RG-1 à RG-13).
  - ch13:4087 fait remplacer par deux DSF la présentation décidée par D-339 et D-341 (« Validée, Hermann 12/10 »), sans décision Dxxx. Cela contredit le rang 1 du registre et D-255, selon lequel les DSF ne portent que le rendu.
- proposition :
  - Inscrire dans la règle unique (H-01) : « DSF = référence de rendu, sous les chapitres, sans effet sur les règles métier ».
  - Remplacer les 10 blocs « Référence normative ciblée… prévalent » par : « Rendu des cartes : DSF-CARTES-ICONES-APPUIS ; règles : RG-x intégrées ici ».
  - Pour ch13:4087, créer une décision Dxxx nommant D-339 et D-341 comme remplacées, ou retirer le mot « supersèdent ».
- statut PR/décisions : couvert partiellement par P9 (lecture D-339/D-341) et P10/P23 (DSF Circuits pris comme supersédant).
- touche_PRE4 : oui
- question à Hermann : confirmez-vous que la présentation D-339 (fermeture progressive) et D-341 (typographie des options) est remplacée pour PRE-4 par le DSF Circuits et le DSF Deux modes ? Si oui, une décision Dxxx doit l'acter.

### H-04 — D-237 (animations d'appui) a perdu son texte, remplacé par un renvoi Bip, alors qu'elle est citée une quinzaine de fois
- qualification : REFERENCE_ROMPUE (elle masque une règle)
- gravité : majeur
- passages :
  - `ch07:325` — « ## Précision normative — animations d'appui »
  - `ch07:329` — « | D-237 | Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git. | Révisée le07/10 — seconde clarification | »
  - `ch06:89` — « Sur tous les écrans concernés, les appuis suivent D-237 : dilatation au contact, retour et action immédiate au relâchement »
  - `ch13:2629` — « action/animation D-237. »
- analyse : D-237 porte sur les appuis tactiles. Son texte au registre a été remplacé par la formule générique utilisée pour 23 autres décisions de cadence. Il s'agit manifestement d'un remplacement en masse : les colonnes Statut et Portée sont identiques mot pour mot. La règle ne survit que dans des paragraphes de chapitres (ch06:2277, ch08:1822, ch10:295, ch12:1521). Le rang 1 (le registre) ne la porte donc plus. On ne peut pas parler de remplacement, faute de remplaçant pertinent. On ne peut pas parler non plus de CONTRADICTION, puisque le texte du registre est vide de sens pour ce sujet.
- proposition : restaurer dans ch07 le texte de D-237 depuis Git, en vérifiant le commit, ou y écrire le paragraphe « Appuis » de ch06:2277. Refaire le même contrôle pour D-252 (pas des pauses, cité en ch13:2609). Pour les 22 autres décisions, vérifier qu'elles relevaient bien de la cadence avant de leur laisser ce renvoi.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : non (restauration factuelle).

### H-05 — Chaîne de remplacement vide : D-302 et D-305 sont des renvois sans contenu, mais servent de remplaçants
- qualification : REFERENCE_ROMPUE
- gravité : majeur
- passages :
  - `ch07:278` — « Révision 07/10 : affichage, initialisation et symboles incompatibles remplacés par D-302–D-307 ; autres règles conservées. » (D-208 ; même statut pour D-209 l.284, D-217 l.292, D-238 l.335)
  - `ch07:464` — « | D-302 | Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git. »
  - `ch13:650` — « symbole du total selon D-305. »
  - `ch13:1318` — « D-302 confirme tous les signaux et comportements de cadence »
- analyse : quatre décisions de structure (Circuit et Tour, Point d'arrêt, cartes) sont dites remplacées « sur l'affichage, l'initialisation et les symboles » par une plage dont les deux premiers éléments n'ont plus de contenu propre. ch13 s'appuie sur D-305 pour le symbole du total et sur D-302 pour la cadence. Le lecteur ne peut pas reconstruire la règle depuis le registre. Seuls D-303, D-304, D-306 et D-307 ont un contenu.
- proposition : restaurer le texte de D-302 et D-305, ou réécrire les quatre statuts en nommant les décisions effectives (D-303, D-304, D-306, D-307, D-308–D-313). Remplacer en ch13:650 et 1318 la référence par la règle de ch10#resultats-temporels.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : non.

### H-06 — Le registre désigne v12 comme « référence active » ; README dit v12 historique, ch01 dit v13 active
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch07:60` — « | D-040 | … | Supersédée sur ces points le 02/10/2026 | Historique conservé dans Git ; référence active v12 | » (8 lignes identiques : D-040, 041, 144, 156, 208, 232, 242, 246)
  - `README.md:68` — « v12 et v10.2 sont historiques ; leurs règles remplacées ne doivent pas être utilisées pour la cible. »
  - `ch01:169` — « La référence active est [Paramètres en modale v13](08…#parametres-exercice) »
  - `DSF-PARAMETRES-MODALE-2026-10-01.md:13` — « [Spécification normative v12](Specifications-fonctionnelles/08…#parametres-exercice). »
- analyse : même objet (la version normative des paramètres), même périmètre. Trois sources disent v12 active (ch07 ×8, DSF-PARAMETRES-MODALE, SOURCE-SERIES-VARIABLES:5). Deux disent v12 historique et v13 active. De plus, la même ancre ch08#parametres-exercice est appelée « v12 » dans DSF-PARAMETRES-MODALE:13 et « v13 » dans ch01:169.
- proposition : dans ch07, remplacer « référence active v12 » par « référence active : ch08 #parametres-exercice ». Retirer les numéros de version des libellés de lien (voir H-07).
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch07)
- question à Hermann : non.

### H-07 — Autorité déléguée à des noms d'annexes disparues (« Bip v2 », « v13 », « Phrase v1 »)
- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `ch01:277` — « Bip v2 gouverne calculs et périmètres. » (même phrase en ch10:135 et ch10:194)
  - `ch08:1836` — « fait autorité sur les signaux, Pause/Reprise, reset, temps réel, arrière-plan et seuil de sécurité ; paramètres v13 pour pauses/côtés/Récupération, phrase v1 pour le texte. »
  - `DSF-BIP-CADENCE-2026-10-07.md:7` — « Métier : [Bip v2](Specifications-fonctionnelles/10…#resultats-temporels). »
  - `REPORT-BIP-2026-10-07.md:11` — « Nouvelle référence [Bip v2](Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md) »
- analyse : les fichiers SPECIFICATION-*.md n'existent plus dans Specifications-fonctionnelles. Le mot « Bip v2 » apparaît 26 fois dans ch07 et 12 fois dans ch13, et seuls certains liens le résolvent vers ch10#resultats-temporels. « v13 » se résout vers ch08#parametres-exercice. Une règle de priorité exprimée par un nom de version, sans cible unique, est ambiguë : quelle section précise « gouverne » ? Est-ce le §3 de l'ancien Bip v2, dont le contenu n'a peut-être pas été intégralement reporté ? Le constat n'est pas une REFERENCE_ROMPUE pure, puisque certains liens fonctionnent.
- proposition : définir une table de correspondance unique dans INDEX.md (« Bip v2 → ch10 §Résultats temporels ; Paramètres v13 → ch08 #parametres-exercice ; Phrase v1 → ch08 #phrases »). Remplacer ensuite progressivement les noms par les sections.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : non.

### H-08 — D-111 est remplacée par « EC-01/02 », identifiants définis nulle part, et garde le statut « Validée »
- qualification : REFERENCE_ROMPUE
- gravité : majeur
- passages :
  - `ch07:143` — « Disposition historique supersédée le13/10 par EC-01/02 : le MVP ajoutait le mode `À l'échec`, désormais cible de Série dans les deux modes. … | Validée post-Figma | »
  - `ch07:604` — « Elles remplacent la création d'un troisième mode de D-111 et l'interdiction d'un total partiel à l'Exercice. »
  - `ch08:1564` — « | Bip de cadence | Stepper | Trois modes, réglage commun | »
- analyse : le remplacement est explicite en prose (l.604), mais il pointe vers EC-01, EC-02 et EC-05 (cité aussi en l.446), qu'aucun fichier de docs/ ne définit. La colonne Statut de D-111 reste « Validée post-Figma ». Des restes à trois modes subsistent dans ch08 (l.1564, 1580). Il s'agit d'un remplacement explicite mais mal référencé, pas d'une contradiction ouverte.
- proposition : statut de D-111 « Supersédée partiellement par la section Décisions Deux modes (ch07:602) et ch09 #cibles-typees ». Remplacer « EC-01/02 » par ces cibles.
- statut PR/décisions : couvert partiellement par P20 (lecture des restes à trois modes) ; arbitré, intégration pendante pour ch08.
- touche_PRE4 : oui
- question à Hermann : non.

### H-09 — Remplacements écrits dans la décision remplaçante, mais absents du statut de la décision remplacée
- qualification : CONTRADICTION_REELLE (D-251 contre D-337) ; DOUBLON pour les autres
- gravité : majeur
- passages :
  - `ch07:374` — « Cible incomplète : total—, ✓ grisé, cellule et message en ligne. … | Validée | » (D-251)
  - `ch07:548` — « aucun message « Renseignez la durée… » … | Validée, Hermann 12/10 ; remplace le message en ligne de chapitre 08, paramètres d'exercice | » (D-337)
  - `ch07:554` — « Remplace, pour la Catégorie de l'Exercice, le choix « validé au toucher » de D-222 et D-228 » (D-343) ; `ch07:302` D-222 « Révisée 08/10/2026 » ; `ch07:308` D-228 « Sélection simple des référentiels : fermeture au toucher … | Validée DSF »
  - `ch07:446` — « phrases de pauses fixées par les276 cas v14 » (D-298, « Validée, consolidation ») contre `ch07:506` « v15 remplace v14 » (D-321)
- analyse : D-251 et D-337 portent sur le même objet (feuille Paramètres, cible incomplète) et sont incompatibles (message contre aucun message). D-337 nomme le ch08, pas D-251, si bien que D-251 reste « Validée ». Pour D-222, D-228 et D-298, le remplacement est nommé par la nouvelle décision mais n'est pas répercuté dans le statut de l'ancienne. Un lecteur qui part de l'ancienne ne voit donc pas le remplacement.
- proposition : règle de registre selon laquelle toute décision remplaçante met à jour la colonne Statut de la remplacée. Appliquer à D-251 (« message en ligne remplacé par D-337 »), D-222 et D-228 (« sélection de Catégorie et d'Étiquette remplacée par D-343/D-355 »), D-298 (« corpus v14 → v15 par D-321 ; phrases de pauses par D-315 »), D-339 et D-341 (voir H-03).
- statut PR/décisions : couvert partiellement par P4 (D-337) et P14 (D-343)
- touche_PRE4 : oui
- question à Hermann : non.

### H-10 — Règle remplacée (D-222 « appui court valide et ferme ») encore énoncée dans ch10, ch08 et PRODUCT
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch10:69` — « | RM-200 | Dans les modales de sélection des Étiquettes, Catégories et Zones corporelles, l'appui court valide et ferme une sélection simple »
  - `ch08:1592` — « Dans les modales de sélection `Étiquettes`, `Catégorie` et `Zones corporelles`, un appui court valide et ferme une sélection simple »
  - `PRODUCT.md:304` — « un appui court valide et ferme une sélection simple ou sélectionne/désélectionne une valeur en sélection multiple (D-222) »
  - `ch07:580` — « remplace pour l'Étiquette le choix au toucher (D-222, CE-T03-16 §4). » (D-355)
- analyse : même objet (sélection simple de Catégorie ou d'Étiquette), même périmètre MVP. D-343 et D-355 remplacent explicitement ce comportement par « toucher marque, ✓ confirme ». La règle remplacée reste écrite dans une règle métier numérotée (RM-200), dans ch08 et dans PRODUCT.
- proposition : référence unique : RM-200 réécrit selon D-343 et D-355. ch08:1592 renvoie à RM-200. PRODUCT:304 retire l'énoncé et garde un renvoi.
- statut PR/décisions : arbitré par D-343/D-355, lu par P14 ; intégration pendante.
- touche_PRE4 : oui
- question à Hermann : non.

### H-11 — Chaîne D-204 → D-232 → (02/10) : ch08 applique encore D-232 et D-246, toutes deux supersédées
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch07:260` — « | D-204 | … | **Supersédée ; D-232 fait foi.** | Historique. | »
  - `ch07:312` — « Anciennes saisie inline, valeurs initiales, formules et granularités remplacées par D-246 puis D-247 à D-253/v12. | Supersédée sur ces points le 02/10/2026 »
  - `ch07:412` — « La phrase de D-232/D-253 est remplacée dans sa présentation seulement. »
  - `ch08:1573` — « Les bornes et pas suivent D-232, les valeurs initiales D-246. »
  - `ch08:1595` — « Elle suit les fragments conditionnels D-232, se régénère à chaque modification »
- analyse :
  - D-232 se décrit elle-même comme ayant perdu ses « granularités » (les pas) et sa présentation de phrase. ch08 y renvoie pourtant pour les pas et pour la phrase, dont la règle courante est D-298 et Phrase v1.
  - D-246 est supersédée (« Layout et contrôles complétés par D-247 à D-253 ») ; ch08 y renvoie pour les valeurs initiales.
  - D-204 désigne comme faisant foi une décision supersédée.
  - Enfin, ch07:610 corrige D-232 après coup (« D-232, RM-234 et les contrats sont corrigés »), si bien qu'une décision supersédée reste éditée comme une source active.
  
  Seules les bornes conservées par D-232 restent valables, et elles sont aussi dans RM-234.
- proposition : référence unique des bornes et pas : RM-234 (ch10:281) avec ch13 « Règles communes de l'éditeur ». ch08:1573 renvoie à RM-234. ch08:1595 renvoie à Phrase v1 (ch08 #phrases). Statut de D-204 : « Supersédée ; voir D-298 et RM-234 ». Préciser le statut de D-232 : « bornes conservées dans RM-234 ; le reste est historique ».
- statut PR/décisions : couvert partiellement par Q12 (PR #371 corrige la même ligne ch08:1573 sur « sans seconde validation », pas les renvois D-232/D-246).
- touche_PRE4 : oui
- question à Hermann : non.

### H-12 — Numérotation du registre : décisions manquantes, hors registre, ou sans statut
- qualification : REFERENCE_ROMPUE
- gravité : majeur (D-334/D-335) ; mineur pour le reste
- passages :
  - `ch07:539` — « | D-333 | L'ajout/import de médias … » (suivi directement de `ch07:547` « | D-336 | … »)
  - `docs/preparation/PRE-3/planification/passe2/plan-technique-corrige.md:64` — « ## 8. Médias : architecture proposée et décisions D-334/D-335 »
  - `ch07:8` — « | D-047 | La règle de reprise tardive s'applique à partir de 30 minutes consécutives en pause » (seule occurrence, dans le tableau d'exemple « # Format »)
  - `ch07:630` — « | D-369 | État de développement. le moteur n'a pas encore été développé | » (sans statut)
- analyse :
  - D-334 et D-335, modalités d'import et actions par média, sont des décisions appliquées en PRE-3 (comparaison-visuelle-revue1.md:20 « E10 | D-335 ») mais absentes du registre de rang 1. Elles ne sont pas non plus déclarées « Non utilisé », comme le sont D-003, D-009 et D-010.
  - D-097 et D-205 manquent sans déclaration.
  - D-046 et D-047 ne sont définies que dans l'exemple de format. D-047 n'est appliquée nulle part et risque d'être confondue avec la pause de sécurité de 30 minutes (PRODUCT:219).
  - D-357 à D-369 n'ont pas de statut. D-369 constate un état, ce n'est pas une décision. D-363 est une consigne de travail (« Claude propose les deux organisations dans Figma »).
- proposition : reporter D-334 et D-335 depuis la préparation PRE-3 dans ch07, avec un statut. Ajouter D-097 et D-205 à « Identifiants non utilisés ». Déplacer D-046 et D-047 dans le tableau des décisions validées, ou les déclarer historiques. Ajouter une colonne Statut à D-357–D-369 (et aux D-370–D-375 de la PR #370). Reclasser D-369 en note.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ED-21 médias, non-régression)
- question à Hermann : D-334 et D-335 (modalités d'import de médias PRE-3) doivent-elles entrer au registre telles que formulées dans `plan-technique-corrige.md` §8 ? D-047 (reprise tardive à 30 min de pause) est-elle encore une règle active ?

### H-13 — Règle de priorité tronquée dans cinq RM : « Hors règles propres des formats (RM-et RM-) »
- qualification : REFERENCE_ROMPUE (elle masque une règle de priorité)
- gravité : majeur
- passages :
  - `ch10:135` — « | RM-072 | Hors règles propres des formats (RM-et RM-), Exercice : exact en Durée, ≈ en Ré… »
  - `ch10:143` — « | RM-126 | Hors règles propres des formats (RM-et RM-), La barre de progression couvre le Plan d'Exécution complet »
- analyse : RM-071, 072, 075, 125 et 126 sont des règles générales de calcul et de progression, assorties d'une exception au profit des règles de formats dont les identifiants ont disparu (probablement au cours d'un remplacement automatique). Il est impossible de savoir quelles RM de formats prévalent, ni sur quel périmètre. La préparation PRE-4 lit RM-072 (P25) sans ce point.
- proposition : rétablir les deux identifiants, à retrouver dans MATRICE-FORMATS-SEANCES ou dans le commit d'intégration des Formats.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : non.

### H-14 — Critère de récence érigé en règle de priorité, à côté de la règle « explicitement supersédants »
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `ch07:559` — « Les décisions récentes prévalent, dans leur portée, sur les présentations antérieures (maquette figée du 08/10 comprise). »
  - `PRODUCT.md:436` — « 1. registre des décisions de conception et arbitrages explicitement supersédants ; »
  - `MATRICE-CARTES-PHRASES-2026-10-07.md:5` — « Les décisions explicites du propriétaire priment sur les contradictions des prompts. »
- analyse : la règle de ch07:559 est limitée « dans leur portée » et vise des « présentations » (maquette), pas des décisions. Elle reste compatible avec R4 si on la lit comme « décision contre Figma ». Mais sa formulation générale (« les décisions récentes prévalent ») peut être lue comme une règle de récence entre décisions. C'est la lecture que fait P13 (« décision validée plus récente et explicite, prévaut »).
- proposition : reformuler ch07:559 : « Ces décisions prévalent sur la maquette figée du 08/10 pour les points qu'elles nomment ». Inscrire dans la règle unique (H-01) qu'aucune décision n'en remplace une autre sans la nommer.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch07)
- question à Hermann : non.

### H-15 — README « Références actives » renvoie à un DSF et une matrice qui se déclarent eux-mêmes dépassés
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `README.md:65` — « 4. [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice courante Figma](MATRICE-CADENCE-FIGMA-2026-10-06.md). »
  - `MATRICE-CADENCE-FIGMA-2026-10-06.md:5` — « **Inventaire historique du 06/10.** Consulter la [matrice courante du 07/10](MATRICE-FIGMA-2026-10-07.md) »
  - `DSF-CADENCE-2026-10-06.md:3` — « [DSF Deux modes et cible À l'échec](…) remplace les références à trois modes »
  - `DSF-PAUSES-ICONES-2026-10-07.md:3` — « Complète [DSF Cadence](…), avec priorité sur ses prescriptions incompatibles. »
- analyse : même objet (la référence DSF et Figma courante), même périmètre. README dit « courant », les documents visés disent « historique » ou « remplacé sur les points incompatibles ». DSF-CADENCE §4 (l.96) écrit encore « ligne commune aux trois modes ». README:66 annonce aussi « 30 contrats » (ch13:13 : « 40 contrats actifs ») et README:101 « chapitres 00–13 » (il n'y a pas de ch00). PRODUCT:518 répète « DSF-CADENCE-2026-10-06 » parmi les « Références actives ».
- proposition : remplacer README:60–68 par un renvoi à INDEX.md. Lister dans INDEX la chaîne DSF courante (INTERFACE-GENERALE → CIRCUITS → DEUX-MODES → PHRASES-V15, plus CARTES pour les cartes), avec la règle « rendu uniquement ». Remplacer « matrice courante » par « matrice courante : aucune ; preuves datées ».
- statut PR/décisions : aucun
- touche_PRE4 : non (README et DSF-CADENCE ne sont pas figés). Le constat influence toutefois la lecture des DSF figés.
- question à Hermann : non.

### H-16 — PRODUCT.md, déclaré « synthèse », porte des « Références courantes » et des règles normatives
- qualification : DOUBLON (règles) ; CONTRADICTION_REELLE (statut de MATRICE-TRACABILITE-T03)
- gravité : majeur
- passages :
  - `PRODUCT.md:432` — « `PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées. »
  - `PRODUCT.md:3` — « **Référence courante — évolutions v15 :** [inventaire, plan et preuves](MATRICE-EVOLUTIONS-V15-2026-10-07.md) »
  - `PRODUCT.md:449` — « - `MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md` ; » (dans « les références explicites de cette mise à jour »)
  - `MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md:1` — « # MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES — référence historique »
- analyse :
  - PRODUCT désigne comme « Référence courante » une matrice de lot qui renvoie elle-même vers des lots postérieurs. Il liste comme référence explicite un fichier qui se déclare historique et « Remplacé ».
  - PRODUCT recopie des règles complètes : formules de durée (l.62, 64, 187), seuils de pause de sécurité (l.219), règle de sélection D-222 périmée (l.304, voir H-10), bornes et pas (l.500, section « Générateur de phrase »).
  - PRODUCT écrit que ch07 « intègre D-167 à D-187 » (l.446), ce qui est périmé.
  
  Chaque recopie est un doublon qui peut diverger.
- proposition : réduire PRODUCT à la finalité, au périmètre et à la roadmap, avec des renvois. Supprimer « Référence courante » (l.3), « Références actives » (l.518) et la liste T03 (l.444–450). Les remplacer par « Références : INDEX.md ».
- statut PR/décisions : aucun
- touche_PRE4 : non
- question à Hermann : PRODUCT.md doit-il rester une page produit sans aucune règle (renvois seulement) ?

### H-17 — Statuts contradictoires des matrices Figma (« courant » et « historique » dans le même fichier)
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `MATRICE-CADENCE-FIGMA-2026-10-06.md:1` — « # Matrice courante — Figma, Cadence, captures et contrats » ; l.3 « **État antérieur au lot Bip de cadence.** »
  - `MATRICE-FIGMA-2026-10-07.md:1` — « # Inventaire courant des références Figma — 07/10/2026 » ; l.6 « **Relevé historique du lot précédent.** »
  - `MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md:8` — « **Inventaire historique.** La [matrice du 07/10](…) porte les références actives » ; l.10 « **Inventaire courant :** [matrice06/10](…) »
- analyse : ces bandeaux, ajoutés successivement, désignent chacun une matrice « courante » différente (06/10, 07/10, Bip, v15, voile, compléments, 12/10). ETAT-DES-LIEUX:3 désigne encore la 06/10. Pas d'effet sur les calculs : les matrices ne portent que des références Figma. Mais aucun fichier ne donne la matrice réellement courante.
- proposition : ne garder dans chaque matrice qu'un bandeau unique « preuve datée du lot JJ/MM ; non courante ». Laisser au ch06 le rôle d'inventaire courant des captures, comme le dit INDEX:21.
- statut PR/décisions : aucun (la PR #363 ne touche que ch06)
- touche_PRE4 : non
- question à Hermann : non.

### H-18 — Résidus normatifs historiques non neutralisés (v12, classeur v10)
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `DSF-V2-MOTIFS-LOT-3.md:4` — « **Référence fonctionnelle active :** `Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md`. La documentation fonctionnelle et le classeur v10 déterminent les règles de gestion »
  - `ch07:495` — « Les276 cas v14 fixent les formulations ; … Excel exclusivement rédactionnel. » (D-315)
  - `README.md:68` — « v12 et v10.2 sont historiques »
  - `SOURCE-SERIES-VARIABLES-2026-10-02.md:5` — « Consolidation normative : [v12](…SPECIFICATION-PARAMETRES-MODALE-v12.md). »
- analyse : DSF-V2-MOTIFS ne porte aucun bandeau historique. Il affirme qu'un classeur Excel (v10) « détermine les règles de gestion », ce qui contredit directement D-315, D-298 et D-300 (« Excel ne définit pas les pauses/durées »). Il désigne aussi comme active une version déclarée historique. Les fichiers ARBITRAGES:6, RAPPORT-CONFORMITE-*:6 et MATRICE-TRACABILITE-*:10, bien que bandeautés « historique », gardent des liens libellés « Spécification normative v12/v13 » vers des fichiers absents.
- proposition : ajouter à DSF-V2-MOTIFS-LOT-3 le bandeau « référence historique (lot 3, PR #247) ; règles : ch08/ch10 ; Excel : formulations seulement ». Dans les fichiers historiques, renommer les liens « Spécification normative v12 » en « Spécification de l'époque (v12, historique) ».
- statut PR/décisions : aucun
- touche_PRE4 : non
- question à Hermann : non.

### H-19 — Règles de gestion RG-1 à RG-13 portées par un DSF et recopiées dans 10 chapitres
- qualification : DOUBLON
- gravité : mineur
- passages :
  - `DSF-CARTES-ICONES-APPUIS-2026-09-30.md:123` — « | RG-10 | Profil : champ silhouette facultatif, valeurs homme/femme ; absence = homme affiché. »
  - `ch09:1128` — « Contrat de donnée : ajouter au Profil la préférence facultative `silhouette`, valeurs `homme` / `femme` »
  - `DSF-CADENCE-2026-10-06.md:96` — « Bip de cadence : ligne commune aux trois modes,0..10s et0=Aucun »
- analyse : RG-1 à RG-13 sont des règles de gestion (l.12 « les règles de gestion et le statut des essais sont distingués »), dont une règle de données (RG-10). Elles vivent dans un DSF et sont résumées dans un paragraphe identique copié dans ch01, 03, 04, 05, 06, 08, 09, 10, 11 et 12, accompagné des blocs « D-248/v13 (ancien repli D-242 retiré) » et « Appuis — D-237 ». La règle n'est pas contredite aujourd'hui, mais elle est écrite 11 fois. De son côté, DSF-CADENCE §4 rappelle des règles métier devenues fausses (« trois modes »).
- proposition : déplacer RG-1 à RG-13 dans ch10, avec des RM dédiées et RG-10 dans ch09. Le DSF ne garderait que le rendu. Remplacer les 10 paragraphes par un renvoi d'une ligne. Dans DSF-CADENCE §4, remplacer les rappels métier par un renvoi.
- statut PR/décisions : aucun
- touche_PRE4 : oui (paragraphes copiés dans les chapitres figés)
- question à Hermann : non.

### H-20 — Chaîne DSF fondée sur l'« incompatibilité », sans liste des dispositions remplacées
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `DSF-BIP-CADENCE-2026-10-07.md:3` — « [DSF Deux modes et cible À l'échec](…) remplace les références à deux modes »
  - `DSF-BIP-CADENCE-2026-10-07.md:7` — « Complément courant à DSF Cadence et DSF Pauses/icônes ; remplace uniquement leurs dispositions incompatibles. »
  - `DSF-FORMATS-SEANCES-2026-10-14.md:3` — « Statut : extension documentaire du DSF courant. »
- analyse : chaque DSF remplace « les dispositions incompatibles » du précédent, sans les énumérer. Le lecteur doit lui-même juger de l'incompatibilité, ce qui contredit le principe du remplacement explicite. DSF-BIP:3 écrit « deux modes » là où les cinq autres bandeaux écrivent « trois modes » : faute probable, mais qui inverse le sens. DSF-FORMATS s'étend du « DSF courant », que seul DSF-CADENCE revendique (« DSF courant », l.1).
- proposition : dans INDEX ou dans un tableau de tête de DSF-INTERFACE-GENERALE, lister la chaîne DSF et, pour chaque remplacement, les sections remplacées. Corriger DSF-BIP:3 en « trois modes ». Remplacer dans DSF-FORMATS « DSF courant » par les DSF nommés.
- statut PR/décisions : la PR #370 modifie DSF-BIP et DSF-FORMATS (phases) sans traiter ce point.
- touche_PRE4 : oui (DSF-CIRCUITS et DSF-DEUX-MODES figés)
- question à Hermann : non.

---

## Couverture

**Lu :**
- BRIEF-COMMUN.md en entier ; pre4-bmad-questions-ouvertes.md §1 et §2 en entier ; corps des PR #370 et #371 ; diffs des PR #370, #371 et #363 (en-têtes et lignes D-xxx).
- INDEX.md et README.md en entier ; PRODUCT.md l.1–30 et l.415–526, plus un grep complet.
- ch07 : structure complète, lignes 1–40, 300–336, 364–378 et 400–632 en entier ; extraction mécanique des 365 lignes D-xxx et de leur statut.
- ch13 : l.1–30, l.4050–4100, plus des grep ciblés ; ch08 : l.1–62 et l.1560–1600 ; ch10 : l.1–25, plus les lignes RM citées.
- 30 premières lignes de tous les fichiers docs/*.md et du début de chaque JSON ; grep des mots de statut sur chaque fichier et sur les 13 chapitres.

**Non lu en entier :**
- ch01 à ch06, ch09, ch11 et ch12 (grep et passages cités seulement) ; corps des DSF au-delà des en-têtes, sauf DSF-CADENCE §4 et la table RG de DSF-CARTES.
- Corps des matrices, rapports et JSON au-delà des en-têtes.
- docs/archives (ignoré) et docs/preparation (consulté seulement pour D-334/D-335).

**Contrôles mécaniques faits :** doublons et trous de la numérotation D-xxx ; RM définies et RM référencées ; citations de chaque décision supersédée dans les chapitres et PRODUCT ; recherche des définitions ED, EC, CE et RG. Les doublons CE trouvés sont des index, pas des définitions.

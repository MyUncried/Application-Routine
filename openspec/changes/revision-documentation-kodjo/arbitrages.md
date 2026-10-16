# Arbitrages — réexamen des questions Q-A à Q-N (révision 2, 16/10)

## Méthode et sources

- **Base :** `main` `6656fefc` (inchangé). Les fichiers de `docs/` de la branche sont identiques à la base.
- **Sources consultées :**
  - chapitres 01 à 13 et `docs/*.md` ;
  - historique Git : textes d'origine des décisions, spécifications supprimées par `7a89220f`, fusion `ae50aaed` ;
  - PR #363, #370 et #371 (têtes inchangées : `d2386c8d`, `6cf3634a`, `2c050d0e`) ;
  - décisions de Hermann de la préparation PRE-4 BMAD : fichier **non versionné** `C:\Dev\KODJO-BMAD-PRE4\docs\preparation\PRE-4\bmad\questions-ouvertes.md`, lu le 16/10 à 17:31 (SHA-256 `ceadbee3967779b859b2c80b4c2522cd3b3ce0f9bf54f47ce11aee27249f2fbe`), cité ci-dessous `pre4:Qxx`. Il n'est pas copié dans ce change ; seuls des extraits sont cités.
- **Analyses détaillées** (preuves verbatim, sources contraires, certitude, couverture) :
  - [constats/arbitrages/G-gouvernance.md](constats/arbitrages/G-gouvernance.md) : Q-A, Q-B, Q-C, Q-D, Q-M, Q-N ;
  - [constats/arbitrages/F-fonctionnel.md](constats/arbitrages/F-fonctionnel.md) : Q-E à Q-L.
- **Classement :** `RÉSOLUE PAR LES SOURCES` (une décision explicite ou une règle non contredite répond, et il ne reste qu'à la reporter) ; `RECOMMANDATION DOCUMENTAIRE` (choix d'organisation sans effet sur une règle produit) ; `ARBITRAGE PRODUIT` (une décision de Hermann reste nécessaire).
- **Portée des décisions PRE-4 :** seule Q19 déclare une portée générale, « Décision pour la phase projet, commune aux versions PRE-4 BMAD et VNext » (`pre4:Q19`). Les autres sont lues comme des décisions pour PRE-4, sans extension implicite. Leur extension fait l'objet de la question 10.

## 1. Tableau récapitulatif

| ID | Décision attendue | Classement | Preuve principale | Suite |
|---|---|---|---|---|
| Q-A | Règle d'autorité unique ; sort de PRODUCT:434–442, ch. 13:19, ch. 08:33, ch. 07:559 | Frontière doc/Figma : **RÉSOLUE** ; borne « jusqu'à D-255 », emplacement, ch. 07:559 : **RECOMMANDATION** ; rang ch. 08 / ch. 13 : **ARBITRAGE** | D-255 (ch. 07:378) ; D-300 (ch. 07:448) ; ch. 13:4059 ; la borne D-255 date de `117bedcb` (03/10), quand D-255 était la dernière décision | Question 2 |
| Q-B | Statut des DSF ; D-339 et D-341 remplacées ? | DSF = rendu : **RÉSOLUE** (transfert des règles selon design G4) ; D-339 et D-341 : **ARBITRAGE** | ch. 13:4087 introduit par `096686e1` (13/10), sans décision D-xxx ; valeurs de D-341 validées le 12/10, alors que le ch. 07 indique encore « à valider » | Question 3 |
| Q-C | Rôle de PRODUCT.md | **RECOMMANDATION** : synthèse sans ordre de référence propre | PRODUCT.md:432 « `PRODUCT.md` est une synthèse » ; INDEX.md:3 | Lot 4, sans question |
| Q-D | MVP / V1 / V2 / tranche ; version de Formats, Circuits de séries, Cadence | Définitions : **RÉSOLUE** en grande partie (ch. 05:1 « V1 – KODJO MVP », ch. 05:217 tranches) ; Circuits de séries : **RÉSOLUE** (MVP, un circuit par composition, CIR-01 ch. 07:589) ; Formats et Cadence à l'exécution : **ARBITRAGE** | Aucune version attribuée (ch. 05:284, ch. 06:2414) ; précédent de forme : PR #370 (section ch. 05 et D-370 « Phases au MVP ») | Question 4 |
| Q-E | Médias pendant l'Exécution : MVP ? | **RÉSOLUE** | D-203 (ch. 07:259) : « périmètre MVP confirmé le 28/09/2026 » ; ch. 05:242 ; CONCEPTION-EXECUTION-MEDIA.md:7. Restes contraires : ch. 01:155, ch. 10:250 | Lot 5 (`FONCT-ARBITRÉ`) |
| Q-F | Prédicat du statut de Séance `Partielle` | **ARBITRAGE** (restreint) | Statut d'Exercice fixé (D-053 ch. 07:84, RM-060, D-150) ; deux définitions de Séance jamais arbitrées (ch. 08:996, ch. 08:1386) | Question 5 |
| Q-G | Suppression d'une Séance active | **RÉSOLUE** | RM-007 (ch. 10:19) : « Une Séance active ne peut pas être supprimée. Elle doit d'abord être archivée » ; D-121 (ch. 07:153) | Lot 5 |
| Q-H (a) | Persistance de la Composition | **RÉSOLUE** | D-123 (ch. 07:155) ; ch. 06:329 ; CE-T03-08 §15 (ch. 13:988) | Lot 5 |
| Q-H (b) | Séance avec un Exercice valide et un Exercice à cible à renseigner | **ARBITRAGE** | RM-017 ; ch. 08:352 ; `pre4:H29` (hypothèse tirée du code) | Question 6 |
| Q-I | Statut visible d'un Death by incomplet | **ARBITRAGE, différable** | D-365 (ch. 07:626) : « conception reportée au Suivi » ; spécification Formats supprimée, FMT-38 | Question 7 |
| Q-J | Montant affiché sous le titre du Circuit | **ARBITRAGE** | D-100 (ch. 07:132) et D-131, contre la spécification Circuits supprimée §5.2 et ch. 10:684 | Question 8 |
| Q-K (a) | Valeur héritée hors bornes non modifiée : enregistrable ? | **ARBITRAGE** (confirmer `pre4:H25` et sa portée) | `pre4:Q15` ne règle que l'affichage et le calcul ; ch. 13:4100 et API-PARAM-01 refusent | Question 9 |
| Q-K (b) | Ligne Total pendant une cible à renseigner : « — » ou absente | **ARBITRAGE** | ch. 08:1565 « Variable : lecture seule, — si incomplet » ; ch. 06:1119 ; contre `pre4:H10` (hypothèse) | Question 9 |
| Q-L | Intégration de Q8, Q19–Q26 ; X-06 et X-07 ; ordre des PR | X-06 et X-07 : **RÉSOLUES** (texte de Q18 et Q8) ; ordre des PR : **RECOMMANDATION** ; portée générale des décisions PRE-4 : **ARBITRAGE** | Voir §3 | Question 10 |
| Q-M | D-334 et D-335 au registre ; D-047 active ? | **RÉSOLUE** | D-334 et D-335 présentes à `341f4d41` (ch. 07:550 et 552), second parent de la fusion `ae50aaed` (09/10), et absentes de `main` (vérifié) ; D-047 active, rangée sous l'exemple « # Format » | Lot 1 (G4) ; D-047 au lot 6 |
| Q-N | « Inventaire opposable PRE-4 » dans `main` ? | **RECOMMANDATION** : pas d'intégration en bloc ; les décisions validées passent par Q-L | `pre4:Q7` limitée aux sources PRE-4 ; aucune décision d'intégration à `main` | Question 10 |
| **Q-O** (nouvelle) | Les renvois D-nnn effacés par `7a89220f` hors rubriques de traçabilité doivent-ils être restaurés ? | **RECOMMANDATION** (documentaire) | 244 lignes restaurables portent toutes une trace d'effacement mécanique ; la PR #360 n'annonce que le retrait des « rubriques de traçabilité des contrats » | Question 11 |
| **A-PRE4** (préalable) | Autoriser la modification, dans `main`, de sources figées par PRE-4 | Accord de procédure, pas une décision produit | Consigne du chantier ; PRE-4 BMAD lit une copie à `caa2a5cf` | Question 1 |

## 2. Décisions demandées à Hermann

Seules les questions qui restent ouvertes après le réexamen sont posées ici. Les recommandations sont des **propositions**, pas des décisions.

| # | Question fermée | Options et sources | Recommandation |
|---|---|---|---|
| 1 | **A-PRE4.** Autorisez-vous l'application du lot 1 (registre ch. 07, restaurations à l'identique depuis Git, sans changement de statut) dans `main`, alors que le ch. 07 est une source figée PRE-4 ? | Oui / Non / Après la fin de PRE-4 | — |
| 2 | **Q-A.** Quand un contrat du ch. 13 et le ch. 08 se contredisent sur un même écran, lequel fait foi ? | A : ch. 13 (ch. 08:33 ; lecture `pre4:P11`, `P19`). B : ch. 08 (PRODUCT:438–440). C : aucun rang général ; chaque contradiction est tranchée par une décision citée (design G3). | C, éventuellement complétée par la confirmation de P11 et P19 comme décisions générales |
| 3 | **Q-B.** À partir de PRE-4, D-339 (fermeture après choix) et D-341 (typographie des options) sont-elles remplacées par les popovers des DSF Circuits et Deux modes ? | A : les deux sont remplacées. B : D-341 est remplacée ; D-339 est maintenue pour son comportement, transposé aux popovers. C : les deux sont maintenues. Dans tous les cas, une décision D-xxx doit l'acter. | B |
| 4 | **Q-D.** (a) Les six formats et les départs rapides sont-ils au MVP ? (b) Le guidage de cadence pendant l'Exécution est-il au MVP ? | MVP (lecture ch. 13:9, ch. 08:64) ou version ultérieure (ch. 05:284, ch. 06:2414) | Aucune |
| 5 | **Q-F.** Une Séance close est-elle `Partielle` si et seulement si au moins un Résultat d'Exercice est `Partielle` ? Une récupération écourtée (RM-065a) n'y suffit-elle pas ? L'action « ignorer un exercice » (ch. 03) est-elle retirée ? | A : définition dérivée des résultats d'Exercice (D-053, D-150, ch. 06:2037). B : lecture large de ch. 08:996, où la récupération écourtée compte. | A |
| 6 | **Q-H (b).** Une Séance dont un Exercice a une cible à renseigner : (A) s'enregistre et s'exécute en sautant cet Exercice ; (B) s'enregistre mais ne s'exécute pas (ch. 08:352) ; (C) ne s'enregistre pas (`Continuer` désactivé, `pre4:H29`) ? | A / B / C | C ou B |
| 7 | **Q-I.** Pour un Death by clos (limite ou abandon), le Suivi et la Synthèse affichent : (A) un statut existant, avec le motif ; (B) un nouveau libellé ; (C) décision différée à la planification des Formats (D-365) ? | A / B / C | C |
| 8 | **Q-J.** Avec des Exercices avant ou après le Circuit, la ligne sous le titre Circuit totalise : (A) le Circuit développé seul (spécification Circuits §5.2, ch. 10:684) ; (B) tous les Exercices de la Séance, hors Compte à rebours et Fin (D-100, D-131) ? | A / B | Aucune : les deux s'appuient sur des décisions validées |
| 9 | **Q-K.** (a) Confirmez-vous `pre4:H25` : une valeur héritée hors bornes non modifiée laisse ✓ et `Terminer` actifs, et seule une valeur modifiée doit respecter les bornes ? Pour PRE-4 seulement, ou aussi pour la doc générale (RM-234, API-PARAM-01) ? (b) Pendant une cible à renseigner, la ligne Total affiche-t-elle « — » (ch. 06:1119, ch. 08:1565) ou n'apparaît-elle pas (`pre4:H10`) ? | (a) Oui, PRE-4 / Oui, général / Non. (b) « — » / absente | (a) Oui, général (cohérent avec `pre4:Q15`, « tant qu'on ne la modifie pas »). (b) Aucune |
| 10 | **Q-L / Q-N.** Les décisions PRE-4 suivantes valent-elles aussi pour la documentation générale : Q8, Q11–Q18 (portées par la PR #371), Q20, Q21, Q23, Q25, Q26 ? | Liste à cocher, décision par décision. Q19 est déjà générale, Q24 est déjà conforme dans `main`, et Q22 ne relève pas de la documentation. | — |
| 11 | **Q-O.** Faut-il restaurer, au lot 3, les renvois D-nnn effacés par la consolidation dans le texte courant des chapitres (lignes EXACT de R-06), en dehors des rubriques de traçabilité dont le retrait était annoncé ? | Oui, tous / Oui, sauf ch. 13 / Non, mais réparer les artefacts (parenthèses vides, espaces orphelines) | Oui, tous : les traces montrent un effacement mécanique, et la restauration est vérifiable ligne à ligne |

**Point d'information pour la question 10 :** la décision Q23 indique que le bouton de Mode est « absent des frames et des sources ». Or `docs/DSF-PHRASES-V15-2026-10-07.md:15` prescrit : « Le champ à droite de Paramètres d'exécution affiche le **mode** des paramètres appliqués » (constat X-11). La décision n'est pas remise en cause, mais son report dans la documentation devra modifier ce DSF.

## 3. Q-L : dépendances avec les PR et décisions déjà portées

| Décision | Portée déclarée | Portée par une PR ? | À aligner dans `main` (exemples vérifiés) |
|---|---|---|---|
| Q8 (roulette Répétitions) | non déclarée | **en partie**, par #371 (CE-UI-10, DSF Deux modes) | D-219 (ch. 07:294) ; ch. 13:125 ; ch. 06:186 ; **#371 réécrit ch. 08 l. 1573 en gardant les steppers** (X-07, ci-dessous) |
| Q11–Q18 | « Validation propriétaire du 16 octobre 2026 » (rapport de #371) | **oui**, par #371 | X-06 et X-07 restent à corriger dans la PR |
| Q19 (données illisibles) | **générale** (phase projet) | non | ch. 09 (migration) ; ch. 12:1597 |
| Q20 (≥ en min et s, sans arrondi) | non déclarée | non | RM-159 (ch. 10:141), D-090 (ch. 07:124) |
| Q21 (valeur valide la plus proche) | non déclarée | en partie, de façon ambiguë (#371 : « pas de 5 s ») | ch. 13 l. 4093 et 4104–4106 (X-05) |
| Q22 (dev client) | préparation de recette | sans objet | — |
| Q23 (retrait du bouton de Mode) | non déclarée | non | DSF-PHRASES-V15:15 ; CE-T03-04 §6 |
| Q24 (« {N} séries à l'échec ») | non déclarée | sans objet | `main` est déjà conforme (ch. 01:363, ch. 05:252, ch. 08:1814) |
| Q25 et Q26 | non déclarées | non | ch. 13 l. 4104 et 2997 |

**X-06 et X-07, écarts entre la PR #371 et les décisions :**

- **X-06.** `pre4:Q18` : création « Abandonner la création ? » / « Les informations saisies seront perdues et l'exercice ne sera pas créé. ». Le diff de #371 (ligne 197 de `pr371.diff`) écrit : « Création : « Abandonner la création ? » / « L'exercice ne sera pas créé. » ». Le texte est **raccourci par rapport à la décision**.
- **X-07.** `pre4:Q8` : roulette native à une colonne, qui « remplace, pour la cible, le stepper en ligne de … ch. 08 l. 1559 et 1573 ». Le diff de #371 (ligne 166 de `pr371.diff`) écrit : « Séries `1..99` et Répétitions `1..100` utilisent des steppers ». La phrase réécrite **contredit Q8**. La lecture « Répétitions » = nombre de répétitions cible est à vérifier dans la PR.

Ces deux corrections relèvent de la PR #371 elle-même : ce change ne modifie pas la PR.

**Ordre de fusion (recommandation documentaire) :**
- une fusion d'essai, faite dans un dépôt jetable construit par `git archive 6656fefc` puis supprimé, sans modifier le clone, montre que les PR #363, #370 et #371 **entrent en conflit au même endroit du ch. 06 (vers la l. 1162)**, quel que soit l'ordre ;
- la PR #363 est en outre basée sur `caeee0ef`, antérieur à `main` ;
- ordre proposé :
  1. corriger X-06 et X-07, puis fusionner #371 ;
  2. rebaser #370 et la fusionner ;
  3. rebaser #363 ;
  4. appliquer ensuite les lots 1 et 3 de ce change ; aucune de leurs lignes n'est touchée par ces PR ;
- cet ordre reste à confirmer par Hermann, et la PR #371 porte la mention « ne pas fusionner pendant le travail BMAD sans coordination explicite ».

## 4. Résolues par les sources : ce qu'il reste à faire

| ID | À reporter | Lot | Classe |
|---|---|---|---|
| Q-E | Retirer ou aligner ch. 01:155 et la dernière ligne de RM-203 (ch. 10:250, « post-MVP à planifier ») sur D-203 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-G | Aligner ch. 08 §2.5 (suppression directe) sur RM-007 et D-121 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-H (a) | Aligner ch. 08 §3.10 et ch. 08:403 sur D-123 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-M | Restaurer D-334 et D-335 depuis `341f4d41` (lot 1, groupe G4) ; ranger D-047 hors de l'exemple « # Format » (lot 6) | 1 et 6 | DOC `[PRE4]` |
| Q-B (a) | Transfert des règles des DSF, règle par règle (design G4) | 6 | DOC |
| Q-C | PRODUCT.md : remplacer l'ordre de référence par un renvoi | 4 | DOC-AUTORITÉ |
| Q-D (définitions) | Rappeler V1 = MVP et la notion de tranche dans le glossaire ; préciser que « V2 » désigne parfois un document (`concept-V2.md`) | 6 | DOC |
| D-341 | Le statut « valeurs à valider » ne reflète pas la validation du 12/10 (`docs/preparation/PRE-3/…/registre-recette1.md:189`, d'après l'analyse G) | 5 | FONCT-ARBITRÉ `[PRE4]`, preuve à revérifier avant application |

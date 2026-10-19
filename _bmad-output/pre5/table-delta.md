# PRE-5 — Table de delta (besoin → source → existant → changement → conservé → validation)

**Date :** 2026-10-19. **Clone :** `C:\Dev\KODJO-BMAD-PRE5`, branche `bmad/pre5-depuis-pre4`, HEAD `52382b04` (code `src/` et `app/` identique au merge PRE-4 `1116586b`).
**Entrées :** cadrage de Hermann du 18/10 (`KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md`, cité « cadrage l. X ») ; `inventaire-sources.md` (règles, C-1 à C-7, P-1 à P-8) ; `inventaire-code.md` ; `docs/preparation/PRE-4/bmad/questions-ouvertes.md` (Q8 à Q55) ; `_bmad-output/implementation-artifacts/spec-4-2-…` (relevé E-V1 à E-V16).
**Conventions :** `ch. NN l. X` = `docs/Specifications-fonctionnelles/NN – ….md` à `5e14a65e` ; `CE-UI-10` et `RC` (règles communes de l’éditeur de paramètres) sont au ch. 13 ; `Sheet` = `src/features/activities/ExecutionParametersSheet.tsx` ; `Form` = `src/features/activities/ActivityEditorForm.tsx` ; `EP` = `src/domain/activities/ExecutionParameters.ts` ; `Draft` = `src/domain/activities/ExecutionParametersDraft.ts`. Les lignes de code sont celles du HEAD ci-dessus.

**Principes appliqués :** un comportement validé en PRE-3 ou PRE-4 ne change que sur un besoin PRE-5 explicite (cadrage, D-xxx, demande de Hermann). Aucun troisième Mode ni aucune condition « Mixte » persistée : AR-01 est calculé. Aucune primitive native acceptée n’est remplacée sans décision explicite. Figma fixe le rendu, jamais une règle. Une ligne marquée **NR** est déjà conforme : c’est une non-régression, pas une story. La colonne « Bloqué par » ne bloque que sa ligne.

---

## 1. Table de delta

### 1.1 Écran principal (CE-T03-04)

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ01 | Description en étapes numérotées : état vide « 1. Décrivez la première étape », Entrée crée l’étape suivante (« Étape suivante »), sans bouton Ajouter, ↑ ferme le clavier | D-425 (ch. 07 l. 715) ; ch. 08 l. 366 ; CE-T03-04 l. 797, 841 ; cadrage l. 25 | `Form:413-454` (`TextInput` multiligne, ↑ D-351) ; défilement `Form:236-252` | Remplacer le champ libre par une liste d’étapes (numéro, texte, invite) ; Entrée = nouvelle étape | Bouton ↑ et sa fonction (D-351) ; défilement au-dessus du clavier, Terminer immobile (D-349) | `ActivityEditorForm.test.tsx` (saisie, Entrée, ↑) ; recette iPhone : clavier ouvert, curseur visible | QP5-02 (étape vide, retour arrière) |
| Δ02 | Sauvegarde, réouverture et copie des étapes ; reprise des anciens textes sans découpage destructif | ch. 09 l. 332 ; ch. 11 l. 100, 125 ; PRODUCT l. 401 ; cadrage l. 25 | `ActivityEditorFormValue.instruction: string` (`Form:64-70`) ; `ExerciseScreen.tsx:360`, `:503-574` ; `activityDefinitionToDraftExercise` (`ActivityDefinition.ts:361`) ; colonnes `description` (sans CHECK) et `instruction` (`CHECK ≤ 1000`, `migration010.ts:548`) | Encodage des étapes et lecture des textes existants ; `formValueEquals` (`ExerciseScreen.tsx:192-200`) sur la nouvelle forme | Copie Définition → Séance, duplication | `ExerciseEditingPaths.integration.test.tsx` ; `copiesAndSnapshots.story13.test.ts` (étapes copiées) ; test de lecture d’un texte PRE-4 multiligne | QP5-01 (P-2) |
| Δ03 | Limite de 1 000 caractères et étapes vides | D-425 « À CLARIFIER » ; ch. 08 l. 366 | `INSTRUCTION_MAX_LENGTH` (`validation.ts:42`, `:368-381`) ; `maxLength` `Form:419` | Appliquer la limite et le retrait des vides selon l’arbitrage | Limite historique de 1 000 | Tests de validation | QP5-02 (P-3) |
| Δ04 | Retirer Compte à rebours et Fin du résumé de la Carte et de son nom accessible (présentation seulement) | cadrage l. 26 ; CE-T03-04 l. 813 (D-413) ; registre du 10/10, demande 2 ; Q-V3-12 | `phasesRow` et `cardSeparator` `Form:485-498` (styles `:864-895`) ; nom accessible `Form:467` | Supprimer l’affichage et les deux valeurs du nom accessible ; clés `card.countdown`/`card.end` orphelines | Données, Feuille et `computeExercisePlanDuration` inchangés ; Phrase et « Durée totale » de la phrase (Q-V3-13) | Réécrire `ActivityEditorForm.test.tsx:327, 374, 668, 737-739, 765, 987-990, 1055` et `EditorAccessibility.story46.test.tsx:454` | — |
| Δ05 | Abaisser Terminer selon Figma et réserver une zone au-dessus, clavier ouvert ou fermé | cadrage l. 27 ; registre du 10/10, demande 20 (y802) ; D-349 | Terminer hors `KeyboardAvoidingView` `Form:521-543` ; `marginBottom: insets.bottom + 16` `:524` ; `bodyContent.paddingBottom = 12` `:835-839` | Marge basse et réserve de défilement selon le relevé Figma | Terminer ne remonte pas avec le clavier (D-349) ; couleurs actif/inactif (CE-T03-04 §14) | Test du créneau `finishSlotTestID` ; recette iPhone (dernier contenu jamais masqué, 2 états clavier) | Relevé Figma (S-2) |
| Δ06 | Conformité Figma : titre d’en-tête, Nom, accès Catégorie et Zones, titres de section, cadre des modalités, typographies, couleurs, positions | cadrage l. 24 ; registre du 10/10, demandes 1, 5, 13, 14, 17, 18, 21 ; Q48 (écarts E-V1 à E-V16, `spec-4-2` l. 76-108) ; C-4, C-6 | `Form:288-386` (bandeau), `:840` (`sectionTitle`), `:459-500` (Carte) ; `ScreenShell.tsx` ; `tokens.ts` verrouillé | Corriger les écarts E-V retenus ; styles locaux nommés si une couleur n’a pas de jeton (`colors.surfaceSubtle` #F9FAFC existe) | Grille verticale D-327 (Q48) ; « Retour » du ✕ (Q48) ; séparateur des Zones (Q49) ; comportements Catégorie/Zones (Q49, Q53) | `tokensSpecification.test.ts` intact ; tests 4.2/4.3 ; recette visuelle par Hermann | Relevé Figma (S-2) ; arbitrage écart par écart de Q48 |
| Δ07 | Ordre Description → Paramètres → Média ; titre de section « Paramètres d’exécution » ; Carte vide sans invite | C-2/P-7 ; Q11 ; Q55 ; registre du 10/10, demande 3 | `Form:405-504` (déjà dans cet ordre) ; `index.ts:12` | **NR** : aucun changement. Q11 et Q55 sont des décisions de Hermann postérieures au registre et priment sur le texte des captures | Q11, Q55, Q23 | Tests existants | — |

### 1.2 Paramètres — phases

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ08 | Modèle : 0 à 6 phases ordonnées, identité stable, libellé de 1 à 20 caractères, durée positive, ancienne version lisible | D-370, D-373 ; ch. 09 l. 370-380 ; ch. 11 l. 107-118 | `UniformSeries` `EP:116-121` ; `serializeV2`/`readV2` `EP:717-834` ; égalité et clone `EP:899-948` | Ajouter les phases (emplacement : architecture §7.2), validation, sérialisation, égalité, clone ; nom anglais distinct de `phasesRow`/`withProfilePhases` (clarification 7) | JSON v2 lisible ; lecteur v1 | `ExecutionParameters.test.ts` (aller-retour, absence = aucune phase) | — |
| Δ09 | Durée de série = Σ phases, calculée et non modifiable, sans arrondi au pas ; T = N × (D + P) ; inversion par N seulement | ch. 08 l. 269-279 ; ch. 10 l. 278 ; CE-UI-10 §12 | `workSeconds` (`executionCalculations.ts:110-121`) ; `applyRequestedTotal` `Draft:576-587` ; `projectScalars` `EP:856-869` | Maintenir ou dériver D (choix d’architecture §7.3) ; afficher D en lecture seule | Calculs, natures, inversion R-02 | `executionCalculations.test.ts` (6 + 3 s, 3 séries, P 15 s → 72 s) | QP5-04 (a) bornes de la somme |
| Δ10 | Ligne « Phases de l’exercice » Avec / Sans en tête du cadre Séries, chevron dans Avec, tableau Libellé/Durée sans pied ni ± (déplacement, numéro, suppression, ligne active) | D-410, D-413 ; ch. 08 l. 249-255 ; RC ligne 2b | `VariableTable` `Sheet:1825-1995` (`DraggableRow`, `RemoveRowButton`, annulation) | Tableau de phases sur le patron du tableau des séries ; Avec crée « Phase 1 » à la durée courante ; ajout copie la dernière durée, pas de 7e ligne | Gestes et alternatives accessibles du tableau (CE-UI-10 §13) | `ExecutionParametersSheet.test.tsx` ; `ExecutionParametersDraft.test.ts` | QP5-04 (b) contrôle d’ajout ; (c) Avec sans durée |
| Δ11 | Libellé de phase : saisie de texte, clavier ne masquant ni le champ ni les actions | ch. 08 l. 253 ; CE-UI-10 §10 l. 1087 | Aucun `TextInput` dans la Feuille | Champ texte dans la cellule, intégré à `sheetSurface` (Δ29) | — | Test Feuille ; recette iPhone (clavier) | — |
| Δ12 | Durée de phase : « contrôle de durée » | ch. 08 l. 253 ; CE-UI-10 §13 | `DurationWheelPicker` natif dans `AnchoredPanel` (Q37, Q41) | Réutiliser la roue native avec les bornes arbitrées | Roue native, zéro `ScrollView` iOS | `DurationWheelPicker.test.tsx:371` intact | QP5-03 (option À l’échec, C-1) ; QP5-04 (a) |
| Δ13 | Compatibilité : avec des phases, Répétitions, À l’échec et Variables indisponibles ; création de phases indisponible en Variables ou À l’échec ; aucune conversion destructive | ch. 08 l. 244-246 ; CE-UI-10 l. 1067 | `setMode` `Draft:396-421` ; `setVariable` `Draft:315-386` | Prédicats d’indisponibilité et options grisées avec valeur réelle (RM-247) | Mémoire par Mode (`TargetsByMode`) | `ExecutionParametersDraft.test.ts` | QP5-03 (portée de « À l’échec ») |
| Δ14 | Normalisation à ✓ : phases à 0 retirées, libellé vide → « Phase n » ; passage Avec → Sans avec phases ; liste entièrement nulle | D-373 ; ch. 08 l. 257-259, l. 342-343 ; D-371 (règles de durée) | `commitSheetDraft` `Draft:621-629` → `validateForSave` | Normalisation au ✓ ; réserve de brouillon pendant l’ouverture | D-249 (non-persistance des variantes cachées, hors charge) | `ExecutionParametersDraft.test.ts` | QP5-04 (d), (e) |
| Δ15 | Phases sous format imposé (D-372) et adaptation proportionnelle (D-374) | D-372, D-374 ; cadrage l. 81 | Aucun parcours de format dans `src/` (recherche du 19/10) | **Aucune** : parcours absent, non créé | — | — | — |

### 1.3 Paramètres — charge

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ16 | Modèle : charge facultative en kg, activation distincte des valeurs, commune ou par série, valeurs conservées sous Sans, absence lue Sans (jamais 0 kg), décimale au pas de 0,25 | D-403, D-404 ; RM-235, RM-236 ; ch. 09 l. 344-347 | `SeriesRow` `EP:111-114` ; `checkStructuralNumber` exige un entier `EP:464-486` ; `alignRowsToBaseline` `EP:412-435` | Champs d’activation et de valeurs (représentation : architecture §7.4) ; contrôle décimal ou unité entière ; égalité, clone | Aucun effet sur les calculs (D-403) | `ExecutionParameters.test.ts` ; JSON PRE-4 et `migration010` relus Sans | — |
| Δ17 | Brouillon : copie uniforme → variable charge comprise, ajout de série, retrait, annulation, déplacement, passage identiques/variables ; Q29 | CE-UI-10 §12 ; RM-238 ; Q29 | `openSheetDraft`, `plain` (ne garde que `target` et `pauseSeconds`), `requestedParameters` `Draft:132-195` ; `setSeriesCount` `:269-306` ; `removeRow`/`undoRemoval` `:489-522` | Porter la charge dans les trois fonctions énumératives ; chaque transition remet `pendingRemoval` à `null` | Réserves, identités, Q29 | `ExecutionParametersDraft.test.ts` | — |
| Δ18 | Identiques : ligne Charge après la Pause, Avec ouvre la saisie, la valeur remplace Avec (« 20 kg ») | D-404 ; RM-237 ; RC ligne 6 | Aucune ligne Charge | Nouvelle ligne du cadre Séries | — | Test Feuille ; recette iPhone | — |
| Δ19 | Variables : ligne Avec / Sans sous le tableau ; colonne Charge, titre non interactif ; la charge suit sa série | D-404 ; RM-238 | `VariableTable` `Sheet:1825-1995` | Colonne supplémentaire, masquée sous Sans | Glisser, retrait, annulation | Test Feuille (déplacement emporte la charge) | — |
| Δ20 | Saisie au clavier décimal sans fenêtre ; arrondi au 0,25 supérieur à la sortie du champ ; négatif refusé ; zéro = sans charge ; 1re activation 0,25 kg ; réactivation restaurée | D-405, RM-239 (CH-05 clos, cadrage clarification 3) | Aucun `keyboardType` dans `src/` | Champ numérique décimal (Δ29) et règles de sortie de champ | Arbitrages CH-05 : ne pas les redemander | Tests unitaires des scénarios spec v3 l. 488 (1,3 → 1,5 ; 0,01 → 0,25 ; [0;0;0] → Sans puis 0,25 partout) | — |

### 1.4 Paramètres — côtés

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ21 | Changement de côté Avec (gauche) / Sans (droite), sans direction ; Avec rend disponibles Enchainement et Pause entre les côtés ; chevron dans Avec ; côté vide → Sans au ✓ | D-406, D-410 ; RM-242 ; RC ligne 7 | `SegmentedControl<SideMode>` à trois valeurs dans `AnchoredPanel` `Sheet:1172-1196` ; `setSideMode` `Draft:524-537` | Segmenté en ligne à deux options ; représentation de Avec (architecture §7.5) | Copie de la Pause entre les côtés du Profil (P3-10) ; deux stratégies (RM-037) | Test Feuille ; `ExecutionParametersDraft.test.ts` | QP5-06 (composant segmenté) |
| Δ22 | Données historiques `RIGHT_LEFT` / `LEFT_RIGHT` lues Avec, Ordre enregistré conservé, pas de réécriture | RM-244 ; D-406 | `SideMode` (`sideMode.ts:24-27`) ; CHECK `side_mode` (`migration006.ts:28`, `migration010.ts:491`) | Lecture tolérante ; aucune nouvelle valeur de CHECK si possible (sinon reconstruction de deux tables) | Lisibilité des résultats par côté | Test de lecture des deux valeurs historiques | — |
| Δ23 | Libellé « Enchainement » ; options à la notation Figma, sans lettres D/G | D-413, D-407 ; RM-243 ; PR-05 ; Q-V3-09 | `sideOrder: "Ordre des côtés"`, `sideOrderSubtitles` « (D1 → D2) → (G1 → G2) » (`index.ts:76-84`) ; panneau `Sheet:1198-1227` | Libellé et sous-titres neutres ; contrôle selon arbitrage | Deux stratégies ; masquée à N = 1 avec Ordre conservé (Q38 = D-415) | `index.test.ts` ; test Feuille | QP5-07 |
| Δ24 | Ligne Enchainement non affichée à N = 1, Avec / Sans disponible | D-415 | Q38 déjà livré | **NR** | Q38 | Tests Q38 | — |

### 1.5 Paramètres — condition d’arrêt

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ25 | Identiques : ligne « Condition d’arrêt » À l’échec / À la cible, défaut À la cible, appliquée à toutes les séries ; retour à À la cible sur la dernière valeur chiffrée | D-411, D-416 ; RM-248 | Cibles typées `EP:38-69` ; `targetFor` renvoie la `FAILURE` telle quelle `Draft:401-402` | Ligne segmentée ; mémoire de la dernière valeur numérique dans le brouillon | Cibles `NUMBER`/`FAILURE`/`UNSET` comme seule donnée ; deux Modes | `ExecutionParametersDraft.test.ts` | — |
| Δ26 | Variables : résultat dérivé non modifiable — À la cible, À l’échec, ou une seule option « À la cible et à l’échec » ; cellule vide non comptée ; sémantique accessible de valeur non modifiable | D-411 ; RM-249 (AR-01) ; spec v3 l. 209-227 | Prédicats `allTargetsFailure`, `hasFailureTarget`, `hasUnsetTarget` `EP:226-238` | Une fonction pure dérivée, lue par la Feuille ; rendu « non sélectionnable » | Aucune valeur Mixte persistée | Test unitaire des 3 résultats + tableau incomplet ; test a11y | — |
| Δ27 | Identiques À l’échec : saisie « Durée d’une série » masquée | D-419 | Ligne de Cible commune `Sheet:1608-1650` | Masquer la ligne | — | Test Feuille | QP5-08 (cas Répétitions) |
| Δ28 | Roulettes : Durée d’une série et Répétitions sans option À l’échec en identiques ; option conservée dans une cellule variable | D-412, D-418 ; RM-250 | Options d’échec `Sheet:1049-1077`, `:1100-1128` | Retirer l’option en identiques | Roue native, PickerToolbar ; option en tête des cellules (Q8) | `NumberWheelPicker.test.tsx:260` intact ; test Feuille | — |

### 1.6 Paramètres — saisie numérique

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ29 | Champ en saisie clavier dans la Feuille (charge décimale, libellé de phase texte) : champ édité visible, tableau visible au-dessus du clavier (marge de 12 dans `9292:18077`), fermeture d’un pavé sans Retour, une seule surface ouverte | D-405 ; CE-UI-10 §10 l. 1085-1087 ; D-413 | Patrons `BodyZonePickerModal.tsx:92-104`, `:314-318` ; `Form:236-252` ; `sheetSurface.ts:56-158` ; hauteur max `Sheet:1347-1351` | Composant de champ + nouvelle surface « saisie clavier » + gestion du clavier dans la `Modal` | Règle d’une seule surface ; absorption ✓/✕ (Q47) | `sheetSurface.test.ts` ; recette iPhone (aucune preuve par Jest) | — |
| Δ30 | Aucune autre valeur ne passe au clavier ; roulettes et steppers conservés | D-405 « propre à la charge » ; ch. 07 l. 686 ; cadrage l. 34 | Roues natives, `RevealStepper` | **NR** | Roues natives et garde-fous | `DurationWheelPicker.test.tsx:371-379`, `NumberWheelPicker.test.tsx:260` | P-1 (confirmation, non bloquant) |

### 1.7 Présentation de la Feuille

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ31 | Quatre cadres gris arrondis espacés de 8 (Exécution ; Séries ; Côtés ; Cadence et durée) et ordre des lignes ; libellés fixés | D-413 (GR-01, PR-01) ; RC l. 1187-1202 | Un seul groupe `Sheet:1425-1433` ; panneaux placés par rapport à ce groupe (`groupBox`, `variableGroupY`, `Sheet:1303-1333`, `:982`) | Découper en quatre groupes ; reprendre le repère de placement des panneaux ; couleur des cadres en constante locale (Q-V3-10) | `Row`, `ValuePill`, `Separator`, `SheetMotion`, animations Q39 à Q41 | Tests de mise en page `Sheet:1522, 1622, 1659` à adapter ; recette iPhone | Relevé Figma (S-2) |
| Δ32 | Mode, Type de série, Changement de côté, Condition d’arrêt, Phases, Charge, Cadence : segmentés en ligne, alignés à droite, sans enveloppe blanche, sans popover | D-413 ; RC l. 1204 | Mode : `NativeRowPopover` iOS `Sheet:325-410`, segmenté ailleurs `:1447` ; Régime et Côté : `AnchoredPanel` (Q41, Q43) | Remplacer la présentation (voir §2) ; variante de style du segmenté | `SegmentedControl` accepté (comportement) | Réviser `Sheet.test.tsx:1257`, `:1368` (popover du Mode) | QP5-06 |
| Δ33 | Chevrons intérieurs aux options Variables, Avec (côtés), Avec (phases) ; repli sans perte de valeurs ni de mode | D-410 ; RM-247 (CV-01) | `DisclosureControl` indépendant `Sheet:1538-1552` | Chevron intégré à l’option | Repli sans perte, animations | `DisclosureControl.test.tsx` ; test Feuille | QP5-06 |
| Δ34 | Tableau variable : fond blanc sans contour, lignes de 36, aucun stepper de cellule ; chaque cellule ouvre le sélecteur de son champ (roue, stepper de Pause pour cette cellule, clavier de charge) | D-413, D-417 ; RC ligne 5 ; CE-UI-10 §9 | `InlineStepper` permanents `Sheet:1929`, `:1951` ; `TABLE_ROW_HEIGHT = 44` `:515` (Q42) ; largeurs `:495-518` | Retirer les ± de cellule ; ouverture du sélecteur par cellule ; hauteur | Glisser, croix et « Série supprimée — Annuler », fond `#FFF1F0` (Q35), roue sous la ligne (Q45) | Tests 3.6 du Sheet ; recette iPhone | QP5-05 |
| Δ35 | Cadence : Autre / 5 s / 2 s / 1 s / Sans ; l’option reflète la valeur ; Autre = ± existant 0..10 pas 1 sans accélération ; aucune mémoire personnalisée | D-408, D-420 ; RM-245 | `stepperField("beep")` `Sheet:1738` ; lexique « Bip de cadence » | Segmenté + ± sous Autre | Bornes, pas, donnée (D-312, D-313) | Test Feuille (Sans puis Autre ne restaure rien) | — |
| Δ36 | « Durée de l’exercice » : chevron à 12 du libellé, replié par défaut, masque Compte à rebours et Fin sans les désactiver ; ligne absente → signaux visibles ; RM-218 | D-409 ; RM-246 | Ligne `Sheet:1753` ; Compte à rebours `:1787`, Fin `:1800` toujours visibles ; « Durée totale » (`index.ts:88`) | Libellé, chevron, visibilité conditionnelle | Calcul, natures, `—`, N = 1 (D-384, D-396, D-397) ; bornes T(1)..T(99) (Q46) | Test Feuille | — |
| Δ37 | La Feuille s’adapte au contenu ; un repli ne laisse pas d’espace vide ; jusqu’à six phases défilent | D-413 ; CE-UI-10 §10 | `SheetMotionScrollView` `Sheet:1387-1404` ; `SheetMotion.tsx` | Vérifier avec les nouveaux groupes | Animations fil UI (Q39 à Q41) | Recette iPhone | — |
| Δ38 | Nombre de séries, Pause, Pause entre les côtés, Compte à rebours, Fin : valeur au repos, ± à l’appui ; roues dans un panneau sans flèche ; ✓/✕ en deux temps ; valeur manquante en fond rouge pâle | CE-UI-10 §8 l. 1063, RC l. 1192 (C-5) ; Q35, Q37, Q41, Q47 | `RevealStepper` `Sheet:992`, `:2233-2299` ; `AnchoredPanel` | **NR** | Q35, Q37, Q41, Q46, Q47 | Tests existants | — |

### 1.8 Consommateurs et persistance

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ39 | Format persisté : nouvelles clés lisibles en leur absence (JSON PRE-4 et `migration010`) | ch. 09 l. 378-380 ; ch. 11 l. 118 | `serializeV2` à clés énumérées `EP:717-741` ; `readV2` ignore les inconnues `EP:778-834` ; colonne `TEXT` sans CHECK (`migration009.ts:23-25`) | Choix v2 étendue ou v3 (architecture §7.1) ; aucune migration SQL si v2 étendue | Migrations 001 à 010 intactes | `ExecutionParameters.test.ts:108-167` (évolue par conception) ; `migration010.test.ts`, `preservation.story14.test.ts` | — |
| Δ40 | Projection scalaire et CHECK : la durée projetée d’un exercice à phases reste dans les bornes | ch. 08 l. 345 ; CE-UI-10 §14 | `projectScalars` `EP:856-869` ; `assertActivityColumns` `SqliteSessionRepository.ts:1420-1424` (1..5999) ; saisie 5..3535 `EP:88` | Garde de borne sur Σ phases | Saisie 5..3535 déjà conforme (l’écart de ch. 08 l. 345 ne concerne plus la saisie) | `SqliteActivityDefinitionRepository.test.ts:755` ; parité du CHECK | QP5-04 (a) |
| Δ41 | Copies, duplications et instantanés transportent phases, charge (valeurs sous Sans comprises) et étapes | D-403 ; ch. 09 l. 242, 430, 450 ; ch. 11 l. 125 ; cadrage clarification 6 | `cloneExecutionParameters` `EP:937-948` ; `ActivityDefinition.ts:339-365` ; `composition.ts:217-243` ; `exerciseSnapshot.ts:91-135` | Étendre clone et égalité (Δ08, Δ16) | Isolation des copies | `copiesAndSnapshots.story13.test.ts` étendu ; `runNativeDatabaseIntegrationCheck.ts:62` | — |
| Δ42 | Phrase : mention de charge après la valeur par série ; `(charges : 20, 12 kg, ...)` au-delà de trois ; zéro affiché ; rien sous Sans | D-414, D-422, D-423 ; RM-240 ; ch. 10 l. 491, 507 | `generateExecutionPhrase` `executionPhrase.ts:105-226` | Nouvelle clause | Les 276 phrases sans charge, intactes | `executionPhrase.test.ts` + cas charge | — |
| Δ43 | Phrase : clause des côtés neutre (« côté 1 puis le côté 2 », etc.) | D-407 ; RM-243 ; ch. 10 l. 515 | `executionPhrase.ts:190-212` (« droit », « gauche ») | Textes de ch. 10 l. 515 | Grammaire et ponctuation du corpus | Corpus mis à jour pour les cas bilatéraux | S-3 (corpus, Q-V3-02) |
| Δ44 | Phrase avec phases | CE-UI-10 l. 1047 ; ch. 08 l. 344 (P-6) | — | Aucune clause nouvelle ; D apparaît comme durée de série | Corpus | Cas « phases » : durée = somme | QP5-09 |
| Δ45 | Indicateur de côté de la Composition sans direction | D-407 ; RM-151 | `CompositionScreen.tsx:1721-1880` ; `fr.ts:47-50` (« D→G ») | Adapter le point de passage seulement (cadrage, Limites) | Reste de la Composition | `compositionPresentation.test.ts` | Relevé Figma (S-2) |
| Δ46 | Lexique : nouvelles clés (Condition d’arrêt et trois résultats, Phases, Charge, kg, Avec/Sans, Enchainement, Cadence, Durée de l’exercice, invites des étapes) ; clés orphelines retirées | RM-092 ; D-413 | `index.ts:10-184` ; `fr.ts:40-96` | Ajouts et retraits | Identifiants techniques (`SideOrder`, `target`) inchangés (D-201) | `index.test.ts` | — |
| Δ47 | Durées de Séance, synthèses de ligne du Catalogue et de la Composition, carte du Catalogue | RM-249 ; cadrage, Limites | `calculations.ts:67-78` ; `compositionPresentation.ts:239-286` ; `ActivityCard.tsx:122-129` | **NR** si `workSeconds` reste juste | Tout | `calculations.test.ts`, `compositionPresentation.test.ts`, `ActivityCard.test.tsx` | — |

**Décompte :** écran principal 7 lignes (dont 1 NR) ; phases 8 (dont 1 sans objet) ; charge 5 ; côtés 4 (dont 1 NR) ; condition d’arrêt 4 ; saisie numérique 2 (dont 1 NR) ; présentation de la Feuille 8 (dont 1 NR) ; consommateurs et persistance 9 (dont 1 NR). Total 47 lignes, dont 5 NR et 1 sans objet.

---

## 2. Remplacements de comportements acceptés

| # | Comportement accepté (PRE-3 ou PRE-4) | Origine | Remplacé par | Explicite ? | Question |
|---|---|---|---|---|---|
| R-01 | Popover natif SwiftUI du Mode (`NativeRowPopover`), « validé par Hermann » | Q41, story 3.3 | Segmenté en ligne, sans popover | Oui : D-413 nomme la ligne Mode | — (réviser `Sheet.test.tsx:1257`, `:1368`) |
| R-02 | Changement de côté : `SegmentedControl` à 3 valeurs dans un `AnchoredPanel` | Q41 | Segmenté Avec / Sans en ligne, chevron intérieur | Oui : D-406, D-410, D-413 | QP5-06 (composant) |
| R-03 | Régime dans un `AnchoredPanel` | Q43 | « Type de série » segmenté en ligne, chevron dans Variables | Oui : D-413, D-410 | — |
| R-04 | Ordre des côtés dans un `AnchoredPanel` | Q41 | Non dit : D-413 liste les segmentés sans nommer Enchainement | **Non** | QP5-07 |
| R-05 | ± permanents des cellules Cible et Pause (« pas de Cellule active ») | Q44 | Aucun stepper de cellule ; la cellule active ouvre son sélecteur | Oui : D-413, D-417 (réponse de Hermann à Q-V3-05, postérieure à Q44) | — |
| R-06 | Lignes de tableau à 44 pt (NFR-09) | Q42 | Lignes de 36 | Oui dans le texte de D-413, mais en conflit avec la cible tactile de Q42 | QP5-05 |
| R-07 | Libellé « Ordre des côtés » et sous-titres « D1 / G1 » | PRE-3, lexique | « Enchainement », notation sans direction | Oui : D-413, D-407, Q-V3-09 | QP5-07 (notation) |
| R-08 | Choix Droite puis gauche / Gauche puis droite | D-143, D-247 | Avec / Sans | Oui : D-406 | — |
| R-09 | Option « Aucune durée, à l’échec » de la roue de Durée commune | DSF Deux modes, PRE-4 | Condition d’arrêt | Oui : D-412 | — |
| R-10 | Option « Aucune répétition, à l’échec » en séries identiques | Q8 (D-385) | Condition d’arrêt | Oui : D-418 | — |
| R-11 | « Bip de cadence » en stepper | D-308 | Cadence segmentée, Autre avec ± | Oui : D-408 | — |
| R-12 | « Durée totale » de la Feuille ; Compte à rebours et Fin toujours visibles | PRE-3, Q46 | « Durée de l’exercice » avec chevron | Oui : D-409 | — |
| R-13 | Description multiligne, Retour = retour à la ligne | D-351 | Étapes numérotées | Oui : D-425 | QP5-01, QP5-02 (modalités) |
| R-14 | Compte à rebours et Fin sur la Carte et dans son nom accessible | story 4.2 AC6, Q52 c | Retirés de la présentation | Oui : cadrage l. 26 | — |
| R-15 | Indicateur « D→G » / « G→D » de la Composition | RM-151 ancien | Indicateur sans direction | Oui : D-407, RM-151 | — (rendu : S-2) |
| R-16 | Phrase « côté droit puis le gauche » | D-148, RM-152 ancien | « côté 1 / côté 2 » | Oui : RM-243 | — |

**Conservés malgré les captures** (décisions de Hermann postérieures ou de même rang) : titre « Paramètres d’exécution » (Q11, contre « Modalités d’exécution » des captures) ; Carte vide sans invite (Q55, contre l’invite des captures) ; ordre Description → Paramètres (déjà conforme à Figma ; ch. 13 l. 813 est un résidu, C-2) ; roues natives dans un panneau sans flèche (Q37, Q41) ; steppers révélés de N et de la Pause (C-5 tranché par CE-UI-10).

---

## 3. Questions indispensables

Seules figurent les questions qui changent ce qu’on développe. Les arbitrages clos (CH-05, AR-01, D-403 à D-426) ne sont pas redemandés.

**QP5-01 — Reprise d’une ancienne Description en texte libre (P-2).** Options : (A) chaque ligne non vide devient une étape ; stockage d’une étape par ligne dans la colonne texte existante. (B) Tout l’ancien texte devient l’étape 1. (C) Nouvelle structure (colonne ou table) et migration. **Recommandation : A.** Le Retour de D-351 séparait déjà les lignes ; la conversion est réversible (jointure par saut de ligne) et ne demande aucune migration (`description` sans CHECK, `instruction` `≤ 1000`, `migration010.ts:548`). Les lignes vides ne sont pas affichées ; le texte stocké ne change qu’au prochain Terminer.

**QP5-02 — Étapes vides, suppression et limite de 1 000 caractères (P-3).** Options : vides retirées au Terminer ou conservées ; retour arrière sur une étape vide (suppression et curseur en fin de l’étape précédente, ou rien) ; limite par étape ou totale. **Recommandation :** retrait silencieux des étapes vides au Terminer (même principe que D-373 pour les phases) ; retour arrière sur une étape vide = suppression et curseur en fin de l’étape précédente ; limite totale de 1 000 sur le texte stocké, comme aujourd’hui (`INSTRUCTION_MAX_LENGTH`, `validation.ts:42`).

**QP5-03 — La durée d’une phase propose-t-elle « À l’échec » ? (P-4, C-1, Q-V3-17).** Options : (A) non, roue numérique seule ; (B) oui, comme une cellule variable. **Recommandation : A.** D-370 et ch. 09 l. 378 exigent une durée positive ; ch. 08 l. 244 rend À l’échec incompatible avec les phases. La phrase de D-412 « la roulette propre à une phase n’est pas modifiée » se lit comme une absence de modification par la v3, pas comme une option à créer. À confirmer avec la spécification des phases (S-1).

**QP5-04 — Bornes et cas limites des phases (P-5).** (a) Bornes : **recommandation** 1 s à 3 535 s par phase, au pas de 1 s, somme ≤ 3 535 s (borne de saisie de la durée de série, `EP:88`), sans plancher de 5 s (ch. 08 l. 340). (b) Contrôle d’ajout, puisque Figma retire les ± : **recommandation** suivre `9207:18817` une fois relevé (S-2) ; à défaut, une ligne d’ajout en fin de tableau, indisponible à six. (c) Avec alors que la durée de série vaut « — » : **recommandation** créer « Phase 1 » avec une durée à renseigner (fond rouge pâle, ✓ indisponible ; D-389, et ch. 08 l. 343 : « ne pas fabriquer une durée valide arbitraire »). (d) Avec → Sans avec des phases : **recommandation** suppression au ✓ ; la somme devient la durée de série (principe de D-371) ; restauration possible tant que la Feuille est ouverte. (e) Toutes les phases à 0 : **recommandation** ✓ indisponible, comme pour une cible à renseigner.

**QP5-05 — Hauteur des lignes de tableau : 36 (D-413) ou 44 (Q42, NFR-09) ?** Options : (A) 36 pour les tableaux des séries et des phases, 44 conservé pour les autres lignes de la Feuille ; (B) 44 partout. **Recommandation : A.** D-413 est postérieure et ne vise que les tableaux. La dérogation à la cible tactile de 44 dans les tableaux doit toutefois être actée par Hermann.

**QP5-06 — Composant des segmentés en ligne.** Options : (A) une variante de style du `SegmentedControl` déjà accepté (alignement à droite, sans enveloppe, chevron intérieur, état non modifiable) ; (B) un segmenté natif iOS via `@expo/ui` 57 (`NON VÉRIFIÉ`, `node_modules` absent). **Recommandation : A**, sauf avis contraire de Hermann. Le composant est déjà accepté pour Côté, Ordre et Régime. Rien ne garantit qu’un segmenté natif accepte les chevrons intérieurs (D-410) ni l’option unique non modifiable (AR-01). Si B est demandé, vérifier d’abord l’API dans la documentation Expo 57.

**QP5-07 — Enchainement : contrôle et notation.** (a) Contrôle : segmenté en ligne ou panneau de Q41 ? **Recommandation :** segmenté en ligne dans le cadre Côtés, puisque D-413 retire les popovers de la Feuille. (b) Notation : les sous-titres actuels portent D/G, écart relevé par Q-V3-09, et la notation C1S1 est rejetée (PR-05). **Recommandation :** reprendre la notation de la frame Figma corrigée (S-2) ; d’ici là, libellés seuls sans sous-titres plutôt qu’une notation inventée.

**QP5-08 — Répétitions en séries identiques avec la Condition À l’échec : ligne Répétitions masquée ?** D-419 ne nomme que la durée. **Recommandation :** la masquer aussi (symétrie de D-419 ; RO-01 : « l’accès au champ suit la condition » ; D-418 retire l’option d’échec de cette roue).

**QP5-09 — Phrase de synthèse d’un exercice à phases (P-6).** **Recommandation :** aucune clause propre aux phases en PRE-5. La somme D apparaît comme valeur par série. Les « nouveaux textes restent à valider » (CE-UI-10 l. 1047), et le corpus de 276 cas reste intact.

Non bloquants, sans question : P-1 (le clavier reste propre à la charge, Δ30) ; P-7 (tranché par Q11 et l’état du code, Δ07) ; P-8 (mesures à relever, S-2) ; C-3 à C-7 (résidus de texte).

## 4. Sources manquantes à demander

- **S-1** — `KODJO-Phases-specification-consolidee-2026-10-15.md` (version interne du 16/10, version de fichier 1), sections 1 à 4.1. Elle sert à QP5-03 et QP5-04 et à vérifier la couverture du rapport PR370.
- **S-2** — Relevé Figma (propriétés, pas règles) : écran principal (§4.5 de l’inventaire des sources : tailles et variables du titre, des sections, de la classification, des étapes et de la phrase ; cadre des modalités ; position de Terminer et zone de protection, clavier ouvert compris) ; Feuille (gris des cadres, violet de sélection, dimensions des segmentés, chevron intérieur, rendu du résultat dérivé, cellule de charge en saisie, clavier `9292:18077` corrigé) ; trois écrans de phases à reporter dans Prototype MVP et contrôle d’ajout de `9207:18817` ; notation corrigée de l’Enchainement (`8328:38193`) ; indicateur de côté de la Composition (RM-151).
- **S-3** — Corpus de recette des phrases mis à jour pour « côté 1 / côté 2 » (coordination Q-V3-02), ou l’accord pour que BMad mette à jour les cas bilatéraux du corpus de `docs/` à partir de ch. 10 l. 515.
- Optionnel : l’audit indépendant PRE-4 du 18/10 (cadrage l. 16), absent du dépôt et du disque.

## 5. Proposition de découpage

Une story par changement testable ; aucune story pour les lignes NR. Les lots 2 et 3 du cadrage sont fusionnés en un lot Feuille, pour éviter deux réécritures de `ExecutionParametersSheet.tsx`.

| Story | Contenu (lignes Δ) | Dépend de | Bloquée par |
|---|---|---|---|
| **1.1 Charge : modèle, brouillon, persistance, copies, phrase** | Δ16, Δ17, Δ39 (charge), Δ41 (charge), Δ42 | — | — |
| **1.2 Phases : modèle, durée dérivée, compatibilité, normalisation, projection** | Δ08, Δ09, Δ13, Δ14, Δ39–Δ41 (phases), Δ44 | — | QP5-03, QP5-04, QP5-09 |
| **1.3 Côtés Avec / Sans neutres** | Δ22, Δ43, Δ45, données de Δ21 | — | S-3 (corpus) ; S-2 pour Δ45 |
| **2.1 Feuille en quatre cadres et segmentés en ligne** | Δ31, Δ32, Δ33, Δ37, Δ21 (contrôle), Δ23, Δ46 (partie Feuille) | 1.3 | QP5-06, QP5-07 ; S-2 |
| **2.2 Condition d’arrêt et roulettes** | Δ25, Δ26, Δ27, Δ28 | 2.1 | QP5-08 |
| **2.3 Cadence et Durée de l’exercice** | Δ35, Δ36 | 2.1 | — |
| **2.4 Tableau variable sans steppers de cellule** | Δ34 | 2.1 | QP5-05 |
| **2.5 Champ de saisie clavier et charge dans la Feuille** | Δ29, Δ18, Δ19, Δ20 | 1.1, 2.1, 2.4 | — |
| **2.6 Phases dans la Feuille** | Δ10, Δ11, Δ12 | 1.2, 2.4, 2.5 (champ texte) | QP5-03, QP5-04 ; S-2 |
| **3.1 Description en étapes** | Δ01, Δ02, Δ03 | — | QP5-01, QP5-02 |
| **4.1 Écran principal : Carte, Terminer, conformité Figma** | Δ04, Δ05, Δ06 | 3.1 (zone de la Description) | S-2 ; arbitrage de Q48 |

Ordre conseillé : 1.1 et 1.3 → 2.1 → 2.2, 2.3, 2.4 → 2.5 → 2.6 (après 1.2). 3.1 avance en parallèle dès QP5-01 et QP5-02 tranchées. Δ04 (retrait de Compte à rebours et Fin de la Carte) n’a aucune dépendance : il peut ouvrir 4.1. Recette iPhone groupée par lot : Feuille (2.x) et Éditeur (3.1, 4.1). Les trois contrôles locaux (`npm test`, `npx tsc --noEmit`, `npm run lint`) s’appliquent à chaque story.

## 6. Réponses et décisions du 2026-10-19 (état consolidé)

Sources : `sources-2026-10-19/PRE5_BMAD_Decisions_v2.md`, qui remplace la version précédente du même jour (`KODJO_PRE5_Reponses_QP5-01_a_QP5-09_et_consigne_BMAD_2026-10-19.md`, conservée). Les sources complémentaires reçues le même jour sont dans `sources-2026-10-19/` : spécification consolidée des phases (S-1), matrice de compatibilité du 19/10, registre de modifications v25 et audit PRE-4 du 18/10.

**Toutes les questions sont décidées.** Hermann a arbitré lui-même QP5-01, la présentation de QP5-07, la Charge en mode Répétitions et la navigation au clavier numérique. Le 2026-10-19, il a validé toutes les autres recommandations (« je valide toutes tes recommandations »). Cela comprend :

- QP5-02 à QP5-06, QP5-08 et QP5-09 ;
- le point de QP5-04 marqué « Reste à confirmer » et la lecture des bornes de la somme ;
- l’extension du corpus pour « côté 1 / côté 2 » (S-3).

Les mentions « Recommandé » du tableau ci-dessous valent donc décision.

| N° | Statut | Réponse | Effet sur la table |
|---|---|---|---|
| QP5-01 | **Décidé** | Les étapes numérotées remplacent la description libre. Le texte existant n'est réutilisé que si c'est simple. Ni migration, ni conversion réversible, ni retour à l'ancien format, ni story dédiée. Recréer à la main les trois ou quatre descriptions est acceptable. Cette tolérance ne s'étend pas aux autres données de l'Exercice. | Δ02 : la reprise des anciens textes et son test sortent du périmètre. La recommandation A de §3 est abandonnée. |
| QP5-02 | Recommandé | Les étapes vides sont retirées à Terminer et la liste est renumérotée. Le retour arrière sur une étape vide la supprime. La limite de 1 000 caractères porte sur l'ensemble des textes des étapes, numérotation exclue. L'ordre est préservé. | Δ01, Δ03 |
| QP5-03 | Recommandé | Une phase est seulement chronométrée : roue numérique, sans « À l'échec » (D-370, D-412 ; spécification des phases §2.1). | Δ12, Δ13 |
| QP5-04 | Recommandé, **corrige la recommandation de §3** | Phase : au moins 1 s, au pas de 1 s, sans borne propre (spécification §2.1). La somme forme la durée de série et suit les bornes existantes de celle-ci. Avec reprend la durée de série existante ; à défaut, « Phase 1 » reste à renseigner (§2.2). Une phase ajoutée reprend la durée de la dernière ; l'ajout est impossible au-delà de six. Les phases à 0 s sont retirées sans message à la validation. Une liste vide ou nulle revient à « Aucune ». Si la cible reste absente ou invalide, la validation existante s'applique. Supprimer la dernière phase restante conserve sa durée comme durée de série (§2.3, D-371). **Arbitrage final du 19/10, Avec → Sans :**

- les phases sont retirées et leur somme devient la durée unique de la série (6 s + 3 s + 5 s → 14 s) ;
- cette durée reste modifiable selon les règles existantes, et les autres paramètres sont conservés ;
- l’annulation de la Feuille restaure la configuration précédente ;
- revenir à Avec crée une seule phase, à la durée actuelle de la série, sans mémoriser les anciennes phases ;
- si aucune durée valide ne peut être déduite, rien n’est inventé.

La restauration tant que la Feuille reste ouverte, prévue en (d) de la §3, est abandonnée. | Δ09, Δ10, Δ14, Δ40. La recommandation (e), qui bloquait la validation quand toutes les phases étaient à 0, est abandonnée. **Borne arrêtée par Δ50 :** la somme est comprise entre 1 et 3 535 s. Une somme hors de ces bornes rend la validation indisponible, comme une durée de série invalide. Sans parcours de format dans `src/` (Δ15), la durée imposée (§3) n'est pas développée. |
| QP5-05 | Recommandé, sous réserve tactile | Lignes de 36 dans les deux tableaux, de 44 pour les autres lignes de la Feuille. Vérification sur appareil avant toute autre géométrie. | Δ34 ; R-06 accepté |
| QP5-06 | Recommandé, **actualisé** | **Le `SegmentedControl` existant est réutilisé par défaut.** Le segmenté natif d'`@expo/ui` 57 ne le remplace qu'après une vérification courte, si elle prouve un gain réel de simplicité sans perte visuelle, fonctionnelle ou d'accessibilité. Aucune story de refonte, aucune abstraction nouvelle. | Δ21, Δ32, Δ33 : variante de style du composant existant, conforme à la recommandation A de §3. |
| QP5-07 | **Décidé** | Segmenté en ligne dans le cadre Côtés, à la largeur Figma. Libellés définitifs : « Un côté après l'autre » et « Les deux côtés à chaque série ». La police est réduite pour qu'ils tiennent, centrés, sans troncature ni sous-titre D/G ni notation C1S1. Visible avec Avec et N > 1 (D-415). La taille exacte de police se règle sur appareil, sans changer automatiquement la géométrie. La frame `8328:38193`, qui porte encore D1, D2, G1 et G2, sera alignée plus tard, sans bloquer PRE-5. | Δ23 ; R-04, R-07 acceptés ; question close |
| QP5-08 | Recommandé | La ligne Répétitions est masquée en séries identiques à la Condition À l'échec (RM-248). La restauration des valeurs est conservée. | Δ27 |
| QP5-09 | Recommandé, **corrige la recommandation de §3** | Les 276 formulations restent. Après la durée de série, une parenthèse détaille les phases dans l'ordre d'exécution (§4.1) : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. » La liste est exhaustive, même pour une seule phase, et reprend les libellés et durées effectifs. Sans phases, la phrase ne change pas. Générateur et segments existants ; le corpus est étendu avec les déclinaisons des phases (§5). | Δ44 : une clause est ajoutée, et le corpus est complété par des cas de phases. |

### Décisions complémentaires

| # | Besoin PRE-5 | Source | Code existant | Modification nécessaire | Conservé | Validation | Bloqué par |
|---|---|---|---|---|---|---|---|
| Δ48 | Charge en mode Répétitions, à l'identique du mode Durée : commune en séries identiques, par ligne en séries variables, y compris avec une cible À l'échec. Mêmes règles Avec/Sans, décimales, zéro, réactivation et conservation (D-403 à D-405, RM-235 à RM-241). Aucun effet sur les calculs. | Décision de Hermann du 19/10 | Δ16 à Δ20 ne dépendent pas du Mode | Aucune différence par Mode dans le modèle, le Brouillon ou la Feuille | Calculs inchangés | Cas explicites dans les tests et la recette : Répétitions × Identiques, Répétitions × Variables, cible À l'échec avec charge | — |
| Δ49 | Barre du clavier numérique : Précédent et Suivant déplacent la saisie entre les cellules du tableau saisies au clavier (les cellules de charge). La cellule active se distingue par sa couleur de fond, qui suit le focus. Le clavier reste ouvert pendant la navigation et la valeur reste éditable. L'état actif reste indiqué de façon accessible. | Décision de Hermann du 19/10 | Aucun `TextInput` numérique (Δ29) | Champs du tableau enchaînés pour le focus ; fond de la cellule active. Le comportement aux extrémités et aux cellules indisponibles suit les conventions existantes de focus, sans boucle inventée. | Roulettes et steppers des autres champs (Δ30) ; gestes du tableau | Test Feuille (focus suivant / précédent) ; **recette iPhone tôt** (audit, action 4) | — |
| Δ50 | **Bornes minimales des durées.** Toute durée strictement positive a un minimum de 1 s : série, phase, exercice, etc. Le pas est de 1 s, sans palier de 5 s. Zéro reste permis là où il l'était déjà : pause, compte à rebours, fin. Les maxima sont conservés. La somme des phases est comprise entre 1 et 3 535 s. | Décision de Hermann du 19/10, qui remplace le minimum de 5 s de D-232 et RM-234. Propagation documentaire : `propagation-borne-1s.md`. | Borne de saisie 5..3535 (`EP:88`). Pour les roues, `validation.ts` et les tests, voir le rapport de propagation. | Abaisser le minimum à 1 s dans les roues, les validations et les tests existants, sans nouveau composant ni mécanisme de saisie. | Maxima, règles de calcul, autres comportements validés | Tests des bornes (1 s accepté, 0 refusé pour une durée positive) ; roue au minimum sur iPhone | — |

### Points signalés par le PRD (§9) : décisions de Hermann du 19/10

Hermann a validé les recommandations de BMad, en corrigeant le point 9 : « Pour fermer le clavier, il y a un bouton "Fermer" sur la barre, à droite. »

| N° | Point | Décision |
|---|---|---|
| 1 | Pas de 1 s et grilles de Pause et de Récupération du Profil (pas de 5 s) | Inchangées : D-430 vise les minima. |
| 2 | Présentation de la Description | Demandes 17 et 21 du registre et Figma actuel : texte à 14, sans cadre. Elles priment sur la demande 10. |
| 3 | Ordre dans la Phrase | Parenthèse des phases juste après la durée de série, puis mention de charge. |
| 4 | Durée de l'exercice avec phases | L'ajustement par le nombre de séries est conservé ; l'illustration de la spécification v3 ne vaut pas règle. |
| 5 | Entrée au milieu d'une étape | Coupe l'étape au curseur. |
| 6 | Collage sur plusieurs lignes | Une étape par ligne. |
| 7 | 1 000 caractères atteints | Toute saisie supplémentaire est refusée. |
| 8 | Cadence réglée à 0, 1, 2 ou 5 | Le choix affiché correspond à la valeur (Sans, 1 s, 2 s, 5 s). « Autre » ne s'affiche que pour les autres valeurs. |
| 9 | Fermeture du clavier décimal | **Bouton « Fermer » à droite de la barre**, à côté de Précédent / Suivant. La ligne active reste visible au-dessus du clavier. |
| 10 | Passage de Variables à Identiques avec une charge reprise à 0 | L'Exercice passe à Sans (zéro = sans charge). |
| 11 | Cellule de charge vidée à la sortie du champ | Vaut 0 : pas de charge pour cette série. |

Q48 (écarts visuels hérités de PRE-4, point 1 du §9 du PRD) : chaque écart sera soumis à Hermann au moment de sa story, s'il touche un jeton, un composant ou la grille D-327.

### Précisions de cohérence, sans story nouvelle

- Description avant Paramètres d'exécution : déjà conforme (C-2).
- La Pause après chaque série reste applicable, y compris à N = 1, selon les règles existantes. La matrice du 19/10, qui suggère l'inverse, est une analyse et ne prime pas sur les décisions validées.
- L'Enchainement appartient aux paramètres de l'Exercice. Il est distinct des variantes d'exécution des formats de Séance, et PRE-5 ne s'étend pas aux formats.
- Les identifiants Figma actuels sont vérifiés avant de fonder une story sur une ancienne référence.
- Description en étapes (registre v25, demande 10, modèle A) : cadre blanc, rayon 8, padding 14, espacement 8.
  - Numéro en Inter Medium 15, #595E66, largeur 16, aligné à droite ; texte en Inter Regular 15.
  - Ligne d'invitation « Étape suivante » en #AEB3BA. Aucun bouton d'ajout : Entrée crée l'étape.
  - État vide : une seule ligne grise, « 1. » suivi de « Décrivez la première étape ».
  - Ces éléments complètent Δ01. Les chiffres sont des propriétés de présentation, non des règles.
- Spécification des phases §5 : elle propose une évolution versionnée du JSON canonique, avec lecture de l'ancienne version. Ce choix, entre v2 étendue et v3, reste à l'architecture (Δ39), qui doit en traiter explicitement.
- Méthode (audit PRE-4, actions 1 à 5) :
  - les lignes NR et les parties déjà conformes ne reçoivent ni story ni revue complète ;
  - la revue approfondie est réservée à la persistance et aux mécanismes nouveaux (phases, charge, champ numérique) ;
  - le champ numérique avec Précédent / Suivant est essayé tôt sur iPhone, avant d'être généralisé ;
  - aucun comportement validé ne change sur la seule autorité d'un document généré.

### Sources : état

- S-1 : **reçue**, `sources-2026-10-19/KODJO-Phases-specification-consolidee-2026-10-15.md`, lue aux §1 à 5.
- S-2 (relevé Figma) : la notation de l'Enchainement est tranchée par QP5-07. Les autres propriétés seront relevées dans Figma en lecture seule, frame par frame, au moment des stories concernées.
- S-3 (corpus « côté 1 / côté 2 ») : validé le 19/10. BMad étend le corpus pour les phases (§5 de la spécification) et pour les côtés d’après ch. 10 l. 515.
- La matrice du 19/10, le registre v25 et l'audit PRE-4 sont **reçus**. La spécification de la charge v3.0 est déjà dans le dépôt (`openspec/changes/archive/2026-10-18-integration-parametres-execution-v3/source/`).

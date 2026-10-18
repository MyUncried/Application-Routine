# PRE-4 — Porte de préparation à l'implémentation

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

Date : 2026-10-16. Porte : `bmad-sprint-planning`, `references/readiness-gate.md`. Revue en lecture seule.
Question posée : **un développeur pourrait-il implémenter ces epics sans inventer de décisions que rien n'enregistre ?**

Artefacts examinés :

- `_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md` et `addendum.md` ;
- `_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md` ;
- `_bmad-output/planning-artifacts/epics.md` : 4 epics, 21 stories ;
- `docs/preparation/PRE-4/bmad/questions-ouvertes.md` (Q1-Q24, P1-P45, H1-H30) et `recette-iphone.md` ;
- `AGENTS.md` et `CLAUDE.md` ;
- le code de départ de `src/`, consulté sur des points précis : `tokens.ts`, `ProfileStepper.tsx`, `DurationWheelPicker.tsx` (`PickerToolbar`), `ActivityEditorForm.tsx:289-330`, `fr.ts`, occurrences de `TO_FAILURE`.

Rien n'a été lu sous `docs/preparation/PRE-4/planification/` ni sous `.github/orchestration/`.

## Verdict : CONCERNS

Le plan est très détaillé. Les 196 FR sont couvertes, les AC sont chiffrés et littéraux, et presque toutes les décisions renvoient à une Q, une P, une H ou un AD. Il reste trois trous qui obligeraient un développeur à décider à la place du produit ou de l'architecture, sur des états fréquents ou sur la migration. Aucun n'impose de reprendre le plan : ce sont des corrections ciblées.

**Préalable hors plan.** Quel que soit ce verdict, `CLAUDE.md` interdit tout développement avant deux étapes : la revue indépendante par ChatGPT, puis l'autorisation explicite de Hermann. Aucune des deux n'a été transmise dans la conversation. Cette porte ne les remplace pas.

## Constats

### Critiques

Aucun.

### Élevés

**E1. Prédicat d'illisibilité de la migration : conflit entre P45 et AD-4 d'une part, FR-18-20 et la story 1.1 d'autre part.**

- **Emplacement :**
  - `questions-ouvertes.md` P45, PRD §9 point 7 et spine AD-4 étape 5 : une Copie en Séance dont la projection d'une valeur lisible violerait le CHECK d'`activities` est classée illisible et écartée. C'est le cas d'une Cible ou d'une Pause de première ligne hors bornes, portée par le seul JSON v1. Un N non entier est traité de même.
  - PRD FR-18-20 (l. 1758, 1760) et story 1.1 AC9 (« aucune autre cause n'écarte une ligne »), AC14 et la clause « une ligne sans JSON n'est jamais écartée, quels que soient ses scalaires » disent le contraire. P45 n'est cité dans aucune story.
- **Effet :** sur une Copie en JSON v1 dont la Pause de première ligne vaut −5, ou sur un `series_count` de 2,5, suivre la story fait échouer la migration entière : erreur structurelle, annulation, erreur de démarrage. Suivre P45 contredit les AC. Le développeur doit trancher.
- **Correction :** `bmad-correct-course`. Aligner FR-18-20 sur P45, ajouter à 1.1 AC9 les cas P45 (projection hors CHECK, N non entier) avec un test par cas, et restreindre AC14 aux Définitions.

**E2. Position d'ouverture du Sélecteur de cible sur une Cible à renseigner (`UNSET`).**

- **Emplacement :** PRD FR-07-04, story 3.4 AC3 et AC4, story 3.5 AC4, story 3.6 AC3.
- **Ce que disent les sources :** FR-07-04 impose « jamais sur une position neutre » et « à tout instant exactement une Cible est sélectionnée ». Il ne traite que `NUMBER`, `FAILURE` et les valeurs hors grille.
- **Ce qui manque :** le cas `UNSET` n'est traité nulle part. Or c'est l'état de toute création en Durée (P19 : Cible initiale `—`) et de toute ligne après un changement de Mode (3.2 AC3). Le développeur doit choisir lui-même :
  - la position d'ouverture : `00:00` en sélection numérique avec ✓ indisponible, `00:05`, ou l'échec présélectionné ;
  - en Répétitions, la position de la roue (1 ou la ligne de tête).

  Toutes ces options contredisent au moins une conséquence de FR-07-04.
- **Correction :** une question à faire trancher par Hermann, à enregistrer dans `questions-ouvertes.md`, puis `bmad-prd` (FR-07-04) et `bmad-create-epics-and-stories` (3.4, 3.5, 3.6).

**E3. Pied commun sans Cellule active, et ± sur une cellule `UNSET`.**

- **Emplacement :** story 3.6, section « Hors story », AC2, AC4 et AC9 ; PRD FR-10-02 et FR-10-04.
- **Pied commun sans Cellule active :** l'état existe forcément. FR-10-04 dit qu'un appui extérieur « range l'outil », et le tableau doit bien s'afficher avant le premier toucher. Pourtant ni le rendu du Pied dans cet état (masqué, ou présent avec ± indisponibles et sans mention) ni la Cellule active à l'ouverture ne sont fixés. La story renvoie au relevé (« NON VÉRIFIABLE », « signalé à Hermann, sans composant inventé »), mais le développeur doit tout de même rendre quelque chose. Le point n'est pas inscrit dans `questions-ouvertes.md`.
- **± sur une cellule `UNSET` :** de même, l'effet des ± du Pied sur une cellule `UNSET` n'est défini nulle part. `stepTarget(mode, value, direction)` n'a pas de valeur de départ, et Q13 ne règle que le cas `FAILURE`.
- **Correction :** question à faire trancher par Hermann (`questions-ouvertes.md`), puis `bmad-create-epics-and-stories` (3.6) et `bmad-architecture` (AD-16, entrée `UNSET` de `stepTarget`).

### Moyens (7)

**M1. Ordre AD-14 modifié sans le dire.**

- **Emplacement :** spine AD-14 (« Ordre ensuite : (2) brouillon… (3) calculs et phrase… (4) interface, S0… (5) cartes ») et `epics.md` l. 78, qui le cite comme « ordre de livraison imposé ».
- **Écart :** le découpage livre les calculs et la Phrase (E2) avant le brouillon (3.2), les cartes (2.4) avant l'interface, et S0 (3.1) avant le brouillon. Aucun artefact ne signale cette modification. Le risque technique paraît faible (2.1 AC8 utilise le brouillon existant), mais deux documents se contredisent.
- **Correction :** `bmad-architecture` (amender AD-14) ou une note dans `epics.md`.

**M2. Garde de cantonnement de `TO_FAILURE` incomplète.**

- **Emplacement :** 1.1 AC4 et 2.3 AC13.
- **Écart :** la liste des fichiers autorisés de 1.1 AC4 n'inclut pas le test du corpus (`src/domain/activities/__tests__/executionPhrase.test.ts`, qui porte le littéral au départ). 2.3 AC13 suppose pourtant que la garde l'admet « à l'endroit de cette adaptation ». Le développeur de 1.1 doit soit élargir la garde, soit masquer le littéral.
- **Correction :** `bmad-create-epics-and-stories`.

**M3. Exigences de la Carte livrées en 2.3 alors que le bouton qui les bloque n'est retiré qu'en 4.2.**

- **Emplacement :** 2.3 AC15, 4.2 AC6, 4.2 AC14 et 4.5 AC7.
- **Écart :** 2.3 AC15 exige déjà « une seule zone touchable, de nom accessible unique ». Or le bouton `exercise-parameters-mode`, qui porte le même `accessibilityLabel` (`ActivityEditorForm.tsx:294-305`), n'est retiré qu'en 4.2 AC14 (Q23). Le test de 2.3 échoue donc, sauf à anticiper 4.2.
- **Point voisin :** la composition du libellé accessible n'est pas fixée. Les stories disent « libellé `Modifier les paramètres d’exécution` » et « Phrase lue en entier », alors que le code de départ concatène le libellé, la Phrase, le Compte à rebours et la Fin.
- **Correction :** `bmad-create-epics-and-stories`.

**M4. ✓ indisponible du Sélecteur sans support dans `PickerToolbar`.**

- **Emplacement :** 3.4 AC7 et spine AD-7.
- **Écart :** 3.4 AC7 demande un ✓ du Sélecteur indisponible. `PickerToolbar` (`DurationWheelPicker.tsx:315`, dupliqué dans `NumberWheelPicker.tsx`) n'a pas d'état désactivé. AD-7 limite ses changements aux « libellés ou icônes ». Le rendu, l'état d'accessibilité et l'ajout de la prop dans les deux copies ne sont enregistrés nulle part.
- **Correction :** `bmad-architecture` (AD-7).

**M5. Contrat des roulettes posé avant la décision de S0.**

- **Emplacement :** 3.1 AC4 et AC7, 3.4 AC12 et 3.5 AC8.
- **Écart :** S0 laisse ouvertes deux voies pour la roue dans `Popover.Content` : le `Picker` SwiftUI, ou la roulette existante par `RNHostView`. 3.4 et 3.5 supposent pourtant l'extension de `DurationWheelPicker` et de `NumberWheelPicker`. Rien n'oblige 3.1 à consigner la voie retenue, ni 3.4 à s'y conformer.
- **Correction :** `bmad-create-epics-and-stories`.

**M6. Story 1.1 très volumineuse.**

- **Emplacement :** story 1.1.
- **Constat :** 25 AC, environ 30 fichiers de production, les tests `TO_FAILURE`, la migration et l'interface minimale. Son atomicité est justifiée (AD-14) et ses tâches sont ordonnées, mais elle n'a aucun point de contrôle intermédiaire vert. Le risque de livraison est réel, même s'il ne demande aucune décision au développeur.
- **Correction :** accepter le risque en connaissance de cause, ou `bmad-create-epics-and-stories` pour définir des jalons internes vérifiables.

**M7. Hypothèses non validées qui portent des critères d'acceptation.**

- **Emplacement :** `questions-ouvertes.md` §5 ; stories 1.2, 2.3, 3.2, 3.6, 4.2 et 4.5.
- **Constat :** les hypothèses H4 à H30 sont enregistrées, donc ce ne sont pas des inventions. Plusieurs fixent pourtant des comportements ou des textes visibles : H5, H19, H22, H23, H24 (singulier de 1.2 AC4 compris) et H27. Toute révocation par ChatGPT ou par Hermann modifie des AC déjà rédigés.
- **Correction :** processus. La revue ChatGPT, puis l'arbitrage de Hermann, avant le démarrage.

### Faibles (9)

- **F1. Deux stories changent le même texte de carte.** 1.1 AC21 et 2.4 AC4 modifient toutes deux le texte de carte du tout échec (`fr.ts:380`, Q24), sans désigner celle qui porte le changement du lexique.
- **F2. Politique de maintien des ± pour une Cible Répétitions non fixée.** Elle n'est définie ni dans le Pied commun ni ailleurs. H19 ne vise que la Durée.
- **F3. Story 4.2 : deux choix laissés au développeur.** AC4 laisse à son jugement le retrait du séparateur de 1 px. AC5 exige des espacements et des marges « mesurés par test » sans dire comment, alors que Jest n'a pas de moteur de mise en page.
- **F4. Schéma de `migration_notices` non fixé.** Les noms et types des colonnes et le format de date ne sont pas donnés (1.1 AC13, AD-12).
- **F5. Tenue de `questions-ouvertes.md`.** Q22 figure encore au §3 alors qu'elle est tranchée. Le §3 affirme qu'aucune autre question ne bloque, ce que contredisent E2 et E3.
- **F6. Retour à la ligne avant « Durée totale » non attribué.** Ch. 13 l. 4265 et 4.2 AC6 demandent un « retour de ligne de présentation ». 2.3 AC15, qui porte le rendu de la Phrase dans la Carte, ne le mentionne pas, et sa mise en œuvre dans le rendu seulement n'est pas décrite.
- **F7. Jeux de largeurs incohérents.** NFR-09 et 3.8 AC7 citent 360, 402 et 440 ; 4.2 AC5 cite 360, 390, 402 et 440 ; 4.5 AC6 cite 360, 390, 402, 430 et 440.
- **F8. Décompte imprécis dans 1.1.** « Tests `TO_FAILURE` existants (36 fichiers porteurs du littéral) » : le relevé donne 17 fichiers de test et 19 fichiers de production.
- **F9. Gras de « répétitions variables » non fixé (Q16).** Il est lu comme normal dans 2.3, à confirmer sur Figma `8470:13303`. Le point est signalé, pas tranché.

## Traçabilité

- **Des exigences vers les stories :** les 196 FR sont couvertes, d'après les tables E1 à E4 et la couverture consolidée. Les NFR sont rappelées comme règles communes. Q1 à Q24 et P1 à P44 sont reprises là où elles s'appliquent. Il y a un orphelin : **P45**, présent au PRD §9 et dans la spine AD-4, mais absent de toutes les stories et contredit par FR-18-20 (E1). P32 n'est pas cité, mais son contenu est couvert (1.1 AC6 : Bip −1, 11 et 2,5 refusés). H1 à H3 relèvent du processus.
- **Des stories vers l'intention :** chaque AC cite une FR, une Q, une P, une H ou un AD. Aucune story ne porte de fonction sans intention enregistrée. Seuls les trous E2 et E3 obligeraient à en créer une.
- **Valeur des epics et dépendances :** E1 apporte une valeur de préservation, E2 à E4 des capacités visibles. Les dépendances déclarées pointent toutes vers l'arrière. Restent deux exceptions :
  - des renvois de recette vers l'avant, assumés et signalés : R-1.x après R-3.1-00, R-2.3-03/04 et R-2.4-03 après E3 ;
  - le chevauchement de test 2.3 / 4.2 (M3).

## Échantillon approfondi : décisions qu'un développeur devrait inventer

| Story | Décisions non enregistrées |
|---|---|
| 1.1 | Sort des Copies dont la projection viole le CHECK et des N non entiers (E1). Inclusion du test du corpus dans la garde (M2). Colonnes et format de `migration_notices` (F4). Le reste (forme v2, lecteurs, prédicat, étapes, projection, interface minimale) est spécifié au caractère près. |
| 2.3 | Moyen de satisfaire « nom accessible unique » avant le retrait du bouton de Mode, et composition du libellé (M3). Retour à la ligne de présentation avant « Durée totale » (F6). Gras de « répétitions variables », lecture provisoire déjà signalée (F9). Les gabarits, les attendus du corpus et les variantes sont complets. |
| 3.4 | Ouverture sur une Cible `UNSET` (E2). Rendu et accessibilité du ✓ indisponible dans `PickerToolbar` (M4). Contenu du popover selon l'issue de S0 (M5). Disposition de l'option échec dans la roulette `Legacy*` hors iOS : faible, non recettée. |
| 3.6 | Rendu du Pied commun sans Cellule active, et Cellule active à l'ouverture (E3). Effet des ± sur une cellule `UNSET` (E3). Politique de maintien pour une Cible Répétitions (F2). Sort de la Cellule active quand le tableau est replié par le chevron : faible. |
| 4.2 | Retrait ou maintien du séparateur de 1 px (F3). Méthode de test de la grille et des marges (F3). Composition du libellé accessible de la Carte (M3). Retour à la ligne avant « Durée totale » (F6). Les textes (Q18, H22), l'ordre (P7), la validation (H25) et le retrait du bouton (Q23) sont enregistrés. |

## Suite proposée

1. Faire trancher par Hermann les points E2 et E3, et inscrire ces deux nouvelles questions dans `questions-ouvertes.md`.
2. Corriger les documents :
   - `bmad-correct-course` pour E1 : PRD FR-18-20, puis story 1.1 AC9 et AC14 ;
   - `bmad-prd` (FR-07-04) puis `bmad-create-epics-and-stories` (3.4, 3.5, 3.6) pour les décisions prises sur E2 et E3 ;
   - `bmad-architecture` pour M1, M4 et l'entrée `UNSET` de `stepTarget` (AD-16) ;
   - `bmad-create-epics-and-stories` pour M2, M3 et M5.
3. Soumettre les documents à la revue ChatGPT, puis à l'autorisation de Hermann (`CLAUDE.md`). Générer ensuite le fichier de suivi (`generate-tracking.md`).

## Traitement (2026-10-16)

Corrections faites après les décisions de Hermann Q25 et Q26 (`questions-ouvertes.md` §1) et la règle P45. Chaque modification d'une partie `epics-parts/epic-N.md` est reportée à l'identique dans la section « Stories » d'`epics.md` ; la comparaison finale des quatre parties avec leur copie est identique. Les décisions d'architecture modifiées ont chacune une ligne dans `.memlog.md` (AD-4, AD-7, AD-12, AD-14, AD-16 ×2).

### Élevés

| Constat | Correction | Emplacement |
|---|---|---|
| E1 (P45) | Liste fermée des causes d'illisibilité complétée : N non entier (deux tables) ; Copie en Séance dont la projection violerait le CHECK d'`activities`. Exception P45 ajoutée à la conservation des valeurs hors bornes. | PRD FR-18-20 (septième conséquence de la liste), FR-18-14 (troisième conséquence), §9 point 7, en-tête (P1 à P45) ; spine AD-4 (Binds, cas (f) et (g), étape 5) ; story 1.1 : Exigences, AC9 (cas (c9) et (c10), un test par cas, classement à l'étape 1, Définition au même JSON conservée), AC14 (limité aux Définitions, cas de la Copie à ligne non première, renvois à (c9) et (c10)), tâche 3, « Hors story » |
| E2 (Q25) | Ouverture du Sélecteur sur une Cible à renseigner : valeur minimale sélectionnée (00:05, ou 1 et non la ligne de tête), rien appliqué avant ✓, ✕ laisse `—`. Fonction `selectorOpeningPosition(mode, target)`. | PRD FR-07-04 (nouvelle conséquence), FR-10-03, §9 point 8 ; spine AD-16 ; stories 3.4 (Exigences, Architecture, AC3, tests, `R-3.4-06`), 3.5 (Exigences, Architecture, AC4, `R-3.5-04`), 3.6 (AC3) |
| E3 (Q26) | Sans Cellule active : Pied affiché sans mention, ± indisponibles, aucune Cellule active à l'ouverture. Cellule `UNSET` : + donne 5 s ou 1, − indisponible. `stepTarget` prend une `SeriesTarget`. Renvoi « à Hermann » retiré du « Hors story ». | PRD FR-10-04 (deux conséquences), §9 point 8 ; spine AD-16 ; story 3.6 (Exigences, AC4, AC5, tests, `R-3.6-08`, « Hors story ») |

### Moyens

| Constat | Correction | Emplacement |
|---|---|---|
| M1 | AD-14 distingue l'obligatoire (socle d'abord, S0 avant les autres stories d'interface, aucune dépendance vers l'avant) de l'ordre indicatif, et déclare conforme le découpage des epics, avec ses raisons. | Spine AD-14 ; `epics.md`, inventaire, ligne AD-14 |
| M2 | Le test du corpus `executionPhrase.test.ts` est admis par la garde, au seul endroit de son adaptation. | Story 1.1 AC4 |
| M3 | 2.3 AC15 n'exige plus la zone touchable unique ni le nom accessible unique : ils sont portés par 4.2 AC6 et AC14, après le retrait du bouton de Mode. Composition du libellé accessible fixée sur celle du code de départ (libellé, Phrase, Compte à rebours, Fin). | Story 2.3 (AC15, preuves, `R-2.3-05`) ; story 4.2 (AC6, `R-4.2-03`) ; story 4.5 (AC7, ligne R-42) |
| M4 | Une seule prop optionnelle `validateDisabled` ajoutée à `PickerToolbar` dans ses deux copies : ✓ `disabled`, `accessibilityState`, opacité `UNSELECTED_OPACITY`, jamais sur la roue, sans remplacement du composant. Rendu `NON VÉRIFIABLE`, jugé en recette. | Spine AD-7 ; stories 3.4 (AC7, tests), 3.5 (AC8) |
| M5 | S0 consigne la voie de la roue (`RNHostView` ou `Picker` SwiftUI direct) ; 3.4, 3.5 et 3.7 l'appliquent sans en ouvrir d'autre ; le contrat reste porté par les deux roulettes existantes. | Spine AD-7 (« Voie consignée ») ; stories 3.1 (AC7), 3.4 (Architecture, AC12), 3.5 (Architecture, AC8), 3.7 (AC4) |
| M6 | 1.1 reste atomique (AD-14). Sept jalons internes vérifiables (J1 à J7), avec commande et résultat consignés ; aucun n'est livré seul. | Story 1.1, « Tâches indicatives et jalons internes » |
| M7 | Ligne « Hypothèses non validées : H… — à confirmer par la revue ChatGPT/Hermann avant développement » dans chaque story dont un AC repose sur une hypothèse (18 stories ; 4.1, 4.3 et 4.4 n'en ont pas). | Toutes les parties et `epics.md` |

### Faibles

| Constat | Traitement | Emplacement |
|---|---|---|
| F1 | Le changement du texte de carte du tout échec dans le lexique est porté par 1.1 ; 2.4 le réutilise sans le modifier. | Story 1.1 AC21 ; story 2.4 AC4 |
| F2 | Maintien sur une Cible Répétitions : règle générale de FR-09-04 par la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY`, dans 1..100. | Spine AD-16 ; story 3.6 AC6 et tests |
| F3 | Séparateur de 1 px : décidé par le relevé d'AC1 (retiré s'il est absent de `8328:35698`, sinon conservé et signalé). Grille et marges : tests sur les styles et sur la marge calculée par largeur ; géométrie effective en recette. | Story 4.2 AC4, AC5 |
| F4 | Schéma de `migration_notices` fixé (colonnes, types, CHECK, dates ISO 8601 de `toISOString`). | Spine AD-12 ; story 1.1 AC13 |
| F5 | **Non traité ici** : `questions-ouvertes.md` n'est pas dans le périmètre de cette correction. Q25 et Q26 y sont déjà inscrites (§1). Reste à faire : retirer Q22 du §3 et la phrase « Aucune autre question produit ne bloque », devenue exacte, à relire. | `docs/preparation/PRE-4/bmad/questions-ouvertes.md` §3 |
| F6 | Retour de ligne avant « Durée totale » attribué à 4.2 AC6, comme traitement de rendu seul ; 2.3 AC15 précise que la Phrase générée reste sans saut de ligne. | Story 2.3 AC15 ; story 4.2 AC6 |
| F7 | Pas d'incohérence de fond : NFR-09 fixe 360, 402 et 440 ; FR-02-04 ajoute 390 (seuil de marge) ; FR-22-06 ajoute 390 et 430. Chaque AC indique maintenant l'origine de ses largeurs. | Story 4.2 AC5 ; story 4.5 AC6 |
| F8 | Décompte corrigé : 17 fichiers de test (dont le corpus) et 19 fichiers de production, à recompter à l'ouverture. | Story 1.1, Architecture |
| F9 | **Non traité** : le gras de « répétitions variables » (Q16) demande une lecture de Figma `8470:13303` ou un arbitrage de Hermann. La lecture provisoire (normal) reste écrite dans 2.3, donc aucune décision n'est laissée au développeur. | Story 2.3 ; à vérifier à la recette `R-2.3-04` |

### Points résiduels, hors des 19 constats

- Disposition de l'option échec dans les roulettes `Legacy*` hors iOS, et sort de la Cellule active quand le tableau est replié par le chevron : faibles, non traités.
- Choix rédactionnels faits pendant cette correction, sans source qui les impose, à soumettre à la revue : opacité `UNSELECTED_OPACITY` pour le ✓ indisponible (AD-7) ; libellé accessible de la Carte vide (composition du code de départ, avec l'invite H22 à la place de la Phrase, 4.2 AC6) ; Pied sans Cellule active « sans mention », à la géométrie de l'état actif (3.6 AC4, qui découle de Q26 et de FR-10-05).

### Verdict estimé : PASS

Aucun des trois trous élevés ne subsiste. Les moyens et sept des neuf faibles sont corrigés dans les documents. F5 relève d'un autre fichier. F9 a une lecture provisoire écrite. Un développeur n'a plus de décision à prendre que rien n'enregistre. Ce verdict est une estimation de Claude, pas une nouvelle passe de la porte.

Le préalable de `CLAUDE.md` reste entier : revue indépendante par ChatGPT, puis autorisation explicite de Hermann. Aucune des deux n'a été transmise dans la conversation. Les hypothèses désormais signalées story par story (M7) peuvent encore modifier des AC.

---
title: "Réconciliation PRD PRE-5 ↔ cadrage, inventaires, registre v25, audit PRE-4, AGENTS.md"
created: 2026-10-19
statut: lecture seule ; aucun autre fichier modifié
---

# Réconciliation du PRD PRE-5 avec le cadrage et les inventaires

**Objet.** Comparer `prd.md` (dans son état du 19/10 après l'ajout de la décision « Phases Avec → Sans » à FR-8) et `addendum.md` aux sources suivantes :

- le cadrage du 18/10 ;
- `inventaire-sources.md` et `inventaire-code.md` ;
- le registre v25 (demandes 1, 3, 5, 10, 13, 14, 17, 18, 20, 21) ;
- l'audit PRE-4 §5 ;
- `AGENTS.md`.

**Préséances appliquées, non signalées comme écarts :**

- `table-delta.md` §6, de QP5-01 à QP5-09 (en particulier : aucune reprise des anciennes descriptions) ;
- Δ50 : minimum et pas de 1 s pour les durées, maxima conservés ;
- Q11 et Q55, qui priment sur les demandes 4 et 6 du registre : titre « Paramètres d'exécution », carte vide sans invite ;
- la décision du 19/10 « Phases Avec → Sans », déjà intégrée à FR-8.

Le code a été lu ponctuellement dans `C:\Dev\KODJO-BMAD-PRE5\src` (styles d'`ActivityEditorForm.tsx` et `tokens.ts`) pour qualifier certains écarts.

---

## 1. Écarts principaux

### E-1 — FR-33 : présentation de la Description figée sur un état intermédiaire du registre (déformation)

**Ce que dit le PRD.** FR-33 décrit les étapes ainsi : « cadre blanc de rayon 8, padding 14, espacement 8 ; numéro en Inter Medium 15 […] ; texte en Inter Regular 15 ». Ces valeurs viennent de la seule demande 10, recopiée dans les « Précisions » de `table-delta.md` §6. Ces précisions ne sont pas une décision de Hermann : `PRE5_BMAD_Decisions_v2.md` ne cite la demande 10 que comme source à transmettre.

**Ce que disent les demandes suivantes du registre.** Elles modifient cet état.

- **Demande 17.** Tous les textes de la liste d'étapes, numéros compris, passent à **14**. La phrase passe à 14, avec un interligne de 20.
- **Demande 21, état déployé sur 44 écrans.**
  - La Description **n'a plus aucun contenant** : ni cadre blanc, ni liseré, ni rayon.
  - Les numéros sont alignés à x24, au fer des titres de section. Le texte des étapes va de x48 à x378, sans marge droite.
  - Le titre est à **10** de la première étape.
  - Le cadre passe sur les **modalités** : `#F9FAFC`, rayon 12, sans liseré, padding de 12 en vertical et de 24 en horizontal. Le retrait de 24 vaut la gouttière de numérotation, soit la largeur du numéro plus son espacement. La phrase tombe ainsi au fer du texte des étapes.

**Ce que fait le code PRE-4.** Le champ a une bordure `disabled` et un rayon de 8. La Carte a une bordure, un rayon de 12 et un fond blanc.

**Conséquence.** Le PRD prescrit un rendu que la source a abandonné. Il omet aussi le changement de la Carte, qui relève de FR-38.

**Correction proposée.**

1. Retirer de FR-33 les valeurs « cadre blanc, rayon 8, padding 14 » et « 15 ».
2. Renvoyer à l'état final des demandes 10, 17 et 21 : aucun contenant pour la Description, corps de 14 numéros compris, gouttière du numéro lue sur la première étape.
3. Ajouter à FR-38 la Carte des modalités : `#F9FAFC`, rayon 12, sans liseré, retrait horizontal égal à la gouttière. `#F9FAFC` existe déjà dans les jetons (`surfaceSubtle`, `tokens.ts:19`) : aucun jeton nouveau n'est nécessaire.
4. Signaler la tension entre les marges de 4 et de 10 du registre (demandes 1 et 21) et la grille D-327 conservée par FR-38 (13 d'un titre à son bloc). C'est le même point que Q48, déjà signalé au §9 : y rattacher explicitement ces deux valeurs.
5. Garder la règle : ce sont des propriétés de rendu à vérifier dans Figma (S-2), pas des règles.

### E-2 — FR-33 et FR-34 : modification d'une étape, ligne d'invitation au repos et rejet du modèle B non spécifiés (omission)

**Ce que demande le cadrage.** La Description en étapes doit couvrir « saisie, modification, numérotation, sauvegarde et réouverture ».

**Ce que couvre FR-33.** La création (Entrée) et la suppression d'une étape vide (retour arrière). Trois points manquent.

- **La modification d'une étape existante.**
  - Toucher une étape place le curseur dans son texte.
  - Le comportement d'Entrée au milieu d'une étape, ou sur une étape qui n'est pas la dernière, n'est pas défini.
  - Le collage d'un texte de plusieurs lignes n'est pas défini.

  `inventaire-sources.md` §4.4 relève aussi que l'état « Description en modification (suppression ou édition d'une étape) » n'a pas de référence visuelle.
- **La ligne d'invitation au repos.** Dans le registre (demande 10), la ligne « n. Étape suivante », en `#AEB3BA` pour le numéro comme pour le libellé, est le **dernier élément permanent** de la liste remplie. On la voit sur `8328:36853` : quatre étapes, puis « 5. Étape suivante ». À l'état vide, il n'y a pas de ligne d'invitation. La formulation de FR-33, « Entrée crée l'étape suivante, avec l'invite grise », laisse croire que l'invite n'apparaît qu'après Entrée.
- **Le rejet du modèle B (`7867:14580`, « Réorganisable »).** Il implique qu'aucune poignée ni aucun déplacement d'étape n'est prévu. Le PRD ne le dit pas, alors que le tableau des séries et celui des phases ont des gestes de déplacement : une transposition est donc possible.

**Correction proposée.**

1. Ajouter à FR-33 une puce « Modification ». Elle dit qu'une étape existante est éditable sur place. Si Entrée ou le collage au milieu d'une étape ne sont tranchés par aucune source, les classer « à confirmer » au §9, sans les inventer.
2. Préciser que la ligne d'invitation est affichée en permanence sous la dernière étape d'une liste remplie, et qu'elle est absente à l'état vide.
3. Ajouter à §8 : « aucun réordonnancement des étapes (modèle B écarté) ».

### E-3 — FR-38 : delta de la classification Catégorie / Zones réduit à « aligné sur Figma » ; intention et contrainte tactile perdues

**Ce que dit le PRD.** FR-38 cite les demandes 13, 14 et 18, mais ne dit que « l'accès à la Catégorie et aux Zones » est aligné sur Figma. Il conserve en même temps « les comportements de Catégorie et Zones ».

**L'écart avec le code PRE-4.** Il est structurel. `referencePill` porte un liseré `primary`, un fond blanc et une pastille de couleur de 24 (`categorySwatch`).

**La règle finale du registre.** « La classification n'a qu'une seule forme, et c'est l'état qui change de registre, pas la forme » :

| État | Rendu |
|---|---|
| À renseigner | Voile blanc à 35 %, rayon 13, hauteur 26 ; glyphe et texte en accent |
| Renseigné | Sans fond, hauteur 20 ; glyphe plein **teinté de la couleur de la catégorie** ; texte `text-primary` |

**Les points qualitatifs du registre que le PRD perd :**

- « rien ne doit bouger entre les deux états » : le glyphe reste à l'aplomb du texte du Nom ;
- la hiérarchie est rétablie : le secondaire suit la grammaire du Nom, sans fond ni liseré ;
- le glyphe de catégorie est continu sur tout le parcours (demande 14) ;
- les cibles tactiles font 48, sont désaxées vers le bas et **ne recouvrent pas le Nom**, qui est éditable et où une erreur passerait inaperçue (demande 13).

**Correction proposée.** Énoncer dans FR-38, comme delta de présentation, ce qui suit.

1. Une seule forme pour la classification, avec deux registres d'état ; aucun déplacement du glyphe entre les deux états ; le glyphe plein est teinté de la couleur de la catégorie.
2. Les cibles tactiles de la classification ne chevauchent pas le champ Nom. Le reporter aussi dans NFR-7.
3. Les mesures restent à relever dans Figma (S-2). Le comportement de sélection (Q49, Q53) est inchangé.

### E-4 — FR-5 : le contrôle d'ajout d'une phase renvoie à une frame qui n'en montre pas (risque d'invention)

**Ce que dit le PRD.** FR-5 : « Le contrôle d'ajout suit la frame `9207:18817` ».

**Ce que disent les inventaires.**

- `inventaire-sources.md` §4.5 : le contrôle d'ajout d'une phase manque (« aucun +/− dans `9207:18817` ») ; §4.4 : « ajout d'une phase » figure parmi les états sans référence visuelle.
- P-5 : « l'ajout d'une phase sans boutons +/− n'est pas décrit ».

**La règle d'`AGENTS.md`.** Ne pas inventer un composant absent de Figma, mais le classer `NON VÉRIFIABLE`.

**Correction proposée.**

1. Requalifier FR-5 : « contrôle d'ajout **sans référence visuelle connue** ; `NON VÉRIFIABLE` tant que S-2 ne l'a pas relevé ».
2. L'ajouter explicitement aux propriétés Figma manquantes du §9, comme une question de rendu à poser à Hermann, et non comme une frame existante.

### E-5 — NFR : contraintes d'`AGENTS.md` et actions 5 et 6 de l'audit non reflétées

**Contraintes d'`AGENTS.md` absentes des NFR, alors que le delta les touche directement :**

- **Piège CRLF.** Tout découpage sur LF doit retirer le CR. C'est critique si les étapes sont encodées une par ligne dans `description` ou `instruction` (Q-A5).
- **Terme « Set » proscrit (D-077), noms de code anglais rattachés au glossaire (D-035).** Les nouveaux identifiants (phases, charge, étapes) y sont soumis. FR-44 ne cite que D-201.
- **Persistance uniquement par les repositories, sans ORM (D-043).**
- **Duplication volontaire de `PickerToolbar` (`NumberWheelPicker.tsx:48-57`).** FR-45 retouche les roues : lire le commentaire avant d'y toucher.
- **Primitives natives.** NFR-1 pose la priorité au natif, mais FR-27, sur la base de QP5-06 qui fait foi, garde par défaut le `SegmentedControl` en React Native. NFR-1 devrait citer QP5-06 comme exception décidée, pour éviter qu'un lecteur y voie une contradiction.

**Actions de l'audit §5 non reprises :**

- **Action 5.** Consolider les décisions finales une seule fois dans les documents courants, garder l'historique dans un journal et ne pas rouvrir la recette déjà validée. NFR-5 ne couvre que le report des décisions de recette.
- **Action 6.** Publier l'historique de travail à la livraison suivante, en plus du commit nettoyé. Aucune mention, pas même comme critère de livraison.

**Correction proposée.**

1. Compléter NFR-8 ou NFR-9 avec CRLF, D-077, D-035 et D-043, ainsi qu'avec la note sur `PickerToolbar`.
2. Ajouter à NFR-1 l'exception QP5-06.
3. Ajouter une NFR-11 « Traçabilité », qui reprend les actions 5 et 6 de l'audit. Elle n'est pas bloquante.

### E-6 — Addendum : incohérences et omissions par rapport à `inventaire-code.md`

**Q-A5 présuppose la réponse.** Elle demande « quel encodage pour la liste dans ces colonnes, **sans migration** ? ». Or l'en-tête de l'addendum affirme qu'« aucune réponse n'est présupposée ». De son côté, `inventaire-code.md` §7.10 garde l'option d'une structure séparée, avec migration. Q-A5 omet aussi plusieurs points de code relevés par l'inventaire :

- `INSTRUCTION_MAX_LENGTH` (`validation.ts:42`, `:76-78`, `:368-381`) ;
- `normalizeInstruction` (`validation.ts:91-97`) ;
- `maxLength` du `TextInput` (`ActivityEditorForm.tsx:419`) ;
- `formValueEquals` (`ExerciseScreen.tsx:192-200`), sur lequel repose la détection de modification de FR-34 ;
- le transport `description: value.instruction` (`ExerciseScreen.tsx:360`).

**Q-A4 est incomplète sur deux points.**

- Elle ne cite pas `migration005.ts:36-39`, troisième emplacement du CHECK `side_mode`.
- Elle ne reprend pas la liste des consommateurs anatomiques à neutraliser. L'inventaire §7.5 dit « dans tous les cas, lister », et FR-18 est concerné :
  - `executionCalculations.ts:146`, registre `RIGHT` / `LEFT` ;
  - `executionPhrase.ts:190-212` ;
  - `sideOrderSubtitles` dans `i18n/index.ts` ;
  - `CompositionScreen.tsx:1875-1879` et `fr.ts:47-50` (« D→G ») ;
  - `SideModeControl.tsx`, sans consommateur en production.

**Le remplacement du popover natif du Mode (R-01) n'est pas acté.** L'inventaire §8 demande de l'acter en architecture et de réviser explicitement `ExecutionParametersSheet.test.tsx:1257` et `:1368`. L'addendum n'en dit rien.

**AR-01 n'a pas de fonction pure.** L'inventaire §7.6 demande une seule fonction pure, dérivée des Cibles et exposée au domaine, avec le cas `UNSET`. Q-A6 ne traite que la mémoire de la dernière valeur chiffrée.

**Les références vérifiées sont cohérentes avec l'inventaire :**

- `EP:88` ;
- `EP:116-121`, `:412-435`, `:464-486`, `:717-741`, `:778-834`, `:856-869`, `:937-948` ;
- `Draft:132-195`, `:269-306`, `:489-522` ;
- `Sheet:982`, `:1303-1333` ;
- `migration009.ts:23-25`, `migration010.ts:491`, `:548` ;
- `SqliteSessionRepository.ts:1420-1424` ;
- `BodyZonePickerModal.tsx:92-104`, `:314-318`, `Form:236-252` ;
- les cinq points de transport de FR-41.

**Correction proposée.**

1. Reformuler Q-A5 sans présupposer l'absence de migration, et y ajouter les cinq points de code ci-dessus.
2. Compléter Q-A4 avec `migration005.ts:36-39` et la liste des consommateurs anatomiques.
3. Ajouter aux vérifications une ligne « R-01 : tests du popover natif à réviser explicitement ». Les garde-fous des roues restent intacts.
4. Ajouter à Q-A6 la fonction pure d'AR-01 et le cas `UNSET`.

---

## 2. Écarts secondaires

- **FR-36 et demande 2 : le filet n'est pas nommé.** Le registre retire aussi le filet de la Carte, situé après « Durée totale ». Dans le code, c'est `cardSeparator`, à `ActivityEditorForm.tsx:484`. FR-36 ne cite que Compte à rebours et Fin. Ajouter : « le séparateur qui les précède est retiré ».
- **FR-38 et C-4 : la typographie de la phrase n'est pas tranchée.** Le ch. 13 donne Inter 13 ; le registre (demande 17) donne 14, avec un interligne de 20 ; le code utilise `exerciseFieldValue` 13. Le PRD ne mentionne pas C-4. La rattacher à FR-38 et à S-2.
- **FR-38 et demande 1 : le style des titres de section n'est pas précisé.** Le registre donne Inter Regular 11, `text-secondary`. Le code a `sectionTitle` en Semi Bold 16, `textPrimary`. Il s'agit probablement de E-V8 (Q48), corrigeable avec les jetons existants. Le citer comme écart connu de FR-38.
- **FR-37 : la mesure du registre n'est pas citée.** Le registre donne la référence : `Action finale` en position absolue à y790, haute de 84, bouton à y802 (demande 20). Le PRD renvoie à S-2 sans citer cette mesure. Ce n'est pas un écart de fond.
- **Intention qualitative de la demande 21, perdue.** « Moins on a de cadres et de lignes, plus fluide est le parcours de l'écran. » Ce principe d'arbitrage gagnerait à figurer en tête de §4.7, puisque c'est lui qui départage les écarts visuels de Q48.

## 3. Points vérifiés sans écart

Les points suivants du cadrage sont repris correctement, ou neutralisés par une préséance :

- **Phases :** clarification 4, Δ50 et FR-1 à FR-9, dont FR-8 corrigé.
- **Charge :** clarification 3 (CH-05), FR-10 à FR-14 et Δ48.
- **Côtés :** clarification 5, FR-15 à FR-18.
- **Condition d'arrêt :** clarifications 1 et 2 ; libellé « À la cible et à l'échec » ; aucun troisième Mode.
- **Exécution :** clarification 6 ; transport seul ; exclusions du §8.
- **Nommage :** clarification 7 (`phasesRow`), reprise en Q-A3.
- **Carte :** retrait de présentation de Compte à rebours et Fin.
- **Clavier :** limité à la charge et au libellé de phase.
- **Figma :** aucune règle déduite de Figma.
- **Formats :** sans objet (Δ15).
- **Lots :** proposés, pas imposés.
- **Validation proportionnée :** NFR-4, NFR-5 et NFR-8.
- **Audit §5 :** les actions 1 à 4 sont reprises.
- **Préséances :** l'ordre des sections (Δ07) et Q11 / Q55 priment sur les demandes 3, 4 et 6. QP5-01 prime sur la reprise des anciens textes demandée par le cadrage.

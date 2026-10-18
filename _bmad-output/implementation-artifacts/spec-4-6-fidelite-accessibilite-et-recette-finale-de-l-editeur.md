---
title: 'Story 4.6 — Fidélité, accessibilité et recette finale de l''Éditeur'
type: 'feature'
created: '2026-10-18'
status: 'done'
route: 'dispatch'
baseline_commit: '2b766635'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-4.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-8-accessibilite-et-recette-de-la-feuille.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-delta-PRE3-a-4.4.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les stories 1.1 à 4.5 ont livré PRE-4 surface par surface. Il manque la vue d'ensemble de clôture : conformité des 32 frames état par état, accessibilité de l'Éditeur et des référentiels (VoiceOver, texte agrandi, largeurs, alternatives aux gestes), et la liste complète des scénarios de recette rattachant tous les `R-x.y-zz`.

**Approach:** Implémenter la **story 4.6 (AC1 à AC11, `epics-parts/epic-4.md`)** comme une story de **vérification, de consolidation et de compléments ciblés**, sur le modèle de la 3.8 : auditer d'abord, citer les preuves existantes, ne corriger que les écarts réels. **Principe obligatoire (décision de Hermann du 2026-10-18, Q49 b) : un comportement validé en PRE-3 n'est modifié que sur un besoin PRE-4 explicite (bilan approuvé, décision Q, demande de Hermann), jamais sur la seule divergence avec un document BMAD généré.** Tout autre écart devient une ligne de question ouverte, sans changement de code. Les écarts visuels E-V déjà signalés restent à l'arbitrage de Hermann (Q48 à Q51) et ne sont pas corrigés ici.

## Boundaries & Constraints

**Always:**
- AC1 : tableau de conformité des 32 frames construit à partir des relevés existants (3.3 à 3.7, 4.2, 4.3, 4.4, 4.5) ; une frame sans relevé est relevée ici ; traitements : signalé, `NON VÉRIFIABLE`, `À CLARIFIER`. Aucun composant inventé ; D-255.
- AC2 : trois rubriques de preuves séparées (tests, comparaisons de captures, perception sur appareil) ; aucune conformité visuelle ou tactile déclarée par des tests (NFR-04) ; aucune comparaison de capture ni résultat d'appareil fabriqué : rubriques vides ou « à faire par Hermann ».
- AC3 à AC10 : vérifier puis compléter par tests nommés `PRE4-4.6/ACn` ou citer précisément les tests existants ; corrections limitées à l'accessibilité (libellés, rôles, états, actions, focus), à la tenue au texte agrandi et aux alternatives aux gestes exigées par FR-22-0x, sans modifier un comportement PRE-3 validé hors besoin explicite.
- AC11 : liste complète des scénarios insérée dans `recette-iphone.md` (nouvelle section, format du §3, colonne « Rattachement », Résultat vide) ; tous les `R-x.y-zz` de 1.1 à 4.5 rattachés ; matrice ED-01 à ED-22 × parcours complète ; rien de retiré. Application « Routine BMAD ». Réutiliser la recette delta `recette-delta-PRE3-a-4.4.md` sans la dupliquer (renvoi).
- Garde-fous zéro `ScrollView`, primitives natives (`ContextMenu`, Popover, roues) inchangés ; jetons intouchés ; lexique pour tout texte.

**Never:**
- Aucune correction des écarts E-V en attente d'arbitrage ; aucune refonte ; aucun remplacement de primitive acceptée.
- Ne pas retravailler l'ergonomie de la Feuille (session dédiée de Hermann).
- Hors story : exécution de la recette elle-même (Hermann), accessibilité propre à la Feuille déjà traitée en 3.8 (seulement vérifiée en AC1 et rattachée en AC11).

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityEditorForm.tsx`, `ActivityMediaList.tsx`, `MediaConsultation.tsx`, `ActivityCard.tsx` ; `src/features/sessions/ExerciseScreen.tsx` ; `src/features/reference-data/*` ; `src/shared/i18n/`.
- Livré (revue comprise) : `src/features/reference-data/useReferenceSheet.ts` (ouverture d'une feuille de référentiel, focus rendu à l'accès après `onDismiss`) ; `src/shared/ui/entryMenuAction.ts` (nom neutre de l'action « Modifier ou supprimer ») ; opt-in `focusOnOpen` de `ReferenceValueDialog`, passé par Catégorie et Zones seulement (l'Étiquette ne l'a pas) ; `onEntryMenuAction` de `BodyZoneSelector` ; `visible` / `onDismissed` des deux feuilles.
- Relevés : specs 3.3 à 3.7, 4.2, 4.3, 4.4, 4.5 (Implementation Notes) ; `docs/preparation/PRE-4/figma/*.json.gz`.
- `docs/preparation/PRE-4/bmad/recette-iphone.md` (nouvelle section finale) ; `recette-delta-PRE3-a-4.4.md` (renvoi).

## Tasks & Acceptance

**Execution:**
- [x] Audit AC1 à AC11 (tableau dans les Implementation Notes).
- [x] Tableau de conformité des 32 frames (AC1) ; trois rubriques de preuves (AC2).
- [x] Compléments d'accessibilité et de texte agrandi limités aux écarts réels (AC3 à AC10).
- [x] Liste complète des scénarios et matrice ED × parcours (AC11).
- [x] Tests `PRE4-4.6/AC1` à `AC11` ou citations ; READMEs.

**Acceptance Criteria:**
- Given la story 4.6 et le principe Q49 b, when elle est livrée, then chacun de ses critères AC1 à AC11 est vérifié par un test nommé, une citation précise ou un document consigné ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

Base : `2b766635`. Principe appliqué partout : Q49 b (un comportement PRE-3 validé n'est modifié que sur un besoin PRE-4 explicite). Les compléments de cette story sont **additifs** (action accessible, envoi du focus, `hitSlop` sans changement de dessin) ; tout écart dont la correction changerait un rendu, un espacement ou un test PRE-3 est consigné comme question à Hermann, sans changement de code. Aucun écart E-V en attente n'est corrigé ; l'ergonomie de la Feuille n'est pas touchée.

Fichiers de tests cités (identifiant de tête du test, dans le fichier indiqué) : `EditorAccessibility.story46.test.tsx` (**EA**, nouveau, `src/features/activities/__tests__/`), `ReferentialAccessibility.story46.test.tsx` (**RA**, nouveau, `src/features/reference-data/__tests__/`), `ActivityEditorForm.test.tsx` (E), `ExerciseScreen.test.tsx` (X), `ExecutionParametersSheet.test.tsx` (S), `AnchoredPanel.test.tsx` (P), `ActivityMediaList.test.tsx` (M), `DurationWheelPicker.test.tsx` (DW), `NumberWheelPicker.test.tsx` (NW), `CategoryPickerModal.test.tsx` (C), `BodyZonePickerModal.test.tsx` (Z), `ReferenceValueDialog.test.tsx` (V).

### Audit AC1 à AC11

| AC | Exigence | Existant (avant 4.6) | Écart réel | Suite donnée |
|---|---|---|---|---|
| AC1 | Relevé par frame, 32 frames | Relevés 3.3 (11 frames), 3.4 (`37862`, `37760`), 3.6 (`38632`, `38741`, `38848`, `8470:13303`, `39279`, `39181`, `37760`), 3.7 (`38084`, `38409`, `8470:13303`), 4.2 (7), 4.3 (6), 4.4 (bloc Médias de A et B, pictogrammes de 4.5) ; tests X `PRE4-4.2/AC1`, C `PRE4-4.3/AC1`, M `PRE4-4.4/AC1` | aucune frame sans relevé ; relevé de 3.6 au format réduit (« Conforme ») pour `38741`, `38848`, `39279` | complément ci-dessous (« Complément de relevé ») ; tableau de conformité des 32 frames ci-dessous |
| AC1 | Texte de fond de `38848` non reproduit (P1) ; aucun composant inventé ; frame de composant jamais promue | relevé 3.6 ; générateur de Phrase unique (AD-6) ; listes `NON VÉRIFIABLE` de 3.3, 3.4, 4.2, 4.3, 4.4 | — | cité ; aucun composant ajouté par 4.6 |
| AC1 | États exigés sans frame listés | dispersés (R-3.8-04 à 06, R-4.x) | liste d'ensemble absente | `recette-iphone.md` §6, « États exigés sans frame » ; « N hérité » non produit par PRE-4 : `NON VÉRIFIABLE` sur appareil (compatibilité au domaine, 2.1 AC6, P42) |
| AC2 | Trois preuves séparées | consignes NFR-04 dans chaque section de recette | rubriques d'ensemble absentes | rubriques « Preuve 1 / 2 / 3 » ci-dessous et `recette-iphone.md` §6 ; Preuves 2 et 3 vides |
| AC3 | Garde-fous zéro `ScrollView` | DW « REWORK06 — actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback », DW « R-1/native-delegation — … aucun ScrollView de substitution », NW « actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback (priorité aux primitives natives de l'OS) » ; occurrences de `ScrollView` dans ces deux fichiers : 10 → 11 et 5 → 6 depuis `626632c3`. `git diff 626632c3 HEAD` de ces fichiers ne contient aucune ligne `ScrollView` retirée et une seule ajoutée dans chacun : `expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);`, dans DW `PRE4-3.4/AC6 — échec choisi, tourner la roue jusqu'à 00:30…` (commit `63f12693`, story 3.4) et dans NW `PRE4-3.5/AC2 — une seule colonne : ligne de tête puis 1..100…` (commit `2945e167`, story 3.5). Ce sont des assertions de zéro `ScrollView` en plus, sur les nouveaux états des roues ; les trois garde-fous d'origine sont intacts (mêmes titres, mêmes assertions) : aucun affaiblissement | — | cité ; non modifiés |
| AC3 | AD-7 : aucune `Modal` ni `Pressable` de substitution | S `PRE4-3.3/AC11 — iOS : aucune Modal ni aucun Pressable de substitution…`, P `PRE4-Q41 — ni Modal, ni Popover…`, M `PRE4-4.5/AC9 — iOS : chaque tuile est le déclencheur d'un menu contextuel natif…` | — | cité |
| AC3 | Grisé manipulable sans `disabled` | DW `PRE4-3.4/AC6 — … jamais de disabled sur la roue` | — | cité |
| AC3 | Aucun mécanisme accepté remplacé ; P33 signalé | glisser : S `PRE4-3.6/AC8` ; menus des Médias : M `PRE4-4.5/AC8` (×4, dont le repli `actionSheet` et l'`Alert` Android existants) ; roulettes : garde-fous | — | cité ; le diff de 4.6 ne touche aucun de ces mécanismes ; écarts natifs signalés : popover du Mode (3.3), roue (3.4), menu contextuel sans `Annuler` (Q51 c) |
| AC4 | Cibles ≥ 44, 8 entre cibles | accès : E `PRE4-4.3/AC2 — chaque accès a une cible d'au moins 44 × 44…` ; poignée, cellules, croix : S `PRE4-3.6/AC13` ; option échec : DW `PRE4-3.4/AC11 — … cible tactile ≥ 44 pour 30 de haut` ; ✕ / ✓ des roues : DW « gives Cancel and Validate … 48×48 » ; ✕ de l'en-tête : X `PRE4-4.2/AC4 — ✕ : cible 48…` | **`Créer une catégorie` / `Créer une zone corporelle` 32 sans marge ; `Ouvrir les réglages` 17** ; options de Catégorie 30 sans marge (E-V7 de 4.3) ; cases du nuancier ; `Annuler` / `Enregistrer` de la modification 30 ; champ Nom 42 | `hitSlop` sans changement de dessin, seulement dans la place laissée par le parent (sur iOS, un débord hors des limites du parent ne reçoit pas le toucher) et à 8 au moins de la cible voisine : `CREATE_ACTION_HIT_SLOP` (12 sous la pilule, dans la marge basse de 24 du contenu ; 44 atteints) ; `OPEN_SETTINGS_HIT_SLOP` (14 en haut seulement, sur le texte de l'avis : le lien est le dernier enfant de l'avis, sans place en bas ; **31, sous 44**) ; tests EA `PRE4-4.6/AC4`, RA `PRE4-4.6/AC4` (calculés depuis les styles rendus, `type.body` / `type.button` et les constantes ; exceptions figées) ; le reste : Q52 |
| AC5 | Aucun plafond de taille ; aucune hauteur fixe qui rogne ; Zones lisibles | Feuille : S `PRE4-3.8/AC7` (×2) ; Phrase : E `P3-15/long-phrase`, E `PRE4-2.3/AC15` | **contrôles PRE-3 à hauteur fixe contenant un texte** : options de Catégorie (30), `Créer…` (32), champ de création (46), ↑ (32), actions de modification (30) ; nom de l'entrée limité à 2 lignes dans le menu ; noms des Zones du bandeau sur 1 ligne | aucun plafond trouvé (`maxFontSizeMultiplier`, `allowFontScaling`, `adjustsFontSizeToFit` : 0 dans `src/`) ; hauteurs non modifiées (verrouillées par C « P3-20/all-surfaces — … pastilles 30 rayon 16, action Créer 32 ») ; tests EA `PRE4-4.6/AC5`, RA `PRE4-4.6/AC5` (exceptions figées, liste des Zones lue en entier par le libellé) ; question 2 ; R-4.6-02 |
| AC6 | 360, 390, 402, 430, 440 ; clavier | E `PRE4-4.2/AC5` (360, 390, 402, 440), X `PRE4-4.2/AC4 AC5` (quatre parcours), E `PRE4-4.2/AC8` (`Terminer` hors de la zone qui évite le clavier) | 430 non testée | EA `PRE4-4.6/AC6` (cinq largeurs, marges, aucun bloc absolu, rangée des accès en retour à la ligne, `Terminer` hors du `KeyboardAvoidingView`) ; largeur de l'iPhone : R-4.6-03, autres `NON VÉRIFIABLE` sur appareil |
| AC7 | Ordre, libellés, Carte un focus, focus rendu | ordre des blocs : E `PRE4-4.2/AC3` ; Carte : E `PRE4-4.2/AC6 AC14` ; focus à la Carte : E `PRE4-3.8/AC1` ; ✕ « Retour » : X `PRE4-4.2/AC4` ; accès : E `PRE4-4.3/AC2` | ordre des éléments **parcourus par VoiceOver** non vérifié d'un tenant | EA `PRE4-4.6/AC7` (×2 : ordre des éléments accessibles et des titres, Carte sans élément interne ; libellés du lexique) ; textes : liste H23 ci-dessous |
| AC8 | Alternatives aux gestes | Séries : S `P3-07/move-accessible`, S `ACCESSIBILITY/sortable-rows`, S `PRE4-3.6/AC8` ; retrait par la croix (appui simple) : S `PRE4-3.6/AC9` ; pas au-delà du pas simple : actions « augmenter / diminuer » du réglage ajustable (S `PRE4-3.6/AC13`, S `PRE4-3.8/AC2`) ; Médias : M `PRE4-4.5/AC7` | **aucune action accessible équivalente à l'appui long d'une Catégorie ou d'une Zone** (absente du code de départ, prévue par AC8) | action personnalisée `ENTRY_MENU_ACTION` (« entryMenu », `src/shared/ui/entryMenuAction.ts` ; jamais l'action standard « longpress », que la vue Android traite aussi en appui long natif, d'où un risque de double menu), libellé « Modifier ou supprimer » (`referenceData.longPressDialog.accessibilityAction`) ; ignorée formulaire de création ou de modification ouvert, ou menu déjà ouvert ; liste retirée de l'accessibilité Android pendant le menu (`importantForAccessibility`) ; menu remonté par `key` à chaque entrée, usage remis à faux et résultat périmé ignoré ; RA `PRE4-4.6/AC8` (×4) ; formes consignées ci-dessous |
| AC9 | Nom et état ; couleur avec nom ; focus confiné, au dialogue, retour à la liste, retour à l'accès ; ↑ désactivé | C « announces each Category's name and selected state, color always accompanied by the name » ; feuilles `accessibilityViewIsModal` ; retour à la liste : V (R10, ×4) ; ↑ : `accessibilityState.disabled` (C, Z « P3-03/empty-create-name ») | **focus non envoyé au dialogue à son ouverture ; focus non rendu à l'accès à la fermeture d'une feuille** | `ReferenceValueDialog`, sur opt-in `focusOnOpen` (Catégorie et Zones ; l'Étiquette, hors périmètre, n'envoie rien) : focus au nom de l'entrée, puis au titre de la confirmation — le dialogue est un calque sans animation dans la feuille déjà présentée, son montage est sa présentation ; après `Modifier`, focus au champ de nom du formulaire d'édition (les deux feuilles) ; retour à l'accès Catégorie ou Zones **après la fin de la fermeture** (`useReferenceSheet` : feuille gardée montée en `visible={false}` jusqu'à `onDismiss` du `Modal` sur iOS, comme la photo de 4.5 ; démontage et focus immédiats ailleurs) ; RA `PRE4-4.6/AC9` (×4), EA `PRE4-4.6/AC9` (Zones, iOS et Android), X `PRE4-4.6/AC9` (Catégorie par l'adaptateur réel, CC et MS, ✕ et ✓). Limites, à constater en R-4.6-05 : sur Android, le retour du focus à la liste (R10, PRE-3) vise une liste encore masquée au même instant ; si `onDismiss` n'arrivait pas sur iPhone, la feuille resterait montée invisible (sans effet tactile) et le focus ne serait pas rendu, la réouverture montant une feuille neuve |
| AC10 | États non portés par la seule couleur ; appui ; lexique et termes interdits | états : `accessibilityState` (`disabled`, `selected`, `checked`, `expanded`) sur ↑, ✓, `Terminer` (X `PRE4-4.2/AC9`), options, accès ; Feuille : S `PRE4-3.8/AC4` (×2) | **unité « s » en dur dans le libellé de la Carte** (composition PRE-3 imposée par 4.2 AC6) ; **aucune dilatation au contact** (aucun retour visuel d'appui dans ces surfaces) ; l'action au relâchement et l'annulation quand le doigt sort sont celles de `Pressable` (natif), non simulables sous Jest | EA `PRE4-4.6/AC10` (×2 : douze sources lues — attributs porteurs de texte en littéral, ternaire ou gabarit, valeurs et actions d'accessibilité, texte JSX `>Texte<` et `{"…"}`, limite nommée dans le titre ; termes interdits sur le texte rendu de l'Éditeur, de la feuille des Zones, de la feuille de Catégorie, du formulaire, du menu et de la confirmation) ; Q52 ; R-4.6-04 (étape 4), R-49 |
| AC11 | Liste complète, rattachements, matrice | R-x.y-zz des stories, sections §4.1 à §4.4 | liste d'ensemble absente ; 15 scénarios de story hors de la liste d'origine | `recette-iphone.md` §6 : R-01 à R-52 au format du §3 + « Rattachement », 15 rattachements ajoutés (aucun retiré), R-4.6-01 à 05 (§6.1), matrice (§6.2), Résultat vide, renvoi au delta |

### Ce qui a été changé

- `src/shared/ui/entryMenuAction.ts` (nouveau, module neutre) : `ENTRY_MENU_ACTION` = « entryMenu », action personnalisée.
- `ReferenceValueDialog.tsx` : prop opt-in `focusOnOpen` ; avec elle, à l'ouverture et au passage à la confirmation, `AccessibilityInfo.sendAccessibilityEvent(titre, "focus")` (nom de l'entrée, puis « Supprimer « {nom} » ? ») ; sans elle (Étiquette), aucun focus envoyé ; retour à la liste (R10, `setAccessibilityFocus`) inchangé.
- `CategoryPickerModal.tsx` et `BodyZonePickerModal.tsx` : `openEntryMenu` (corps de l'ancien `onLongPress`, plus : cible mémorisée, usage remis à faux, résultat asynchrone périmé ignoré) appelé par l'appui long ; `runEntryMenuAction` (action accessible, ignorée formulaire ouvert ou menu ouvert) ; liste en `importantForAccessibility="no-hide-descendants"` pendant le menu ; dialogue monté avec `key` = identifiant de l'entrée et `focusOnOpen` ; focus au champ de nom après `Modifier` ; props optionnelles `visible` (vrai par défaut) et `onDismissed` (`onDismiss` du `Modal`) ; `CREATE_ACTION_HIT_SLOP` sur `Créer…`.
- `BodyZoneSelector.tsx` : prop optionnelle `onEntryMenuAction` ; avec elle seulement, action accessible sur chaque Zone ; sans elle, aucune prop ajoutée.
- `useReferenceSheet.ts` (nouveau) : état ouvert / monté / génération d'une feuille de référentiel ; focus rendu à l'accès après `onDismiss` (iOS) ou dès la fermeture (ailleurs).
- `ActivityEditorForm.tsx` : feuille des Zones par `useReferenceSheet` (accès Zones) ; prop optionnelle `categoryAccessRef` posée sur l'accès Catégorie.
- `ExerciseScreen.tsx` (deux adaptateurs) : feuille de Catégorie par `useReferenceSheet(categoryAccessRef)` ; `isCategoryPickerOpen` = `categorySheet.isOpen` (icône et état « développé » de 4.3 inchangés).
- `ActivityMediaList.tsx` : `OPEN_SETTINGS_HIT_SLOP` (exporté, débord haut seul) sur `Ouvrir les réglages`.
- Lexique : `referenceData.longPressDialog.accessibilityAction` (« Modifier ou supprimer ») ; `index.test.ts` mis à jour additivement (égalité de l'objet `longPressDialog`).
- Tests : EA (8), RA (10), X `PRE4-4.6/AC9` (1) ; tests existants : seulement `index.test.ts` (ajout de la clé). READMEs `src/features/activities`, `src/features/reference-data`, `src/features/sessions`.
- Documents : `recette-iphone.md` §6 (ajout en fin de fichier, aucune ligne existante modifiée).
- Non touchés : `tokens.ts`, `migration001.ts`, garde-fous zéro `ScrollView`, Feuille et ses composants, menus et lecteur des Médias, frozen, epics, PRD, spine, `questions-ouvertes.md`.

**Formes des alternatives aux gestes (AC8, consignées).** Série : actions VoiceOver « Monter la série {n} » / « Descendre la série {n} » sur la poignée (alternative au glisser, 3.6 AC8) ; retrait par la croix, appui simple, puis « Série supprimée — Annuler ». Valeur au-delà du pas simple : actions « augmenter » / « diminuer » du réglage ajustable (champs ± et cellules) et la roue (Sélecteur), sans maintien. Média : actions « Retirer {item} », « Monter {item} », « Descendre {item} » de la tuile (alternative au menu d'appui long, Q31). Catégorie et Zone : action « Modifier ou supprimer » qui ouvre le menu ✕ / `Modifier` / `Supprimer`.

### Tableau de conformité des 32 frames (AC1)

Lettres des relevés de 4.2 (A à G) et de 4.3 (H à M). « Écarts restants » : écarts signalés et non corrigés, avec leur numéro dans la spec qui porte le relevé. Traitements : **signalé** (à arbitrer par Hermann, questions citées), **`NON VÉRIFIABLE`** (absent de Figma ou non observable), **`À CLARIFIER`** (règle en attente), **conforme** (aucun écart restant au relevé). Rappel NFR-04 : ce tableau ne déclare aucune conformité visuelle ; il récapitule des relevés et des décisions.

| # | Frame | Surface | Relevé (story) | États couverts | Écarts restants | Traitement |
|---|---|---|---|---|---|---|
| 1 | `8328:36711` | Éditeur — Avant Paramètres (D) | 4.2 ; accès 4.3 | création, Nom, accès renseignés, Carte vide avec invite | communs A–G : E-V1 à E-V6, E-V8 à E-V10, E-V13, E-V14 (4.2) ; accès : E-V1 à E-V3 (4.3) | signalé (Q48, Q49 e) |
| 2 | `8328:36853` | Éditeur — Champ vide (E) | 4.2 | Carte vide, invite | communs A–G ; invite 14 / #6B6E75 : E-V11 (4.2) | signalé (Q48) |
| 3 | `8328:37022` | Éditeur — Résumé affiché (F) | 4.2 ; accès Zones 4.3 | Phrase affichée, accès Zones renseigné | communs A–G ; Phrase 14 contre 13 : E-V12 (4.2, règle maintenue) ; séparateur des Zones « . » | signalé ; séparateur `À CLARIFIER` (Q49 a) ; lignes Compte à rebours et Fin absentes de la frame : `NON VÉRIFIABLE` (P17) |
| 4 | `8328:35698` | Éditeur — Initial (A) | 4.2 ; 4.3 ; 4.4 | création vide, accès non renseignés, galerie vide | communs A–G ; placeholder #7A7A80 : E-V5 (4.2) ; contour des tuiles : E-V17 ; icône d'ajout : E-V18 (Q50 a) ; tuile de démonstration : E-V19 | signalé (Q48, Q50) |
| 5 | `8328:35740` | Éditeur — Nom Description Média (B) | 4.2 ; 4.4 ; pictogrammes 4.5 | saisie, Description, Média, `Terminer` inactif | communs A–G ; interligne du Nom : E-V6 ; Description en étapes non reprise (P18) : E-V9 ; `Terminer` inactif : E-V15 ; E-V17, E-V18, E-V21 ; pictogrammes de lecture et de plein écran non rendus : E-V20 (Q51 e) | signalé (Q48, Q50, Q51) |
| 6 | `8328:36278` | Éditeur — Catégorie renseignée (C) | 4.2 ; 4.3 | accès Catégorie renseigné | communs A–G ; accès renseignés : E-V3 (4.3) ; état ouvert sans rendu visuel : E-V12 (4.3) | signalé (Q49 e) |
| 7 | `8328:36923` | Feuille — Champs vides | 3.3 | champs `—`, Régime `identiques` | contour blanc du groupe non rendu ; écart libellé → Régime 8 au lieu de 12 | signalé (3.3) |
| 8 | `8328:37092` | Feuille — popover du Mode | 3.3 | popover ouvert, ligne sélectionnée | repère d'accent non rendu (Q40) ; rendu du `Popover` natif (P33) | signalé ; popover natif : rendu système |
| 9 | `8328:37760` | Feuille — Série en durée | 3.3 ; 3.4 ; 3.6 | valeurs au repos, N = 1 | champ ± ouvert sans frame ; ± de part et d'autre de la valeur (AD-16) | `NON VÉRIFIABLE` (état ouvert) ; signalé (§5, points d'ergonomie) |
| 10 | `8328:37862` | Sélecteur de cible en Durée | 3.4 | roue numérique, option échec non choisie | rendu de la roue native (P33) ; unités `min` / `s` ; présentation en panneau (Q41) | signalé ; option choisie et ✓ indisponible : `NON VÉRIFIABLE` |
| 11 | `8328:37972` | Feuille — Changement de côté | 3.3 | sélecteur ouvert | liste de Figma contre segmenté dans le panneau (Q41, décision) | signalé (décision Q41, à juger R-3.3-02) |
| 12 | `8328:38084` | Feuille — roulette de Durée totale | 3.7 | roue ouverte | roue PRE-3 dans le panneau (Q41), bornes T(1)..T(99) (Q46) | signalé (Q46) |
| 13 | `8328:38193` | Feuille — Un côté après l'autre | 3.3 | valeur de l'Ordre | — | conforme au relevé |
| 14 | `8328:38301` | Feuille — Les deux côtés à chaque série | 3.3 | valeur de l'Ordre | — | conforme au relevé |
| 15 | `8328:38409` | Feuille — Durée totale ajustée (message) | 3.7 | message et `Annuler` | — (message existant) | conforme au relevé |
| 16 | `8328:38513` | Feuille — popover du Mode, variables | 3.3 | popover ouvert, Régime `variables`, chevron | — (groupe sans interrupteur, FR-04-01) | conforme au relevé |
| 17 | `8328:38632` | Tableau — variables en durée | 3.6 | lignes, croix, tableau sans retrait x52 | Cellule active, barre d'accent, Pied : sans objet (Q44) ; cellules 128 (± permanents) au lieu de 76 ; croix rognée à 375 pt (R-3.6-01) | signalé ; Pied et Cellule active : sans objet (Q44) |
| 18 | `8328:38741` | Tableau — variables en répétitions | 3.6 ; complément 4.6 | `12 rép.`, `10 rép.`, `8 rép.` | Pied « Série 1 · … » : sans objet (Q44) | conforme au complément de relevé |
| 19 | `8328:38848` | Tableau — variables à l'échec | 3.6 ; complément 4.6 | toutes Cibles à l'échec, deux colonnes | texte de fond énumérant des Pauses variables non reproduit (P1) ; Pied : sans objet (Q44) | conforme au complément de relevé |
| 20 | `8470:13303` | Tableau et Durée totale — cas mixte | 3.6 ; 3.7 | Cibles mixtes, total `≥` en lecture seule | — (montant non repris de la capture, D-255) | conforme au relevé |
| 21 | `8328:38953` | Feuille — Ordre des côtés | 3.3 | sélecteur ouvert avec sous-titres | liste de Figma contre segmenté dans le panneau (Q41) | signalé (décision Q41) |
| 22 | `8328:39072` | Feuille — Une seule série | 3.3 | N = 1, Régime non modifiable | Régime atténué 0,45 contre normal dans la frame ; ligne Ordre masquée (Q38) | signalé (§5, points d'ergonomie) ; Ordre : décision Q38 |
| 23 | `8328:39181` | Tableau replié | 3.3 ; 3.6 | `variables`, chevron replié | — | conforme au relevé |
| 24 | `8328:39279` | Tableau — déplacement | 3.6 ; complément 4.6 | glisser en cours | repère de dépôt : E-V24 ; carte soulevée : E-V25 ; repère « ligne en cours de réglage » : sans objet (Q44) | signalé (nouveaux, ci-dessous) |
| 25 | `8328:39390` | Feuille — popover du Régime | 3.3 | sélecteur ouvert | bulle ancrée à gauche contre panneau de la largeur de la ligne (Q43) | signalé (Q43, à juger R-3.3-03) |
| 26 | `8328:35810` | Feuille Catégories (H) | 4.3 | liste, sélection | ✕ / ✓ sans contour ni ombre : E-V4 ; libellé sélectionné : E-V6 ; cible des options 30 : E-V7 ; accès : E-V1 | signalé (Q49 e ; question 1 de 4.6) |
| 27 | `8328:35932` | Catégorie — confirmation de suppression (I) | 4.3 | dialogue de suppression | ordre et typographie des actions : E-V11 ; frame antérieure à D-354 | signalé ; menu D-354 : `NON VÉRIFIABLE` (P13) |
| 28 | `8328:36056` | Nouvelle catégorie (J) | 4.3 | formulaire de création, clavier | champ et ↑ : E-V9 ; barre de 16 cases contre 12 couleurs (D-026) : E-V10 | signalé (E4-5, NFR-01) |
| 29 | `8328:36348` | Feuille Zones (K) | 4.3 | liste, sélection | options de Zone : E-V8 ; silhouette au repos : E-V2 | signalé (Q49 e) |
| 30 | `8328:36441` | Zone — confirmation de suppression (L) | 4.3 | dialogue de suppression | E-V11 ; frame antérieure à D-354 | signalé ; menu D-354 : `NON VÉRIFIABLE` (P13) |
| 31 | `8328:36536` | Nouvelle zone corporelle (M) | 4.3 | formulaire de création, clavier | titre et placeholder des captures (P34) : E-V5 ; champ : E-V9 | signalé (Q49 e) |
| 32 | `8328:36781` | Abandon (confirmation) (G) | 4.2 | dialogue en création | typographie du dialogue : E-V16 ; textes remplacés par Q18 | signalé (Q48) ; abandon en modification : `NON VÉRIFIABLE` (aucune frame) |

**Frames sans relevé comblées : aucune** — les 32 frames avaient un relevé. Le complément ci-dessous détaille trois frames que 3.6 n'avait relevées qu'en une ligne.

**Complément de relevé (2026-10-18, D-255 ; lecture des arbres `docs/preparation/PRE-4/figma/8328-*.json.gz` par un script jetable, supprimé ; code relevé : `2b766635`).**

| Frame | Élément (nœud) | Figma | Code | Écart |
|---|---|---|---|---|
| `8328:38741` | En-têtes de colonnes (`8328:38822`, `8328:38823`) | « Répétitions », « Pause » Inter Medium 12, #595E66 | `columnHeader` : `type.supporting` Medium, `colors.textSecondary` (#595E66) | — |
| `8328:38741` | Numéro de ligne (`…;8129:31579`) | Inter Medium 14, #141414, 24 de large | `rowNumber` : `type.label` (Medium 14), `colors.textPrimary` | — |
| `8328:38741` | Valeurs des cellules (`…;8129:31581`, `…;8129:31583`) | `12 rép.`, `10 rép.`, `8 rép.` ; `30 s`, `45 s`, `1 min` ; Semi Bold 13, #0508E5 | valeur du stepper : `type.editableValue`, `colors.primary` ; formateurs existants | — (cellules 76 × 24 contre 128 : ± permanents, Q44) |
| `8328:38741` | Pied « Série 1 · … » | Pied de tableau, Medium 12 #595E66 | absent | sans objet (Q44) |
| `8328:38848` | Valeurs de Cible | « à l’échec » Semi Bold 13 #0508E5 dans les trois cellules ; en-tête de colonne « Durée » | « à l’échec » dans le stepper (`formatValue`), ± indisponibles ; en-tête du Mode courant | — |
| `8328:38848` | Pied « Série 1 · Pause » (`I8328:38946;8129:31595`) | Medium 12 #595E66 | absent | sans objet (Q44) |
| `8328:38848` | Description de l'exercice (texte de fond) | énumère des Pauses variables | Phrase du générateur (AD-6) | non reproduit (P1) |
| `8328:39279` | Repère de dépôt (`8328:39362`) | 330 × 2, rayon 1, #5F60EE (`colors.selection`) | `insertionGuideLine` : 2, rayon 1, `colors.primary` #0508E5 (recette 2, T-15 : « trait bleu Kodjo », demande de Hermann en PRE-3) | **E-V24** : teinte |
| `8328:39279` | Carte — ligne soulevée (`8328:39388`) | 346 × 40, blanc, rayon 10, ombre #1A1A33 18 % (0, 4), flou 12 | aucune carte ni ombre : la ligne glissée garde son rendu (glisser PRE-3 accepté, 3.6) | **E-V25** : carte et ombre absentes ; aucun jeton d'ombre |
| `8328:39279` | Repère « ligne en cours de réglage » (`8328:39378`) | 3 × 24, #0508E5 | absent | sans objet (Q44) |
| `8328:39279` | Lignes 2 et 3 (`8328:39374`, `8328:39376`) | 334 × 36, valeurs Semi Bold 13 #0508E5 | lignes du tableau (44, Q42), mêmes styles qu'au repos | hauteur 44 décidée (Q42) |

E-V24 et E-V25 sont numérotés à la suite des écarts de 4.4 (E-V17 à E-V23) ; ils portent sur des rendus PRE-3 acceptés et ne sont pas corrigés (signalés, question 7).

### Preuve 1 — tests automatisés (AC2)

Tests de la story (19, tous verts, revue comprise) : EA `PRE4-4.6/AC4`, `AC5`, `AC6`, `AC7` (×2), `AC9`, `AC10` (×2) ; RA `PRE4-4.6/AC4`, `AC5`, `AC8` (×4), `AC9` (×4) ; X `PRE4-4.6/AC9`. Tests antérieurs cités dans l'audit, verts. Suite complète, `npx tsc --noEmit`, `npm run lint` : voir « Vérification » plus bas. Ce que ces tests ne prouvent pas : l'annonce réelle de VoiceOver, le déplacement effectif du focus, la géométrie rendue, le comportement au texte agrandi, la réception des touchers dans les `hitSlop` (NFR-04) — tout cela relève des Preuves 2 et 3.

### Preuve 2 — comparaisons de captures (AC2)

À faire par Hermann. Aucune comparaison de capture n'a été faite dans cette story ; aucune n'est fabriquée. Rubrique vide.

| Frame ou état | Capture iPhone | Écart constaté | Verdict de Hermann |
|---|---|---|---|
| | | | |

### Preuve 3 — perception sur appareil (AC2)

À faire par Hermann, sur la liste de `recette-iphone.md` §6 (colonne « Résultat », vide) et §4. Aucun résultat d'appareil n'est consigné ici ; rubrique vide.

### Textes d'annonce nouveaux (H23 — à valider par Hermann)

- Action accessible d'une Catégorie ou d'une Zone dans sa feuille : « Modifier ou supprimer » (`referenceData.longPressDialog.accessibilityAction`).
- Focus envoyé (sans texte nouveau) : au nom de l'entrée en tête du menu d'appui long, puis au titre de la confirmation « Supprimer « {nom} » ? » ; au champ de nom après `Modifier` ; à l'accès Catégorie ou Zones à la fin de la fermeture de sa feuille.

### Points à arbitrer par Hermann (non corrigés ; ouverts par le coordinateur en Q52 de `questions-ouvertes.md`, qui fait foi)

Après la revue, le point 1 inclut aussi `Ouvrir les réglages` (cible effective 31 : le lien n'a pas de place sous lui dans son parent), et le point 6 couvre aussi le focus au champ de nom après `Modifier`.

1. **Cibles sous 44 non corrigeables sans changer un rendu PRE-3 (FR-22-04).** Options de Catégorie : pilule de 30, sans `hitSlop`, dans une rangée à écart de 8 (E-V7 de 4.3) ; cases du nuancier : 12 segments contigus de 32 de haut, ≈ 29 de large à 402 ; `Annuler` / `Enregistrer` du formulaire de modification : 30 de haut (deux feuilles) ; champ Nom : hauteur minimale 42, relevée sur `8328:35698`. Les porter à 44 avec 8 entre cibles impose d'agrandir le dessin ou l'espacement. À juger en R-4.6-04.
2. **Hauteurs fixes sur un texte (FR-22-05, convention « Texte agrandi » de la spine).** Options de Catégorie (30), `Créer une catégorie` / `Créer une zone corporelle` (32), champ de création (46), ↑ (32, symbole), actions de modification (30), tuiles Médias (213, textes d'état) ; nom de l'entrée limité à 2 lignes dans l'en-tête du menu ; noms des Zones du bandeau sur 1 ligne (liste entière dans le libellé accessible). Passer en hauteur minimale changerait des styles verrouillés par des tests PRE-3 (C « P3-20/all-surfaces »). À juger en R-4.6-02.
3. **Libellé accessible de la Carte (FR-22-12 contre 4.2 AC6).** La composition PRE-3 « Compte à rebours {n} s, Fin d’exercice {n} s. » garde l'unité « s » en dur et des secondes brutes (90 s annoncées « 90 s », affichées « 1 min 30 s »). 4.2 AC6 impose de garder cette composition ; AC10 refuse tout texte en dur. Exception consignée dans EA `PRE4-4.6/AC10`.
4. **Dilatation au contact (FR-22-12, D-237).** Aucune surface de l'Éditeur ni des référentiels n'a de retour visuel d'appui ; l'ajouter changerait le rendu PRE-3 (et demanderait la variante « opacité seule » avec « Réduire les animations »). Action au relâchement et annulation quand le doigt sort : comportement natif de `Pressable`, à constater en R-4.6-04.
5. **Couleur annoncée par son code.** Dans le nuancier de création, chaque case est annoncée « Couleur #RRGGBB » (PRE-3) : aucune couleur de D-026 n'a de nom au lexique. FR-22-10 exige qu'une Catégorie ne soit jamais désignée par sa seule couleur (respecté : son nom est toujours lu) ; le nuancier lui-même reste peu intelligible à VoiceOver.
6. **Cible du focus à l'ouverture du menu d'appui long** : le nom de l'entrée (choix de Claude), plutôt que ✕ ou `Modifier`.
7. **E-V24, E-V25** (frame `8328:39279`) : repère de dépôt #5F60EE dans Figma contre bleu Kodjo #0508E5 demandé par Hermann en PRE-3 (T-15) ; carte soulevée avec ombre absente du glisser PRE-3.

## Spec Change Log

- 2026-10-18 — (a) **Cibles tactiles (AC4) et liste fermée des corrections.** La section frozen limite les corrections à « l'accessibilité (libellés, rôles, états, actions, focus) », au texte agrandi et aux alternatives aux gestes ; FR-22-04 (cibles) relève de l'accessibilité (ED-22). Lecture retenue : une cible n'est agrandie que par un `hitSlop`, sans changement de dessin ni d'espacement, et seulement là où 44 et 8 entre cibles tiennent (`Créer…`, `Ouvrir les réglages`) ; les autres cibles deviennent des questions (point 1).
- 2026-10-18 — (b) **Hauteurs fixes (AC5) contre Q49 b.** La convention de la spine (« aucune hauteur fixe sur un texte ») vise des styles PRE-3 des feuilles de référentiel que fige un test PRE-3 (C « P3-20/all-surfaces »). Lecture retenue, comme 3.8 pour `TABLE_ROW_HEIGHT` : pas de modification sans besoin explicite ; exceptions figées par RA et EA `PRE4-4.6/AC5`, jugement en R-4.6-02 (point 2).
- 2026-10-18 — (c) **Lexique (AC10) contre 4.2 AC6.** L'unité « s » du libellé de la Carte est la seule chaîne en dur trouvée ; 4.2 AC6 impose la composition du code de départ. Non modifiée, exception nommée dans le test (point 3).
- 2026-10-18 — (d) **Dev client.** AC11 et Q22 nomment « Routine Dev » ; le dev client utilisé depuis la recette du 2026-10-17 est « Routine BMAD » (§5 de `recette-iphone.md`, consigne du coordinateur). La section §6 nomme « Routine BMAD » et rappelle l'ancien nom.
- 2026-10-18 — (e) *Remplacé par (j).* **Action accessible des référentiels.** Nom « longpress » (action standard d'appui long sur Android ; action personnalisée sous son libellé sur iOS) ; la clé du libellé est placée dans `executionParameters.referenceSheets` et non dans `referenceData.longPressDialog`, que fige un test PRE-3 (`index.test.ts`, égalité stricte de l'objet).
- 2026-10-18 — (f) **Focus.** `sendAccessibilityEvent(…, "focus")` est utilisé pour les nouveaux envois (dialogue, accès), pour laisser `setAccessibilityFocus` au seul retour à la liste (R10) que comptent les tests PRE-3 de `ReferenceValueDialog`.
- 2026-10-18 — (g) **AC11, format.** Le format du §3 n'a pas de colonne « Parcours » : elle est portée en tête des Préconditions ; « Préconditions et gestes » de la liste d'origine est scindé sans reformulation ; les attendus devenus caducs (Q41, Q43, Q44, Q46, Q47, Q49 b, Q51) sont annotés « Consolidation 4.6 » sans être réécrits. Les 15 scénarios de story absents de la liste sont rattachés à la ligne la plus proche (index en §6). R-4.6-01 à 05, que la liste nomme sans les détailler, sont rédigés en §6.1.
- 2026-10-18 — (h) **« N hérité » (AC1).** Désigne un N hérité d'un circuit de séries (FR-12-07), que PRE-4 ne produit pas : `NON VÉRIFIABLE` sur appareil, compatibilité prouvée au domaine (2.1 AC6, P42).
- 2026-10-18 — (i) **AC1, complément de relevé.** Les relevés de 3.6 en une ligne (`38741`, `38848`, `39279`) ne sont pas des absences de relevé ; ils sont complétés ici (propriétés observées), d'où E-V24 et E-V25.
- 2026-10-18 — (j) **Correctifs de revue du coordinateur** (points 1 à 11, principe Q49 b) : focus du dialogue en opt-in (`focusOnOpen`), l'Étiquette (Composition) inchangée ; retour du focus à l'accès après `onDismiss` (`useReferenceSheet`), même mécanisme pour Catégorie et Zones, plus d'envoi dans `onClose` ni pendant le fondu ; focus à l'ouverture du dialogue gardé au montage, le calque n'ayant pas d'animation (documenté) ; `key` du dialogue = identifiant de l'entrée ; liste masquée sur Android pendant le menu ; action ignorée formulaire ou menu ouvert ; nom d'action personnalisé « entryMenu » dans un module neutre (au lieu de « longpress », risque de double menu Android) ; clé du lexique dans `referenceData.longPressDialog`, test d'égalité étendu additivement ; usage remis à faux et résultat périmé ignoré (Catégorie, et Zones par cohérence, même flux) ; débord de `Ouvrir les réglages` réduit au côté libre (haut) ; tests AC4 calculés depuis les styles et les constantes ; test AC10 élargi (ternaires, `{"…"}`, littéraux d'attributs, limite nommée) et termes interdits sur les feuilles et dialogues rendus ; focus au champ de nom après `Modifier` ; explication des occurrences de `ScrollView` (AC3). Points ouverts : Q52.

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V, aucun manque). Onze correctifs appliqués par l'implémenteur (Spec Change Log (j)) ; points produit renvoyés à Q52 par Claude.

| Constat | Verdict | Route |
|---|---|---|
| B1/V-autre — focus du dialogue étendu aux Étiquettes (Composition), contre Q49 b | high | patch (opt-in `focusOnOpen`) |
| B2/B3/E1/E2/V-autre — focus envoyé pendant la fermeture des feuilles ; deux mécanismes | medium | patch (`useReferenceSheet`, `onDismiss`, intégration par l'adaptateur) |
| E3 — étape `delete` conservée après changement de cible | high | patch (`key`) |
| E4/B5 — liste active sous le dialogue (Android), double menu possible, action sur formulaire ouvert | medium | patch (`entryMenu`, gardes) |
| E5 — usage périmé de l'entrée précédente | medium | patch |
| B7/E6 — `hitSlop` sans place dans le parent | low | patch (« Ouvrir les réglages » ramené à 31, Q52 a) |
| B6/E7 — test AC4 tautologique | low | patch |
| B8 — test AC10 lacunaire | low | patch (limite nommée, termes interdits sur le rendu) |
| B4 — focus après `Modifier` | low | patch |
| B11/B12 — couplage sessions → reference-data, clé de lexique mal rangée | low | patch |
| B13/B14 — statut, points ouverts non numérotés | low | patch (Q52) |
| B15 — hausse des occurrences de `ScrollView` inexpliquée | low | patch (expliquée, garde-fous intacts) |
| B9 — formatage | low | patch |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Résultats (2026-10-18, implémenteur), sur l'arbre de travail au-dessus du commit de base `2b766635`, sans commit :**
- première livraison : `npx jest --maxWorkers=50%` : 114 suites, 2837 tests, tous verts (dont 13 tests `PRE4-4.6`) ; `npx tsc --noEmit` et `npm run lint` : aucune erreur ;
- après les correctifs de revue : `npx tsc --noEmit` et `npm run lint` : aucune erreur ; suites couvrant les fichiers modifiés (20 suites : `ExerciseScreen`, `ActivityEditorForm`, `ActivityMediaList`, EA, `reference-data/*`, `BodyZoneSelector`, `i18n`, intégrations `ExerciseEditingPaths`, `ExerciseEditorNoWrite`, `CategoriesSaveFlow`, `CompositionExerciseFlow`, `ExerciseNavigationGuard`, `CompositionScreen`, `ColorPalette`) : vertes. Suite complète : par le coordinateur.
- Fins de ligne CRLF des fichiers modifiés conservées (lignes = retours chariot).

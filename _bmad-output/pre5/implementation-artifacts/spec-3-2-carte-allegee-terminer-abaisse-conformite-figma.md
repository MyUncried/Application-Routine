---
title: 'Story 3.2 — Carte allégée, Terminer abaissé et conformité Figma de l''écran principal'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '01ca2546c9dd750961d1be35ca98e77835c2bbb5'
route: 'dispatch'
review_loop_iteration: 0
context:
  - 'C:/Dev/KODJO-BMAD-PRE5-fix/_bmad-output/pre5/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Carte des paramètres affiche encore Compte à rebours, Fin et leur filet (R-14, FR-36) ; `Terminer` est posé à `insets.bottom + 16` au lieu de la position Figma (FR-37) ; l'en-tête de la Carte, les titres de section et la Classification Catégorie / Zones gardent le rendu PRE-3 au lieu des frames actuelles (FR-38, E-V7, E-V8, E-V10).

**Approach:** Story 3.2 d'`epics.md` (AC1 à AC4, qui font foi), présentation seulement (AD-30) dans `ActivityEditorForm.tsx`. Relevé Figma du 19/10 (lecture seule) : `8328:35698` (Initial, à renseigner), `8328:36853` et `8328:37022` (renseigné, Carte vide et remplie). Valeurs sans jeton en constantes locales nommées (AD-11).

## Boundaries & Constraints

**Always:**
- Carte : plus de `phasesRow` ni `cardSeparator` ; nom accessible `« Modifier les paramètres d’exécution. {Phrase} »`, sans la Phrase quand elle est vide (`« Modifier les paramètres d’exécution. »`) ; clés `card.countdown` / `card.end` retirées ; Carte = fond `colors.surfaceSubtle`, rayon 12, sans bordure, padding vertical 12, horizontal = gouttière des étapes (16 + 8 = 24, constante exportée de `DescriptionSteps.tsx`, non dupliquée).
- `Terminer` : hors du `KeyboardAvoidingView` (D-349), bas du bouton à 24 du bord bas de l'écran (`Action finale` : `pb` 24, bouton à y802 sur 874), indépendamment de `insets.bottom` ; réserve de défilement au-dessus = `paddingBottom` du corps (12, D-327 bloc → `Terminer`) nommée ; couleurs actif / inactif inchangées.
- Titres de section (Description, Paramètres d’exécution, Médias) : `type.caption` (Regular 11) et `colors.textSecondary` ; texte « Paramètres d’exécution » (Q11) et rôle `header` inchangés.
- Classification : une seule forme pour « à renseigner » et « renseigné » — rangée `paddingLeft` 6, écart 20 entre les deux accès ; accès : hauteur 26, rayon 13, `paddingLeft` 8, `paddingRight` 10, écart glyphe → libellé 6, glyphe 18, libellé Regular 13 (`type.exerciseFieldValue`). À renseigner : voile blanc à 35 % (constante locale), glyphe et libellé `colors.primary`. Renseigné : aucun fond, libellé `colors.textPrimary`, glyphe Catégorie = `icon-categorie-plein` teinté (`tintColor`) de la couleur de la Catégorie (sans couleur : non teinté). Mêmes dimensions dans les deux états : rien ne bouge. Écart Nom → rangée = 0 (E-V4). Cibles ≥ 44 de haut, étendues vers le bas (`hitSlop` haut ≤ 1, ne recouvrant pas le champ Nom), frontière au milieu de l'écart de 20.
- Comportements conservés : contour au repos / plein pendant l'ouverture de la feuille (Catégorie non renseignée et Zones, PRE-4 4.3), silhouette du Profil, séparateur des Zones (Q49), noms accessibles et `expanded`, Q53 ; ordre Description → Paramètres → Médias ; Carte vide sans invite (Q55) ; grille D-327 (18 / 13 / 20 / 12) ; « Retour » du ✕ ; ↑ de la Description (D-351).
- `tokens.ts` et `tokensSpecification.test.ts` intacts ; textes par `src/shared/i18n/` ; CRLF des fichiers touchés.

**Never:** aucune modification de données, de la Feuille (`ExecutionParametersSheet.tsx` et fichiers de la Feuille), de `computeExercisePlanDuration`, de la Phrase ; ni de `FixedHeader` / `ScreenShell`, du dialogue d'abandon, de `ActivityMediaList`, de `KodjoIcon` ou `BodyZoneIcon` ; aucun jeton, aucun asset nouveau ; aucune ombre ; aucune `ScrollView` ajoutée ; les écarts listés « soumis à Hermann » ne sont pas implémentés ; aucun constat iPhone fabriqué.

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityEditorForm.tsx` -- l. 301-400 bandeau (Nom, `referenceRow`, `referencePill`, `categorySwatch`, `ACCESS_*`) ; l. 422, 465, 508 `sectionTitle` ; l. 468-504 Carte (`accessibilityLabel` l. 472, `cardSeparator`, `phasesRow`, styles l. 849-897 à retirer : `phase*`) ; l. 528-548 créneau `Terminer` (`marginBottom: insets.bottom + spacing[16]`) ; `bodyContent.paddingBottom`. `formatPhraseDuration` peut devenir inutilisé : retirer l'import.
- `src/features/activities/DescriptionSteps.tsx` -- l. 129-133 `STEP_NUMBER_GAP`, `STEP_NUMBER_WIDTH` : exporter une constante `DESCRIPTION_STEP_GUTTER` (somme), seul changement de ce fichier.
- `src/shared/ui/KodjoIcon.tsx` -- `tintColor`, `size` déjà disponibles (non modifié) ; `icon-categorie-plein` (22, même tracé que le glyphe Figma `9002:15540` à l'échelle 18/22, vérifié).
- `src/shared/ui/BodyZoneIcon.tsx` -- `size` (18) ; non modifié.
- `src/shared/i18n/index.ts` -- `executionParameters.card.countdown`, `.end` : retirer (commentaire PRE-5 3.2).
- Tests : `ActivityEditorForm.test.tsx` (l. 253-254 créneau ; 330-350 « carte bordée » ; 385, 814, 1036, 1105 libellés ; 713-716, 738-788, 1038-1040, 1650-1664 Compte à rebours / Fin ; 1300-1430 icônes des accès, pastille `activity-editor-category-swatch`), `EditorAccessibility.story46.test.tsx:444-456` (exception « . s, s. » à retirer ou adapter), tout test de `ExerciseScreen*.test.tsx` ou intégration qui lit ces libellés ou `categorySwatch` (chercher `swatch`, `Compte à rebours 10 s`).

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/DescriptionSteps.tsx` -- exporter `DESCRIPTION_STEP_GUTTER` -- padding de la Carte au fer du texte des étapes.
- [x] `src/features/activities/ActivityEditorForm.tsx` -- Carte allégée, `Terminer` abaissé et réserve nommée, titres de section, Classification -- AC1 à AC3.
- [x] `src/shared/i18n/index.ts` -- clés orphelines retirées -- AC1, AD-32.
- [x] Tests -- réécrire les tests cités ; ajouter : Carte sans lignes ni filet et libellé sans ces valeurs (Phrase vide et remplie) ; créneau `marginBottom` 24 indépendant de `insets.bottom`, hors `KeyboardAvoidingView`, `paddingBottom` 12 ; titres 11 / `textSecondary` ; Carte `surfaceSubtle`, rayon 12, sans bordure, padding 12 / 24 ; accès : mêmes styles géométriques dans les deux états, voile et couleurs par état, glyphe Catégorie teinté, `hitSlop` haut ≤ 1 et cible ≥ 44 -- AC1 à AC4.

**Acceptance Criteria:**
- Given un Exercice avec Compte à rebours 10 s et Fin 5 s, when la Carte s'affiche, then aucun texte « Compte à rebours » / « Fin d’exercice » ni filet n'est rendu, le libellé accessible ne contient pas ces valeurs, et la Feuille montre toujours ces lignes (2.5 inchangé).
- Given l'Éditeur, when il est rendu avec `insets.bottom` 34 puis 0, then le créneau `Terminer` a `marginBottom` 24 dans les deux cas et reste hors du `KeyboardAvoidingView`.
- Given une Catégorie non renseignée puis renseignée, when le bandeau est rendu, then les styles de géométrie de l'accès (hauteur, paddings, écart) sont identiques et seuls le fond et les couleurs changent.
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint` tournent, then tout est vert, `tokensSpecification.test.ts` et les gardes zéro-`ScrollView` compris.

## Écarts soumis à Hermann (non implémentés, AC3 / §9-1)

Relevé du 19/10 sur les frames ci-dessus ; détail, options et recommandation dans le rapport de la story (Implementation Notes).

- G-1 (E-V1, E-V2, E-V3) en-tête partagé `FixedHeader` : titre Inter Medium 17 `#3A3A3F` à x64, ✕ à 12 du bord, cercle `#FCFCFE` liseré blanc et ombre, trait `#14141A` -- composant partagé par tous les écrans.
- G-2 (grille D-327) titre → bloc 10 (Description) et 4 (Paramètres) dans Figma, 13 dans la grille ; contenu à 14 du bandeau (18) et écart 16 entre sections (20).
- G-3 (E-V5) placeholder du Nom : `#141414` dans les frames actuelles (`#7A7A80` au relevé PRE-4), `colors.textSecondary` dans le code.
- G-4 (E-V6) interligne du Nom 22 contre `type.screenTitle` 24 (`TextInput` natif mono-ligne).
- G-5 (E-V7) glyphes au repos pleins dans Figma, contour au repos / plein à l'ouverture dans le code accepté (4.3).
- G-6 (E-V12) Phrase en 14 dans Figma, 13 par la règle FR-02-06.
- G-7 (E-V13) aucun titre « Médias » dans les frames.
- G-8 (E-V14) ombre portée de `Terminer` (`#1A1A26` 18 %, (0, 2), flou 10), aucun jeton d'ombre.
- G-9 (E-V16) typographie du dialogue d'abandon (instance PRE-3 acceptée).

Sans objet : E-V9 (livré par 3.1), E-V11 (invite retirée, Q55), E-V15 (Figma actuel : `#BEC2CC` = `colors.disabled`, conforme).

## Implementation Notes

- Environnement : travailler uniquement dans `C:/Dev/KODJO-BMAD-PRE5-fix` (worktree ; `node_modules` est une jonction : aucun `npm install` / `npm ci`) ; ne toucher ni `C:/Dev/KODJO-BMAD-PRE5` ni `C:/Dev/KODJO-BMAD-PRE5-recette` ; aucun serveur, aucun commit, push ni `git worktree` ; pas de python système ; fichiers temporaires dans le worktree, supprimés ensuite ; respecter les CRLF des fichiers touchés ; docs Expo SDK 57.
- Relevé Figma (lecture seule, 19/10, identifiants vérifiés) : `8328:35698` Initial (à renseigner), `8328:36853` Champ vide et `8328:37022` Résumé affiché (renseigné). Glyphes `9002:15540` (Catégorie, 18) et `9002:15547` (Zone, 18) : même tracé que `icon-categorie-plein` et `body-zone-homme-plein` à l'échelle 18/22 et 18/26 (vérifié par les chemins exportés) — aucun asset nouveau. `Action finale` : `pb` 24, bouton 48 à y802 sur un écran de 874 (bas à 24 du bord). Aucune frame de l'Éditeur clavier ouvert : la position clavier ouvert découle de D-349 (`Terminer` sous le clavier), NON VÉRIFIABLE dans Figma.
- Livré : Carte à Phrase seule (libellé sans Compte à rebours ni Fin, clés retirées), fond `surfaceSubtle` rayon 12 sans liseré, padding 12 / 24 (`DESCRIPTION_STEP_GUTTER`) ; `Terminer` à 24 du bord bas (iOS), réserve `FINISH_SCROLL_RESERVE` (12) ; titres `type.caption` / `textSecondary` ; Classification à une forme (rangée 32, retrait 6, écart 20 ; accès 26 de haut minimum, rayon 13, 8 / 10, glyphes 18, Regular 13 ; voile `rgba(255, 255, 255, 0.35)` et accent à renseigner, sans fond et `textPrimary` renseigné, glyphe Catégorie teinté) ; écart Nom → rangée 0 ; cibles 1 + 26 + 17 = 44, débord bas 14 dans le padding bas de 16.
- Écarts à la lettre de la spec : `minHeight` (et non `height`) 26 pour les accès et aucune troncature du nom de Catégorie (test PRE-4 4.6 AC5 : texte agrandi jamais plafonné) ; liseré `primary` des accès retiré dans les deux registres (relevé) ; **Android** (revue BH-1) : `max(24, insets.bottom)`, car le bord à bord d'Expo 57 placerait la barre de navigation sur `Terminer` — les frames ne couvrent que l'iPhone ; iOS reste à 24 indépendamment de l'encart.
- Glyphe au repos : la Catégorie non renseignée garde le contour au repos et le plein pendant l'ouverture (PRE-4 4.3) ; Figma les montre pleins au repos (G-5). Le glyphe renseigné de `8328:37022` est décalé de 8 (retrait de la pastille absent), ce qui contredit « rien ne bouge » (FR-38) : la règle écrite est appliquée.
- Contrôles : `npm test` (120 suites, 3147 tests), `npx tsc --noEmit`, `npm run lint` verts ; `tokens.ts` inchangé. Aucun constat iPhone.

### Écarts soumis à Hermann, un par un (non implémentés)

- **G-1 (E-V1, E-V2, E-V3) — en-tête partagé `FixedHeader`.** Figma `5544:4503` : titre Inter Medium 17 `#3A3A3F` à x64, ✕ dans une cible 48 à 12 du bord, cercle `#FCFCFE` liseré blanc 1 et ombre (0, 2) flou 10 `#1A1A26` 8 %, trait `#14141A`. Code : titre `type.screenTitle` Semi Bold 20 `#141414` à x74, ✕ à 24, cercle `#E5F0FF` sans liseré ni ombre, trait `#141414`. Options : (a) garder ; (b) variante d'en-tête propre à l'Éditeur ; (c) changer `FixedHeader` pour tous les écrans. Recommandation : (a) pour 3.2, puis une story d'en-tête dédiée si Hermann retient (c) — composant accepté et partagé, aucun jeton d'ombre.
- **G-2 — grille D-327 face aux marges Figma.** Figma : titre → bloc 10 (Description) et 4 (Paramètres), contenu à 14 sous le bandeau, 16 entre sections. Code (D-327) : 13, 18, 20. Options : garder D-327 ; adopter les marges Figma (révision de D-327). Recommandation : garder D-327, décision validée en PRE-4.
- **G-3 (E-V5) — placeholder du Nom.** Frames actuelles : « Nom de l’exercice » en `#141414` (même couleur qu'une valeur) ; relevé PRE-4 : `#7A7A80` ; code : `colors.textSecondary` `#595E66`. Options : garder ; `#7A7A80` en constante locale ; `#141414`. Recommandation : garder (un placeholder noir se confond avec une saisie).
- **G-4 (E-V6) — interligne du Nom 22 contre 24 (`type.screenTitle`).** Options : garder ; surcharger `lineHeight` 22 localement. Recommandation : garder (un `lineHeight` sur un `TextInput` mono-ligne iOS décale le texte ; 2 pt).
- **G-5 (E-V7) — glyphes au repos.** Figma : Catégorie et Zone pleines dans les deux registres. Code : contour au repos et plein pendant l'ouverture de la feuille (PRE-4 4.3, recetté R-4.3-01). Options : garder ; plein permanent (perte du signal d'ouverture). Recommandation : garder.
- **G-6 (E-V12) — Phrase de la Carte en 14 (Figma, registre demande 17) contre 13 (règle FR-02-06 maintenue en PRE-4).** Options : garder 13 ; passer à 14 (`type.body` + interligne 20, jetons existants). Recommandation : 14 si Hermann confirme que la demande 17 remplace FR-02-06 (la Description est déjà à 14).
- **G-7 (E-V13) — titre « Médias ».** Absent des frames, affiché par le code (titre de section, grille D-327). Options : garder ; retirer. Recommandation : garder (repère VoiceOver `header`).
- **G-8 (E-V14) — ombre de `Terminer`** (`#1A1A26` 18 %, (0, 2), flou 10). Aucun jeton d'ombre. Options : garder sans ombre ; ombre en constantes locales. Recommandation : garder sans ombre.
- **G-9 (E-V16) — dialogue d'abandon** (`8328:36781`) : message 14/21 `#474D57`, actions 16. Code : instance d'édition acceptée en PRE-3 (`3224:4140`). Options : garder ; jetons de l'instance Séance (existants). Recommandation : garder (composant partagé accepté).
- **G-10 — position de `Terminer` sur iPhone.** Figma : bas du bouton à 24 du bord, soit 10 pt dans l'encart bas de 34 (au-dessus de l'indicateur d'accueil). Implémenté ainsi. Repli si la recette le juge trop bas : `max(24, insets.bottom)` (bas à 34). Recommandation : garder 24 et juger en R-3.2-02.

### Arbitrages définitifs de Hermann du 19/10 (G-1 à G-10, appliqués)

Principe : conformité au Figma actuel (référence `8328:35698`), jetons existants réutilisés quand ils correspondent exactement, sinon constantes locales ; aucun jeton ni composant global modifié pour cet écran. Les recommandations ci-dessus sont remplacées par ces décisions.

- **G-1** en-tête : `FixedHeader` reçoit trois props locales (`layoutStyle`, `backCircleStyle`, `titleStyle`), passées par l'Éditeur seul (`EDITOR_HEADER`) : cible du ✕ à 12 du bord (retrait 17), titre à 4 après la cible, `dimensions.backAction` (38 / 24 / 48), cercle `#FCFCFE` liseré blanc 1, ombre `#1A1A26` 8 % (0, 2) rayon 10, titre Inter Medium 17 `#3A3A3F` (constantes locales) ; halo centré sur le ✕ (x36). Autres écrans inchangés.
- **G-2** `EDITOR_VERTICAL_GRID` : 14 (`spacing[14]`), 10 (`spacing[10]`), 16 (`spacing[16]`), 12 conservé ; D-327 remplacée pour cet écran seulement.
- **G-3** placeholder du Nom `colors.textPrimary`. **G-4** `type.screenTitle` + interligne local 22.
- **G-5** glyphes pleins au repos (`icon-categorie-plein`, `BodyZoneIcon filled`) ; `expanded` inchangé.
- **G-6** Phrase `type.body` + interligne local 20.
- **G-7** titre « Médias » hors flux (1 × 1, transparent), en-tête VoiceOver conservé.
- **G-8** ombre locale de `Terminer` (`#1A1A26` 18 %, (0, 2), rayon 10, élévation 3). **G-10** `dimensions.finalAction.buttonHeight`, marges `spacing[24]`, bas à 24 (inchangé).
- **G-9** message du dialogue `type.dialogMessage` (14/21), titre `type.modalTitle` (18) ; couleurs, actions et interactions PRE-3 conservées.
- Documents : ch. 07 (section « Arbitrages G-1 à G-10 », statut de D-327), ch. 13 CE-T03-04 §9, `epics.md` story 3.2 AC3 (une ligne).
- Écarts restants (non arbitrés, non implémentés) : couleur du message du dialogue (`#474D57` Figma, `textSecondary` code), libellés d'actions 16 et liseré de `Confirmer` dans `8328:36781` ; trait de l'icône ✕ `#14141A` (export `#141414`).
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

## Spec Change Log

## Review Triage Log

| # | Couche | Constat | Verdict | Preuve / décision |
|---|---|---|---|---|
| VG-0 | verification-gap | Aucun écart de vérification | — | Couverture constatée par la couche (Carte, libellé, clés, créneau à 24 avec encarts 34 et 0, glyphe teinté, géométrie). |
| VG-1 | verification-gap (autre) | P3-10 : la seconde moitié appuie sur Terminer sans attendre le Profil | low | Faiblesse antérieure au diff (même attente avant) ; rejetée. |
| VG-2 / EC-2 / BH-3 | verification-gap, edge, blind | Débord bas de la cible (18) supérieur au padding bas du bandeau (16), `overflow: hidden` : cible rognée si le bandeau grandit | medium | Réel quand le contenu dépasse 115 (deux lignes, texte agrandi) ; rangée sans hauteur (Figma : 32). **patch** : rangée 32, `hitSlop` 1 / 17, débord sous la rangée 14 ≤ 16. |
| BH-1 | blind | `Terminer` ignore l'encart bas | medium | iOS : position Figma voulue (indicateur d'accueil à ~13 du bord, bouton à 24) ; Android bord à bord : barre à trois boutons (~48) recouvrirait le bouton. **patch** Android seulement (`max(24, insets.bottom)`) ; la position iOS reste soumise à la recette (R-3.2-02). |
| BH-2 / EC-3 / EC-6 | blind, edge | Exercice ouvert depuis une Séance : Compte à rebours et Fin visibles nulle part | false | Voulu : RC-7 (`recette-iphone-pre5.md`) « conservés en données sans être affichés » ; 2.5 inchangé, la Carte suit R-14. |
| BH-4 | blind | `ACCESS_ROW_GAP` dérivé de la cible, pas de Figma | low | Aucune frame ne montre la rangée repliée ; écart recalculé avec le patch VG-2 (14). |
| BH-5 | blind | Retrait du `gap` du bandeau touche tous ses enfants | false | Seuls Nom et rangée sont en flux (fondu et halo absolus). |
| BH-6 / EC-1 | blind, edge | Catégorie sans couleur ou couleur `""` | low | `null` : glyphe source `#0508E5` (accent), acceptable ; `""` passerait une teinte vide. **patch** (test de vérité). |
| BH-7 | blind | Couleur de la silhouette « renseigné » non spécifiée | false | Figma `8328:37022` : glyphe de Zone `#0508E5` dans les deux registres, inchangé dans le code. |
| BH-8 | blind | Test AC1 filtrant `PressabilityDebugView` | low | Tests toujours en mode dev ; rejeté. |
| BH-9 / EC-4 | blind, edge | `setTimeout(0)` au lieu d'une attente observable (P3-10) | low | Risque d'instabilité. **patch** (attente sur un effet du Profil). |
| BH-10 | blind | `expectUncapped` retiré pour Compte à rebours / Fin | low | Valeurs sorties de la Carte ; lignes de la Feuille hors périmètre (2.5) ; rejeté. |
| BH-11 | blind | VoiceOver : Carte vide sans indication | false | Q55 / E-21 : Carte vide sans invite, rendu PRE-3 ; seul le retrait de Compte à rebours / Fin change le libellé. |
| BH-12 | blind | Commentaires : réserve « jamais masqué » ; AC10 « reste « . » » | low | Réserve : vraie par construction (créneau hors défilement, corps au-dessus) ; commentaire AC10 faux. **patch** du commentaire AC10. |
| EC-5 | edge (suppression) | `ProfileEditScreen.tsx:178-180` cite l'Éditeur comme patron d'encart bas | false | Le commentaire cite le patron de défilement (`ScrollView`, `keyboardShouldPersistTaps`), inchangé. |
| EC-7 | edge (claims) | AC1 « la Feuille montre toujours ces lignes » faux en Séance | false | Le critère porte sur le Catalogue ; en Séance, 2.5 (D-409) les retire déjà de la Feuille, inchangé. |

## Verification

**Commands:**
- `npm test` -- vert
- `npx tsc --noEmit` -- vert
- `npm run lint` -- vert

**Manual checks (recette iPhone, lot Éditeur, Hermann):** R-3.2-01 à R-3.2-05 d'`epics.md` ; en plus : position de `Terminer` par rapport à l'indicateur d'accueil, cibles des accès (bas étendu), Carte vide sans contenu (hauteur).

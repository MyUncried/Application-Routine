---
title: 'Story 2.1 — En-tête, bornes de séance et Continuer'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '8e5bc83a02008f4df0c93d2ec3eae949e8ff547b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Composition ne suit pas le rendu Figma actualisé (`8328:28172` initial, `8328:28605` standard) : en-tête sans durée de séance ni action « + » compacte, bornes sans rail ni pastille de valeur, action finale « Enregistrer la séance », et sous-carte « Récupération 0 s » affichée pour toute occurrence (E5, contraire à D-303).

**Approach:** Refaire le haut et le bas de la Composition dans des composants dédiés (AD-41), en réutilisant tokens et primitives existants : en-tête (nom, Étiquette, durée de séance, « + »), séquence à rail (repères, bornes avec pastille de valeur modifiable), ligne structurelle de récupération sous chaque occurrence (trait toujours présent, information seulement si R > 0), action finale « Continuer ». Comportements existants conservés (roulettes des bornes, `LabelPickerModal`, arbre d'ajout, `handleSave`).

## Boundaries & Constraints

**Always:**
- En-tête fixe : bouton fermer (X) — `FixedHeader` avec `closeIcon` — même action et même garde d'abandon que le retour actuel ; titre « Composer une séance ».
- Bande de contexte (`8328:28608`) : nom de séance (champ existant, Inter Semi Bold 20, `colors.textPrimary`, placeholder « Nom de la séance ») ; dessous, sur une ligne de 32 : puce Étiquette (fond blanc 35 %, rayon 13, hauteur 26, icône `label-outline` 18, libellé 13 primaire ; avec Étiquette : pastille de couleur + nom, comme aujourd'hui ; cible tactile 44) puis durée de séance (Inter 14, texte tertiaire) ; à droite, bouton rond « + » 34 (fond blanc, bordure et croix primaires, cible 44, nom accessible « Ajouter un exercice ») qui ouvre l'arbre d'ajout existant. L'ancien bouton texte « + Ajouter un exercice » est retiré.
- Durée de séance de l'en-tête : toutes les occurrences, selon la nature du Circuit (`computeStructuredSessionDuration` avec `circuitNature`), sans compte à rebours ni Fin (RM-159) ; même formatage et mêmes préfixes ≈ / ≥ que le résumé du Circuit ; séance vide : « 0 min ».
- Séquence (`8328:28634`) : rail vertical gris 2 à gauche (x 7) ; repère par étape : anneau 10 pour Compte à rebours, Circuit et Fin ; point 8 pour une occurrence hors Circuit. Bornes (`8328:28636`) : libellé Inter Medium 14 (texte « label »), pastille de valeur modifiable à droite (fond surface, rayon 10, padding 10/4, Inter Semi Bold 13 primaire). Le toucher de la pastille ouvre la roulette existante (CE-T03-08 : « roulette minutes/secondes intégrée ») ; libellés « Compte à rebours initial » et « Fin de séance » conservés (lexique).
- Bornes toujours présentes, immobiles, 0 s admis, défauts 10 s et 5 s (RM-030, RM-031) — vérifiés, inchangés.
- Ligne structurelle sous chaque occurrence (`8328:28657`) : hauteur 21, padding 14/4, trait 1 (couleur divider) sur toute la largeur restante. Si R > 0 : sablier 13 + « Récupération {durée} » (Inter Medium 11, texte tertiaire, `formatCompactDuration`) avant le trait. R absente ou 0 : trait seul, aucune information (D-303, D-217). La ligne fait bloc avec l'occurrence (déplacement et actions glissées existants inchangés).
- Action finale : « Continuer » (CE-T03-08, D-388, Figma `8328:28732`) — même composant, mêmes règles d'activation (nom non vide, au moins un Exercice valide, aucune cible obligatoire manquante : `toCreateSessionInput` existant), même flux `handleSave` (succès → Catalogue / Séances ; échec → rester, brouillon intact, message existant).
- Textes dans `fr.ts` ; couleurs et mesures depuis `tokens.ts`, toute valeur sans jeton en constante locale nommée.
- Icône sablier absente de `KodjoIcon` : l'ajouter depuis Figma (nœud `8328:41087`, export SVG exact), comme les autres sources.

**Never:**
- Action « Ajouter un arrêt » et mode placement (story 4.1) ; cartes d'occurrence et leur contenu (story 2.2) ; en-tête et compteur du Circuit (story 3.1).
- Remplacer les roulettes des bornes par un stepper ; modifier `tokens.ts` ; nouvelle dépendance.
- Faire grossir `CompositionScreen.tsx` : extraire les nouveaux blocs dans des composants de `src/features/sessions/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Séance vide | création | « 0 min » dans l'en-tête ; Continuer désactivé | — |
| Durée ≥ | une cible À l'échec | « ≥ … » dans l'en-tête | — |
| Récupération | R absente, R = 0, R = 20 | trait seul, trait seul, « Récupération 20 s » + trait | — |
| Continuer | nom vide / cible manquante / valide | désactivé / désactivé / enregistre puis Catalogue Séances | échec : reste, message, brouillon intact |
| Fermer | brouillon modifié | confirmation d'abandon existante | — |
| Ajout | « + » | arbre d'ajout existant | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx:614-935` -- en-tête, bande de contexte, `BoundaryActivityRow`, zones, `TourCard`, action finale ; brancher les nouveaux composants, conserver hooks, gestes et roulettes.
- `src/features/sessions/CompositionScreen.tsx:1700-1930` -- `CompositionActivityRow` : sous-carte récupération (L1714, L1885) remplacée par la ligne structurelle ; hauteur de bloc (`blockHeightFor`, `dimensions.compositionActivityRow.recoveryCardHeight`) à revoir pour la géométrie du glisser (`compositionGesture.ts`).
- `src/features/sessions/compositionPresentation.ts:346-362` -- `formatActivityRecoveryLabel` : retourner `null` pour R absente ou 0 ; réutiliser le formatage du résumé du Circuit pour la durée de séance.
- `src/shared/ui/ScreenShell.tsx:81` -- `FixedHeader` `closeIcon`.
- `src/shared/ui/KodjoIcon.tsx` -- sources d'icônes (ajout du sablier).
- `src/shared/i18n/resources/fr.ts` -- `composition.saveAction` → « Continuer » ; libellés nouveaux.
- `src/domain/sessions/calculations.ts` -- `computeStructuredSessionDuration` (story 1.3).
- Tests : `src/features/sessions/__tests__/CompositionScreen.test.tsx`, `compositionPresentation.test.ts`, tests d'intégration du parcours (libellé de l'action finale).

## Tasks & Acceptance

**Execution:**
- [x] `KodjoIcon.tsx` + asset -- sablier depuis Figma.
- [x] Composants `CompositionHeader` (bande de contexte), `CompositionSequenceRail` / ligne de borne, `ActivityRecoveryLine` -- nouveaux fichiers dans `src/features/sessions/`.
- [x] `CompositionScreen.tsx` -- branchement, retrait du bouton texte et de la sous-carte, `closeIcon`.
- [x] `compositionPresentation.ts`, `fr.ts` -- récupération, durée de séance, « Continuer ».
- [x] Tests -- matrice ; attentes existantes modifiées seulement pour E5, « Continuer » et le bouton « + ».

**Acceptance Criteria:**
- Given la Composition, when elle s'affiche, then en-tête, bornes et ligne de récupération reprennent la structure et les mesures Figma citées (vérification visuelle sur iPhone par Hermann, jalon J1).
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.

## Implementation Notes

- Sablier : couche vectorielle MCP Figma de `8328:41087` (`assets/icons/icon-sablier-recuperation.svg`, entrée `recovery.hourglass` du manifeste, `KodjoIcon` `recovery-hourglass`).
- Repères posés en absolu dans chaque étape (aucune enveloppe nouvelle) : la géométrie de dépose (`compositionGesture.ts`) est inchangée ; la ligne de récupération est dans le conteneur gestuel de l’occurrence, avec la même translation que la carte.
- Valeur des bornes : format existant `formatDurationRowValue` (« 00 min 10 s ») conservé ; Figma montre « 10 s » — non changé faute de règle dans la spec (à arbitrer).
- Couleur `color/text-tertiary` (#7A7A80) et styles Inter Regular 13 / Medium 11 en constantes locales nommées (aucun jeton).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Durée d'en-tête selon la nature non testée à l'écran | medium | patch : test Séries. |
| 2 | verification-gap | Ligne de récupération : translation au balayage / glisser non testée | medium | patch : tests. |
| 3 | blind | X annoncé « Retour » | medium | patch : « Fermer ». |
| 4 | blind | Nom accessible de la ligne redondant | low | patch. |
| 5 | blind + edge | Repère d'occurrence au-dessus de la carte balayée et immobile au glisser | medium | patch : ordre de rendu et translation verticale. |
| 6 | edge | Ligne de borne : seule la pastille ouvre la roulette (régression) | medium | patch : ligne entière pressable. |
| 7 | blind | Couleur tertiaire dupliquée | low | patch : constante unique. |
| 8 | blind | Durée d'en-tête avec récupération non testée | low | patch : test. |
| 9 | blind + verification-gap | Commentaires, README et titres de tests périmés (« Enregistrer la séance », sous-carte) | low | patch. |
| 10 | blind | État d'accessibilité constant sur « + » | low | patch. |
| 11 | blind | Puce Étiquette : ouverture de la modale non testée | low | patch : test. |
| 12 | blind | Géométrie de dépose modifiée | low, rejeté | L'ancienne sous-carte (24 pt) était déjà mesurée dans le bloc pour toute occurrence ; la ligne (21 pt + écart) la remplace : écart de quelques points, jugé en recette J1. |
| 13 | edge | Toucher la ligne de récupération n'ouvre plus l'édition | low, rejeté | Le toucher d'une récupération positive ouvre son réglage en story 4.2 (CE-T03-08 §12). |
| 14 | edge | `NaN` dans la récupération | low, rejeté | Valeur validée à l'enregistrement et à la lecture. |
| 15 | blind + edge | Jeton `recoveryCardHeight` orphelin | defer | `tokens.ts` verrouillé ; retrait à planifier. |
| 16 | blind | Format « 00 min 10 s » vs « 10 s » | — | Soumis à Hermann (20/10). |
| 17 | edge | Tests d'anatomie des bornes réécrits au-delà de la liste | false | Mise en page remplacée par la story ; tests réécrits sur les nœuds Figma cités, sans affaiblissement. |
| 18 | blind | Préfixe d'identifiant de test, vérification du style du libellé de borne, confirmation d'abandon au X | low, rejeté | Sans défaut constaté ; garde d'abandon inchangée (`mockExitGuard`). |

## Verification

**Commands:**
- `npx jest src/features/sessions` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.

**Manual checks (if no CLI):**
- iPhone (J1, Hermann) : en-tête, bornes, trait, « Continuer », largeurs 375 et 402.

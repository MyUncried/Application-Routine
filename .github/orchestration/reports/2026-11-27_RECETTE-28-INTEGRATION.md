# Recette iPhone du 27/11/2026 (matin) — intégration des cinq paquets de correction (lot 24)

## Identifiant et objectif

- Message de Hermann (27/11/2026) : « les tests sont réalisés, tu peux corriger les écarts des cas de test et des autres remarques ».
- Source : base `results` du cahier (https://claude.ai/artifact/DYbwwvFJZPq2HHKm2W8dAy), lignes KO du lot 23 (d607-compo-hauteur v3,
  d607-clavier v3, fmt-modale-rapides v4, r26-deathby-progression v2), remarque de lib-changer v3 (OK) et note « constats » a à e.
- d607-compo-notification v3 : non testée, laissée en l'état.

## Branche et commit de départ

- Base de tous les paquets : recette `recette/agenda-axe-20261124` @ `900502584` (lot 23).
- Branche d'intégration : `integration/recette-28` (worktree `C:\Dev\KODJO-R28-INTEG`).

## Périmètre traité (un rapport par paquet, `2026-11-27_RECETTE-28-<PAQUET>.md`)

| Paquet | Branche | Dernier commit | Points | Preuve |
|---|---|---|---|---|
| LIBRE3 | `fix/recette-28-libre3` | `600dc2b75` | « Ajouter ce mouvement » en bas du catalogue de l'Exercice libre ; ✓ grisé sur le catalogue | Jest ; rendu iPhone à vérifier |
| COMPO3 | `fix/recette-28-compo3` | `7e567fce3` | bouton « Créer » parti de (0,0) (`FloatingCreateButton`) ; bord du circuit sous les cartes (élévation de l'enveloppe de carte) ; bord qui repasse par sa position de départ (`EnvelopeHandle.finish`) ; saut de carte et cycle cassé : non corrigés | causes lues dans le code ; iPhone à vérifier |
| FOCUS | `fix/recette-28-focus` | `5f7cc4cb4` | standard de focus unique `src/shared/ui/fieldFocus.tsx` (KeyboardField, TableCell) ; Exercice libre ; Compte à rebours, Fin de séance, tableaux à hauteur constante ; hôte natif du menu « De chaque côté » à taille fixe | DD→GG / Avec : hypothèse |
| DEATHBY3 | `fix/recette-28-deathby3` | `4fe3062d2` | `holdForAlert` : la modale / la page gardent leur place pendant l'alerte d'arrondi, focus rendu après le choix ; page Death by : alerte à la sortie de la case, plus à chaque chiffre | hypothèse ; le clavier tombe par l'alerte native (RN `RCTAlertController`) |
| CLAVIER2 | `fix/recette-28-clavier2` | `f89f7b8b7` | défilement planifié au début de l'animation du clavier, suivi image par image ; écran du format sous la modale non défilé ; marge retirée après fermeture complète | hypothèse (iPhone) |

## Intégration

- Fusions : libre3, compo3, focus, deathby3, clavier2.
- Conflits : registre ch07 (compléments datés des mêmes entrées D-607 / D-608) résolus à chaque fusion par fusion à trois voies des
  insertions ; `useSheetKeyboard.ts` (DEATHBY3 × CLAVIER2, mêmes écouteurs du clavier) combiné : la retenue d'alerte de DEATHBY3
  s'applique aussi au défilement synchronisé de CLAVIER2 (aucune redescente ni nouveau défilement pendant l'alerte).

## Preuves et tests

- `npx tsc --noEmit` : OK.
- Jest ciblé (`-w 1`) : ExecutionParametersSheet*, useSheetKeyboard*, FormatModelScreen*, FreeExerciseScreen*, CompositionScreen*,
  EnvelopeHandle*, EnvelopePerimeter, FloatingCreateButton, fieldFocus*, KeyboardField, CompositionMovementFlow, ExerciseRecovery,
  CarrierDurationSheet*, FormatTables : 60 suites, 1 328 réussis, 33 ignorés, 2 échecs. 1) préexistant : `CompositionScreen.test.tsx` ›
  « … Démarrer (brouillon inchangé) … » (déjà relevé au lot 23) ; 2) né de l’intégration : `ExecutionParametersSheet.deathby3.recette2711`
  › « clavier non revenu après le choix » — la marge de CLAVIER2 (`insetFrame`, retirée au `keyboardDidHide`) n’était pas retirée à la fin
  d’une retenue d’alerte DEATHBY3 ; corrigé (`endAlertHold` retire aussi `insetFrame` et réarme `shownRef`) ; relance des suites du
  clavier (deathby3, useSheetKeyboard*, keyboard0611, recette2611soir) : 7 suites, 67/67.
- `pre4Story11Controls` (empreinte de `tokens.ts`) : échec préexistant, `tokens.ts` non modifié (FOCUS a créé `fieldFocus.tsx`).
- Aucune de ces suites ne prouve le rendu, les gestes ni le clavier sur iPhone.

## Hypothèses non démontrées / À CLARIFIER (consolidé)

1. COMPO3 : saut d'une carte relâchée et cycle au format cassé non corrigés (cause non démontrée ; vidéo au ralenti demandée) ; pourquoi
   le bouton « Créer » restait inactif après la modale : non expliqué.
2. DEATHBY3 : garder le clavier visible pendant l'alerte exige du natif (nouveau build) ; `askPhaseRounding` (arrondi de la durée de
   série) a probablement le même défaut, non cité, non traité.
3. FOCUS : le standard doit-il s'appliquer aux champs de texte (recherche, nom de séance, renommage de circuit, libellé de phase) et à
   la fiche Mouvement ? Chevauchement possible d'un champ agrandi dans une colonne étroite.
4. CLAVIER2 : léger décalage possible entre le bas de la modale et la barre native (courbe estimée par Reanimated) ; `FormatModelScreen`
   et `CarrierDurationSheet` gardent la barre JS pour leurs champs.
5. LIBRE3 : sans sélection, le bouton est inactif (catalogue des formats : « Fermer sans sélectionner ») ; ✓ conservé grisé sans rôle.

## Éléments non corrigés

- Saut de carte, cycle cassé (voir 1) ; clavier pendant l'alerte (voir 2) ; d607-compo-notification (non retestée).

## Vérifications restant à faire sur iPhone

- Toutes : lignes du cahier (versions suivantes des lignes KO, section « Recette 27/11 matin »).

## Fichiers modifiés

Voir les rapports de chaque paquet ; intégration : `src/features/activities/useSheetKeyboard.ts` (résolution et correctif `endAlertHold`), registre ch07.

## Commit final et état Git

Renseignés dans le message de livraison ; aucune fusion dans main (accord de Hermann requis).

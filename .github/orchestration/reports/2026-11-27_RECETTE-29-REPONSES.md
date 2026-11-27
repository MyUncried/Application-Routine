# Réponses de Hermann aux questions du lot 24 (27/11/2026) — lot 25

## Identifiant et objectif

- Message de Hermann (27/11/2026), réponses aux questions de la livraison du lot 24 :
  « 1. Recherche, nom de séance, renommage de circuit, et fiche de mouvement : non / libellé de phase oui
  2. Oui, non, il est grisé donc c'est ok
  3. oui
  4. que dois-je faire ? »
- Objectif : appliquer les réponses 1 à 3 ; la question 4 (questions ouvertes du lot 23) reçoit une explication dans le message de
  livraison, sans code.

## Branche et commit de départ

- Base : recette `recette/agenda-axe-20261124` @ `1924e2014` (lot 24).
- Branche : `fix/recette-29-reponses` (worktree `C:\Dev\KODJO-R29`).

## Périmètre demandé / traité

| # | Question (lot 24) | Réponse | Traitement |
|---|---|---|---|
| 1 | Standard du focus sur les champs de texte et la fiche Mouvement ? | non, sauf « libellé de phase oui » | Libellé de phase modifiable (`KeyboardField` mode `text`) : agrandissement, liseré bleu fin, fond bleu pâle du standard unique (`fieldFocus.tsx`). Recherche, nom de séance, renommage de circuit, fiche Mouvement : inchangés. |
| 2 | Exercice libre : « Fermer sans sélectionner » sans choix ? Retirer le ✓ grisé ? | « Oui, non, il est grisé donc c'est ok » | Sans mouvement choisi, le bouton du bas est actif, s'intitule « Fermer sans sélectionner » et ferme comme la croix ; ✓ grisé conservé. |
| 3 | Arrondi de la durée de série : même défaut que le Death by, le corriger ? | oui | `askPhaseRounding` reprend la retenue de `askIncrementRounding` (`keyboard.holdForAlert`, `keyboardHoldHeight`) : feuille et cadre du clavier gardés pendant l'alerte, focus rendu au champ voulu après le choix. |
| 4 | Questions du lot 23 | « que dois-je faire ? » | Explication dans le message de livraison (aucun code). |

## Constats et causes

- 1 : `NativeEntryField` (libellé de phase) ne posait que le fond bleu pâle ; le standard (agrandissement + liseré) n'était appliqué qu'aux
  cellules (`CellEntryField`). Un `TextInput` ne peut pas porter d'enfant : le liseré est posé sur le cadre du champ (bordure de 1, champ
  de largeur 100 % et de hauteur fixe `TABLE_CELL_HEIGHT` : aucune mise en page déplacée) ; l'agrandissement passe par
  `Animated.createAnimatedComponent(TextInput)`.
- 3 : `askPhaseRounding` ouvrait l'alerte native sans retenue : iOS retire le clavier (fenêtre clé prise par l'alerte) et la feuille
  redescend — même cause que DEATHBY3 (hypothèse héritée, non démontrée sur iPhone).

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : primitives natives (`TextInput`, `Alert.alert`, `InputAccessoryView`) ; `tokens.ts` ; champs de recherche, nom de séance,
  renommage de circuit, fiche Mouvement ; libellé de phase verrouillé (`editable={false}`) ; choix proposés par l'alerte d'arrondi ;
  sélection d'un mouvement, ✓ grisé du catalogue, « Ajouter ce mouvement » avec un choix.
- CHANGE : `KeyboardField.tsx` (`NativeEntryField`) ; `ExecutionParametersSheet.tsx` (`askPhaseRounding`) ; `FreeExerciseScreen.tsx`
  (bouton du bas sans choix).
- FORBIDDEN : nouveau composant de focus, imitation d'alerte, modification native.
- Démonstration : le diff ne touche que ces trois fonctions, leurs tests et la documentation ci-dessous.

## Modifications réalisées

- `src/features/activities/KeyboardField.tsx` : `AnimatedTextInput`, standard du focus dans `NativeEntryField`, style `textFocusFrame`.
- `src/features/activities/ExecutionParametersSheet.tsx` : retenue d'alerte dans `askPhaseRounding`.
- `src/features/sessions/FreeExerciseScreen.tsx` : « Fermer sans sélectionner » sans choix (`tFormat.closeWithoutSelecting`, `onClose`).
- Tests : `FreeExerciseScreen.d608.test.tsx` (règle mise à jour) ; nouveau `ExecutionParametersSheet.recette29.test.tsx`.

## Classe documentaire et documents touchés

- Classe B (réponses explicites de Hermann).
- Registre ch. 07 : compléments datés dans D-607 (focus du libellé de phase ; arrondi de la durée de série) et D-608 (Exercice libre).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.10 : complément daté (« Fermer sans sélectionner »).

## Preuves et tests

- `npx tsc --noEmit` : OK. `npx eslint` (fichiers modifiés) : OK.
- Jest ciblé (`-w 1`) : FreeExerciseScreen.d608, ExecutionParametersSheet.recette29 (nouveau), ExecutionParametersSheet.phases,
  ExecutionParametersSheet.keyboard0611, ExecutionParametersSheet.deathby3.recette2711, KeyboardField, ExecutionParametersSheet.test,
  useSheetKeyboard*, ExecutionParametersSheet.recette2611soir, CompositionMovementFlow, ExerciseRecovery : tous réussis.
- Jest ne prouve ni le rendu, ni le clavier iOS, ni l'alerte native.

## Hypothèses non démontrées / À CLARIFIER

- 3 : le clavier tombe toujours pendant l'alerte (alerte native) ; seule la tenue de l'écran est corrigée — à vérifier sur iPhone.
- 1 : le libellé agrandi (× 1,15) dans une colonne étroite peut chevaucher la cellule voisine — à vérifier sur iPhone.

## Éléments non corrigés / hors périmètre

- Questions du lot 23 (son des phases, retour après notification, ± au Death by) : en attente de décision de Hermann.

## Vérifications restant à faire sur iPhone

1. Modale Paramètres d'exécution d'un mouvement à phases modifiables : toucher un libellé de phase → il grossit, liseré bleu, fond bleu
   pâle ; la ligne ne change pas de hauteur.
2. Mouvement à phases (motif 15 s) : saisir une durée de série de 20 s puis Suivant → message d'arrondi ; la modale ne descend pas ;
   après le choix, la valeur est arrondie et le clavier revient.
3. Exercice libre, catalogue sans choix : le bouton du bas affiche « Fermer sans sélectionner » et ferme l'écran ; après un choix, il
   affiche « Ajouter ce mouvement » ; le ✓ reste grisé.

## Fichiers modifiés

Voir « Modifications réalisées » et « Classe documentaire ».

## Commit final et état Git

Renseignés dans le message de livraison ; aucune fusion dans main (accord de Hermann requis).

# Mission EN-TETE-CERCLE-UNIQUE — un seul cercle Retour / Annuler pour tous les écrans

## Identification

- **Objectif** : demande de Hermann du 24/11/2026.
  - Citation : « je ne comprends pas pourquoi seul le bouton Annuler de la fiche de mouvement est au nouveau format, et que tous les autres ne le sont pas (ils sont toujours bleus), c'est pourtant un composant unique non ? On doit assurer l'homogénéité de présentation des écrans ».
  - Choix retenu : cercle blanc partout (« fais le »).
- **Branche** : `fix/en-tete-cercle-blanc-20261124`, worktree `C:\Dev\KODJO-HEADER`.
- **Commit de départ** : `6ce2d832` (`origin/main`).

## Constat (diagnostic)

- Le cercle Retour / Annuler en haut à gauche est dessiné par un seul composant, `FixedHeader` (`src/shared/ui/ScreenShell.tsx`). Son fond par défaut était bleu pâle (`colors.selectionSurface`, #E5F0FF).
- Le 19/10/2026 (PRE-5 story 3.2, arbitrage G-1), deux surcharges locales ont été ajoutées au composant pour l'Éditeur d'Exercice : `backCircleStyle` et `backIconTintColor`. Elles donnent un cercle blanc #FCFCFE, avec un liseré blanc, une ombre et une ✕ #14141A.
- Trois écrans seulement passaient ces surcharges : l'éditeur d'exercice (`ExerciseScreen`), la recherche de mouvement (création de fiche, `MovementSearchScreen`) et les niveaux du mouvement (`MovementLevelsScreen`). Les autres, une vingtaine, gardaient le bleu pâle.
- Figma dessine le cercle blanc sur tous les écrans, par exemple la composition `10705:20223`.

## Périmètre

- **Demandé et traité** :
  - le cercle blanc devient le seul rendu de `FixedHeader`, en-têtes de feuilles natives (`NativeSheetTop`) compris ;
  - les surcharges de couleur sont supprimées, si bien qu'aucun écran ne peut plus avoir sa propre couleur.
- **Hors périmètre** :
  - la croix des en-têtes de modale « Fermer et valider » (`ModalHeader` : paramètres d'exécution, Formats, saisies d'exécution) est un composant distinct, avec un cercle gris #F5F7FA de 38 dessiné par Figma « DSF / Actions / Fermer et valider ». Elle n'a pas été citée et reste inchangée ;
  - les boutons d'action des fenêtres de confirmation.

## Modifications

| Fichier | Changement |
|---|---|
| `src/shared/ui/ScreenShell.tsx` | `styles.backCircle` : fond #FCFCFE, liseré blanc 1, ombre #1A1A26 à 8 % (décalage 2, flou 10) ; icône #14141A ; props `backCircleStyle` et `backIconTintColor` supprimées |
| `src/features/activities/ActivityEditorForm.tsx` | `EDITOR_HEADER.backCircle` et `closeIconTint` retirés (devenus le rendu commun) |
| `src/features/sessions/ExerciseScreen.tsx`, `src/features/activities/MovementSearchScreen.tsx`, `src/features/activities/MovementLevelsScreen.tsx` | Surcharges retirées |
| `src/shared/ui/__tests__/ScreenShell.test.tsx`, `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | Les tests vérifient désormais le même cercle blanc et la même ✕ sur un écran ordinaire et sur l'éditeur |
| Registre ch. 07 | Nouvelle décision **D-593** |
| ch. 12 | Note sur `color.selectionSurface` |

## Synchronisation code / documentation

- **Classe B**, évolution demandée explicitement par Hermann.
- **Documents mis à jour** : registre ch. 07 (D-593) et ch. 12 (jetons).
- Le numéro D-593 est le premier libre sur `main` et sur les branches actives au 24/11/2026. La renumérotation proposée pour D-532 (calendrier), non encore tranchée, prendra un autre numéro.

## Tests

- **Suites qui touchent l'en-tête** (12 suites, toutes celles qui citent `screen-header-back`) : 702 tests réussis, 32 ignorés (déjà ignorés sur `main`), **0 échec**.
- **Types** : `npx tsc --noEmit` est propre.
- **Lint** : ESLint ne signale rien sur les fichiers modifiés.
- **Suite complète** : non relancée, car la mémoire du PC est saturée (la précédente a été arrêtée par l'outil). Elle est à relancer à la demande de Hermann.

## Hypothèses non démontrées

Le rendu de l'ombre et du liseré blanc sur chaque fond d'en-tête (blanc, couleurs des Catalogues, lilas de la composition) n'est vérifiable que sur iPhone.

## Vérifications sur iPhone

Le cercle Retour / Annuler doit être blanc, avec un liseré et une ombre légère, et une ✕ ou un chevron noir sur :
- la composition ;
- la planification et la sélection des séances ;
- les feuilles de programme ;
- la fiche Mouvement ;
- l'éditeur d'exercice ;
- les écrans du Profil et des Bibliothèques ;
- les filtres.

Aucun cercle bleu pâle ne doit rester.

## Livraison

- Mise à jour OTA ou Metro, sans module natif.
- PR vers `main`, sans fusion.

## Commit final et état Git

Commit qui contient ce rapport, sur `fix/en-tete-cercle-blanc-20261124`, envoyé sur GitHub. Arbre propre et verrou libéré.

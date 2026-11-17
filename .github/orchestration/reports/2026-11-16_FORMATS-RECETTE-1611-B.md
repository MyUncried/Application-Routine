# 2026-11-16 — FORMATS-RECETTE-1611-B

## Identifiant et objectif

- **FORMATS-RECETTE-1611-B** : corriger les écarts de la seconde recette iPhone du 16/11/2026, section « fmt-recette-1611 » du cahier en ligne.
  - Quatre lignes KO : r16-appui-long, r16-charge-orange, r16-deathby-depart, r16-echec-lignes.
  - Constats b à h.
- Constat a écarté par Hermann pour cette livraison : « ne considère pas encore le a) ». Il porte sur la réouverture par glisser gauche d'un Format en exercice unique ; la partie correspondante de r16-deathby-depart est donc écartée aussi.

## Branche et commit de départ

- Dépôt : `C:\Dev\PRE10-SON`, branche `pre11-formats` (locale, non poussée).
- Commit de départ : `86521472`, rapport FORMATS-RECETTE-1611.
- Le code des missions For time, Formats à tableau et recette du 16/11 n'est toujours pas commité, conformément à la consigne « Ne commite pas sans validation ».

## Préalable : Routine BMAD ne s'ouvrait plus (hors code)

- **Symptôme.** Le Metro de `C:\Dev\PRE10-SON` (port 8081, tunnel, lancé le 15/11 à 19 h 28) répondait par une erreur 500 : `expo-updates … runtimeversion:resolve … exited with non-zero code: 3221225794` (0xC0000142, processus enfant qui n'a pas pu démarrer).
- **Redémarrage.** Hermann a relancé ce Metro (`--tunnel --clear`). Ensuite, la demande d'application par le tunnel est restée sans suite sur l'iPhone, alors que le même téléchargement réussissait depuis le PC.
- **Contournement.**
  - Second Metro sur le réseau local : `npx expo start --dev-client --lan --port 8085`.
  - Les ports 8082 (Catalogue) et 8083 (Planification, autre session) sont occupés : je n'y ai pas touché.
  - Hermann a fait la recette sur `http://192.168.0.16:8085`.

## Périmètre demandé (texte de Hermann)

- **r16-appui-long** : « Il faut désactiver le glisser gauche pendant le déplacement. La ligne se déplace, mais visuellement elle est séparée en deux verticalement (entre le nom et le tableau). »
- **r16-charge-orange** : « +kg sans rien saisir : la charge devient orange puis immédiatement après bleue. »
- **r16-deathby-depart** : « Un ou X mouvements : il ne doit pas y avoir de valeur par défaut dans les cellules Départ et Incrément, uniquement un trait horizontal et un fond rouge. »
- **r16-echec-lignes** : KO, sans note.
- **Constat d** : « Format A l'échec : écrire A l'échec sur deux lignes dans la colonne "Objectif". »
- **Constat b** : « Vérifier le symbole et l'état d'activation des boutons Annuler et Valider pour tous les formats. Les symboles ont parfois disparus ou les boutons ne sont pas actifs (superset). »
- **Constat c** :
  - « déroulé : hauteur relative : le principe de présentation doit être appliqué de la même manière aux autres formats tabata, AMRAP, 30/30, For Time, Death by. »
  - « Appliquer le même principe de largeur relative pour la récupération s'il y en a une. »
  - « Buy In / Buy Out : comment est calculé la largeur du cadre (par exemple pour l'AMRAP ?) »
- **Constats e et f** : glisser gauche d'une carte ou d'un Circuit dans la Composition, d'une carte dans les catalogues des Mouvements et des Séances : « la liste ne doit pas défiler et rester stable ».
- **Constat g** : Superset : « lorsque j'ai appuyé sur "J'ai compris" il faut laisser le catalogue ouvert, ne pas le refermer ».
- **Constat h** : « AMRAP, avec nombre d'AMRAP > 1 : écrire à côté de Déroulé "(N fois)". »

## Périmètre réellement traité

- Tout le périmètre demandé, sauf le constat a, reporté par Hermann.
- Le constat b est traité sans cause démontrée : voir ci-dessous.

## Historique comparé

| Point | Comportement | Introduit par | Nature |
|---|---|---|---|
| Death by | Valeurs par défaut 1 et + 1 | `initialAnswers` et `initialMovementValues` d'avant le 16/11 | Évolution demandée, pas une régression |
| Charge | Bleue pendant la saisie | Convention du champ de valeur (MAJ 04/11 §4.5) | Exception demandée pour les cases à vérifier vides |
| Appui long | Coupure entre le nom et le tableau ; glisser gauche actif pendant le déplacement | Livraison du 16/11 matin (`useRowDrag`, non commitée) | Défaut de cette livraison |
| En-tête | Flèche au lieu de la croix | Suppression du questionnaire le 15/11 : `stage` toujours à « summary » | Défaut de cette livraison |

## Contrôle des acquis

### PRESERVE

- Popover d'unité natif.
- Geste d'appui long natif (react-native-gesture-handler).
- Mécanisme de glissement des cartes (responder system) ; seule la prise du verrou de défilement est ajoutée.
- Déplacement des cartes par appui long dans la Composition.
- Défilement automatique.
- Glisser d'un trait de périmètre.
- Comportement de « J'ai compris » hors mode catalogue (champ de recherche).
- AMRAP et For time, à part le Déroulé et le titre.

### CHANGE

| Fichier | Changement |
|---|---|
| `formatModels.ts` | Valeurs initiales du Death by |
| `FormatModelScreen.tsx` | Passage de un à deux mouvements du Death by ; croix ; « J'ai compris » ; titre du Déroulé ; libellé « À l'échec » |
| `FormatTables.tsx` | Case à vérifier vide pendant la saisie |
| `ForTimeBlocks.tsx` | Ligne portée ; glissement coupé pendant le déplacement |
| `formatTimeline.ts` | Hauteurs et largeurs du Déroulé |
| `swipeScrollLock.ts` (nouveau) | Verrou de défilement |
| `SwipeActionsRow.tsx` | Prise du verrou |
| `SheetMotion.tsx` | Fourniture du verrou par la liste des catalogues |
| `CompositionScreen.tsx` | Verrou de la liste ; prise par la carte de Composition |
| `fr.ts` | Deux libellés |

### FORBIDDEN, respecté

- Aucune primitive remplacée.
- Aucune fusion de `main`.
- Aucun commit de code.

## Constats et modifications

1. **Appui long.**
   - Pendant le déplacement, la ligne glissable reçoit `enabled={false}` : aucun « Supprimer ».
   - La ligne portée a un fond uniforme (`#ECEEF4`) sur le nom, les valeurs, la marge droite et, pour les colonnes à dimensions, le retrait de 16. Elle n'a plus d'ombre par partie.
2. **Charge orange.**
   - Une case à vérifier (`pending`) garde son fond orange quand elle a le focus ; l'appui sur « +kg » donnait le focus à la case et la colorait aussitôt en bleu.
   - Dès un chiffre, la case n'est plus à vérifier et reprend le surlignage de saisie.
3. **Death by.**
   - Plus de `startRepetitions: 1` ni `increment: 1` dans les valeurs initiales ; un mouvement ajouté a `start` et `startIncrement` à `null`.
   - La validation existante rend ces cases rouges et la coche grise.
   - Au passage de un à deux mouvements, les réglages communs déjà saisis passent au premier mouvement.
4. **À l'échec.** Le texte « À\nl’échec » est affiché sur deux lignes explicites ; « à l'échec » tenait sur une seule ligne dans la largeur de 100.
5. **Constat b.**
   - Cause signalée non démontrée.
   - Écart trouvé : depuis la suppression du questionnaire, l'écran est toujours à l'étape « récapitulatif ». Le bouton de gauche montrait donc la flèche Retour, sauf en mode catalogue. Il montre maintenant la croix « Fermer » pour tous les Formats.
   - La coche est inchangée : grise tant qu'une valeur requise manque.
6. **Constat c.**
   - Hauteurs proportionnelles à l'objectif pour tous les Formats :
     - Tabata et 30/30 : objectif de chaque mouvement ;
     - AMRAP : buy-in et tours, et « n » d'un volume constant ;
     - For time : buy-in et buy-out compris ;
     - Death by : Départ et Incrément propres à chaque mouvement, « n » au plus haut.
   - Répétitions et Durées sont rapportées chacune à leur plus grande valeur du Déroulé.
   - Récupération : largeur égale à sa durée divisée par la durée d'un bloc quand le travail est minuté :
     - Tabata : Travail ;
     - EMOM et Death by « À la suite » : Intervalle.
   - Sinon, la récupération a la largeur d'un bloc.
   - Réponse sur le buy-in et le buy-out : largeur fixe de 2,5 blocs, sans calcul.
7. **Constats e et f.**
   - Nouveau contexte `SwipeScrollLockContext`.
   - La liste le fournit :
     - Composition : `setNativeProps` et état de l'écran, même procédé que le glisser d'un trait ;
     - catalogues : `SheetMotionScrollView`.
   - Une carte le prend au premier mouvement horizontal engagé et le rend à la fin, à l'annulation, à l'appui sur une action et au démontage. Cela concerne `SwipeActionsRow` (catalogues, Circuits, lignes des Formats) et la carte de Composition.
8. **Constat g.** En mode catalogue, « J'ai compris » ne ferme plus que le message : le catalogue, la recherche et la sélection restent en place.
9. **Constat h.** Le titre devient « Déroulé (N fois) » quand le Nombre d'AMRAP dépasse 1.

## Synchronisation documentaire

- **Classe B** pour tous les points.
- **Correctif préparé, non appliqué** : `_bmad-output/pre11/integration-documentaire-main-2026-11-16b.patch`.
  - Il couvre le chapitre 07 (deux entrées) et le chapitre 13 (CE-FMT-02 §8), avec annotations « Remplacé le 16/11/2026 ».
  - Il reprend aussi le correctif du matin, qui ne s'applique plus : `origin/main` est passé à `6663a2ce` avec la grille du catalogue. Il le remplace.
  - `git apply --cached --check` est conforme sur un index temporaire construit sur `6663a2ce`.
- **Spec du lot `_bmad-output/pre11/spec-pre11-formats.md`** :
  - point 23 du §5, avec le texte de Hermann recopié ;
  - §7, points (n) à (t), dont les interprétations.

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint` sur les fichiers touchés : aucun signalement nouveau.
  - Les 10 erreurs `react-hooks/refs` et les 2 avertissements de `CompositionScreen.tsx` sont identiques dans `HEAD`, contrôlé par lint du fichier commité.
  - L'avertissement `openGeneric` existait déjà.
- `npx jest`, suite complète : 366 suites, 5 861 tests réussis, 32 ignorés (déjà ignorés), 0 échec.
- Tests ajoutés ou mis à jour :
  - `FormatModelScreen.tableauUnique.test.tsx` : case orange en saisie ; Death by sans valeur ; « À\nl’échec » ; croix ; Superset « J'ai compris » ; « Déroulé (3 fois) ».
  - `FormatModelScreen.c3.test.tsx` : croix.
  - `formatTimeline.recette1611.test.ts` : Tabata, For time, AMRAP, Death by, récupération.
  - `formatModels.c3.test.ts` et `formatModels.reprise0411.test.ts` : valeurs initiales du Death by.
  - `SwipeActionsRow.scrollLock.test.tsx` (nouveau) : verrou pris et rendu, geste vertical sans verrou.
- Paquet servi par le Metro 8085 : contrôlé par `curl` et `grep` ; il contient les nouveaux symboles.

## Hypothèses non démontrées

- Le blocage du défilement natif par `scrollEnabled={false}` au milieu d'un geste n'est pas vérifiable sous Jest. Il repose sur le comportement d'UIScrollView, qui annule le geste en cours.
- La cause du symbole manquant du constat b n'est pas démontrée. Si l'écart persiste, il faut l'écran exact.
- L'appui long n'a pas d'assertion intermédiaire en test (fond pendant le geste, glissement coupé) : à vérifier sur l'iPhone.

## Non corrigé ou hors périmètre

- Constat a, reporté par Hermann.
- Plusieurs AMRAP : Déroulé « Bloc 1 … Bloc n », décision `69d5c267`, toujours non réalisé.

## Vérifications restant à faire sur l'iPhone

Cahier en ligne, section « fmt-recette-1611b » (11 lignes `r16b-*`), version 119 : https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq

## Fichiers modifiés (mission)

- `src/domain/sessions/formatModels.ts`
- `src/domain/sessions/formatTimeline.ts`
- `src/features/sessions/FormatModelScreen.tsx`
- `src/features/sessions/FormatTables.tsx`
- `src/features/sessions/ForTimeBlocks.tsx` (non suivi)
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/activities/SwipeActionsRow.tsx`
- `src/features/activities/SheetMotion.tsx`
- `src/shared/ui/swipeScrollLock.ts` (nouveau)
- `src/shared/i18n/resources/fr.ts`
- Tests :
  - `src/features/sessions/__tests__/FormatModelScreen.tableauUnique.test.tsx`
  - `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`
  - `src/domain/sessions/__tests__/formatTimeline.recette1611.test.ts`
  - `src/domain/sessions/__tests__/formatModels.c3.test.ts`
  - `src/domain/sessions/__tests__/formatModels.reprise0411.test.ts`
  - `src/features/activities/__tests__/SwipeActionsRow.scrollLock.test.tsx` (nouveau)
- `_bmad-output/pre11/spec-pre11-formats.md`
- `_bmad-output/pre11/integration-documentaire-main-2026-11-16b.patch` (nouveau)
- Ce rapport.

## Commit final et état Git

- Commit de ce rapport : voir le message de clôture ; il ne contient que ce rapport.
- Code : non commité, en attente de validation par Hermann.
- Branche `pre11-formats`, locale, non poussée.

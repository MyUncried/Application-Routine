# Recette iPhone du 26/11/2026 (soir) — intégration des six paquets de correction (lot 23)

## Identifiant et objectif

- Message de Hermann (26/11/2026, soir) : « La recette Programmes est faite, des écarts constatés, des changement à apporter dans
  autre remarques. A noter que le blocage de déplacement des exercices et de recadrage des circuits et des cycles n'a pas du tout
  changé. Je m'interroge sur les tests automatiques qui auraient démontré que cela aurait été résolu. »
- Source : base `results` du cahier (https://claude.ai/artifact/DYbwwvFJZPq2HHKm2W8dAy), 14 lignes KO du 26/11 soir et note
  « constats » a à d.

## Branche et commit de départ

- Base de tous les paquets : recette `recette/agenda-axe-20261124` @ `202570906` (lot 22).
- Branche d'intégration : `integration/recette-27-11` (worktree `C:\Dev\KODJO-R27-INTEG`).

## Réponse à la question sur les tests (constat)

- Aucun test automatique n'a démontré que le blocage du déplacement était résolu. Le paquet COMPO du 26/11 avait rejoué le scénario
  (séance rouverte, déplacement) en Jest : la dépose était correcte, ce qui écartait la logique JS ; la cause native retenue (défilement
  qui prend le geste) était qualifiée « plausible, non démontrée » dans son rapport, mais présentée au cahier comme une correction à
  vérifier, sans dire clairement qu'il s'agissait d'une hypothèse.
- Jest n'exécute ni les feuilles natives iOS ni l'arbitrage des gestes UIKit : il ne pouvait pas voir le défaut.
- Cause probable trouvée le 27/11 (non démontrée sur iPhone) : depuis D-602 (25/11), une séance ouverte depuis sa carte du catalogue
  est présentée en feuille native (`formSheet`) ; le geste de glisser de la feuille (UISheetPresentationController, react-native-screens
  4.26, `gestureEnabled:false` = `modalInPresentation`, pan toujours actif) prend le toucher et annule le glisser. Une séance neuve
  (écran poussé) n'est pas touchée ; cohérent avec le constat « dès qu'on ouvre une séance sauvegardée ».
- Arbitrage de Hermann (27/11) : « Modale plein écran » (paquet FEUILLE).
- Règle appliquée aux paquets du 27/11 : chaque compte rendu dit d'abord si la cause est démontrée ou supposée.

## Périmètre traité (un rapport par paquet, `2026-11-27_RECETTE-27-11-<PAQUET>.md`)

| Paquet | Branche | Dernier commit | Points | Preuve |
|---|---|---|---|---|
| FEUILLE | `fix/recette-27-11-feuille` | `e886445db` | Composition ouverte depuis le catalogue en modale plein écran (d607-compo-hauteur) ; d607-compo-notification analysé, non corrigé | hypothèse (iPhone) |
| CLAVIER | `fix/recette-27-11-clavier` | `cbc31720f` | barre du clavier native (`InputAccessoryView`) : modales, Exercice libre, phases, cadence « Autre » ; « ralentir le clavier » impossible (iOS) | hypothèse (iPhone) |
| MODALE2 | `fix/recette-27-11-modale2` | `3f37761f0` | champ ×1,15 + liseré bleu ; « Avec » ouvre le menu natif sans valeur ; DD…→GG… élargi ; durée de l'exercice 13 ; phases : libellés noirs, croix inactive | « Avec » : hypothèse |
| FORMATS2 | `fix/recette-27-11-formats2` | `1d7084965` | « ± / tour » ; bouton ± (AMRAP) ; arrondi au multiple des phases ; AMRAP « à l'échec » grisé ; cadre du Circuit à la couleur du format | rendu : hypothèse |
| LIBRE2 | `fix/recette-27-11-libre2` | `c927be2ce` | recherche « Tes » et chevauchement du mouvement choisi : même cause (cadre de la première ScrollView imposé par la feuille native) | test d'ordre natif rouge avant / vert après ; iPhone à vérifier |
| AGENDA | `fix/recette-27-11-agenda` | `cad4f4507` | glissé gauche de la ligne Ⓟ d'un parcours : Dupliquer, Supprimer (arbitrage de Hermann, option B) | geste : iPhone à vérifier |

## Intégration

- Fusions feuille, libre2, formats2, modale2, clavier, agenda.
- Conflits : registre ch07 et `KODJO-Formats-entrainement-2026-11-02.md` (compléments datés des mêmes entrées) résolus par fusion à
  trois voies des insertions ; même nom de test créé par MODALE2 et FORMATS2 (`ExecutionParametersSheet.recette2611soir.test.tsx`) :
  les deux gardés (celui de MODALE2 renommé `ExecutionParametersSheet.modale2.recette2611soir.test.tsx`) ; une assertion de
  `ExecutionParametersSheet.test.tsx` (nœuds au focus) combinée : nœuds de la feuille hors barre native + 1 (liseré).
- `76f22c04b` : `FormatModelScreen.d603.test.tsx` comparait le texte exact d'un champ ; la barre native y est rendue sous Jest : la
  valeur seule est comparée (aucun changement de comportement).

## Preuves et tests

- `npx tsc --noEmit` : OK.
- Jest ciblé (`-w 1`) sur la branche intégrée : `src/features/activities`, `FreeExerciseScreen*`, `compositionRoutePresentation*`,
  `FormatModelScreen*`, `src/shared/ui`, `rootLayoutGesture`, `compositionCreateEntry`, `CompositionScreen*`, `recette3*`,
  `StickyHeader`, `src/features/planning` : tout vert sauf 2 échecs préexistants (relevés sur 202570906) :
  `CompositionScreen.test.tsx` › « … Démarrer (brouillon inchangé) … » et `pre4Story11Controls` › empreinte de `tokens.ts`.
- Passe complète : non relancée pour ce lot (mémoire de la machine) ; dernière passe complète sur 202570906.
- Aucune de ces suites ne prouve le rendu ni les gestes sur iPhone.

## Hypothèses non démontrées / À CLARIFIER (consolidé)

1. FEUILLE : disparition du rebond attendue, à vérifier. Notification : la Composition apparaît forcément un instant avant la modale
   des paramètres (une `Modal` RN ne peut pas être présentée pendant une transition) — options : a. raccourcir ce passage ; b. ne pas
   rouvrir la modale après un rappel ; c. passer la modale en route native (changement de primitive). Corps vide / ajout invisible :
   peut disparaître avec le plein écran, à vérifier.
2. CLAVIER : ralentir l'animation du clavier est impossible (iOS) ; `FormatModelScreen` et `CarrierDurationSheet` gardent l'ancienne
   barre (même retard probable) — les passer à la barre native ? Sur la page et les modales, les libellés de phase sont fixés par la
   fiche du mouvement : Précédent / Suivant n'y parcourent que les durées.
3. MODALE2 : l'icône de son des phases retirée de la modale (croix rétablie) ⇒ plus de moyen d'y couper le son d'une phase (D-608) ;
   liseré bleu aussi sur un champ rouge à renseigner ; largeur 116 choisie sans Figma ; débordement possible d'un champ agrandi dans une
   option du segmenté.
4. FORMATS2 : pas de bouton ± au Death by (incrément toujours positif) ; ligne « Incrément par intervalle » de la modale non renommée ;
   « Annuler » garde la saisie ; couleur de fond du format (pas la couleur de bande).
5. LIBRE2 : la page Exercice libre a la même structure (ScrollView en premier enfant natif) : non modifiée, aucun KO signalé.
6. AGENDA : hauteur des actions de la ligne Ⓟ (≈ 36 pt) ; « Supprimer » masqué quand toutes les Séances sont déjà supprimées.

## Éléments non corrigés

- d607-compo-notification (voir 1) ; ralentissement du clavier (voir 2).

## Vérifications restant à faire sur iPhone

- Toutes : lignes du cahier (versions suivantes des lignes KO, section « Recette 26/11 soir »).

## Fichiers modifiés

Voir les rapports de chaque paquet ; intégration : `FormatModelScreen.d603.test.tsx`, `ExecutionParametersSheet.test.tsx`,
`ExecutionParametersSheet.modale2.recette2611soir.test.tsx` (renommage), docs fusionnées.

## Commit final et état Git

Renseignés dans le message de livraison ; aucune fusion dans main (accord de Hermann requis).

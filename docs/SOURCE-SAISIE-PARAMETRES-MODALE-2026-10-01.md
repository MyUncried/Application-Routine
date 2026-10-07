# Synthèse — Saisie des paramètres d'exécution par modale

> Source historique du 01/10. Les valeurs de voile décrites ci-dessous sont supersédées : appliquer exclusivement `overlayScrim` (#1F2129 à 34 %) pour toutes les modales, y compris CE-UI-10. Voir la [clôture du voile](MATRICE-VOILE-MODAL-2026-10-07.md).

Document de transmission pour la mise à jour de la documentation et du DSF. Il décrit ce qui a été créé ou modifié, les comportements du prototype et les règles de gestion qui en découlent. Les identifiants sont ceux des nœuds Figma actuels.

## 1. Principe retenu

La saisie des paramètres d'exécution d'un exercice se fait **dans une modale** (feuille basse) ouverte depuis la carte « Paramètres d'exécution » de l'écran « Ajouter un exercice ». Cette approche **remplace la phrase éditable**, jugée moins efficace : la spécification du champ éditable est obsolète (voir la section 6).

## 2. Écrans

Tous les écrans sont sur la page « Prototype MVP », préfixés « Création activité — Paramètres en modale — ». Ils sont tous des copies de l'écran source « Création activité — Avant Paramètres d'exécution » (`3542:4656`), qui n'est pas modifié.

| N° | Référence | Titre | Contenu |
|---|---|---|---|
| 1 | `6407:9458` | Champ vide | Carte de texte vide, cliquable |
| 2 | `6407:9551` | Modale ouverte (champs vides) | Modale à l'ouverture : steppers prêts, autres champs vides (« — ») |
| 3 | `6407:9702` | Texte affiché | Phrase de paramètres affichée, valeurs cliquables |
| 4 | `6407:9805` | Modale complète — mode activé | Ligne « Mode d'exécution » sélectionnée, contrôle segmenté ouvert (mode Durée) |
| 5 | `6407:9966` | Modale complète — steppers (séries, pauses) | Modale sans champ activé ; le stepper « Séries » est interactif |
| 6 | `6407:10127` | Durée activée (roulette ouverte) | Ligne « Durée d'une série » sélectionnée, roulette déployée |
| 7 | `6411:9546` | Durée totale activée (roulette ouverte) | Ligne « Durée totale » sélectionnée, roulette déployée |
| 8 | `6407:10481` | Changement de côté activé (contrôle segmenté) | Ligne sélectionnée, contrôle segmenté ouvert |
| 9 | `6411:9649` | Avec changement de côté (pause au changement de côté) | Un changement de côté est choisi : la ligne « Pause au changement de côté » apparaît ; aucune ligne sélectionnée |
| 10 | `6419:9847` | Répétitions (mode activé) | Mode Répétitions : ligne « Répétitions » à la place de la durée d'une série ; « Durée totale ≥ » non modifiable |
| 11 | `6419:10028` | À l'échec (mode activé) | Mode À l'échec : ni durée d'une série, ni durée totale |
| 12 | `6423:9953` | Modale complète — steppers avec message de durée totale ajustée | Écran 5 avec le message temporaire sous « Durée totale » |

Autre écran modifié : **« Modal — Confirmer la suppression d'une séance archivée »** (`2234:189`). Sa fenêtre de confirmation avait disparu ; elle est recréée : titre « Supprimer cette séance ? », message « Cette séance archivée sera définitivement supprimée. Cette action est irréversible. », boutons « Annuler » (gris `#F3F4F6`) et « Confirmer » (`#B1503C`). Les interactions des deux boutons n'ont pas été recâblées.

## 3. Comportements

**Ouverture et fermeture**
1. Un clic sur la carte de texte vide ouvre la modale (écran 1 vers 2). À l'ouverture, **les champs à stepper sont prêts** (valeurs par défaut) et **les autres champs sont vides**.
2. Le bouton de validation de la modale (✓, en haut à droite) ferme la modale ; **à la fermeture, le texte est affiché** (écran 3). Le bouton d'annulation (✕) ferme sans valider.
3. Depuis le texte affiché, l'utilisateur peut :
   - **changer un champ en particulier** en cliquant sur sa valeur dans le texte : la modale s'ouvre avec ce champ activé (ligne sélectionnée ; roulette déployée pour les champs à roulette ; contrôle segmenté ouvert pour le mode et le changement de côté) ;
   - **changer plusieurs champs** en cliquant sur le mode, par exemple : la modale complète s'ouvre et permet de modifier les paramètres souhaités ;
   - cliquer sur une **zone vide de la carte de texte** : la modale s'ouvre **sans aucun champ activé** (écran 5).

**Correspondance texte vers modale (écran 3)**

| Clic sur | Modale ouverte |
|---|---|
| Le mode (« Durée ») | Écran 4 |
| « 3 séries » ou « 15 s » (steppers) | Écran 5, sans cadre sélectionné |
| « 1 min 30 s » | Écran 6 |
| « 5 min » (durée totale) | Écran 7 |
| « sans » (changement de côté) | Écran 8 |
| Zone vide de la carte | Écran 5 |

**Champs de la modale**

| Champ | Type | À l'ouverture | Présent si |
|---|---|---|---|
| Mode d'exécution | Champ sélectionnable : le contrôle segmenté (Durée, Répétitions, À l'échec) apparaît à la sélection | vide | toujours |
| Séries | Stepper | 1 série | toujours |
| Durée d'une série | Champ modifiable à roulette (minutes, secondes) | vide | mode Durée |
| Répétitions | Stepper | prêt | mode Répétitions |
| Pause entre les séries | Stepper | prêt (0 s) | toujours |
| Changement de côté | Champ sélectionnable : contrôle segmenté (Sans changement, Droite puis gauche, Gauche puis droite) | vide | toujours |
| Pause au changement de côté | Stepper | prêt | un changement de côté est sélectionné, juste après « Changement de côté » |
| Durée totale | Champ modifiable à roulette ; en mode Répétitions : « Durée totale ≥ », **non modifiable** (texte simple) | vide | mode Durée ou Répétitions, juste avant le compte à rebours |
| Compte à rebours | Stepper | 10 s | toujours |
| Fin d'exercice | Stepper | 5 s | toujours |

**Changer de mode.** Dans le contrôle segmenté du mode (écrans 4, 10, 11), un clic sur une autre option ouvre l'écran du mode correspondant, avec les lignes adaptées.

**Stepper animé (écran 5).** Le stepper « Séries » est interactif : « + » passe à la valeur suivante et « − » à la valeur précédente, de 1 à 10 séries, avec une animation de 0,12 s. Les autres steppers sont statiques. Il s'agit d'un composant propre au prototype (« Stepper — Séries (interactif) », `6426:10149`).

**Message temporaire (écran 12).** Quand la durée totale est ajustée, un message s'affiche **juste sous la ligne « Durée totale »** : « Durée ajustée à 5 min pour respecter un nombre entier de séries. » La feuille grandit vers le haut de 62 px pour libérer la place ; les lignes du bas ne bougent pas.

## 4. Présentation de la modale

- **Voile :** noir à 28 % sur tout l'écran. **Feuille :** blanche, coins supérieurs de 24 px, contenu rogné par les coins, ombre légère vers le haut, collée en bas de l'écran. Sa hauteur dépend des lignes affichées.
- **En-tête :** composant DSF « En-tête de modale », titre « Paramètres d'exécution », annuler à gauche, valider à droite.
- **Champs empilés :** une carte arrondie (`#FCFCFE`, contour blanc) dont les lignes de 42 px sont séparées par un trait (`#DEDEE5`), libellé de 14 px à gauche, contrôle à droite, **comme l'écran des profils**.
- **Cadre sélectionné** (roulettes et contrôles segmentés uniquement) : contour bleu `#0508E5` de 2 px, fond `#F4F4FF`, rayon de 12 px, **limité à la ligne** ; la roulette ou le contrôle segmenté s'affiche dessous, hors du cadre. **Les steppers n'ont pas de cadre sélectionné.**
- **Stepper :** largeur uniforme de **137 px** (boutons alignés à gauche et à droite d'un stepper à l'autre), fond blanc, boutons `#F2F2FF`, glyphes et valeur en bleu, valeur centrée. Le bord droit du bouton « + » est aligné sur celui des champs (366 px).
- **Champ modifiable :** pastille « Valeur modifiable » du DSF, sans chevron.
- **Contrôle segmenté :** composant DSF ; options de largeur égale ; options non sélectionnées à la couleur du bouton Annuler (`#FCFCFE`, contour blanc) ; libellés du changement de côté à 13 px, sur deux lignes, centrés.
- **Libellé long :** « Pause au changement de côté » passe sur deux lignes (180 px) pour ne pas passer sous le stepper.

## 5. DSF

**Composants du DSF utilisés** : « DSF / Controls / Stepper / Profil » et « … / Tour », « DSF / Forms / Valeur modifiable », « DSF / Forms / Roulette », « Controls / Segmented » (3 options), « DSF / Overlays / En-tête de modale ».

**Évolutions du DSF à envisager**
1. **Stepper :** le DSF a deux présentations différentes (Profil : fond lavande, boutons blancs ; Tour : fond blanc, boutons gris clair). La modale impose une présentation unique : fond blanc, boutons `#F2F2FF`, texte bleu, largeur 137 px, valeur centrée. À harmoniser dans le composant.
2. **Valeur modifiable :** ajouter une variante **non modifiable** (texte `#141414` en 14 px, sans pastille), utilisée pour « Durée totale ≥ ».
3. **Contrôle segmenté :** ajouter l'usage en feuille (options de largeur partagée, options non sélectionnées `#FCFCFE`, libellés de 13 px sur deux lignes).
4. **Ligne de paramètre :** formaliser la ligne de la carte empilée avec ses états (repos, sélectionnée) et ses trois types de contrôle (stepper, champ modifiable, champ sélectionnable à contrôle segmenté).
5. **Feuille modale de paramètres :** formaliser la feuille (voile 28 %, coins de 24 px, ombre) et la règle de croissance vers le haut quand une ligne s'ajoute.
6. **Message temporaire :** ajouter la règle de placement dans une feuille (sous la ligne concernée, 4 px d'écart, la feuille grandit vers le haut).

Le composant « Stepper — Séries (interactif) » est un outil de prototype et n'a pas vocation à entrer dans le DSF.

## 6. Éléments devenus obsolètes

La spécification du **champ éditable** (phrase éditable), remplacée par la modale. Éléments concernés dans le fichier, à traiter par leur propriétaire :
- les écrans « Ajouter un exercice » qui utilisent la phrase éditable, dont « Phrase éditée » (`4279:7044`), « Mode d'exécution (3 pastilles) » (`4367:7128`) et « Changement de côté (3 pastilles) » (`4367:7906`) ;
- la démo « Champ éditable » de la page « Démonstrations — Animations d'appui ».

## 7. Écarts entre le comportement décrit et le câblage actuel du prototype

À signaler une fois ; le comportement décrit à la section 3 fait foi.
- **Écran 2 :** le bouton de validation mène à l'écran 4 ; le comportement décrit mène au texte affiché (écran 3).
- **Écran 4 :** le champ « Changement de côté » mène à l'écran 7 (durée totale) ; il devrait mener à l'écran 8.
- **Écrans 4, 10 et 11 :** seuls le mode et, pour l'écran 4, quelques champs sont reliés ; les autres champs de ces écrans ne mènent à rien.

## 8. Limites du prototype (faits, sans décision à prendre)

- La phrase de l'écran 3 ne change pas après une modification, et ne reprend pas la pause au changement de côté.
- La modale n'existe en détail que pour le mode Durée, avec les écrans 10 et 11 pour les deux autres modes ; il n'y a pas d'état « texte affiché » pour ces deux modes.
- Les valeurs de la roulette sont celles de l'exemple du DSF (« 05 minutes 30 secondes »), non celles du champ.
- Le point de départ du prototype n'a pas pu être déclaré ; la présentation se lance depuis l'écran 1.

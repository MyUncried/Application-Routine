# PRE-3 (#340) — retests ciblés après la correction de la recette 1

## Installation

- Application : **Routine Dev**, build iOS **7** (déjà installé, EAS `e1deb07e-3f67-43d3-9d34-9b15147af94b`).
- Aucune nouvelle installation n’est nécessaire : la correction arrive par une **mise à jour OTA** sur le canal `review` (`OTA_COMPATIBLE`, aucun fichier natif modifié). L’identifiant et le commit publiés sont donnés dans le rapport `2026-10-12_PRE3-340_CORRECTION-RECETTE1.md`.
- Charger la mise à jour :
  1. ouvrir Routine Dev avec le réseau actif ;
  2. attendre 10 à 20 secondes ;
  3. fermer complètement l’app depuis le sélecteur d’apps, puis la rouvrir ;
  4. recommencer une fois si rien ne change.
- Repère que la mise à jour est chargée : RT-01 ne fait plus apparaître l’écran d’erreur.
- Pour chaque retest, indiquer **Conforme** ou **Non conforme**, avec une capture en cas d’écart.
- Indiquer aussi une fois : modèle d’iPhone, version d’iOS, numéro de build affiché par TestFlight ou l’installation interne. Pour RT-06, préciser le réglage de taille du texte.

## Retests

| ID | Écran (nom complet) | Données de départ | Actions | Résultat attendu |
|---|---|---|---|---|
| RT-01 (T-15) | Catalogue › Créer un exercice › carte Paramètres › feuille « Paramètres d’exécution » | Mode Durée, 3 Séries, Séries variables activé, tableau déployé, durées 30 s / 45 s / 60 s | Maintenir la poignée (six points) de la Série 1, la glisser de deux rangs vers le bas, relâcher. Recommencer en remontant la Série 3. Toucher ✕. | Aucun écran d’erreur. La ligne suit le doigt. Après relâchement, la Série déplacée garde sa durée **et** sa pause, et les numéros 1, 2, 3 restent dans l’ordre. ✕ annule tous les déplacements. |
| RT-02 (T-10) | Même feuille « Paramètres d’exécution » | Mode Durée, 3 Séries variables 30 / 45 / 60 s | Modifier la Série 2 (+). Toucher la valeur « Mode d’exécution », choisir Répétitions, puis Durée, **sans désactiver** l’interrupteur. Ensuite, inverse : en Répétitions, modifier une ligne, passer en Durée et revenir en Répétitions. | La Série 2 affiche la **dernière** durée saisie. En Répétitions, les cibles sont vides (« — ») puis les répétitions saisies reviennent. **Si l’écart persiste, noter le trajet exact** : nombre de Séries, tableau replié ou non, tap ou maintien, ✓ avant le changement. |
| RT-03 (T-34, T-35) | Catalogue › Créer un exercice › ligne Catégorie › feuille « Catégorie de l’exercice » | — | Toucher « Créer une catégorie » ; saisir un nom ; ouvrir la palette. Puis appui long sur une Catégorie personnelle › Modifier. | Le clavier ne recouvre jamais le formulaire : le champ, la palette et les boutons Annuler / Ajouter restent visibles au-dessus du clavier. Les fonctions déjà conformes sont inchangées (Ajouter inactif à vide, anti-doublon). |
| RT-04 (T-34, T-35) | Catalogue › Créer un exercice › ligne Zones › feuille « Zones corporelles » | — | Mêmes actions que RT-03, avec une Zone. | Même résultat que RT-03. *L’Étiquette (Composition) n’est pas encore corrigée.* |
| RT-05 (T-39, T-43) | Catalogue › Créer un exercice › section Médias | Une vidéo de la photothèque | Ajouter une photo, une vidéo, une photo. Terminer. Fermer complètement l’app, la rouvrir, rouvrir l’exercice. | La tuile vidéo montre une **image de la vidéo** (badge « Vidéo » conservé), avant et après redémarrage. La vidéo ne se lit pas : la lecture est hors PRE-3. Si la tuile reste grise, noter la durée et la provenance de la vidéo (iCloud ou locale). |
| RT-06 (T-61) | Réglages iOS › Accessibilité › Affichage et taille du texte › Police plus grande, au maximum, puis Routine Dev › feuilles « Paramètres d’exécution », « Catégorie de l’exercice », « Zones corporelles » | — | Ouvrir chaque feuille. | Titre de la feuille entier, éventuellement sur plusieurs lignes, jamais rogné par la ligne suivante. *Titres d’écran, segmentés, Créer/Filtrer/Trier et Profil ne sont pas encore corrigés (composants partagés).* |
| RT-07 (T-04) | Composition d’une séance › exercice ajouté depuis le Catalogue › écran de l’exercice | Une séance en cours de composition | Ajouter un exercice du Catalogue. Ouvrir sa copie dans la séance. Toucher la carte Paramètres, changer le nombre de Séries, ✓, puis **Terminer**. Dans la Composition, toucher **Continuer** pour enregistrer la séance. Rouvrir la séance, puis la définition de l’exercice dans le Catalogue. | La séance rouverte garde le nouveau nombre de Séries. La définition du Catalogue est **inchangée**. Aucun contrôle de base de données n’est demandé. |
| RT-08 (T-17) | Feuille « Paramètres d’exécution » | 3 Séries variables aux valeurs distinctes, Changement de côté « Droite puis gauche », Ordre des côtés « Les deux côtés à chaque série » | **Essai A**, sans ✓ : descendre à 1 Série, puis remonter à 3. **Essai B** : descendre à 1, ✓, Terminer, rouvrir l’exercice et remonter à 3. | A : les 3 lignes, leurs valeurs et l’ordre reviennent. B : pas de restauration des anciennes options ; les nouvelles lignes reprennent la dernière ligne active. |
| RT-09 (T-62) | Toutes les surfaces PRE-3, sans VoiceOver | — | Regarder le haut et le bas de l’éditeur et des feuilles. | Retour, ✕, ✓ et Terminer, ainsi que le bas des feuilles, sont atteignables. Rien d’important sous l’encoche ni sous l’indicateur d’accueil. |
| RT-10 (A-05) | Feuille « Paramètres d’exécution » | Séries variables activé | Replier le tableau (chevron), puis le redéployer. | Replié : plus de cadre bleu autour de la ligne Séries variables, l’interrupteur reste activé. Déployé : le cadre revient avec le tableau. |
| RT-11 (A-02, A-07, T-57) | Feuille « Paramètres d’exécution » | Création d’un exercice, mode Durée, Séries variables, une Série sans durée | Observer la cellule vide. | Contour **orange** (et non rouge) autour du stepper vide ; ✓ grisé ; total « — ». Le message « Série n : renseignez la durée. » reste affiché tant que la décision R-15 n’est pas prise. |

Les points en attente de décision ou d’extension (R-04 à R-11, R-14, R-17, R-19) ne sont pas à retester.

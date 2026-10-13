# PRE-3 — procédure de vérification sur iPhone

Opération #340. Cette procédure ne porte **que** sur ce qui ne peut pas être prouvé hors appareil : rendu natif, perception, VoiceOver, permissions système, photos/vidéos réelles, gestes de maintien et défilement, redémarrage et installation. Les calculs, la persistance SQLite, les migrations, les copies et les fichiers sont prouvés par les tests techniques (`resultats-tests.json`) ; ils ne sont **pas** à revérifier ici.

## Préalable bloquant (hors périmètre PRE-3)

`app.json` déclare encore `photosPermission : « Routine accède à vos photos uniquement pour choisir la photo de votre profil. »`. Ce texte devient inexact dès que l'éditeur d'Exercice importe des médias ; il doit être adapté (fichier hors du périmètre d'écriture approuvé) **avant** la build de recette. La première demande d'accès iOS affiche ce texte.

## Build

1. Build de développement ou de recette contenant la tête livrée sur `feat/pre3-exercice-20261009` (dépendance native ajoutée : `expo-video ~57.0.5` → nouvelle build native nécessaire, un simple rechargement JS ne suffit pas).
2. Installation propre **et** mise à jour d'une installation existante contenant des Exercices/Séances PRE-2 (migration 009 réelle).

## A. Éditeur et feuille Paramètres (rendu, gestes)

| Étape | Action | Attendu à observer |
|---|---|---|
| A1 | Catalogue → Créer un exercice | Zone bleue, pastilles Catégorie/Zones, carte « Paramètres d'exécution » (« Choisir un mode »), Description, Médias, Terminer inactif |
| A2 | Toucher n'importe où sur la carte | La feuille monte, voile sombre, en-tête ✕ / titre / ✓ fixe, corps défilant jusqu'à « Fin d'exercice » |
| A3 | Mode → Durée ; Durée d'une série | Roulette native iOS (inertie, courbure) en place ; une seule roulette/segmenté ouvert à la fois |
| A4 | Séries « + » maintenu ~5 s | Un pas au toucher ; répétition après ~0,5 s ; accélération visible vers 2 s et 4 s ; arrêt net au relâchement |
| A5 | Bip / Compte à rebours / Fin maintenus ~5 s | Toujours pas de 1 |
| A6 | Séries variables, 12 séries, défiler jusqu'en bas | Toutes les lignes et la ligne Fin d'exercice atteignables, en-tête toujours visible |
| A7 | Monter / Descendre une ligne | Cible et Pause bougent ensemble, numéros mis à jour |
| A8 | Rendre une cible vide, replier le tableau, ✓ | Feuille reste ouverte, message « Série n … », tableau redéployé |
| A9 | ✕ après plusieurs réglages | Carte inchangée |
| A10 | ✓ | Phrase complète, valeurs en gras, aucune coupure, carte qui s'agrandit |
| A11 | Texte agrandi (Réglages > Accessibilité > Taille du texte, max) | Phrase et feuille lisibles, rien de tronqué, bas de feuille atteignable |
| A12 | Clavier ouvert dans la Description | Champ et Terminer atteignables |

## B. Médias (photothèque, permissions, fichiers réels)

| Étape | Action | Attendu |
|---|---|---|
| B1 | Ajouter des photos ou vidéos (1re fois) | Demande d'accès Photos iOS (texte : voir préalable) ; aucune demande caméra ni micro |
| B2 | Accès « Sélectionner des photos » (limité) | Import possible des éléments autorisés ; mention d'accès limité |
| B3 | Refus définitif puis nouvel essai | Message « Accès à la photothèque refusé. » + « Ouvrir les réglages » |
| B4 | Sélection photo + vidéo + photo (dont une vidéo longue / HEIC / iCloud) | Ordre de sélection conservé, état « Importation… », aperçu vidéo (affiche, sans lecture ni son) |
| B5 | Annuler le sélecteur | Aucun message d'erreur, brouillon intact |
| B6 | Monter / Descendre / Retirer | Ordre et VoiceOver mis à jour |
| B7 | Terminer, fermer l'app (balayage), relancer, rouvrir l'Exercice | Mêmes médias, même ordre, affiches régénérées |
| B8 | Ajouter l'Exercice à une Séance, Continuer, relancer | La copie porte les mêmes médias ; retirer un média de la copie ne change pas la définition |
| B9 | Stockage presque plein (si praticable) | Erreur locale avec Réessayer, brouillon conservé |

## C. VoiceOver

| Étape | Attendu |
|---|---|
| C1 | Carte Paramètres annoncée une seule fois, phrase complète, puis activation ouvre la feuille ; à la fermeture le focus revient sur la carte |
| C2 | Steppers annoncés comme réglables (nom, unité, valeur), balayage haut/bas = ± 1 |
| C3 | Roulette : valeur annoncée par la roulette native ; Valider / Annuler nommés |
| C4 | Lignes variables : « Monter la série n » / « Descendre la série n » ; bornes inactives |
| C5 | Médias : « Photo n sur N », actions nommées ; erreur d'import annoncée |
| C6 | Feuilles Catégorie / Zones : pastilles avec nom et état ; ✕ / ✓ nommés |

## D. Non-régressions perceptibles

Profil : stepper inchangé (maintien ~0,45 s, pas de 1). Catalogue et Composition : cartes inchangées hors « N séries variables » et symboles ≈ / ≥.

## Compte rendu attendu

Pour chaque étape : OK / écart (capture + description). Aucun contrôle de base de données ni de calcul n'est demandé.

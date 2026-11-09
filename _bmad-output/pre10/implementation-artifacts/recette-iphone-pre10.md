# PRE-10 — Recette iPhone n° 1 (moteur d'exécution, Exécution Libre)

Branche `pre10-bmad/dev`, tête `9aa90d5f` (code) ; rapport `.github/orchestration/reports/2026-11-09_PRE10_MOTEUR_EXECUTION_LIBRE.md`. Ce cahier couvre PRE-10.1 à PRE-10.3 : lancement depuis le Catalogue, déroulé d'une Séance sans Format, commandes, Point d'arrêt, interruption et reprise, fin minimale. Les Formats AMRAP, EMOM, For time et Death by ne sont pas exécutables (PRE-11).

Au premier lancement, la base passe en version 24 (migration 024, tables d'exécution) : aucune Séance ne doit être perdue.

Notez pour chaque cas : **OK**, ou **KO** avec ce que vous voyez (une capture aide). Avant de conclure à un KO, vérifiez que l'iPhone a bien rechargé le bundle (fermer l'application, la rouvrir).

## Corrections du 09/11/2026 (recette n° 1) — à tester

Version en ligne, avec les résultats : https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq. Fermer complètement l'application puis la rouvrir.

- C1. Réinitialiser l'exercice puis Annuler (et Réinitialiser puis Confirmer) : le dialogue se ferme, aucune Pause n'apparaît, les trois boutons répondent ensuite ; recommencer plusieurs fois, aussi dans Recette B.
- C2. Fin de Recette B (après une réinitialisation) : Fermer ramène au Catalogue.
- C3. Exercice suivant pendant une Pause entre séries, une Pause entre les côtés et une Récupération : passage direct, sans confirmation.
- C4. Exercice suivant pendant une Durée : la confirmation s'ouvre et le chrono s'arrête ; Annuler reprend à la même valeur ; Confirmer passe à l'étape suivante, Exercice « Partielle ».
- C5. Comptes à rebours : chaque seconde affichée dure une seconde, y compris les 3 dernières.
- C6. « À suivre » : « Gainage · Série 2/2 · 00:30 » ; avant un Point d'arrêt : « Arrêt de la séance, redémarrage manuel ».

## 0. Séances de recette à préparer

Dans la Composition, créez et enregistrez :

- **« Recette A »** (sans Format) :
  1. **Gainage** — mesure en **Durée 30 s**, **2 séries**, Pause entre séries **15 s**, Récupération **20 s**.
  2. **Pompes** — mesure en **Répétitions 10**, **2 séries**, Pause **15 s**, Récupération **20 s**.
  3. Un **Point d'arrêt** après Pompes.
  4. **Fente** — **bilatérale**, **Durée 20 s**, **1 série**, Pause entre les côtés **10 s**, Récupération **0 s**.
- **« Recette B »** (sans Format) : un **Circuit 2 tours** contenant **Jumping jack** (Durée 20 s, 1 série) et **Squat** (Répétitions 12, 1 série), Récupération 10 s chacun.
- **« Recette Format »** : une Séance avec un Format **AMRAP** (n'importe quel contenu).

Gardez une Séance existante quelconque pour le § 1.

## 1. Mise à jour de la base et Catalogue

1. Ouvrez l'application, puis le Catalogue des Séances : toutes vos Séances sont présentes, avec leurs noms, étiquettes et durées.
2. Sur la carte de « Recette A », la pilule **Démarrer** est active. Toucher la carte (hors Démarrer) ouvre toujours la Séance en modification.
3. Démarrer « Recette Format » : l'écran indique « Cette séance ne peut pas encore être exécutée. » et « Les Formats AMRAP, EMOM, For time et Death by seront exécutables dans une prochaine version. ». **Retour** ramène au Catalogue.

## 2. Déroulé d'une Séance (Recette A)

4. Démarrez « Recette A » : l'écran d'Exécution s'ouvre sur le **Compte à rebours**, puis enchaîne seul sur Gainage. Le balayage retour d'iOS ne ferme pas l'écran.
5. Pendant Gainage : nom de l'Exercice, « Série 1 » sur 2, chrono décroissant de 30 s, « À suivre », « Temps écoulé » qui avance.
6. À 0 s : passage automatique à **Pause** (15 s), puis Série 2, puis **Récupération** (20 s). Une vibration marque chaque changement d'étape.
7. Pompes (Répétitions) : aucun chrono décroissant ; l'étape attend. Touchez **Exercice suivant** : passage **sans** confirmation à la Pause.
8. Après la Série 2 et la Récupération de Pompes, l'écran affiche **Point d'arrêt** : rien ne s'enchaîne seul. Le bouton de droite devient **Continuer** ; touchez-le : Fente commence.
9. Fente : « Côté 1 » (20 s), **Pause entre les côtés** (10 s), « Côté 2 » (20 s), puis **Fin de séance**. Récupération à 0 s : aucune étape vide n'apparaît.
10. Fin : « Séance terminée », avec la liste des Exercices exécutés, chacun « Terminée ». **Fermer** ramène au Catalogue.

## 3. Commandes

Relancez « Recette A ».

11. **Exercice suivant avant la fin d'une Durée** : pendant Gainage, à mi-chrono, touchez Exercice suivant : la confirmation « Passer à l'exercice suivante ? » apparaît et le chrono est arrêté. **Annuler** : le chrono reprend là où il était. Recommencez et **Confirmer** : passage à l'étape suivante.
12. **Réinitialiser une Série** : pendant une Série de Gainage, touchez « Réinitialiser l'exercice », confirmez : la Série recommence à 30 s, la Série déjà faite reste acquise. Annuler ne change rien.
13. **Réinitialiser une récupération** : pendant une Récupération, le bouton s'appelle « Réinitialiser la récupération » ; confirmez : elle recommence à sa durée complète.
14. **Réinitialiser un côté** : pendant Côté 2 de Fente, réinitialisez : seul Côté 2 recommence.
15. Réinitialiser est **grisé** pendant le Compte à rebours, le Point d'arrêt et la Fin de séance.
16. **Pause** : touchez Pause pendant une Durée : la modale « Séance en pause » apparaît, chrono figé. **Reprendre la séance** : le chrono repart de la même valeur (pas de saut).
17. **Arrêter** : Pause → **Arrêter la séance** : fin « Séance interrompue ». Retournez au Catalogue, puis relancez « Recette A » : elle démarre normalement depuis le début.
18. **Fin partielle** : faites toute la Séance en confirmant une fois Exercice suivant avant la fin d'une Durée (cas 11) : la fin indique « Séance partiellement exécutée » et l'Exercice concerné « Partielle ».

## 4. Circuit (Recette B)

19. Démarrez « Recette B » : l'écran indique « Tour 1 » sur 2 ; Jumping jack, Récupération, Squat, Récupération, puis « Tour 2 » avec les mêmes Exercices, puis Fin de séance.

## 5. Interruptions

20. **Verrouillage** : pendant une Durée de Gainage (chrono vers 25 s), verrouillez l'iPhone 10 s, déverrouillez : le chrono affiche environ 15 s (le temps a continué), sans vibration en rafale ni étape sautée en double.
21. **Arrière-plan plus long qu'une étape** : pendant la Série 1 de Gainage, passez sur une autre application ~60 s, revenez : l'écran est sur l'étape où la Séance doit être à cet instant (Pause, Série 2 ou Récupération) ; les étapes passées comptent une seule fois.
22. **Fermeture forcée** : pendant Pompes, fermez l'application (balayage vers le haut dans le sélecteur), rouvrez-la : le dialogue « Séance interrompue — La séance « Recette A » n'a pas été terminée. » apparaît.
    - **Reprendre la séance** : retour sur l'étape en cours, en pause, avec « La séance a été remise à l'étape en cours. » ; Reprendre relance cette étape.
    - Recommencez et choisissez **Arrêter la séance** : la Séance est close (interrompue) et le Catalogue est utilisable.
23. **Démarrage bloqué** : après une fermeture forcée, si vous démarrez une autre Séance depuis le Catalogue avant de répondre au dialogue, l'écran indique « Une séance interrompue doit d'abord être reprise ou arrêtée. ».
24. Pendant le Point d'arrêt, verrouillez 1 min puis revenez : toujours au Point d'arrêt, « Continuer » fonctionne.

## 6. À observer

- **Rendu** comparé à Figma (écran `1992:8132`, `1992:8530`, `1992:8626` ; dialogues `1992:8224`, `1992:8326`, `1992:8428`) : non vérifié par le développement. Écarts connus : police Roboto Condensed non chargée, chrono circulaire et progression segmentée par Tours non dessinés.
- **Sons / Annonces vocales** : les interrupteurs existent mais ne produisent **aucun son** (aucune bibliothèque audio installée) ; seule la vibration est attendue.
- Texte de la confirmation « Passer à l'exercice suivante ? / … l'exercice suivante … » : repris tel quel du contrat d'écran ; l'accord (« suivant ») est à confirmer.
- Lisibilité du chrono et des commandes sur petit écran ; aucune commande inaccessible.

## Choix provisoires à confirmer pendant la recette

Spec `spec-pre10-moteur-execution-libre.md` § À CLARIFIER :

1. Exercice suivant pendant le Compte à rebours et la Fin de séance : passage immédiat, sans confirmation (cas 4, 9).
2. Réinitialiser pendant une Pause entre séries : la Pause recommence.
3. Bilatéral alterné par série : seul le côté courant recommence (cas 14).
4. L'attente au Point d'arrêt compte dans le « Temps écoulé » (cas 8, 24).
5. Libellés de la fin minimale (cas 10, 17, 18).
6. Son et voix : ajout de `expo-audio` / `expo-speech` maintenant (nouvelle version native) ou après le spike arrière-plan.

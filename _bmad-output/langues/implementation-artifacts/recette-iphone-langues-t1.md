# Langues T1 — Recette iPhone n° 1 (textes déplacés dans le catalogue)

Branche `claude/exciting-lovelace-iyn2wf`, tête `d07e434` (code) ; plan `docs/preparation/langues/T1-PLAN-EXTERNALISATION-TEXTES-2026-11-23.md` ; rapport `.github/orchestration/reports/2026-11-23_LANGUES-T1-IMPLEMENTATION.md`.

T1 déplace les textes de l'Exécution, des annonces vocales et des Bibliothèques vers le catalogue de textes, **sans rien changer à l'écran ni à la voix**. Une seule différence attendue : le dialogue « Passer à l'exercice suivant ? » (faute corrigée, demande du 23/11). Tout autre changement de texte, d'accord (singulier/pluriel), de guillemets ou d'apostrophe est un **KO**.

Notez pour chaque cas : **OK**, ou **KO** avec ce que vous voyez (une capture aide). Avant de conclure à un KO, fermez complètement l'application puis rouvrez-la. Aucune migration de base : aucune donnée ne doit changer.

## 0. Préparation

- Une Séance sans Format avec : un Exercice en **Durée** (2 séries), un Exercice en **Répétitions** (10, 2 séries), un Exercice **bilatéral**. Par exemple la « Recette A » de PRE-10.
- Profil › Préférences : **Annonces vocales** activées (noms, côtés, objectif, pauses, début et fin de séance).
- Au moins une **Bibliothèque KODJO installée** (par fichier ou depuis l'administration du PC) et au moins une **Bibliothèque personnelle** avec 2 Mouvements.

## 1. Exécution — dialogue corrigé et textes

1. Démarrez la Séance. Pendant l'Exercice en Durée, touchez **Exercice suivant** : le titre est **« Passer à l'exercice suivant ? »** et le message **« La séance continuera avec l'exercice suivant, elle sera enregistrée comme partiellement exécutée. »** Annuler puis Confirmer fonctionnent comme avant.
2. « Réinitialiser l'exercice ? » : titre, message, Annuler / Confirmer inchangés.
3. Écran : « Préparez-vous », « À suivre », « Pause », « Changez de côté », « Récupération », « Point d'arrêt », « Fin de séance », « 1er côté » / « 2d côté » (suffixe en exposant), « rép. », « Temps écoulé » : inchangés.
4. Fermez l'application pendant une Durée, rouvrez-la : le dialogue « Séance interrompue », avec « La séance « nom » n'a pas été terminée. », est inchangé.
5. Fin : « Séance terminée » ou « Séance partiellement exécutée », avec les mentions « Terminée » / « Partielle » par Exercice.

## 2. Exécution — annonces vocales

6. Au départ : « Préparez-vous. Premier exercice : <nom> » si la Séance a plusieurs Exercices, sinon « À suivre : <nom> ».
7. Début d'un Exercice en Répétitions : « <nom>, 10 répétitions ». En Durée : la durée en toutes lettres (« 30 secondes », « 1 minute 30 »).
8. Série suivante du même Exercice : « Deuxième série » (puis « Troisième série »…), sans répéter le nom.
9. Exercice bilatéral : « premier côté » au départ, « Second côté » au changement.
10. Pause et Récupération : « Pause » / « Récupération », suivis de « À suivre : <nom> ».
11. Fin : « Bravo, séance terminée ».

## 3. Profil › Bibliothèques (KODJO)

12. La liste des Bibliothèques : sous-titres (« n mouvements · installée », « · mise à jour disponible »…) et pilules (« Installer », « À jour », « Mettre à jour ») inchangés ; accord singulier/pluriel correct avec 1 mouvement.
13. **Ajouter une bibliothèque** : « Depuis un fichier » / « Depuis l'administration (PC) » et leurs sous-titres inchangés.
14. Depuis l'administration : écran « Connexion à l'administration », saisie du code ; un code faux donne « Code refusé ou expiré ». Connecté : « Connecté à « nom du PC » ».
15. « Bibliothèques disponibles » : liste, aperçu d'une Bibliothèque (compteurs « Modifiée(s) / Nouvelle(s) / Retirée(s) » au bon accord), installation : « <titre> est installée ».
16. Désinstaller : « Désinstaller « titre » ? » et son message inchangés (annulez si vous voulez la garder).

## 4. Bibliothèques personnelles

17. **Créer une bibliothèque** avec un nom déjà pris : « Nom déjà utilisé » / « Vous avez déjà une bibliothèque nommée « nom ». ». Faites le test une fois à la création et une fois au renommage.
18. Supprimer une Bibliothèque personnelle : « Supprimer « titre » ? » et son message inchangés (annulez).
19. Retirer le dernier Mouvement : « Dernier mouvement » et son message inchangés.
20. **Partager** et **Envoyer mes mouvements** (si un PC est appairé) : titres, messages et compte rendu « n mouvements à « nom » » inchangés.

## 5. Mouvements venant d'une Bibliothèque

21. Fiche d'un Mouvement installé : le badge et ses lignes (origine, révision « rév. ») sont inchangés.
22. Archiver ce Mouvement depuis le Catalogue des Mouvements : « Archiver ce mouvement ? » ; message « Il fait partie de votre bibliothèque « titre ». Archivé, il n'y apparaîtra plus. ». Avec deux Bibliothèques : « vos bibliothèques « A », « B » ». Annulez.
23. Tenter de supprimer un Mouvement de Bibliothèque archivé : « Suppression impossible » ; message « Ce mouvement vient de la bibliothèque « titre ». Il reste archivé ; seule la désinstallation de la bibliothèque le retirera de votre Catalogue. » ; bouton **OK**.

## Résultats

| Cas | OK / KO | Constat |
|---|---|---|
| 1–5 |  |  |
| 6–11 |  |  |
| 12–16 |  |  |
| 17–20 |  |  |
| 21–23 |  |  |

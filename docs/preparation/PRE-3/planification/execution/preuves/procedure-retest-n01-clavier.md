# PRE-3 (#340) — retest N-01 : clavier pendant l’appui long et la modification

Ce retest porte seulement sur N-01. N-01 reste à valider sur iPhone : les tests automatiques ne prouvent pas l’absence d’animation du clavier. Durée : environ 10 minutes. Aucune suppression ni réinstallation. Pour Modifier, utiliser des **entrées de test** (« Test N01 », « Zone N01 », « Étiq N01 »), créées au préalable si nécessaire.

Candidat : commit `29d149bd`, OTA **`01a131f9-1cf0-705c-8531-3919ff3b2aa6`** (canal `review`, runtime 1.1.0), compatible avec les builds 7 et 8.

## 0. Version exécutée (une fois)

1. Ouvrir **Routine Dev** avec le réseau actif.
2. Dans **Safari**, saisir `routine://diagnostic-updates` et accepter « Ouvrir dans Routine Dev ».
3. « Mise à jour exécutée » doit afficher `01a131f9-1cf0-705c-8531-3919ff3b2aa6`, avec « Lancement » = « mise à jour OTA » : faire une capture, puis fermer le diagnostic (bouton Fermer).
   - Si `01a131f9-1cf0-705c-8531-3919ff3b2aa6` apparaît seulement en « Téléchargée, en attente » : fermer complètement l’app **une fois**, la rouvrir et refaire 2-3.
   - Sinon : toucher « Vérifier maintenant », faire une capture et s’arrêter.

**Ne pas fermer complètement l’app entre les contrôles du §1 et la lecture du §2** : le journal est conservé en mémoire pour la session.

## 1. Contrôles

Pour chaque feuille :
- **Catégorie** : « Modifier un exercice » › Catégorie › « Catégorie de l’exercice ».
- **Zones** : « Modifier un exercice » › Zones › « Zones corporelles ».
- **Étiquette** : « Composition d’une séance » › bouton Étiquette › « Étiquettes ».

Avant chaque contrôle : dans la feuille, toucher « Créer une … » et écrire « Provisoire » : **le clavier est affiché**.

| ID | Contrôle | Gestes | Attendu |
|---|---|---|---|
| A | **Appui long seul** | Maintenir l’entrée de test jusqu’à l’ouverture du menu ; observer **sans rien choisir** ; toucher ✕ du menu | Le clavier reste affiché **sans descendre ni remonter**, à l’ouverture comme à la fermeture du menu. « Provisoire » est intact. |
| B | **Modifier → Annuler** | Maintenir l’entrée de test, toucher **Modifier** ; observer ; toucher **Annuler** | Le clavier reste affiché sans interruption ; le champ affiche le nom de l’entrée, modifiable ; après Annuler, il revient à « Provisoire » et l’entrée est inchangée. |
| C | **Modifier → Enregistrer** | Maintenir l’entrée de test, Modifier, ajouter « X » au nom, **Enregistrer** | Le clavier reste affiché sans interruption ; l’entrée est renommée, sans nouvelle entrée ; le champ revient à « Provisoire ». |

À noter pour chaque feuille et chaque contrôle : « clavier stable » ou « clavier descend puis remonte » (à quel geste).

## 2. Lire le journal (après les contrôles)

1. Sans fermer l’app, ouvrir `routine://diagnostic-updates` dans Safari.
2. Faire défiler jusqu’à « **Journal clavier et focus** » et faire une **capture de toute la liste** (deux captures si elle est longue).

Ce journal horodaté enregistre les événements du clavier (`keyboardWillHide`, `keyboardWillShow`…), le focus du champ et les gestes (appui long, menu ouvert ou fermé, Modifier, Annuler, Enregistrer). Il prouve la cause si le clavier bouge encore.

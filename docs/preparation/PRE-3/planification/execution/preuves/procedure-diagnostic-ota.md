# PRE-3 (#340) — preuve de la version exécutée (blocage OTA-NON-APPLIQUEE)

Cette procédure prouve, sur l’iPhone, l’identifiant de la mise à jour réellement exécutée. Elle ne relance pas la recette.

Arbitrage A de Hermann (12/10) : build 8 du commit `58bbc3bc`. Ce commit contient le code de `a12bb92f` (candidat de la recette 2) et un écran technique de diagnostic, ouvert uniquement par lien. Identifiants du build : rapport `2026-10-12_PRE3-340_OTA-NON-APPLIQUEE.md`, section « Build 8 ».

Le build 7 ne contient pas l’écran de diagnostic. La capture de 14:46 (« Annuler » présent) reste le constat de son état. Le journal `expo-updates` antérieur ne s’affichera que s’il survit à l’installation.

## 1. Installer le build 8

1. Sur l’iPhone, ouvrir le lien du build 8 (page expo.dev) et toucher **Install**. Confirmer l’installation.
2. Ouvrir **Routine Dev** une fois. Les données de l’app sont conservées.

## 2. Lire la preuve

1. Dans **Safari**, saisir dans la barre d’adresse `routine://diagnostic-updates`, valider, puis accepter « Ouvrir dans Routine Dev ».
2. L’écran « Diagnostic des mises à jour » s’affiche. **Faire une capture du haut de l’écran.**

Attendu :

| Ligne | Valeur attendue |
|---|---|
| Lancement | « bundle embarqué du build » |
| Build | « 1.0.0 (8) » |
| Canal | `review` |
| Runtime | `1.1.0` |
| Lancement d’urgence | « non » |
| Mise à jour exécutée | identifiant du bundle embarqué du build 8 |

3. Toucher **Vérifier maintenant (sans télécharger)**. Faire une capture du résultat et des premières lignes du journal.

Le build 8 embarque le code du candidat. Le repère « Annuler » absent dans « Créer une catégorie » doit donc être visible. La reprise de la recette T-15 reste suspendue jusqu’à l’examen de ces captures par Claude.

## À rapporter

- les captures de l’étape 2 ;
- tout écart avec les valeurs attendues.

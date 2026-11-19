# 2026-11-19 — ILLUSTRATIONS-60 — diagnostic : photos absentes sur l'iPhone après mise à jour

## Identifiant et objectif
- Mission : `ILLUSTRATIONS-60-DIAGNOSTIC-IPHONE`. Constat utilisateur (capture iPhone, 01:09) : écran « Mise à jour de Pilote KODJO — 60 mouvements (recette) », 4 fiches « Révision incohérente » (Air squat, Adho Mukha Svanasana, Balasana, Bhujangasana), « Mettre à jour » inactif ; « une seule fiche mise à jour, aucune photo chargée ».
- Type : diagnostic sans correction ; aucun fichier applicatif modifié.

## Branche et commit de départ
- `assets/illustrations-60-20261117` @ `73ba1a929d7b11cbe9e6c5da3d4cbde1f48498e7`. Comparée à `origin/formats/emom-amrap-deathby-20261118` @ `089be96`.

## Contexte observé sur le PC (sorties fournies par l'utilisateur)
- Worktree `C:\Dev\KODJO-FORMATS` sur `formats/emom-amrap-deathby-20261118`, catalogue local modifié (638+/2212−), mis en réserve (`stash@{0}`) puis passage sur la branche des illustrations (`62 60` vérifié).
- Réserve : en-tête révision 2 ; 59 fiches révision 2 `[1,2]` et REED-001 révision 3 `[1,2,3]`, aucune photo.

## Constats démontrés
1. **L'application de l'iPhone ne peut pas afficher les photos.** L'affichage de la photo du catalogue a été ajouté par `6b1c957` (« Affiche la photo du catalogue sur la fiche mouvement installée ») sur la branche des illustrations uniquement ; `git merge-base --is-ancestor 6b1c957 089be96` est faux et `importedMovements.ts` de la branche formats ne contient aucune `illustration`. L'iPhone exécute vraisemblablement l'application issue de `C:\Dev\KODJO-FORMATS` (branche formats).
2. **Les deux branches n'ont pas le même format de catalogue.** La branche formats contient `a3845e0` (format 3.0.0, MOUV-ADM-20261117) : à la lecture d'un fichier 2.0.0, chaque fiche dont la position de départ n'est pas dans les étapes reçoit une nouvelle révision déterministe (`upgradeToV3` / `nextRevision`). Les 60 fiches du fichier des illustrations sont dans ce cas : révision 2 → 3, et révision 3 → 4 pour le lot 1 ; REED-001 2 → 3.
3. **Le numéro de révision ne suffit plus à ordonner les versions.** La réserve (écrite par l'administration au format 3.0.0) et le fichier des illustrations ont fait évoluer les mêmes numéros (2, 3) avec des contenus différents. Le plan de chargement (`catalogueLoadPlan.ts`) classe `INCOHERENT_REVISION` quand un même numéro porte un contenu différent ou quand l'historique reçu ne contient pas la révision installée.
4. Fusion de `6b1c957` sur la branche formats essayée dans un worktree jetable (puis supprimé) : un seul conflit trivial dans `importedMovements.ts` (deux ajouts voisins), plus `suivi.json` absent de la branche formats.

## Hypothèses non démontrées
- Révisions exactes installées sur l'iPhone : non observables d'ici. La réserve n'explique pas à elle seule les 4 incohérences du lot 1 (elle prédirait REED-001 seule) : l'iPhone a probablement reçu, à une autre occasion, une version du lot 1 en révision 3 ou 4 différente de l'actuelle.
- « Une seule fiche mise à jour » : la fiche concernée n'est pas identifiée.

## Ce qui n'est pas en cause
- Le contenu de la branche des illustrations : 60/60 photos rattachées, octets vérifiés, taille 3,1 Mo, photos ≤ 92 439 caractères (limite 580 000).

## Corrections envisagées (non réalisées, décision utilisateur requise)
- A. Intégrer l'affichage de la photo (`6b1c957`) dans la branche de l'application utilisée sur l'iPhone, et convertir le catalogue des illustrations au format 3.0.0 avec des révisions qui prolongent celles déjà installées.
- B. Alternative : intégrer la branche formats et la branche des illustrations dans une branche commune, après arbitrage.

## Modifications / fichiers
- Ajout de ce rapport uniquement.

## Tests
- Aucun test exécuté pour ce diagnostic (lecture de code, comparaisons Git, essai de fusion jetable).

## État Git
- Voir le commit de ce rapport ; branche synchronisée avec `origin`.

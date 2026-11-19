# 2026-11-19 — ILLUSTRATIONS-60 — vérification avant mise à jour de l'iPhone

## Identifiant et objectif
- Mission : `ILLUSTRATIONS-60-PRET-IPHONE` — question utilisateur : « donc je peux lancer maintenant la mise à jour de l'iphone ? ».
- Type : vérification sans correction ; aucun fichier applicatif modifié.

## Branche et commit de départ
- `assets/illustrations-60-20261117`, `124dfff394f68b9a2514c0781cd53d9d8843a287` (= `origin`).

## Constats et preuves
- Catalogue distant (`origin`, révision 62) : 60/60 fiches portent un média PHOTO / EMBEDDED / PERMISSION_CONFIRMED dont les octets sont identiques au fichier `.webp` distant.
- Taille du catalogue : 3 096 485 octets, sous la limite de 24 Mio du serveur (`tools/catalogue-admin/server.mjs:41`) et de l'application (`src/features/catalogue/pickCatalogueFile.ts:4`).
- Diffusion vers le téléphone : le serveur local `tools/catalogue-admin/server.mjs --lan` sert le fichier de la copie de travail du PC (`GET /phone/v1/catalogues/:catalogueId`, README du dossier).
- Lecture côté application : la photo est lue depuis la fiche installée (`src/features/catalogue/importedMovements.ts:79`) ; elle n'apparaît qu'après installation de la nouvelle révision.
- `node --test tools/catalogue-admin/server.test.mjs tools/catalogue-admin/installation.test.mjs` : 31 réussis, 2 échoués (« crée une 61e fiche… », « édition effective d'une fiche… », édition W1). Les mêmes 2 échecs se produisent avec le catalogue du commit `3ce4989` (avant illustrations) : préexistants, sans lien avec la diffusion vers le téléphone.
- `npx jest src/domain/catalogue src/features/catalogue` (mesure de la veille) : 26 échecs préexistants identiques, aucune régression.

## Hypothèses non démontrées
- La version de l'application installée sur l'iPhone contient l'affichage de la photo (commit `6b1c957`, présent sur cette branche) : non vérifiable depuis cet environnement.
- Le PC qui sert le catalogue est à jour sur cette branche : à faire par l'utilisateur.

## Vérifications restant sur appareil réel
- Appairage / connexion Wi-Fi, chargement de la révision 62, acceptation des mises à jour de fiches, affichage des 60 photos.

## Modifications / fichiers
- Ajout de ce rapport uniquement.

## État Git
- Voir le commit de ce rapport ; branche synchronisée avec `origin`.

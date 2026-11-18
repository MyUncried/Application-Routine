# 2026-11-18 — ILLUSTRATIONS-60 — lot de 5 fiches (FIT-YOG-004 → REED-004)

## Identifiant et objectif

- Mission : `ILLUSTRATIONS-60-LOT-06` (lot suivant les 30 illustrations déjà versionnées ; numéro de lot indicatif).
- Objectif : produire, sauvegarder et rattacher les 5 premières illustrations manquantes, dans l'ordre alphabétique des noms de fiches, du catalogue `kodjo.pilote-60`.

## Branche et commit de départ

- Branche : `assets/illustrations-60-20261117` (désignée explicitement par l'utilisateur).
- Commit de départ : `3ce49892789e2a8a6f93315e24a59a9b09071c41` (`Catalogue : FIT-CRO-009`).

## Périmètre demandé

Audit dépôt/Figma, puis génération, sauvegarde unitaire, rattachement et suivi de 5 fiches maximum.

## Périmètre réellement traité

### Audit

- Catalogue : `catalogue/catalogues/kodjo-pilote-60.catalogue.json`, 60 fiches (`sheets[]`, identifiant `sheetId`, nom `content.name`).
- Suivi existant réutilisé : `catalogue/illustrations/suivi.json` (60 entrées). Au départ : 30 « versionnée », 30 « en attente ».
- Fichiers présents : 30 `.webp` dans `catalogue/illustrations/20261117/` (+ `REED-001.json`, `REED-002.json`, sauvegardes historiques). Contrôle : les 30 médias intégrés au catalogue (`media[].url` en `data:image/webp;base64`) sont identiques octet pour octet aux fichiers `.webp` (0 écart).
- Modèle de rattachement : `media[]` de la fiche, `kind=PHOTO`, `storage=EMBEDDED`, `rightsStatus=PERMISSION_CONFIRMED` ; lecture côté application dans `src/features/catalogue/importedMovements.ts:79` (filtre sur ces trois champs). Aucune évolution du modèle nécessaire.
- Style : références relues dans le dépôt (FIT-YOG-005, REED-009, etc.) — photo réaliste, même femme brune à queue de cheval, débardeur anthracite, legging gris, baskets noires, fond gris clair, tapis anthracite, phases côte à côte séparées par un trait blanc vertical, sans texte ; format majoritaire 1206 × 987.
- Figma `G6RY5Ebhgwb4AHIOYDwwvg` : session ouverte, liste des pages lue (dont `510:101 Prototype MVP`). Le contenu détaillé de la page n'a pas été parcouru (volume) ; le style retenu repose sur les 30 illustrations déjà validées du dépôt.

### Lot (ordre alphabétique, 5 premières fiches sans illustration)

| sheetId | Nom | Fichier | Commit illustration | Commit rattachement |
|---|---|---|---|---|
| FIT-YOG-004 | Marjaryasana (chat) | `catalogue/illustrations/20261117/FIT-YOG-004.webp` | `598c427abd2720651368e6ee108eb687b9960aee` | `5f144daac2194415f6146d618cb0f42934e75e01` |
| FIT-STR-007 | Ouverture des pectoraux assis | `catalogue/illustrations/20261117/FIT-STR-007.webp` | `a4595c06d30ecd49b38650b92a262b04ac4d9f5d` | `aae7f5e8adce76b1fd883aa2b305a3c9d6cd19ef` |
| FIT-STR-006 | Papillon (adducteurs) | `catalogue/illustrations/20261117/FIT-STR-006.webp` | `a181e5a04dc8404b781367d63e50f90eb802e992` | `20553c04135ae87c69663e0c952a25cec11a70eb` |
| REED-003 | Pendulaire d'épaule | `catalogue/illustrations/20261117/REED-003.webp` | `fa1015d34f1dd26b72da8a2535b9ff1f62f9a802` | `79fe7854b891a20795face7493fa858820975e6d` |
| REED-004 | Placement des omoplates | `catalogue/illustrations/20261117/REED-004.webp` | `b25a1c4b851dd434c5e8fa992ca70039474e7f31` | `35baea8300db088509dfc3f2e10ee8a62bb60b93` |

Procédure par fiche : génération (Figma `generate_image`, modèle `gpt-image-2.5-flare`, fichier d'atelier séparé `u3iM9kbt5TfSLU9tGfH3RN` pour ne pas modifier la maquette produit) → contrôle visuel → conversion WebP 1206 × 987 (recadrage central, qualité 80) → commit + push → vérification que `origin/<branche>` = HEAD local et que le blob distant du fichier = blob local → rattachement (`media[]`, révision de fiche +1, entrée d'historique, révision catalogue +1, suivi) → vérification des octets intégrés = fichier → commit + push → même vérification distante. Aucune fiche n'a été commencée avant la vérification distante de la précédente.

Générations : 6 au total (1 par fiche, 2 pour REED-004 — la première, omoplates masquées et phases indiscernables, a été écartée et n'est pas versionnée).

## Constats

- 35/60 illustrations versionnées et rattachées après ce lot (30 avant).
- Le mécanisme de rattachement existant suffit ; aucun changement de code.

## Preuves et tests

- Vérification distante après chaque push : sortie `VERIFIED <commit> <chemin> <blob>` pour les 10 commits.
- Égalité octets intégrés / fichier contrôlée pour chaque fiche avant commit.
- `npx jest src/domain/catalogue src/features/catalogue` : 160 réussis, 26 échoués. Les **mêmes 26 tests échouent avec le catalogue du commit de départ** `3ce4989` (ensemble des tests en échec identique) : échecs préexistants, non introduits par ce lot (probablement liés aux révisions déjà incrémentées sur cette branche ; non investigué, hors périmètre).

## Hypothèses non démontrées

- La mention de licence `Utilisation et affichage aux utilisateurs dans KODJO autorisés par Hermann le 18 novembre 2026.` et `rightsStatus=PERMISSION_CONFIRMED` ont été reprises du lot précédent ; leur extension aux nouvelles illustrations est supposée, à confirmer par Hermann.
- Exactitude technique des postures évaluée par contrôle visuel de l'agent, pas par un professionnel.

## Anomalies par fiche

- REED-003 : la fiche décrit trois balancements (avant/arrière, droite/gauche, cercles) ; seuls la position de départ et le balancement avant sont représentés (impossible à distinguer sans flèches ni texte). Inclinaison du buste modérée.
- REED-004 : cadrage de dessus tête-hanches (corps non entier), différent des autres fiches ; paumes vers le haut.
- FIT-STR-006 : position des pieds de la phase de départ peu nette.
- Tous : rendu sur appareil non vérifié.

## Modifications réalisées / fichiers modifiés

- Ajoutés : `catalogue/illustrations/20261117/{FIT-YOG-004,FIT-STR-007,FIT-STR-006,REED-003,REED-004}.webp`.
- Modifiés : `catalogue/catalogues/kodjo-pilote-60.catalogue.json` (5 fiches, révision catalogue 32 → 37), `catalogue/illustrations/suivi.json`.
- Ajouté : ce rapport.
- Synchronisation code/documentation : classe D (données de catalogue, aucun comportement modifié) ; aucun document à mettre à jour.

## Hors périmètre / non corrigé

- 26 tests catalogue en échec préexistant.
- Fichier d'atelier Figma `u3iM9kbt5TfSLU9tGfH3RN` (brouillons) conservé ; peut être supprimé par l'utilisateur.

## À vérifier sur appareil réel

Affichage des 5 photos sur la fiche mouvement installée (iPhone).

## Prochain lot

FIT-CRO-005 Push press, FIT-PIL-002 Roll Up, FIT-PIL-004 Rolling Like a Ball, FIT-HYR-005 Rowing (rameur), FIT-HYR-007 Sandbag walking lunges.

## Commit final et état Git

Voir le commit qui contient ce rapport (message `Rapport : lot illustrations FIT-YOG-004 → REED-004`) ; état attendu : branche synchronisée avec `origin`, arbre propre.

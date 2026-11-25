# 2026-11-25 — MARQUAGE-PHOTOS-WEB — étape de marquage des photos dans l'administration Web (D-600)

## Identifiant et objectif
- Mission `MARQUAGE-PHOTOS-WEB` : produire le rectangle de la vue retenue de chaque photo du catalogue
  (DSF `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` § 1 et § 3, sur `origin/docs/planification-grille-creneaux` ;
  D-600 côté code) : détection, page de vérification, propositions pour les 60 fiches.

## Branche et commit de départ
- Worktree `C:\Dev\KODJO-MARQUAGE-WEB`, branche `feat/marquage-photos-web-20261125`, départ `e7c6813f`
  (contrat `CatalogueMedia.view` déjà livré, non modifié).

## Périmètre demandé / traité
1. Module pur de détection + tests `node:test` — fait (`tools/catalogue-admin/viewDetection.js`, `viewDetection.test.mjs`, 11 tests).
2. Page : galerie de la fiche (surimpression, Proposer, Accepter, Image entière, 4 champs, glisser et redimensionner) et onglet
   « Marquage des photos » (accessible aussi depuis l'onglet Catalogue, section « Avant publication ») — fait (`viewMarking.js`,
   `media.js`, `app.js`, `index.html`, `styles.css`, `server.mjs` : deux fichiers statiques ajoutés à la liste blanche).
3. Propositions pour les 60 fiches — fait (`propose-views.mjs`, appliqué à `catalogue/illustrations/kodjo-pilote-60.illustre-v3.json`).
4. README de l'outil — section « Marquage des photos ».

## Constats
- Fichier lu par l'application : le catalogue illustré `catalogue/illustrations/kodjo-pilote-60.illustre-v3.json` (60 photos WebP
  intégrées, format 3.0.0, révision 67), copié localement sur le fichier servi pour la recette (rapport
  `2026-11-19_ILLUSTRATIONS-60-INTEGRATION-EMOM.md`). `catalogue/catalogues/kodjo-pilote-60.catalogue.json` (versionné) n'a aucun média
  et sert de fixture aux tests : non modifié.
- Décodage WebP : WIC de Windows (`System.Windows.Media.Imaging.BitmapDecoder`) → PNG temporaires → `pngjs`. 60/60 décodés (1206 × 987).
- Les cinq illustrations refaites au gabarit 1206 × 987 (FIT-CRO-003, FIT-CRO-007, FIT-CRO-008, FIT-HYR-004, FIT-YOG-005) ont un bandeau
  gris uni au-dessus des vues : leurs séparations blanches ne vont pas jusqu'au bord. Une marge de bord unie (écart de luminance ≤ 10,
  au plus 15 % de la dimension) est donc ignorée ; les vues s'arrêtent à cette marge.
- Résultat : 43 images à deux vues, 10 à trois vues (dont 4 « deux en haut, une en bas » : FIT-STR-003, FIT-PIL-006, REED-005, REED-007),
  7 images simples — identique au décompte de l'essai de Hermann (DSF § 3).
- FIT-CRO-010 : aucune fausse séparation avec la détection « bande blanche » (les montants sont noirs) ; deux vues, la droite retenue.

## Propositions (x ; y ; largeur ; hauteur, en %)

| Fiche | Vues | Vue retenue | Remarque |
|---|---|---|---|
| REED-001 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| REED-002 | 2 | 50.17 ; 0 ; 49.67 ; 100 | |
| REED-003 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| REED-004 | 2 | 50.41 ; 0 ; 49.59 ; 100 | |
| REED-005 | 3 | 0 ; 56.33 ; 100 ; 43.67 | deux en haut, une en bas |
| REED-006 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| REED-007 | 3 | 0 ; 46.1 ; 100 ; 53.9 | deux en haut, une en bas |
| REED-008 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| REED-009 | 2 | 50.25 ; 0.1 ; 49.75 ; 99.9 | |
| REED-010 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-CRO-001 | 2 | 50.33 ; 0 ; 49.67 ; 100 | |
| FIT-CRO-002 | 2 | 50.25 ; 0.1 ; 49.75 ; 99.9 | |
| FIT-CRO-003 | 2 | 50.25 ; 8.51 ; 49.75 ; 91.49 | bandeau gris en haut exclu |
| FIT-CRO-004 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-CRO-005 | 3 | 33.25 ; 0 ; 33.58 ; 100 | trois vues de largeur quasi égale : centrale |
| FIT-CRO-006 | 3 | 33.17 ; 0 ; 33.5 ; 100 | trois vues de largeur quasi égale : centrale |
| FIT-CRO-007 | 3 | 26.12 ; 9.32 ; 45.27 ; 90.58 | bandeau gris exclu ; centrale nettement la plus large |
| FIT-CRO-008 | 2 | 50.25 ; 9.73 ; 49.75 ; 90.17 | bandeau gris exclu |
| FIT-CRO-009 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-CRO-010 | 2 | 50.33 ; 0 ; 49.67 ; 100 | faux positif connu non reproduit ; à vérifier |
| FIT-HYR-001 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-HYR-002 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-HYR-003 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-HYR-004 | 2 | 50.25 ; 7.7 ; 49.75 ; 92.3 | bandeau gris exclu |
| FIT-HYR-005 | 2 | 50.33 ; 0 ; 49.67 ; 100 | |
| FIT-HYR-006 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-HYR-007 | 2 | 50.33 ; 0 ; 49.67 ; 100 | |
| FIT-HYR-008 | 3 | 32.67 ; 0 ; 33.67 ; 100 | trois vues de largeur quasi égale : centrale |
| FIT-HYR-009 | 1 | image entière | |
| FIT-HYR-010 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-PIL-001 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-PIL-002 | 3 | 33 ; 0 ; 34.08 ; 100 | centrale la plus large (écart faible) |
| FIT-PIL-003 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-PIL-004 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-PIL-005 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-PIL-006 | 3 | 0 ; 49.95 ; 99.92 ; 50.05 | deux en haut, une en bas |
| FIT-PIL-007 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-PIL-008 | 3 | 66.92 ; 0 ; 33.08 ; 100 | trois vues de largeur quasi égale : la plus à droite |
| FIT-PIL-009 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-PIL-010 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-YOG-001 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-YOG-002 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-YOG-003 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-YOG-004 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-YOG-005 | 2 | 50.33 ; 9.73 ; 49.67 ; 90.17 | bandeau gris exclu |
| FIT-YOG-006 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-YOG-007 | 2 | 50.17 ; 0 ; 49.83 ; 100 | |
| FIT-YOG-008 | 2 | 50.33 ; 0 ; 49.67 ; 100 | |
| FIT-YOG-009 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-YOG-010 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-STR-001 | 2 | 44.11 ; 0 ; 55.8 ; 100 | vues inégales (gauche 43,5 %) |
| FIT-STR-002 | 1 | image entière | |
| FIT-STR-003 | 3 | 0 ; 49.14 ; 99.92 ; 50.86 | deux en haut, une en bas |
| FIT-STR-004 | 1 | image entière | |
| FIT-STR-005 | 1 | image entière | |
| FIT-STR-006 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-STR-007 | 2 | 50.25 ; 0 ; 49.75 ; 100 | |
| FIT-STR-008 | 1 | image entière | |
| FIT-STR-009 | 1 | image entière | |
| FIT-STR-010 | 1 | image entière | |

Cas douteux à regarder en priorité : FIT-CRO-005, FIT-CRO-006, FIT-HYR-008, FIT-PIL-008 (trois vues de même largeur à 1 % près :
« la plus large » ne départage pas vraiment ; règle de départage appliquée : la plus grande, puis la plus à droite), FIT-PIL-002 (écart
de 1,4 %), FIT-CRO-010 (faux positif connu), les cinq images à bandeau gris (marge exclue de la vue), les quatre « deux en haut, une en bas ».

## Preuves et tests
- `node --test "tools/catalogue-admin/*.test.mjs"` : 44 réussis, 0 échec (33 existants dont `server.test.mjs`, + 11 de détection).
  Remarque : sous Node 24, `node --test tools/catalogue-admin/` (dossier) échoue (« Cannot find module ») ; utiliser le motif ci-dessus.
- `propose-views.mjs --write` : contrôle intégré (fichier sans les clés `view` identique à l'original, parseur partagé OK, sérialisation de
  référence) ; `git diff` : 53 blocs `"view"` ajoutés et la virgule de la ligne `rightsStatus` précédente, rien d'autre.
- Contrôle ponctuel hors dépôt (jsdom + serveur sur copie temporaire) : galerie affichant la vue, champ x modifié, « Image entière »
  (clé retirée), puis `PUT` accepté par le serveur (200, révision de la fiche calculée).
- Vérification visuelle des vues retenues sur une planche des 15 cas notables (lecture d'images par l'agent, pas une validation produit).
- Aucun TypeScript modifié : Jest non lancé.

## Hypothèses non démontrées
- Onglet « Marquage des photos » (app.js) non exercé dans un navigateur ; seuls la galerie et l'enregistrement l'ont été (jsdom).
- Le glisser / redimensionner (événements pointeur) n'a pas été exercé.

## Éléments non traités / limites
- **Révisions** : traité, voir la section « Révisions » ci-dessous (la première livraison `36817e9b` n'ajoutait que les clés `view`).
- **« Vérifiée »** n'existe pas dans le format (contrat inchangé) : noté dans le navigateur (`localStorage`), perdu avec les données du
  navigateur ou sur un autre poste.
- La page n'ouvre que `catalogue/catalogues/*.catalogue.json` : pour vérifier le catalogue illustré, le copier à cet emplacement (sans le
  committer), comme pour la recette.
- Le script de lot est Windows uniquement (WIC).

## Révisions (suite demandée par le coordinateur, 25/11)
- Constat bloquant confirmé : `src/domain/catalogue/catalogueLoadPlan.ts` l. 404-407 — même révision et empreinte différente ⇒
  `INCOHERENT_REVISION` sur le téléphone. La livraison `36817e9b` (clés `view` sans révision) aurait donc été refusée.
- `propose-views.mjs` applique désormais les vues par `applyFileEdit` (`catalogueEditing.ts`), comme `server.mjs` à l'enregistrement.
  Métadonnées identiques à celles du serveur sans auteur déclaré (`editMeta`) : auteur `null`, date du moment (ISO), résumé
  « Marquage des photos : vue retenue proposée ». Fonction exportée `applyViewsWithRevisions`, avec contrôles : seules changent la clé
  `view` des photos visées, la révision et l'historique (une entrée ajoutée, préfixe identique) des fiches concernées, et la révision du
  catalogue (que `applyFileEdit` avance dès que le fichier change).
- Catalogue illustré régénéré depuis son contenu d'avant `36817e9b` (`git checkout 36817e9b^ -- <fichier>`, puis `--write`), en un nouveau
  commit, sans réécriture d'historique : **53 fiches révisées** (révision + 1, ex. REED-001 5 → 6, entrée du 2026-11-25), 7 fiches sans vue
  inchangées (FIT-HYR-009, FIT-STR-002, 004, 005, 008, 009, 010), révision du catalogue 67 → 68. Mêmes vues que dans le tableau ci-dessus.
- Vérification indépendante contre la version d'origine : `parseMovementCatalogueFile` valide (62 avertissements `UNKNOWN_OWNER`, comme
  avant) ; 53 fiches différentes, toutes uniquement par `view` + révision + historique ; 7 identiques ; reste du fichier identique hors
  révision du catalogue.
- Test `tools/catalogue-admin/propose-views.test.mjs` (4 tests) : révision incrémentée et entrée d'historique, fiche sans vue inchangée,
  vue retirée (image entière) révisée, même vue sans changement ni révision, photo inconnue refusée.
- `node --test "tools/catalogue-admin/*.test.mjs"` : 48 réussis, 0 échec.
- Côté page : l'enregistrement passe déjà par le serveur, qui révise toute fiche dont la vue change ; accepter une proposition déjà
  présente dans le fichier ne change rien et ne crée pas de révision (cohérent : même empreinte).

## Synchronisation code / documentation
- Classe A : la page et le script appliquent la règle écrite (DSF § 1 et § 3, D-600). README de l'outil mis à jour. Aucun autre document.

## Vérifications restant à faire
- Hermann : vérification une à une des 60 photos dans l'onglet « Marquage des photos » (après copie du catalogue illustré dans
  `catalogue/catalogues/`), en priorité les cas douteux ci-dessus.

## Fichiers modifiés
- `tools/catalogue-admin/viewDetection.js` (nouveau), `viewDetection.test.mjs` (nouveau), `viewMarking.js` (nouveau),
  `propose-views.mjs` (nouveau), `media.js`, `app.js`, `index.html`, `styles.css`, `server.mjs`, `server.test.mjs`, `README.md`.
- `catalogue/illustrations/kodjo-pilote-60.illustre-v3.json` (clés `view`, puis révisions et historique des 53 fiches marquées).
- Suite « Révisions » : `propose-views.mjs`, `propose-views.test.mjs` (nouveau), `README.md`, ce rapport.

## Commits
- `326a7b14` — code, tests, README. `36817e9b` — propositions dans le catalogue illustré (sans révision, remplacé). `91077053` — rapport.
- Suite « Révisions » : commit du script et du test, puis commit du catalogue régénéré et de ce rapport (voir `git log`).

## État Git
- Branche `feat/marquage-photos-web-20261125`, non poussée ; worktree propre après le commit du rapport.

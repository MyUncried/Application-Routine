# 2026-11-19 — ILLUSTRATIONS-60 — intégration à l'application EMOM pour la recette iPhone

## Identifiant et objectif
- Mission : `ILLUSTRATIONS-60-INTEGRATION-EMOM` — option A validée par l'utilisateur (« ok, vas y ») après le diagnostic `2026-11-19_ILLUSTRATIONS-60-DIAGNOSTIC-IPHONE.md` (branche `assets/illustrations-60-20261117`, commit `7c6f2fd`).
- Objectif : que l'application utilisée sur l'iPhone (branche EMOM) affiche les 60 illustrations et que la mise à jour du catalogue les installe.

## Branche et commit de départ
- Nouvelle branche `formats/emom-illustrations-20261119`, créée depuis `origin/formats/emom-amrap-deathby-20261118` @ `089be96`. Branche EMOM d'origine et branche des illustrations non modifiées ; aucune fusion.

## Modifications réalisées
1. `5912db6` — reprise de `6b1c957` (affichage de la photo du catalogue sur la fiche mouvement installée) : `src/features/activities/ActivityEditorForm.tsx`, `src/features/activities/MovementScreen.tsx`, `src/features/catalogue/importedMovements.ts`. Conflit résolu dans `importedMovements.ts` (ajout `installedReferences` de la branche EMOM et ajout `photo` conservés). `catalogue/illustrations/suivi.json` non repris.
2. `790dcb8` — `catalogue/illustrations/kodjo-pilote-60.illustre-v3.json` (sha256 `bef08e8a…df82c`) : catalogue des illustrations (`73ba1a9`) converti au format 3.0.0 par le parseur de la branche EMOM (`upgradeToV3`, reprise de la position de départ = révision 3, ou 4 pour le lot 1), puis une révision supplémentaire par fiche (`nextRevision`, résumé « Republication de l'illustration au format 3.0.0 : nouvelle révision prolongeant celles déjà installées », 19/11/2026) : 56 fiches en révision 4 `[1,2,3,4]`, 4 fiches du lot 1 en révision 5 `[1..5]` ; catalogue révision 63. Le fichier est hors de `catalogue/catalogues/` (dossier servi) : voir « Constat sur les tests ».

## Constat sur les tests (cause des 26 échecs « préexistants » de la branche des illustrations)
- Les tests catalogue utilisent le fichier réel `catalogue/catalogues/kodjo-pilote-60.catalogue.json` comme fixture (révision 1). Le remplacer par le catalogue illustré fait échouer 33 tests Jest et 3 tests de l'administration sur la branche EMOM. C'est aussi la cause des 26 échecs constatés sur la branche des illustrations, jusqu'ici qualifiés de préexistants sans analyse.
- Décision technique (classe D) : le catalogue illustré est versionné à part et copié localement sur le fichier servi pour la recette, sans être committé à cet emplacement.

## Preuves et tests
- `npx tsc --noEmit -p .` : aucune erreur.
- `npx jest src/domain/catalogue src/features/catalogue src/features/activities` : 1 163 réussis, 0 échec (avec la reprise de code, catalogue servi d'origine) ; référence branche EMOM : 1 163 / 0.
- `node --test tools/catalogue-admin/server.test.mjs tools/catalogue-admin/installation.test.mjs` : 33 / 0 (référence : 33 / 0).
- Catalogue illustré : `parseMovementCatalogueFile` OK (format 3.0.0, 62 avertissements `UNKNOWN_OWNER` comme auparavant), `diffusableCatalogue` OK (60 fiches, aucune retenue), 60/60 photos identiques octet pour octet aux fichiers WebP de `assets/illustrations-60-20261117`.
- Application manuelle (non exécutée) de la règle de `catalogueLoadPlan.ts` : toute révision installée de 1 à 4 (1 à 4 pour le lot 1) figure dans l'historique reçu → « nouvelle révision » proposée.

## Synchronisation code / documentation
- Reprise d'un comportement existant (`6b1c957`) : la fiche d'un Mouvement installé affiche la photo de catalogue (PHOTO intégrée, droits confirmés) quand le Mouvement n'a pas de média local et que son contenu est verrouillé. Aucune règle écrite trouvée (recherche « illustration », « photo du catalogue » dans `docs/Specifications-fonctionnelles/`) : **classe C — à clarifier** (priorité média local / photo de catalogue). Aucun document modifié.

## Hypothèses non démontrées
- Révisions réellement installées sur l'iPhone (au plus 4, ou 5 pour le lot 1) : déduites, non observées.
- L'iPhone exécute l'application servie par Metro depuis `C:\Dev\KODJO-FORMATS` (rechargement suffisant, aucune dépendance native ajoutée).

## Vérifications restant sur appareil réel
- Mise à jour proposée pour les 60 fiches, acceptation, affichage des photos sur les fiches.

## Éléments hors périmètre
- Aucun test ajouté pour l'affichage de la photo (absent aussi de `6b1c957`).
- Fixture des tests liée au catalogue réel : à découpler si le catalogue illustré doit devenir le fichier servi versionné.

## État Git
- Voir le commit de ce rapport ; branche poussée sur `origin`.

## Suite — 14 fiches « archivées ou supprimées » sur l'iPhone (19/11, 01:50)
- Après désinstallation puis réinstallation de la bibliothèque par l'utilisateur : 46 fiches installées en révisions 4 et 5 (19/11, version illustrée, constaté sur Pendulaire d'épaule et Chien tête en bas) ; 14 fiches en « Archivé ou supprimé sur ce téléphone » (état `WITHDRAWN_LOCALLY` : registre conservé, Mouvement archivé ou absent) : Demi-squat, Équilibre sur un pied, Bird-dog, Air squat, Front squat, Burpee, Box jump, Burpee broad jump, Balasana, Bitilasana, Bhujangasana, Étirement du quadriceps sur le côté, Étirement fessier en figure quatre, Papillon.
- Leur registre conserve l'ancienne révision 4 (version locale du 17-18/11). Après restauration depuis les archives, les 11 fiches hors lot 1 auraient reçu la révision 4 illustrée, incohérente avec elle. Ces 11 fiches passent en révision 5 (historique contenant 4) ; les 3 fiches du lot 1 (Air squat, Balasana, Bhujangasana) sont déjà en révision 5. Catalogue révision 64 ; 60 photos inchangées ; fichier revalidé par le parseur.
- Affichage des photos sur les 46 fiches installées : non confirmé à ce stade. L'erreur reçue montrait une application servie depuis `C:\Dev\KODJO-EMOM-DUREE`, et non depuis le dossier de cette branche.

## Constat sur iPhone (19/11, 01:50, captures de l'utilisateur)
- Fiche « Adho Mukha Svanasana » (révision 5) : la photo du catalogue s'affiche dans le gabarit photo de la fiche ouverte. Affichage confirmé sur appareil réel pour cette fiche.
- Liste des Mouvements (46) : vignettes vides. L'affichage reprend `6b1c957`, qui ne couvre que la fiche ouverte et pas la vignette de la liste (comportement non spécifié, classe C).
- Les 5 illustrations au format 1800 × 600 (FIT-YOG-002, FIT-CRO-001, FIT-YOG-003, FIT-YOG-006, REED-010) s'affichent en bandeau réduit dans le gabarit 402 × 329 (mode `contain`). Les autres sont au gabarit 1206 × 987.
- Restauration des 14 fiches archivées et mise à jour en révision 5 : en attente.

## Suite — vignettes et bandeaux (demande de l'utilisateur : « oui, les deux »)

### Vignette du Catalogue des Mouvements — `70b206d0`
- Demande de Hermann, recopiée : « Je vois des photos quand j'ouvre la fiche, mais pas la miniature ».
- `catalogueIllustrationsByMovement()` (`src/features/catalogue/importedMovements.ts`) lit en une seule fois les photos de catalogue des fiches installées. `useMovementCatalogue` (`MovementCatalogueList.tsx`) les charge avec les entrées. La vignette de la liste (`MovementCatalogueCard`) et celle de la grille (`MovementGridCard`) affichent la photo de catalogue quand le Mouvement n'a aucun média local ; un média local reste prioritaire, comme sur la fiche ouverte. Registre indisponible : vignettes sans photo de catalogue, Catalogue chargé normalement.
- `jest.setup.js` : simulacre complété. Nouveau test `src/features/activities/__tests__/MovementCatalogue.illustration.test.tsx` (liste, grille, priorité au média local, registre indisponible) : 3/3.
- `npx tsc --noEmit -p .` : aucune erreur. `npx jest src/domain/catalogue src/features/catalogue src/features/activities src/features/sessions` : 2 988 réussis, 1 échec dans `CompositionScreen.test.tsx` (« D-442 — a card step that removes a point… »). Relancé seul : 430/430 avec la modification, et 430/430 sans elle (échec intermittent, sans lien avec la vignette).
- Synchronisation documentaire : classe C (vignette de la photo de catalogue non spécifiée, à clarifier), aucun document modifié.

### Cinq illustrations refaites au gabarit 1206 × 987
- FIT-YOG-002, FIT-CRO-001, FIT-YOG-003, FIT-YOG-006, REED-010 : bandeaux 1800 × 600 à trois positions (départ, mouvement, retour) remplacés par deux phases (départ, mouvement) au gabarit des 55 autres. Six générations, dont une écartée pour REED-010 (orientation inversée entre les phases et jambe au-dessus de la hanche).
- Branche `assets/illustrations-60-20261117` : commits d'illustration `88dc9eb`, `e4e1487`, `ab32779`, `5ea4b70`, `4c9dca7`, chacun suivi d'un commit de catalogue (révision de fiche +1, suivi mis à jour), tous vérifiés sur `origin`. Contrôle final : 60/60 photos au format 1206 × 987, octets intégrés identiques aux fichiers, catalogue 2.0.0 en révision 67.
- Catalogue de recette 3.0.0 (`catalogue/illustrations/kodjo-pilote-60.illustre-v3.json`) : photos remplacées pour ces 5 fiches, qui passent en révision 6 (historique contenant 4 et 5) ; catalogue en révision 65 ; 60/60 photos identiques aux fichiers ; fichier revalidé par le parseur.
- Remarque : sur REED-010, le bout des doigts de la main tendue touche le bord droit de l'image.

## Suite — une seule notion de médias (décisions de Hermann du 19/11/2026)

Classe B. Décision recopiée : « Je n'ai jamais exprimé le besoin d'avoir les médias d'une part et la photo d'autre part. Dans mon esprit c'était toujours la même chose » ; puis « Fais les deux ».

### Diagnostic
- Une photo ajoutée sur le téléphone est un fichier `kodjo-media/<uuid>` relié au Mouvement (`movement_media`). Fiche, Catalogue des Mouvements et Formats lisent cette seule liste (D-264).
- `projectSheetToMovement` installe le Mouvement avec `media: []` depuis l'intégration du chargement de catalogue (10-11/11, CA-3). La photo de la fiche restait dans le registre, invisible des écrans. Les deux contournements du 19/11 (photo sur la fiche, `5912db6` ; vignette, `70b206d0`) ne couvraient pas les Formats.

### Modifications
- `8a7792aa`, `42ccde18` : retour des deux contournements.
- `097fd18c` : `src/domain/catalogue/catalogueMedia.ts` (photos intégrées aux droits confirmés → fichiers ; identité d'asset `catalogue-<empreinte du contenu>` ; médias de la fiche en tête, autres médias du Mouvement conservés). `src/infrastructure/media/CatalogueMediaWriter.ts` (écriture base64 par `File.write` d'Expo 57 sous `kodjo-media/`, fichier existant non réécrit). `CatalogueLoadService` : installation, adoption, mise à jour (y compris photo seule changée) et reprise après interruption comparent et écrivent les médias. Écrivain branché dans `CatalogueLoadScreen.tsx` et `useLibraryServices.ts`.
- Lecture seule A-2 vérifiée : `MovementCatalogueService.update` refuse (`PROTECTED`) l'écriture d'un Mouvement importé ; seul `updateFromSource` (chargement) l'écrit.
- `61ff1165` : documentation. Chapitre 04 ; chapitre 03 (Espace en étoile) ; registre (KIN-01 et nouvelle section « Médias du Mouvement — une seule notion ») ; format catalogue §9 ; modèle cible Étape 2 (MOUV-D2, point 5, partage personnalisé). Décisions du partage recopiées : retrait par le destinataire « Oui » ; nouvelle version « La conserve » ; limite de taille « À CLARIFIER » après comparatif.
- Catalogue de recette : nouvelle révision des 60 fiches (révision du catalogue 66) pour que les Mouvements déjà installés sans média reçoivent leur photo.

### Preuves
- `npx tsc --noEmit -p .` : aucune erreur.
- `src/features/catalogue/__tests__/catalogueMedia.sqlite.test.ts` (vrais fichiers temporaires, SQLite réelle) : 6/6. Couvre la sélection des photos, l'ordre, l'installation, la mise à jour de la photo seule, une fiche installée sans média puis révisée, et l'absence de réécriture d'une photo identique.
- `npx jest src/domain src/features src/infrastructure` : 5 990 réussis, 0 échec. Administration (`node --test`) : 33/33.

### Non démontré / reste à faire
- Rendu sur iPhone non vérifié.
- Médias distants et vidéos de fiche (MOUV-D2, chargement à la demande) : non implémentés.
- Partage personnalisé : cible documentée, non développé.
- Les assets `catalogue-*` remplacés lors d'une mise à jour ne sont pas supprimés (règle existante : aucun fichier supprimé).

### Comparatif — taille d'une vidéo transmise (demande de Hermann du 19/11/2026, pour décision)
Sources consultées le 19/11/2026. Ce sont en majorité des pages d'aide d'éditeurs et des articles tiers ; les chiffres non officiels sont signalés.

| Application | Limite publiée | Remarque |
|---|---|---|
| WhatsApp | 2 Go en « document » ; vidéo envoyée comme média : 16 Mo ou ≈ 100 Mo selon les sources, compressée | chiffres contradictoires, aide officielle non vérifiée |
| Telegram | 2 Go (4 Go en Premium), aucune limite de durée | articles tiers concordants |
| iMessage / Signal | ≈ 100 Mo, compression au-delà | non officiel |
| Medbridge (kiné) | 512 Mo par vidéo personnalisée | aide de l'éditeur |
| Physitrack (kiné) | non publiée ; compression avant envoi sur iPhone | aide de l'éditeur |
| CoachRx | 500 Mo, durée conseillée 15 à 60 s | aide de l'éditeur |
| TeamBuildr | 128 Mo (≈ 60 s en 4K) | aide de l'éditeur |
| BridgeAthletic | 85 Mo | aide de l'éditeur |
| CloudFit | 20 s | aide de l'éditeur |
| Trainerize | non publiée ; pièce jointe client 1 min, messages vidéo 3 min | forum utilisateurs |

Lecture : les applications d'exercice visent des clips courts (15 à 60 s). Elles plafonnent entre 85 et 512 Mo et compressent souvent avant envoi. Les messageries vont jusqu'à 2-4 Go mais compressent les vidéos envoyées comme média. Aucune règle n'est décidée : la limite reste À CLARIFIER (D-335 ne fixe aucun plafond pour l'import local, pas pour la transmission).

## Suite — une seule copie de chaque photo sur le téléphone
- Décision recopiée : « Fait cette optimisation maintenant, je ne veux pas conserver deux photos sur le téléphone ».
- `MovementCatalogueFile.ts` : `embeddedMediaDigest` et `compactSheetMedia` (photo intégrée → `kodjo-embedded-digest:<cyrb53>-<longueur>`). `sheetFingerprint` représente la photo par son empreinte, ce qui donne la même valeur pour la fiche complète et pour l'instantané allégé. `cyrb53` est partagé avec `catalogueMedia.ts`.
- `catalogueLoadPlan.compareSheet` : comparaison sur instantanés allégés, donc pas de faux « média modifié ».
- `SqliteCatalogueRegistry` : schéma 5. Instantanés (`commit`) et opérations en cours (`beginPending`) enregistrés allégés. Migration des lignes existantes avec empreinte recalculée, sans sauvegarde (le contenu retiré est déjà un média du Mouvement). `migrateToSchema4` limité aux registres antérieurs au schéma 4.
- Limite connue : pendant l'application d'une Bibliothèque, `library_operations.file_json` contient temporairement le fichier complet ; la ligne est supprimée à la fin de l'opération. Les tables `*_backup_v3` (18/11) datent d'avant les photos.
- Tests : `catalogueMedia.sqlite.test.ts` 9/9 (dont registre sans `data:image` après installation, même fichier rechargé « à jour », comparaison par empreinte, migration du schéma 4). `npx jest src/domain src/features src/infrastructure` : 5 993/0. Administration : 33/33. `tsc` : aucune erreur.
- Documentation : registre (section « Médias du Mouvement — une seule notion ») et format catalogue §9.

## Suite — recette iPhone : 14 fiches « à examiner », attente du Catalogue, message qui ne s'efface pas
- **14 fiches à examiner** : état `WITHDRAWN_LOCALLY`. Règle documentée (format catalogue, tableau des états) : un Mouvement archivé ou supprimé localement n'est jamais réinstallé ni modifié. Restauration depuis les archives demandée à l'utilisateur ; s'il a été supprimé, seule voie actuelle : désinstaller puis réinstaller la Bibliothèque. Pas de changement de règle sans décision.
- **Attente d'environ 1/2 s (liste vide, indicateur circulaire)** : c'est le chargement des entrées, pas le décodage des photos. `MovementCatalogueService.listEntries` exécute une requête `countOccurrences` par Mouvement (`MovementCatalogueService.ts:152`), et ce code n'a pas été modifié par cette mission. Attribution aux photos non démontrée, durée sur appareil non mesurée. Optimisation proposée (comptage en une requête), non réalisée sans accord.
- **« Mouvement restauré » reste affiché** : cause démontrée en test. `TransientNotification` relançait son délai à chaque nouvelle fonction `onDismiss`, et le Catalogue lui en passe une nouvelle à chaque rendu (`() => setNotice(null)`). Correction : délai dépendant seulement du message et de la durée, dernière fonction appelée via une référence. Test ajouté : il échoue sans la correction et passe avec. Que le Catalogue se redessine en continu après une restauration est **plausible**, non observé sur l'appareil. Documentation : classe A (message temporaire, RM-010), aucun document modifié.
- Tests : `npx jest src` : 6 211 réussis, 0 échec ; `tsc` : aucune erreur.

## Suite — chargement du Catalogue des Mouvements, et confirmation des 60 photos
- Constat de Hermann : « J'ai les 60 photos, c'est ok » (rendu confirmé sur iPhone par l'utilisateur), puis « Fais cette optimisation ».
- `MovementRepository.countAllOccurrences` (facultatif) et `SqliteMovementRepository.countAllOccurrences` : une requête `GROUP BY source_movement_id`. `MovementCatalogueService.listEntries` l'utilise au lieu d'un `countOccurrences` par Mouvement ; sans elle, l'ancien calcul reste en repli. Comportement inchangé (classe D).
- Test ajouté (`occurrenceWithoutCopy.r3.test.ts`) : mêmes nombres que `countOccurrences`, Mouvement sans occurrence à 0, `listEntries` cohérent. `npx jest src` : 6 212/0 ; `tsc` : aucune erreur.
- Non mesuré : gain réel sur l'iPhone. Les familles de niveaux restent lues avec une requête par famille (`listGroup`).

## Suite — Demi-squat sans photo, lenteur générale
- **Demi-squat (REED-002)** : l'iPhone affiche « Révision 7 · installée le 17/11 · mise à jour le 18/11 », donc l'ancienne version locale de l'administration. Le catalogue publiait la révision 6 : l'application la classe « plus ancienne » (`OLDER_REVISION`) et la montre « à jour », sans l'installer. Correction : REED-002 en révision 8 avec un historique qui contient une entrée 7, décrite comme la révision locale non publiée du 17-18/11. Catalogue en révision 67, fichier revalidé, 60 photos.
- **Lenteur générale** : le Profil et la barre de navigation sont lents (déplacement saccadé), écrans sans photo de mouvement. L'attribution aux photos devient peu plausible. Hypothèse plausible, non démontrée : Metro est servi en mode développement depuis `C:\Dev\KODJO-FORMATS` (`npx expo start`), alors que le mode utilisé auparavant dans `C:\Dev\KODJO-EMOM-DUREE` n'est pas connu. Vérification proposée : `npx expo start --no-dev --minify`.
- **Demi-squat : résolu**, constaté par l'utilisateur sur l'iPhone (« demi-squat : résolu ») après la révision 8 (catalogue 67).
- **Mode de Metro** : l'URL du paquet chargé par l'iPhone (message « GO_BACK was not handled », reçu à 10:30) contient `dev=true` et le port 8082. L'application était donc servie en mode développement, et un autre Metro occupait le port 8081. Démarche transmise : fermer tous les Metro, puis `npx expo start --no-dev --minify` depuis `C:\Dev\KODJO-FORMATS`. Effet sur la lenteur : non encore constaté. Le message GO_BACK s'affiche seulement en développement et vient des écrans de Bibliothèque (`LibraryScreens.tsx`, retour après « Refuser »), non modifiés par cette mission.

## Suite — recette en mode optimisé et miniatures en mémoire
- Observations de Hermann avec `--no-dev --minify` : la barre de navigation, les listes, les fiches, les Bibliothèques, la séance et la composition sont redevenues fluides. Restent : une latence au passage Mouvements → Séances et au retour vers le Catalogue des Mouvements ; le cadre de la barre de navigation reste figé après Profil → Catalogue puis rattrape ; une latence Préférences → Profil.
- Hypothèse plausible, non démontrée : à chaque montage du Catalogue, les vignettes (64 à 87 pt) relisent et décodent la photo d'origine (1206 × 987), et le cache par défaut d'`expo-image` n'est pas en mémoire. C'est le même mécanisme que les icônes du 08/11 (`KodjoIcon.tsx`). La latence Préférences → Profil n'est pas expliquée.
- Correction validée (« Oui ») : `src/features/activities/photoThumbnails.ts`, miniature réduite à 288 px par `Image.loadAsync` (`maxWidth`/`maxHeight`), chargée une fois et gardée en mémoire pour la durée de l'application ; rien sur le disque. `MediaPreview` (vignettes du Catalogue, de la grille, des séances, de la composition et des cartes) affiche la place réservée pendant le premier chargement, puis la miniature, ou la photo d'origine si la miniature échoue. `useMovementCatalogue` précharge les miniatures de toute la liste. Sous Jest, simulateur global sans miniature (comportement antérieur) ; module testé à part.
- Tests : `photoThumbnails.test.tsx` 3/3. `npx jest src` : 6 215 réussis, 0 échec. `tsc` : aucune erreur. Gain réel non mesuré ; à juger sur l'iPhone. Classe D, aucun document modifié.

## Suite (20/11/2026) — prompt de partage sur l'administration web
- Demande de Hermann : un prompt réunissant les liens et informations sur le périmètre et les fonctionnalités de l'administration web (mouvements, Bibliothèques…), à partager avec Claude.
- Sources vérifiées sur GitHub : `tools/catalogue-admin/README.md` (sur `main` et sur `mouvement/conformite-fiche-20261118`, PR #444) ; `docs/KODJO-Format-catalogue-mouvements-v1.md` (§11 administration v2, §12 Wi-Fi, §13 format 3.0.0) ; `docs/KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md` (MOUV-ADM-20261117) ; registre (BIB-19 à BIB-23, décisions du 17/11) ; rapports CATALOGUE-AUTONOME, CATALOGUE-CONNECTE, MOUV-CONFORMITE-FICHE.
- Constat : le README de l'administration, sur la branche de la PR #444, décrit encore les champs du format 2 (position de départ, sources, fondement…), retirés par le format 3.0.0. Signalé dans le prompt, non corrigé (hors demande).
- Aucun fichier applicatif modifié ; aucun test applicable.

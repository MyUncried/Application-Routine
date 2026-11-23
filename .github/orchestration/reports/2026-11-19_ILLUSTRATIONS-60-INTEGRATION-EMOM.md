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

## Suite (20/11/2026) — Routine BMAD bloquée en version 31 ; branche réunie avec la planification
- Constat iPhone (18:25) : « Error: Database version 31 is newer than supported version 30 », Routine BMAD servie par le Metro de `C:\Dev\KODJO-FORMATS` (port 8081, `dev=false`). La base de Routine BMAD a été convertie en version 31 par le code de la planification (`planification/main-20261113`, `migration031`), très probablement lors de l'usage de l'agenda vers 18:12. La branche des formats et des photos, comme `main`, s'arrête à la version 30. Aucune donnée abîmée : refus d'ouverture.
- `migration031` (planification) est additive : tables `routines`, `routine_entries`, `routine_exclusions`, aucune table existante modifiée ; `migration030` identique à celle de `main`.
- Solution A choisie (branche réunie, sans perte) : branche `integration/bmad-planification-20261120` = `formats/emom-illustrations-20261119` + fusion de `origin/planification/main-20261113` (`b16add55`). Un seul conflit, dans le registre (deux sections ajoutées au même endroit : For time / repos et planification / rappel), résolu en gardant les deux. `DATABASE_VERSION` = 31.
- Module natif ajouté par la planification : `expo-notifications` (chargé au démarrage par `SessionServiceProvider.tsx` via `requireNativeModule`). Déduction : la build Routine BMAD le contient, puisqu'elle a exécuté le code de la planification jusqu'à la migration 031 (un module natif absent bloque le chargement). Plausible, non vérifié sur la build.
- Vérifications (dépendances installées dans le worktree) : `tsc` sans erreur ; `npx jest src app` : 6 299 réussis, 0 échec ; administration 33/33.

## Suite (20/11/2026) — build Routine BMAD et `.easignore`
- Constat iPhone (19:51) : « Cannot find native module 'ExpoPushTokenManager' ». Routine BMAD ne contenait pas `expo-notifications`. La déduction de la section précédente (« la build le contient ») était **fausse**. Choix de Hermann : « A », nouvelle build `development-bmad` depuis `integration/bmad-planification-20261120`, lancée par lui sur EAS (build `acdb2b02-386a-4dcd-92ca-62ea02fce11e`). Pendant cette build, une clé Apple de notifications push a été créée (« Yes » aux questions d'EAS) ; les rappels sont des notifications locales, et `app.config.js` retire le droit `aps-environment`.
- `.easignore` (demande de Hermann) : contenu de `.gitignore` repris, puisque EAS ne le lit plus quand `.easignore` existe, et ajout de `.github/`, `.claude/`, `docs/`, `openspec/`, `_bmad-output/`, `Revue-claude/`, `e2e/`, `tests/`, `tools/`, `scripts/`, `catalogue/catalogues/`, `catalogue/illustrations/`, `catalogue/admin/` et de trois fichiers racine. Hors `src/`, l'application n'importe que `catalogue/pilote/` et `catalogue/referentiels/` (`pilotMovementImport.ts`), qui restent inclus. Fichiers suivis : 300,2 Mo → 17,4 Mo.
- Preuve : copie du projet réduite aux seuls fichiers conservés, puis `APP_VARIANT=bmad npx expo export --platform ios` : paquet iOS produit (7,8 Mo), aucune erreur. La build native complète n'est pas rejouée ici : elle sera vérifiée par la prochaine build EAS.

## Suite (20/11/2026, soir) — « no such table: routines » sur Routine BMAD
- 21:42 : Routine BMAD servie par `C:\Dev\KODJO-PLANIF-CE12` (port 8083, seul Metro actif) → « no such table: routines ». 22:01 : servie par `KODJO-FORMATS` (branche réunie, port 8081, `dev=false`) → même erreur dans le Calendrier. La base principale se déclare en version 31 sans les tables des routines.
- Historique : sur `planification/main-20261113`, les routines étaient la migration **030** jusqu'au 13/11 (`e0f548bc`, `db338226`), puis la **031** après la fusion de `main` du 17/11 (`6ca16e62`), où `main` a pris la 030 pour les préférences du Catalogue. La 031 de `planification/ce-ui-12-20261118` (`0b056e1f`, branche locale `KODJO-PLANIF-CE12`) est identique à celle intégrée. Aucune version publiée sur GitHub ne produit une base en version 31 sans routines : **cause exacte indéterminée**. Il faudrait examiner le schéma réel de la base sur l'iPhone.
- Correction (classe D) : `repairMissingTables` dans `migrateDatabase.ts`. À l'ouverture d'une base déjà à jour, les tables additives absentes des migrations 030 (`catalogue_preferences`) et 031 (`routines`, `routine_entries`, `routine_exclusions` et leur index) sont créées telles que ces migrations les créent. Rien n'est modifié ni supprimé, `user_version` est inchangé. Test `repairMissingTables.test.ts` (tables supprimées puis recréées, version et données conservées ; base complète sans écriture). `tsc` sans erreur ; `npx jest src app` : 6 301/0.

## Suite — intégration de la planification la plus récente (`planification/ce-ui-12-20261118`)
- La branche locale `KODJO-PLANIF-CE12`, poussée par Hermann, a 48 commits de plus que `planification/main-20261113` (Agenda, Journal, cycle de vie des routines, enchaînement des séances, D-533 à D-542) et 0 de retard. Base en version **34** : 032 ajoute `routines.name`, 033 ajoute une table et un index (lien occurrence ↔ Exécution), 034 ajoute une table et `routines.archived_at`. `package.json` identique : aucun nouveau module natif.
- Fusion dans `integration/bmad-planification-20261120`. Conflits dans `migrateDatabase.ts` (imports, étapes 032 à 034, réparation) et dans le chapitre 12 (deux sections ajoutées au même endroit, les deux gardées).
- Réparation ajustée : elle s'exécute **avant** les migrations, car 032 et 034 modifient la table des routines. Les tables de 031 sont recréées seulement pour une base en version 31 exactement ; à partir de 32 la forme 031 ne suffit plus. Test : base en version 31 sans routines → tables recréées, puis 032 à 034 appliquées, schéma identique à une base neuve, données conservées.
- Demande de modification de l'écran Figma « PROG — 7 Catalogue des programmes » : retirée par Hermann (« erreur de message »), non traitée.
- Vérifications : dépendances réinstallées (`npm ci`) ; `tsc` sans erreur ; `npx jest src app` : 6 415/0 ; administration 33/33.

## Diagnostic du 20/11/2026 (22:50) — « Suppression impossible : utilisé par 51 exercices » avec 2 séances visibles

Constat (captures iPhone) : catalogue Séances = 2 séances ; un Mouvement archivé ne peut pas être supprimé (« utilisé par 51 exercices »).

Analyse du code (branche `integration/bmad-planification-20261120`, sans modification applicative) :
- `SqliteMovementRepository.deleteArchived` compte **toutes** les lignes `activities` du Mouvement (`countMovementOccurrences`), séances archivées comprises ; l'archivage d'un Mouvement, lui, ne compte que les séances actives (`countMovementActiveOccurrences`, décision PRE-9 du 03/11/2026). C'est pourquoi le Mouvement a pu être archivé mais pas supprimé.
- Un exercice ne peut pas survivre à sa séance : `activities.session_id` → `sessions(id) ON DELETE CASCADE`, et la migration 016 a supprimé les orphelins. Les 51 exercices appartiennent donc à des séances encore en base.
- Le catalogue Séances n'affiche par défaut que les séances **actives** (`sessionCatalogueFilters.ts` : aucun statut choisi = Actives). Les séances « supprimées » par balayage sont en réalité archivées ; la suppression définitive se fait depuis le filtre Archivées (`SqliteSessionRepository.deleteArchived`).

Attribution : **plausible** (séances archivées non affichées) — non démontrée faute d'accès à la base du téléphone ; autre cause théorique : séances d'un autre `owner_id`, non observée.

Vérification proposée à l'utilisateur : Séances → Filtres → Statut « Archivées » ; supprimer définitivement les séances inutiles ; puis supprimer les Mouvements archivés. Aucun test exécuté (aucune modification de code).

### Suite (20/11/2026, 23:10) — « je n'ai aucune séance archivée » : cause réelle et correction

L'hypothèse précédente (séances archivées) est **écartée** par l'utilisateur.

**Cause (mécanisme démontré dans le code ; nombre exact de lignes sur le téléphone non vérifiable d'ici) :**
- `ExpoDatabase.withExclusiveTransactionAsync` déléguait à expo-sqlite 57.0.1, dont `Transaction.createAsync` ouvre une **nouvelle connexion** (`useNewConnection: true`, `node_modules/expo-sqlite/src/SQLiteDatabase.ts`). Les pragmas `STANDARD_PRAGMAS` (dont `foreign_keys = ON`) n'étaient appliqués qu'à la connexion principale (`openExpoDatabase`). Toutes les écritures de l'appareil s'exécutaient donc **clés étrangères désactivées** : `DELETE FROM sessions` (suppression d'une Séance) n'emportait ni Exercices, ni Circuits, ni Cycles, ni Points d'arrêt.
- Le comptage `countMovementOccurrences` compte ces Exercices orphelins → « utilisé par 51 exercices ».
- Les tests (`NodeSqliteDatabase`, connexion unique, `foreign_keys = ON`) appliquaient la cascade : le défaut était invisible en Jest.

**Historique :** mécanisme présent depuis le premier adaptateur `ExpoDatabase` (au plus tard `d3e4f14d`, 26/10/2026). Symptôme déjà détecté le 29/10 (« base d'appareil abîmée… écrite clés étrangères désactivées », `162a5069`, migration 016 : orphelins supprimés une fois sur décision de Hermann) sans que la cause soit identifiée ; les suppressions de Séances postérieures ont recréé des orphelins. Introduction : 26/10 ou avant ; détection : 29/10 puis 20/11. Attribution : **démontrée** pour le mécanisme ; **plausible** pour les 51 exercices précis (base du téléphone non lue).

**Correction (branche `integration/bmad-planification-20261120`) :**
- `src/infrastructure/database/ExpoDatabase.ts` : la transaction exclusive ouvre elle-même la connexion dédiée (`openDatabaseAsync(nom, {…options, useNewConnection: true}, dossier)`), applique `CONNECTION_PRAGMAS` (`foreign_keys = ON`) **avant** `BEGIN`, puis `COMMIT`/`ROLLBACK` et fermeture — même séquence qu'expo-sqlite. Repli sur la transaction d'origine si la base n'a pas de chemin (`:memory:`, doubles de test).
- `src/infrastructure/database/constants.ts` : `CONNECTION_PRAGMAS`.
- `src/infrastructure/database/repairOrphanRows.ts` (nouveau) + appel dans `migrateDatabase` (version courante seulement) : au démarrage, retire les lignes orphelines de l'arbre des Séances (`cycles`, `tours`, `activities`, `session_stop_points`) exactement comme `ON DELETE CASCADE` l'aurait fait ; aucune écriture si la base est cohérente. Portée limitée à l'arbre des Séances, conforme à la décision du 29/10 ; les autres incohérences préexistantes (ex. `movement_body_zones` vers un Mouvement absent, test 016) restent tolérées et intactes.
- Tests : `__tests__/repairOrphanRows.test.ts` (règles CASCADE/SET NULL/RESTRICT, clé composite, table WITHOUT ROWID, portée ; schéma réel : Séance supprimée sans cascade → orphelins retirés au démarrage, Mouvement archivé de nouveau supprimable), `__tests__/ExpoDatabase.transaction.test.ts` (ordre pragma → BEGIN → COMMIT/ROLLBACK → fermeture).

**Résultats :** `npx tsc --noEmit` OK ; `npx jest` : 433 suites, 6434 tests réussis, 32 ignorés, 0 échec ; ESLint sans erreur sur les fichiers touchés.

**Synchronisation code/documentation :** classe **A** (le code rejoint la règle déjà écrite : la suppression d'une Séance retire ses Exercices, `SqliteSessionRepository.deleteArchived`, PRE-8 E.5) et **D** (adaptateur SQLite) ; aucun document modifié.

**Effet de bord à surveiller sur iPhone :** les clés étrangères sont désormais réellement appliquées aux écritures de l'appareil (comme en test). Une écriture qui aurait violé une contrainte échouera au lieu de corrompre la base.

**Hors périmètre, non corrigé :** orphelins éventuels d'autres tables écrits pendant la même période (médias/zones de Mouvements supprimés, entrées de Routines supprimées, résultats d'exécution) — non réparés, à décider si un symptôme apparaît.

**À vérifier sur appareil :** relancer Routine BMAD (Metro 8081, `git pull`), supprimer un Mouvement archivé non utilisé par les 2 Séances visibles ; créer, archiver puis supprimer une Séance, et vérifier que ses Mouvements deviennent supprimables.

### Suite (20/11/2026, 23:51) — suppression des Mouvements archivés réussie ; nouvelle erreur « Persisted movement does not satisfy the movement contract »

- Confirmé sur iPhone par l'utilisateur : des Mouvements archivés ont pu être supprimés après `a47a6e23`.
- Nouvelle erreur au chargement du Catalogue des Mouvements (`MovementCatalogueList.tsx`) : un Mouvement relu ne satisfait pas `validateMovement` ; un seul enregistrement invalide fait échouer toute la liste.
- Analyse : aucune écriture de `a47a6e23` ne touche les tables d'un autre Mouvement (la suppression d'un Mouvement ne cascade que vers ses propres alias, phases, zones et médias ; aucun `REPLACE` sur les Mouvements). Cause **indéterminée** à ce stade ; lien avec l'activation des clés étrangères ni démontré ni exclu.
- Mesure de diagnostic (sans changement de comportement) : le message d'erreur nomme désormais le Mouvement (identifiant, nom) et les règles violées (`SqliteMovementRepository.assembleRecords`). Classe D. Tests : `tsc` OK ; Jest 433 suites, 6434 réussis, 32 ignorés, 0 échec.
- À vérifier sur appareil : nouvelle capture du message après `git pull`.
- 23:55 : capture reçue avec l'ancien message (sans identifiant ni règle) alors que `ab55f0f4` est la seule source de ce message (`grep` : un seul `throw`) : l'iPhone exécute encore un bundle antérieur à `ab55f0f4` (pull non fait ou cache Metro). Demande : vérifier le commit local et relancer Metro avec `--clear`.

### 23/11/2026 — Avis pour la consolidation (fusion unique demandée par l'utilisateur)

Vérifié sur `origin` (lecture seule) :
- `assets/illustrations-60-20261117` (`53a2c090`) a 118 commits absents de `integration/bmad-planification-20261120` (`78db25d2`). Leur code (`ActivityEditorForm.tsx`, `MovementScreen.tsx`, `importedMovements.ts`) est le seul commit `6b1c9578` (photo du catalogue affichée à part sur la fiche), **remplacé** dans la ligne d'intégration par le modèle unique des médias (décision du 19/11). À ne pas fusionner tel quel.
- Le catalogue illustré utilisable par l'application (format 3.0.0, 60 photos 1206 × 987 intégrées) est déjà dans la ligne d'intégration : `catalogue/illustrations/kodjo-pilote-60.illustre-v3.json`.
- À reprendre de la branche assets, sans code : les 60 sources `catalogue/illustrations/20261117/*.webp`, `catalogue/illustrations/suivi.json` et les 4 rapports `2026-11-18/19_ILLUSTRATIONS-60-*`. Le fichier `catalogue/catalogues/kodjo-pilote-60.catalogue.json` (v2) reste celui de la ligne d'intégration (fixture des tests).
- Branches `recette/*-20261119` (4 à 13 commits chacune) : absentes de la ligne d'intégration, non développées dans cette session ; décision laissée à la session qui les a produites.
- Présence des correctifs médias (097fd18c médias de fiche = médias du Mouvement, 3c982725 une seule copie, 93a0e7e5 miniatures) et base (a47a6e23) : contenus et identiques (fichiers clés sans diff) dans `integration/bmad-planification-20261120`, `feat/plan-20261121`, `feat/agenda-seances-20261121`, `docs/agenda-seances-journal-filtre-20261121`, `docs/prog-cat-01-suivi-20261123`, `diag/cpu-memoire-20261121` ; absents de `main`, `planification/ce-ui-12-20261118` et `claude/exciting-lovelace-iyn2wf` (i18n, base commune 5fe5e519 du 18/11). La branche i18n modifie `MovementCatalogueList.tsx` et `importedMovements.ts`, aussi modifiés par les correctifs : conflit possible à la fusion, à résoudre en conservant le préchargement des miniatures et les médias de fiche.

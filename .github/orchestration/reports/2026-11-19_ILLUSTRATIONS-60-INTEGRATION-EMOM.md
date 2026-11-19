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

# KODJO — Passerelle de l'administration Web au Catalogue mobile (pilote)

**Statut :** outil de recette locale, hors MVP et non publié.  
**Date :** 7 novembre 2026.  
**Sources :** `tools/catalogue-admin/static-ovh/index.html` (branche de la PR #432, non reportée sur `main`), `catalogue/pilote/mouvements-60-candidats.json`, `catalogue/referentiels/preclassement-60-candidats-v0.json`, `src/features/activities/pilotMovementImport.ts`, `src/features/activities/PilotMovementImportCommand.tsx`.  
**Réintégration sur `main` (9 novembre 2026) :** seuls l'importeur, ses données de référence, la commande de recette et leurs tests sont reportés, sans la pile historique des PR catalogue (#421 à #433) ni leurs annotations des spécifications.

## Objectif et trajet réel

`Administration Web OVH (navigateur) → Exporter les brouillons JSON → Fichier local sur l'iPhone → Import manuel dans KODJO → SQLite locale → Catalogue > Mouvements`.

L'interface Web statique et les 60 fiches importées dans son navigateur **ne sont pas une base centrale**. Elle n'envoie aucun brouillon à OVH. Il n'existe pas de synchronisation Web/mobile. Le JSON exporté reste le support autonome de transfert.

## Procédure de recette (iPhone)

1. Dans l'administration Web, charger le corpus original des 60 fiches si nécessaire et reprendre le dernier JSON de brouillons.
2. Après les éventuelles corrections, cliquer sur **Exporter les brouillons** ; conserver l'original en sauvegarde.
3. Transférer le fichier `kodjo-admin-brouillons.json` dans **Fichiers** sur l'iPhone (iCloud Drive, partage manuel, etc.), sans le publier sur le FTP.
4. Construire et installer une **version native** de KODJO contenant `expo-document-picker@~57.0.3`. La nouvelle dépendance native impose un nouveau build ; une mise à jour OTA seule ne suffit pas pour une application déjà compilée sans ce module. Profil EAS `catalogue-recette` : variante **« Routine Catalogue »** (`APP_VARIANT=catalogue`, identifiant `com.ankusha.kodjo.catalogue`, schéma `routine-catalogue`), installée à côté des autres applications avec sa propre base SQLite, sans canal et avec les mises à jour OTA désactivées (bundle embarqué uniquement).
5. Pour afficher la commande temporaire, construire avec `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1` (fixé par le profil `catalogue-recette`) ; sans cette variable, le catalogue produit ne présente aucune commande additionnelle. Le module natif du sélecteur n'est chargé qu'au toucher de la commande : le code reste utilisable par un binaire qui ne l'embarque pas. Aucune référence visuelle Figma nouvelle n'est déclarée pour cet outil de recette interne.
6. Dans **Catalogue > Mouvements**, toucher **Importer 60 fiches (test local)**, sélectionner le JSON via le sélecteur de fichiers et confirmer après lecture du récapitulatif.
7. L'application relit le Catalogue des Mouvements et indique le nombre de fiches créées ou déjà identiques.

Aucun changement du site OVH n'est nécessaire pour cet import. La PR de raccordement doit d'abord être intégrée dans la branche de build de test ; **rien n'est déployé sur l'iPhone** par la création de cette PR.

## Règles strictes du pilote

- **60 Mouvements locaux** sont créés au maximum depuis la version du corpus 2026-10-27 embarquée dans la build. Le brouillon administratif peut remplacer les noms, étapes, alias, Catégorie et Zones existantes. Les champs obligatoires vides héritent du **préclassement de recette non approuvé**, pas d'une décision métier validée.
- Les IDs `pilot:REED-001` … `pilot:FIT-STR-010` restent stables. Import exact répété = aucune nouvelle création (idempotence). Un ID déjà présent mais modifié, ou un nom KODJO déjà pris par un autre mouvement, **bloque sans écraser** et avant toute insertion.
- Toutes les 60 entrées sont prévalidées par `validateMovement` avant le premier enregistrement. Les écritures passent par `MovementCatalogueService.createIndependent` puis le repository SQLite existant, sans contournement de validation ni migration nouvelle.
- L'installation séquentielle par le service actuel n'est **pas transactionnelle sur l'ensemble des 60 entrées**. En cas d'échec technique après certaines insertions, relancer avec le même JSON : les entrées identiques sont reconnues. Aucun rollback global n'est promis.
- **Aucun Exercice, aucune Séance, aucun Format et aucun réglage d'exécution** n'est créé par cet import. Les Mouvements pourront servir ultérieurement à créer des Exercices.
- Les médias du JSON administratif (photos, vidéos) **ne sont pas convertis** en assets mobiles à cette étape ; leur nombre est montré avant l'import. Le fichier JSON d'origine, photos incluses, reste inchangé et doit être conservé.
- **Taille maximale : 24 Mo**, contrôlée avant lecture (même limite que la relecture des brouillons dans l'administration). L'administration ne plafonne pas l'export : chaque photo embarquée peut atteindre 580 000 caractères (WebP base64, 1 050 px), 30 médias par fiche. Au plafond par photo, l'export dépasse 24 Mo vers 43 photos ; il est alors refusé en entier par le mobile, bien que les photos n'y soient pas transférées.
- Les spécialités, familles gestuelles, cibles anatomiques, problèmes cliniques, propriétaires et auteurs de l'administration ne sont **pas ajoutés artificiellement** au modèle `Movement` existant. Aucune indication clinique n'est validée ni publiée.
- La version test ne doit pas être diffusée comme catalogue éditorial approuvé : `publicationAllowed:false` demeure la frontière de provenance.
- Un JSON de démonstration (`demo:...`), une sauvegarde d'un autre corpus, des champs invalides et les statuts de publication non conformes sont refusés.

## Contrôles

- Tests Jest `src/features/activities/__tests__/pilotMovementImport.test.ts` : couverture 60/60, modifications administrateur, signalement médias exclus, refus d'un brouillon hors corpus, validation, idempotence, refus des collisions.
- Tests Jest `src/features/activities/__tests__/pilotMovementImport.sqlite.test.ts` (ajout du 9 novembre 2026) : même passerelle sur le repository SQLite réel (`node:sqlite`, base isolée en mémoire) — 60 Mouvements et 239 étapes relus, aucune écriture hors des tables de Mouvement, réimport idempotent, collisions refusées sans écriture, interruption au 31e Mouvement puis reprise avec le même fichier. Il a révélé que les Zones, relues sans ordre garanti, faisaient refuser tout réimport ; elles sont désormais comparées comme un ensemble.
- Tests Jest `src/features/activities/__tests__/PilotMovementImportCommand.test.tsx` (9 novembre 2026, `main`) : commande avec sélecteur simulé et base SQLite isolée — import puis réimport identique, annulation, JSON étranger, fichier de plus de 24 Mo refusé avant lecture, export au format OVH avec 42 photos maximales accepté (photos comptées, aucun média créé) et avec 44 refusé, commande absente sans la variable, aucun import statique du module natif.
- Recette iPhone du 9 novembre 2026 (build EAS `f882e911`) : import interrompu deux fois par « The created movement could not be read back » (32e puis 40e fiche), achevé par relances sans doublon. Cause : `SqliteMovementRepository.create` relisait le Mouvement sur la connexion principale, alors qu'expo-sqlite écrit la transaction exclusive sur une connexion distincte (WAL). Correction : relecture dans la transaction d'écriture, comme la création de Séance ; test SQLite simulant la connexion principale en retard (échoue sans la correction).
- `npx tsc --noEmit` et `npm ci` exécutés dans GitHub Actions.
- Aucune recette iPhone physique accomplie à ce stade, aucun transfert réellement vérifié sur une base utilisateur.

## Raccordements et limites

- Fonctionnel : Catalogue > Mouvements — outil de recette hors flux MVP ; écrans Figma normatifs inchangés. Le futur parcours d'import public nécessite un arbitrage UX/Figma distinct.
- Données : transport contrôlé vers `Movement` seulement ; pas de nouveau modèle d'Exercice, de famille de niveaux ou de média.
- Technique : `expo-document-picker` (sélection utilisateur, chargé à la demande), `expo-file-system` (lecture), importateur pur + repository SQLite existant ; variante `catalogue` dans `app.config.js` et profil `catalogue-recette` dans `eas.json`, sans effet sur les variantes Routine, Routine Dev et Routine BMAD.
- Décisions : aucun nouvel arbitrage de taxonomie ni de publication ; l'import demeure une proposition technique provisoire.
- Catalogue autonome (décision de Hermann du 10/11/2026) : ce mécanisme, qui embarque les 60 fiches dans le code, sera remplacé par le format `KODJO_MOVEMENT_CATALOGUE` v1 (`docs/KODJO-Format-catalogue-mouvements-v1.md`). Le fichier pilote converti `catalogue/catalogues/kodjo-pilote-60.catalogue.json` existe (CA-2) ; son chargement dans l'application (CA-3 à CA-6) n'est pas encore développé.
- Évolutions ouvertes : import multimédia, résolution assistée des collisions, révisions différentielles avec historique, accès sécurisé/synchronisé au catalogue, validation éditoriale et clinique.

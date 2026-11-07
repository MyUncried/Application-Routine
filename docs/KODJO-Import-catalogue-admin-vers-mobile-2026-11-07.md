# KODJO — Passerelle de l'administration Web au Catalogue mobile (pilote)

**Statut :** outil de recette locale, hors MVP et non publié.  
**Date :** 7 novembre 2026.  
**Sources :** `tools/catalogue-admin/static-ovh/index.html`, `catalogue/pilote/mouvements-60-candidats.json`, `catalogue/referentiels/preclassement-60-candidats-v0.json`, `src/features/activities/pilotMovementImport.ts`.

## Objectif et trajet réel

`Administration Web OVH (navigateur) → Exporter les brouillons JSON → Fichier local sur l'iPhone → Import manuel dans KODJO → SQLite locale → Catalogue > Mouvements`.

L'interface Web statique et les 60 fiches importées dans son navigateur **ne sont pas une base centrale**. Elle n'envoie aucun brouillon à OVH. Il n'existe pas de synchronisation Web/mobile. Le JSON exporté reste le support autonome de transfert.

## Procédure de recette (iPhone)

1. Dans l'administration Web, charger le corpus original des 60 fiches si nécessaire et reprendre le dernier JSON de brouillons.
2. Après les éventuelles corrections, cliquer sur **Exporter les brouillons** ; conserver l'original en sauvegarde.
3. Transférer le fichier `kodjo-admin-brouillons.json` dans **Fichiers** sur l'iPhone (iCloud Drive, partage manuel, etc.), sans le publier sur le FTP.
4. Construire et installer une **version native** de KODJO contenant `expo-document-picker@~57.0.3`. La nouvelle dépendance native impose un nouveau build ; une mise à jour OTA seule ne suffit pas pour une application déjà compilée sans ce module.
5. Pour afficher la commande temporaire, construire avec `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1` ; sans cette variable, le catalogue produit ne présente aucune commande additionnelle. Aucune référence visuelle Figma nouvelle n'est déclarée pour cet outil de recette interne.
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
- Les spécialités, familles gestuelles, cibles anatomiques, problèmes cliniques, propriétaires et auteurs de l'administration ne sont **pas ajoutés artificiellement** au modèle `Movement` existant. Aucune indication clinique n'est validée ni publiée.
- La version test ne doit pas être diffusée comme catalogue éditorial approuvé : `publicationAllowed:false` demeure la frontière de provenance.
- Un JSON de démonstration (`demo:...`), une sauvegarde d'un autre corpus, des champs invalides et les statuts de publication non conformes sont refusés.

## Contrôles

- Tests Jest `src/features/activities/__tests__/pilotMovementImport.test.ts` : couverture 60/60, modifications administrateur, signalement médias exclus, refus d'un brouillon hors corpus, validation, idempotence, refus des collisions.
- `npx tsc --noEmit` et `npm ci` exécutés dans GitHub Actions.
- Aucune recette iPhone physique accomplie à ce stade, aucun transfert réellement vérifié sur une base utilisateur.

## Raccordements et limites

- Fonctionnel : Catalogue > Mouvements — outil de recette hors flux MVP ; écrans Figma normatifs inchangés. Le futur parcours d'import public nécessite un arbitrage UX/Figma distinct.
- Données : transport contrôlé vers `Movement` seulement ; pas de nouveau modèle d'Exercice, de famille de niveaux ou de média.
- Technique : `expo-document-picker` (sélection utilisateur), `expo-file-system` (lecture), importateur pur + repository SQLite existant.
- Décisions : aucun nouvel arbitrage de taxonomie ni de publication ; l'import demeure une proposition technique provisoire.
- Évolutions ouvertes : import multimédia, résolution assistée des collisions, révisions différentielles avec historique, accès sécurisé/synchronisé au catalogue, validation éditoriale et clinique.

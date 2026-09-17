# Mission d’implémentation — V2-CAT-01

## Autorité

Cette mission exécute exclusivement le plan INITIAL approuvé de la tranche `V2-CAT-01` :

- PLAN_OUTPUT canonique : commentaire `5720329801` de l’Issue #150 ;
- revue indépendante : commentaire `5720519466`, verdict `APPROVE`, statut `PLAN_REVIEW_APPROVED` ;
- gate utilisateur : commentaire `5720551793`, `USER_IMPLEMENTATION_APPROVED` ;
- baseline produit/documentaire du plan : `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`.

Le `scope_allow` transmis au superviseur est dérivé mécaniquement du contrat de plan approuvé. Il est opposable. Aucun fichier hors de ce périmètre ne peut être modifié.

## Objectif

Implémenter le Catalogue des Activités et les adaptations de parcours incluses dans V2-CAT-01, sans moteur d’exécution et sans élargissement fonctionnel.

## Règles fonctionnelles obligatoires

- Le libellé permanent de navigation basse est `Catalogues`.
- Le Catalogue contient les segments `Séances`, `Activités`, `Circuits` ; `Séances` est sélectionné par défaut ; `Activités` est actif ; `Circuits` reste visible mais désactivé.
- Les titres contextuels sont `Catalogue des séances`, `Catalogue des activités`, `Catalogue des circuits`.
- La rangée `Créer / Filtrer / Trier` est visible ; seul `Créer` est fonctionnel dans cette tranche. `Filtrer` et `Trier` restent inertes.
- L’arbre `Créer` affiche exactement, dans cet ordre : `Une nouvelle activité`, `Une séance`, `Un circuit`, `Annuler`. `Un circuit` est désactivé.
- Le Catalogue des Activités permet affichage, création et modification d’`ActivityDefinition` persistantes, sans suppression, archivage, restauration, recherche ou filtre fonctionnel.
- La liste des Activités est ordonnée par `updatedAt DESC`.
- La surface principale d’une carte Activité ouvre l’édition.
- Sur la carte Activité, `Déployer` est présent mais désactivé ; `Lecture`/`Démarrer` est présent lorsque le contrat d’écran le fixe, mais reste désactivé et sans handler fonctionnel dans cette tranche.
- La section `Médias` de l’éditeur est visible et repliable. Les contrôles `Déployer / Condenser`, `Ajouter un média` et le placeholder restent désactivés. Aucun import, stockage ou lecture média n’est implémenté.
- Le nom de l’Activité est en gras dans la synthèse de l’éditeur.
- Une Activité créée depuis la Composition reste locale à la Séance en cours et ne crée jamais automatiquement d’`ActivityDefinition` dans le Catalogue.
- Depuis la Composition, `Ajouter une activité` propose exactement `Une nouvelle activité`, `Une activité existante`, `Annuler`.
- La sélection d’Activités existantes est multiple. Une validation sans sélection est invalide, ne crée aucune donnée et ne modifie ni le brouillon ni le Catalogue.
- Lors d’une sélection valide, chaque Activité est copiée avec un nouvel identifiant ; les propriétés métier applicables sont copiées ; l’insertion est atomique ; l’ordre suit l’ordre courant de présentation, pas l’ordre des touchers.
- Le contexte Catalogue utile à l’aller-retour courant est restauré ; aucun état Catalogue n’est persisté après relance complète.
- Après l’enregistrement depuis Catégories, la destination reste `Catalogue des séances`, segment `Séances`.

## Persistance et architecture

- Ajouter `ActivityDefinition` comme modèle persistant indépendant des `SessionActivity` de Séance.
- Ajouter la migration additive `006` et porter `DATABASE_VERSION` à 6 conformément au plan approuvé.
- La migration ne promeut aucune `SessionActivity` historique vers le Catalogue.
- Le repository Activités couvre uniquement create/read/list/update nécessaires à la tranche.
- La liste repository applique explicitement `ORDER BY updatedAt DESC`.
- `ActivityDefinitionService` doit utiliser exactement la même connexion SQLite et le même cycle de migration que les services existants.
- L’intégration se fait via `src/features/sessions/SessionServiceProvider.tsx` et le provider Activités dédié ; aucun second `SQLiteProvider`, aucune seconde connexion et aucune migration concurrente ne sont autorisés.
- `SessionService.ts`, `SessionServiceContext.tsx` et `src/features/sessions/__tests__/SessionService.test.ts` restent non affectés.

## UI et interactions incluses

- Navigation basse : libellé `Catalogues`, hauteur/marges documentées, icône Recherche correctement alignée, cadre actif visible avec glissement continu.
- Contrôles segmentés : cadre sélectionné centré verticalement, glissement continu, traduction visuelle DSF préservée sans refonte.
- Swipe des cartes d’Activité dans la Composition uniquement : la carte suit réellement le geste vers la gauche, les actions sont révélées progressivement, un vrai swipe droit referme, `Dupliquer / Supprimer` restent fonctionnels, géométrie du bloc conforme au contrat.
- Icône `Côté` : corriger uniquement son placement selon le contrat validé.
- Catégories : centrer `Créer une catégorie` et appliquer la transition documentée après succès.

## Éditeur d’Activité

Extraire/recomposer un formulaire réutilisable à partir du comportement existant de `ExerciseScreen.tsx` sans régresser :

- nom, description, Zones corporelles ;
- modes Durée / Répétitions / À l’échec ;
- Séries, Pause, Récupération ;
- `sideMode` ;
- roulettes existantes ;
- synthèse ;
- garde de sortie.

Les primitives de roulettes natives déjà validées restent inchangées. Les calculs de bilatéralité, `Session.ts`, `calculations.ts`, `sideMode.ts`, `SessionCard.tsx` et son test restent gelés, conformément au plan approuvé.

## Hors périmètre impératif

Ne pas implémenter :

- moteur d’exécution Activité ou Séance ;
- exécution réelle ;
- Circuits fonctionnels ;
- recherche, filtre, tri utilisateur, archivage, restauration ou suppression du Catalogue Activités ;
- swipe/actions contextuelles dans les Catalogues ;
- fonctions média réelles ;
- bouton d’enregistrement futur d’une Activité locale vers le Catalogue ;
- écrans/fonctionnalités du Suivi ;
- composant applicatif `Status / Badge` ;
- modification des calculs de bilatéralité ;
- refactor opportuniste hors tranche.

## Ordre de mise en œuvre

1. Domaine `ActivityDefinition` et contrats repository/service.
2. Migration 006, rows SQLite, repository, tests de migration et persistance.
3. Injection du service Activités sur la connexion SQLite existante via `SessionServiceProvider`.
4. Extraction/adaptation du formulaire commun d’Activité sans régression des contrôles existants.
5. Catalogue Activités, cartes, arbre `Créer`, ordre `updatedAt DESC`, création/modification.
6. Sélection multiple depuis Composition et copie atomique dans le brouillon.
7. Navigation basse, contrôles segmentés, swipe Composition, icône `Côté`, Catégories.
8. Régressions, intégrations et vérifications finales.

## Contrôles

Exécuter les contrôles autorisés par le superviseur : Jest, TypeScript et lint. Corriger uniquement les causes situées dans `scope_allow`. Ne jamais affaiblir un test pour obtenir un PASS.

Si une règle nécessaire ne peut pas être déterminée à partir du plan approuvé et de cette mission, arrêter avec `CLARIFICATION_REQUIRED` ; ne pas inventer et ne pas élargir le périmètre.

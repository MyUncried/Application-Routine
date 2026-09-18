[KODJO_V2] PLAN_OUTPUT
slice_id=V2-CAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json
source_head=63a3c26ed492f7c0925cfb57419f3dc2dcc5e476
planning_mode=INITIAL
planning_contract=kodjo.plan-impact.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# Plan technique — V2-CAT-01

## 1. Identité, état et bornage

- **Baseline immuable :** `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`.
- **Issue :** #150.
- **Mode :** PLAN_ONLY ; aucune implémentation autorisée.
- **Objectif :** rendre le segment `Activités` consultable dans le Catalogue, persister les `ActivityDefinition`, permettre leur création et modification, créer une `SessionActivity` locale depuis la Composition et copier des Activités existantes dans une Séance.
- **Corrections incluses :** navigation basse, contrôles segmentés, swipe de Composition, position de l’icône `Côté`, centrage de `Créer une catégorie`, transition Catégories → Catalogue.
- **Préparation d’exécution :** les contrôles prévus par les écrans inclus sont visibles mais désactivés, sans handler fonctionnel. Aucun moteur, plan, résultat, historique ou exécution réelle.

Le libellé exact de la première option de l’arbre Catalogue est `Une nouvelle activité`, conformément à l’arbitrage utilisateur intégré à la mission. La section `Médias` est visible et repliable ; son contrôle, son placeholder et `Ajouter un média` restent désactivés. Aucune fonction média réelle n’est incluse.

Restent hors périmètre : exécution directe, origine `ACTIVITY`, Suivi, archivage, restauration, suppression, recherche, filtre fonctionnel, tri fonctionnel, médias réels, Circuits fonctionnels, composant applicatif `Status / Badge`, calculs de bilatéralité et tout moteur d’exécution.

## 2. Constat de l’existant

### 2.1 Catalogue et navigation

`src/features/sessions/CatalogueScreen.tsx` porte le Catalogue actuel, charge les Séances via `useSessionCatalogue()` et rend `SessionCard`. Le sélecteur `Activités / Séances / Circuits` existe visuellement, mais seul le parcours Séances est alimenté.

La navigation basse est portée par `app/(tabs)/_layout.tsx`, avec `src/shared/ui/navigationLayout.ts`, `src/shared/ui/ScreenShell.tsx` et les tokens partagés. Le libellé permanent attendu est `Catalogues`. Les titres contextuels sont `Catalogue des séances`, `Catalogue des activités` et `Catalogue des circuits`.

Le Catalogue devra également afficher la rangée commune `Créer / Filtrer / Trier`. Dans cette tranche, `Créer` est actif ; `Filtrer` et `Trier` restent visibles mais inertes, car la recherche, le filtre fonctionnel, l’archivage et le tri fonctionnel sont explicitement hors périmètre. L’arbre `Créer` est ancré à `Créer` et conserve cette rangée sous le scrim.

### 2.2 Domaine Séance et Composition

Les Activités actuelles sont des copies rattachées à une Séance dans :

- `src/domain/sessions/SessionDraft.ts` ;
- `src/domain/sessions/composition.ts` ;
- `src/features/sessions/SessionDraftContext.tsx` ;
- `src/features/sessions/SessionDraftProvider.tsx` ;
- `src/features/sessions/CompositionScreen.tsx`.

`src/domain/sessions/Session.ts`, `src/domain/sessions/calculations.ts` et `src/domain/sessions/sideMode.ts` sont gelés : aucun changement concret indispensable n’est démontré et les calculs de bilatéralité restent hors écriture.

Le contexte et le provider de brouillon sont concernés uniquement par la conservation du brouillon et l’insertion atomique des copies lors du retour de la sélection. `src/features/sessions/SessionService.ts` et `src/features/sessions/__tests__/SessionService.test.ts` restent non affectés : leur contrat consommé ne change pas.

### 2.3 Éditeur d’Activité

`src/features/sessions/ExerciseScreen.tsx` couvre déjà le nom, la description, les Zones corporelles, les modes Durée/Répétitions/À l’échec, les Séries, la Pause, la Récupération, `sideMode`, les roulettes, la synthèse et la garde de sortie. Son enregistrement est couplé au brouillon de Séance.

Le plan extrait un formulaire commun avec deux adaptateurs :

1. Composition : écriture dans le brouillon `SessionActivity` uniquement ;
2. Catalogue : création ou modification d’une `ActivityDefinition` persistante.

La valeur `Renforcement du genou` reste une donnée de démonstration Figma et ne doit pas être codée en dur. Le nom doit être en gras uniquement dans la synthèse de l’éditeur.

### 2.4 Persistance et injection SQLite

La persistance SQLite est organisée dans `src/infrastructure/database/`, avec migrations `001` à `005`, `migrateDatabase.ts`, `constants.ts`, `DatabaseRows.ts` et des repositories existants. La version courante est 5.

La connexion SQLite est initialisée par la composition existante autour de `SessionServiceProvider`. L’implémentation devra y intégrer le nouveau service d’Activités, afin que `ActivityDefinitionService` utilise exactement la même instance SQLite et le même cycle de migration. Aucun second `SQLiteProvider`, aucune seconde connexion et aucun cycle parallèle de migration ne sont autorisés.

Une migration additive `006` est nécessaire pour `ActivityDefinition` et ses associations aux Zones corporelles. Elle ne convertit aucune `SessionActivity` historique et n’introduit aucune donnée d’exécution, d’archivage, de suppression ou de média fonctionnel.

### 2.5 Gestes, catégories et état temporaire

Le swipe de Composition et ses callbacks `Dupliquer`/`Supprimer` existent dans `compositionGesture.ts` et `compositionPresentation.ts`. Ils doivent être corrigés sans changer leur sémantique métier.

`CategoriesScreen.tsx` porte le parcours existant. Seuls le centrage de `Créer une catégorie` et la transition canonique après succès sont concernés.

`SessionDraftContext.tsx` et `SessionDraftProvider.tsx` conservent le brouillon pendant l’aller-retour vers la sélection et exposent l’opération d’insertion groupée des copies. Aucun changement n’est requis dans le service de Séances.

## 3. Matrice périmètre → état → écart

| Sous-périmètre | État au HEAD | Écart à traiter |
|---|---|---|
| `Séances` | Fonctionnel | Préserver et maintenir le segment par défaut. |
| `Activités` | Visible mais non fonctionnel | Activer le segment et charger des définitions persistantes. |
| `Circuits` | Visible et désactivé | Préserver sans route ni logique fonctionnelle. |
| Titres Catalogue | Titre Séances fixe | Rendre le titre dépendant du segment actif. |
| Rangée Catalogue | Absente ou incomplète | Afficher `Créer / Filtrer / Trier`; seul `Créer` est actif dans cette tranche. |
| Catalogue Activités | Absent comme source autonome | Créer liste, cartes et ouverture en modification. |
| Création Catalogue | Accès direct à Composition | Ajouter l’arbre exact de création. |
| Modification Catalogue | Absente | Ouvrir l’éditeur prérempli et persister la modification. |
| Persistance | Pas d’`ActivityDefinition` | Ajouter migration 006, repository et service create/read/list/update. |
| Création depuis Composition | Existante pour une Activité de Séance | Préserver le caractère local, sans définition Catalogue. |
| Sélection d’une Activité existante | Absente | Ajouter sélection multiple et copie indépendante. |
| Médias | Pas de fonctionnalité réelle | Afficher la section repliable et les contrôles désactivés. |
| Navigation basse | Primitive existante à mettre à niveau | `Catalogues`, marges, espace, Recherche, cadre actif et animation. |
| Contrôles segmentés | Présentation statique | Indicateur centré et déplacement continu, sans refonte visuelle DSF. |
| Swipe Composition | Révélation non conforme | Translation réelle, révélation progressive, fermeture par vrai swipe droit. |
| Icône `Côté` | Présente | Corriger uniquement son placement visuel. |
| Catégories | Parcours existant | Centrer le bouton et appliquer la transition droite→gauche après succès. |
| Préparation d’exécution | Aucun moteur | Conserver ou afficher les contrôles prévus, désactivés et sans handler. |
| Fonctions exclues | Non présentes ou incomplètes | Ne créer aucune API, route ou persistance correspondante. |

## 4. Comportements déterministes

### 4.1 Catalogue

- `Séances` est sélectionné par défaut à l’ouverture et après relance complète.
- `Activités` est actif et affiche les `ActivityDefinition` persistantes.
- `Circuits` est visible mais désactivé et ne déclenche aucune navigation.
- Le titre suit le segment : `Catalogue des séances`, `Catalogue des activités`, `Catalogue des circuits`.
- `Créer`, `Filtrer` et `Trier` restent visibles. `Filtrer` et `Trier` ne produisent aucun effet fonctionnel dans cette tranche.
- L’arbre `Créer` est ancré à `Créer`, conserve la rangée sous scrim et affiche exactement : `Une nouvelle activité`, `Une séance`, `Un circuit`, `Annuler`.
- `Un circuit` est désactivé. `Annuler` ferme l’arbre sans écriture et restitue exactement le contexte courant.
- L’apparition de l’arbre est progressive et rapide.
- La surface principale d’une carte d’Activité ouvre l’édition.
- Le contrôle `Déployer` est présent sur chaque carte d’Activité, visible mais désactivé, avec la même zone réservée sur toutes les cartes.
- Le bouton `Lecture` est présent sur chaque carte d’Activité ; il est désactivé et sans handler fonctionnel dans cette tranche.
- Les cartes d’Activité n’ont ni poignée, ni swipe, ni action d’archivage ou de suppression.
- La liste est triée par `updatedAt DESC`, c’est-à-dire par dernière modification décroissante. Ce tri implicite n’est pas un tri utilisateur et n’est pas persisté comme préférence.

L’état de segment, de recherche déjà existante et de scroll est restauré pendant l’aller-retour courant. Aucun état Catalogue n’est persisté après relance complète. Après l’enregistrement depuis Catégories, la destination est toujours `Catalogue des séances`, segment `Séances`.

### 4.2 ActivityDefinition

Une `ActivityDefinition` persistante peut être créée, lue et modifiée. La suppression, l’archivage, la restauration, la recherche et le filtrage ne sont pas exposés.

L’éditeur est prérempli en modification. `Terminer` persiste uniquement dans le contexte Catalogue. Une erreur de sauvegarde conserve le brouillon et ne laisse pas de modification partielle.

Les champs persistés sont ceux nécessaires à la réouverture exacte : nom, description, mode et cible applicable, Séries, Pause, Récupération, `sideMode`, Zones corporelles, dates de création et de modification.

### 4.3 Médias

La section `Médias` est visible et repliable. `Déployer / Condenser`, `Ajouter un média` et le placeholder sont visibles conformément au contrat mais désactivés. Aucun sélecteur de fichier, import, lecture, association ou stockage média n’est ajouté.

### 4.4 Ajout depuis Composition

`Ajouter une activité` ouvre exactement :

1. `Une nouvelle activité` ;
2. `Une activité existante` ;
3. `Annuler`.

`Une nouvelle activité` crée une `SessionActivity` propre à la Séance. `Une activité existante` ouvre la sélection multiple des définitions persistantes.

La validation sans sélection est invalide : elle reste désactivée ou refusée, ne crée aucune donnée et ne modifie ni le brouillon ni le Catalogue.

Lors d’une sélection valide, les copies sont insérées selon l’ordre courant de présentation de la liste au moment de la validation, indépendamment de l’ordre des touchers. Chaque copie possède un nouvel identifiant et copie toutes les propriétés métier applicables, notamment description, mode/cible, Séries, Pause, Récupération, Zones et `sideMode`. L’opération est atomique : toutes les copies ou aucune.

Une activité créée directement depuis Composition ne crée jamais d’`ActivityDefinition` et aucun bouton d’enregistrement vers le Catalogue n’est ajouté.

### 4.5 Navigation, segments et gestes

- La destination basse porte le libellé `Catalogues`.
- Les icônes restent vectorielles, avec dessin de référence centré dans sa boîte optique et cible tactile conforme.
- Le cadre actif de navigation reste visible et glisse continûment entre destinations.
- Le contrôle segmenté répartit ses options avec Flexbox, conserve la traduction visuelle DSF canonique et anime le cadre sélectionné sans le faire disparaître.
- Dans la Composition, un swipe gauche fait suivre la carte au doigt et révèle progressivement `Dupliquer`/`Supprimer` derrière elle.
- Seul un véritable swipe droit commencé sur la carte ouverte la referme. Un tap sur le fond, un swipe droit ailleurs ou un tap hors action ne ferme pas le contexte.
- L’appui court, l’appui long et le déplacement restent distincts du swipe.
- Le Compte à rebours initial et la Fin de séance restent non déplaçables.
- L’icône `Côté` est décalée vers la droite selon la marge prescrite, sans changement de domaine.
- `Créer une catégorie` est centré horizontalement.
- Après succès de l’enregistrement Catégories, la cible entre depuis la droite et l’écran courant sort vers la gauche.

## 5. Périmètre technique exact

La liste suivante est normative. Chaque chemin est une application à créer ou modifier et possède le même statut que dans `modified_modules`.

### À créer

- `app/(creation)/activity-selection.tsx`
- `src/domain/activities/ActivityDefinition.ts`
- `src/domain/activities/ActivityDefinitionRepository.ts`
- `src/domain/activities/__tests__/ActivityDefinition.test.ts`
- `src/domain/activities/index.ts`
- `src/features/activities/ActivityCard.tsx`
- `src/features/activities/ActivityCatalogueList.tsx`
- `src/features/activities/ActivityDefinitionService.ts`
- `src/features/activities/ActivityDefinitionServiceContext.tsx`
- `src/features/activities/ActivityDefinitionServiceProvider.tsx`
- `src/features/activities/ActivityEditorForm.tsx`
- `src/features/activities/ActivitySelectionScreen.tsx`
- `src/features/activities/CatalogueCreateOptions.tsx`
- `src/features/activities/__tests__/ActivityCard.test.tsx`
- `src/features/activities/__tests__/ActivityCatalogueList.test.tsx`
- `src/features/activities/__tests__/ActivityDefinitionService.test.ts`
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx`
- `src/features/activities/__tests__/ActivitySelectionScreen.test.tsx`
- `src/features/activities/__tests__/CatalogueCreateOptions.test.tsx`
- `src/features/activities/__tests__/useActivityCatalogue.test.ts`
- `src/features/activities/useActivityCatalogue.ts`
- `src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts`
- `src/infrastructure/database/migrations/migration006.ts`
- `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts`
- `src/shared/ui/SegmentedControl.tsx`
- `src/shared/ui/__tests__/SegmentedControl.test.tsx`

### À modifier

- `app/(creation)/_layout.tsx`
- `app/(creation)/exercise.tsx`
- `app/(tabs)/_layout.tsx`
- `app/__tests__/creationLayout.test.tsx`
- `app/__tests__/rootLayoutGesture.test.tsx`
- `app/_layout.tsx`
- `src/domain/sessions/SessionDraft.ts`
- `src/domain/sessions/__tests__/SessionDraft.test.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/domain/sessions/composition.ts`
- `src/features/sessions/CatalogueScreen.tsx`
- `src/features/sessions/CategoriesScreen.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/SessionDraftContext.tsx`
- `src/features/sessions/SessionDraftProvider.tsx`
- `src/features/sessions/SessionServiceProvider.tsx`
- `src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx`
- `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CategoriesScreen.test.tsx`
- `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/features/sessions/__tests__/SessionDraftContext.test.tsx`
- `src/features/sessions/__tests__/SessionDraftProvider.test.tsx`
- `src/features/sessions/__tests__/SessionServiceProvider.test.tsx`
- `src/features/sessions/__tests__/compositionGesture.test.ts`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/features/sessions/compositionGesture.ts`
- `src/features/sessions/compositionPresentation.ts`
- `src/infrastructure/database/__tests__/initializeDatabase.test.ts`
- `src/infrastructure/database/__tests__/migrateDatabase.test.ts`
- `src/infrastructure/database/constants.ts`
- `src/infrastructure/database/migrateDatabase.ts`
- `src/infrastructure/database/types/DatabaseRows.ts`
- `src/shared/i18n/resources/fr.ts`
- `src/shared/ui/ScreenShell.tsx`
- `src/shared/ui/__tests__/ScreenShell.test.tsx`
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `src/shared/ui/__tests__/navigationLayout.test.ts`
- `src/shared/ui/navigationLayout.ts`

### Modules explicitement non affectés ou gelés

- `src/domain/sessions/Session.ts` : aucun changement concret nécessaire ; les champs communs sont consommés depuis les types existants.
- `src/domain/sessions/calculations.ts` : calculs de bilatéralité gelés.
- `src/domain/sessions/sideMode.ts` : contrat réutilisé inchangé.
- `src/features/sessions/SessionService.ts` : `CONSUMER_UNAFFECTED` ; il consomme `SessionDraft`, `toCreateSessionInput` et `toUpdateSessionInput`, dont le contrat consommé ne change pas pour cette tranche.
- `src/features/sessions/__tests__/SessionService.test.ts` : `TEST_UNAFFECTED` ; aucun contrat couvert ne change.
- `src/features/sessions/SessionCard.tsx` et `src/features/sessions/__tests__/SessionCard.test.tsx` : gelés ; aucun changement de contrat démontré.
- `app/(creation)/composition.tsx`, `app/(creation)/categories.tsx`, `app/(tabs)/index.tsx` : wrappers de routes inchangés ; les écrans conservent leur contrat de montage.

### Rationale d’injection SQLite

`src/features/sessions/SessionServiceProvider.tsx` est le seul module autorisé à compléter la composition des services autour de l’instance SQLite existante. Il doit créer `ActivityDefinitionService` avec la même connexion que `SessionService`, puis exposer le provider d’Activités aux enfants applicatifs. `SessionService.ts`, `SessionServiceContext.tsx` et `SessionService.test.ts` ne changent pas de contrat.

`app/_layout.tsx` conserve une seule composition SQLite et branche le provider existant ; aucune seconde connexion ne doit être créée.

### Scope d’écriture complet

Les chemins d’écriture complets sont exactement ceux des listes `À créer` et `À modifier` ci-dessus, sans chemin supplémentaire. Les tests nouveaux sont explicitement des créations ; les tests existants nécessaires à l’adaptation sont explicitement des modifications. Aucun importeur classé non affecté n’est autorisé en écriture.

## 6. Données, persistance et compatibilité

### 6.1 Séparation des objets

`ActivityDefinition` est une racine persistante autonome et ne porte aucune position de Composition. `SessionActivity` reste rattachée à une Séance et porte sa position structurelle.

L’insertion est une copie ponctuelle. Les modifications ultérieures de la définition et de la copie sont indépendantes. La Durée totale dérivée et le pilote temporaire Séries/Durée totale ne sont pas persistés comme données canoniques supplémentaires.

### 6.2 Migration

`migration006` est additive, idempotente et testée depuis une base neuve et depuis la version 5. Les migrations 001 à 005 restent inchangées. Aucune promotion historique ni écriture implicite n’est effectuée.

### 6.3 Bilatéralité gelée

`sideMode` est seulement copié et relu. Aucun changement n’est prévu dans `Session.ts`, `calculations.ts`, `sideMode.ts` ou les règles de résolution effective. Les suites existantes de bilatéralité restent des tests de régression non modifiés.

## 7. Plan séquencé

### Étape 1 — Contrat de domaine

Définir `ActivityDefinition`, ses entrées create/update, le contrat repository et la conversion vers une copie de Composition.

**Résultat vérifiable :** domaine indépendant de React et SQLite, aucune API hors périmètre.

### Étape 2 — Migration et repository

Ajouter migration 006, lignes SQLite, relation Zones et opérations create/read/list/update. La liste du repository applique explicitement `ORDER BY updatedAt DESC`.

**Résultat vérifiable :** base neuve et montée depuis v5, rollback, données existantes conservées, aucune promotion, ordre de liste déterministe.

### Étape 3 — Service et injection

Modifier `SessionServiceProvider.tsx` pour créer le service d’Activités à partir de la même instance SQLite que le service Séances, puis exposer `ActivityDefinitionServiceProvider` aux enfants applicatifs. Ne pas modifier le contrat de `SessionService` ni de `SessionServiceContext`.

**Résultat vérifiable :** une seule connexion SQLite, aucune UI n’accède directement à SQLite, aucune migration concurrente.

### Étape 4 — Extraction du formulaire

Extraire le formulaire commun, préserver le flux Composition, ajouter l’adaptateur Catalogue et intégrer Médias visible/inactif et nom en gras.

**Résultat vérifiable :** deux cibles de sauvegarde distinctes, règles de validation et de calcul non dupliquées.

### Étape 5 — Catalogue et arbre de création

Activer Activités, titres contextuels, rangée de commandes, liste triée par `updatedAt DESC`, cartes et arbre exact.

**Résultat vérifiable :** création/modification persistantes ; Circuit, Filtrer, Trier, Lecture et Déployer restent inertes conformément au périmètre.

### Étape 6 — Sélection depuis Composition

Ajouter le choix nouvelle/existante/Annuler, l’écran de sélection et la copie atomique ordonnée.

**Résultat vérifiable :** copies indépendantes, nouvel identifiant, ordre de liste, validation sans sélection sans écriture, aucune définition créée par le parcours local.

### Étape 7 — Navigation et segments

Mettre à niveau navigation basse, `Catalogues`, indicateur animé, rangée Catalogue et `SegmentedControl`.

**Résultat vérifiable :** centrage, animation continue, états disabled accessibles sur 360/402/440 points, rendu DSF préservé.

### Étape 8 — Swipe et corrections Composition

Corriger translation, révélation, fermeture, coins, espace du bloc et icône `Côté`.

**Résultat vérifiable :** gestes conformes sans régression des callbacks existants.

### Étape 9 — Catégories

Centrer le bouton et configurer la transition après succès uniquement.

**Résultat vérifiable :** destination `Catalogue des séances`, segment `Séances`, et aucune navigation en cas d’erreur.

### Étape 10 — Contrôle de bornage

Auditer les écrans préparatoires et vérifier l’absence de moteur, route fonctionnelle, persistance d’exécution et fonctions exclues.

### Étape 11 — Validation finale

Exécuter TypeScript, lint, tests ciblés et complets, migrations SQLite, tests UI/gestes/navigation, contrôles responsive/accessibilité, puis vérifier le diff et le périmètre exact.

## 8. Tests

### 8.1 Tests à créer

- `src/domain/activities/__tests__/ActivityDefinition.test.ts` : invariants, validations et conversion en copie ;
- `src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts` : create/read/list/update, ordre `updatedAt DESC`, Zones et rollback ;
- `src/features/activities/__tests__/ActivityDefinitionService.test.ts` ;
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx` ;
- `src/features/activities/__tests__/ActivityCard.test.tsx` ;
- `src/features/activities/__tests__/ActivityCatalogueList.test.tsx` ;
- `src/features/activities/__tests__/ActivitySelectionScreen.test.tsx` ;
- `src/features/activities/__tests__/CatalogueCreateOptions.test.tsx` ;
- `src/features/activities/__tests__/useActivityCatalogue.test.ts` ;
- `src/shared/ui/__tests__/SegmentedControl.test.tsx`.

### 8.2 Tests à adapter

Les tests directement concernés sont adaptés explicitement dans les fichiers listés au périmètre, notamment : routes et layouts, `SessionDraft`, Composition, Catalogue, éditeur, catégories, contextes de brouillon, gestes, migrations, provider SQLite, `ScreenShell` et navigation.

`SessionService.test.ts` n’est pas adapté : son contrat reste inchangé et le fichier est `TEST_UNAFFECTED`. `SessionCard.tsx`, son test, `calculations.ts`, `sideMode.ts` et leurs tests de bilatéralité restent gelés.

### 8.3 Axes de recette

- migration 5→6 et base neuve ;
- création/modification persistantes et relecture ;
- préremplissage exact ;
- séparation ActivityDefinition/SessionActivity ;
- liste triée par dernière modification décroissante ;
- sélection vide invalide sans écriture ;
- insertion atomique et ordre indépendant des touchers ;
- arbre exact et Annuler sans mutation ;
- titres contextuels et rangée Catalogue ;
- `Lecture` et `Déployer` visibles et disabled ;
- Médias visible, repliable, sans accès fichier ;
- navigation basse, segments et accessibilité ;
- swipe Composition ;
- catégories et transition ;
- largeurs 360/402/440, clavier, Safe Areas et texte agrandi ;
- absence de recherche, filtre fonctionnel, tri fonctionnel, archivage, suppression, exécution et moteur.

## 9. Critères d’acceptation

| Exigence | Preuve attendue |
|---|---|
| `Activités` est actif | Test Catalogue et recette UI |
| Titres contextuels corrects | Test des trois segments, Circuit sans navigation |
| Définitions persistantes | Tests repository/service et relecture après remontage |
| Liste dans l’ordre `updatedAt DESC` | Test repository, service et Catalogue |
| Création/modification | Parcours UI complet avec préremplissage |
| Arbre exact | Ordre, libellés, ancrage, apparition et Annuler testés |
| `Une nouvelle activité` | Assertion de texte et accessibilité |
| Copie indépendante | Nouvel ID, champs, Zones, `sideMode`, modifications isolées |
| Création Composition locale | Absence de nouvelle ligne `ActivityDefinition` |
| Validation sans sélection | Action inactive ou rejetée, aucune écriture et Composition inchangée |
| Médias | Section visible/repliable, contrôles désactivés, aucun fichier manipulé |
| Carte Activité | Surface d’édition ; Lecture et Déployer disabled ; aucun swipe Catalogue |
| Navigation basse | `Catalogues`, icônes, marges, séparation et cadre animé |
| Contrôles segmentés | Indicateur centré et translation continue avec rendu DSF préservé |
| Swipe Composition | Translation progressive, fermeture par vrai swipe droit, callbacks préservés |
| Catégories | Bouton centré, destination Séances et transition après succès |
| Injection SQLite | Une seule connexion et un seul cycle de migration vérifiés |
| Préparation d’exécution | Contrôles disabled et absence de handler/moteur |
| Bilatéralité | Aucun changement des modules et tests gelés |
| Bornage | Revue des routes, handlers, migrations, repositories et tests |

## 10. Risques et questions

### Risques

1. **Couplage de l’éditeur à `SessionDraftContext`** : extraction d’un formulaire commun et adaptateurs séparés.
2. **Migration trop large** : limiter 006 aux définitions et Zones nécessaires.
3. **Régression des gestes** : modifier uniquement les modules de geste/présentation et conserver les callbacks testés.
4. **Régression de navigation** : centraliser la géométrie dans `navigationLayout.ts` et vérifier les consommateurs existants.
5. **Connexion SQLite multiple** : toute création de service passe par `SessionServiceProvider`; aucun second provider SQLite ni second appel de migration n’est autorisé.
6. **Confusion préparation/exécution** : interdire toute table, route, service, plan, timer métier ou résultat d’exécution.
7. **Écart documentaire sur Médias et fonctionnalités T03 générales** : appliquer les corrections et exclusions impératives de la mission verrouillée sans étendre le périmètre.

### Clarifications restantes

Aucune clarification ne reste nécessaire pour ce plan :

- le libellé `Une nouvelle activité` est fixé par la mission et l’arbitrage utilisateur fourni ;
- la visibilité et le repli de Médias sont fixés par la correction impérative de mission ;
- la rangée Catalogue est visible, tandis que Filtrer et Trier restent inertes car leurs fonctions sont hors tranche ;
- les titres contextuels et l’ancrage de l’arbre sont déterminés par D-167/D-184 ;
- `Lecture` et `Déployer` sont présents et désactivés, sans handler ;
- la validation sans sélection est invalide et sans écriture ;
- l’état Catalogue est restauré pendant l’aller-retour courant et le segment revient à `Séances` après relance ;
- les calculs et modules de bilatéralité sont explicitement gelés ;
- `SessionService` et son test sont non affectés ;
- `SessionCard` et son test sont gelés ;
- l’injection du nouveau service utilise la connexion SQLite existante via `SessionServiceProvider`.

## 11. Verdict

Le plan est suffisamment déterminé pour la revue indépendante. Il n’autorise aucune implémentation. La liste de périmètre en prose, le `scope_allow` machine et `modified_modules` sont identiques ; les nouveaux tests sont explicitement déclarés comme créations ; les calculs de bilatéralité et les composants gelés restent hors écriture.

### Scope d’écriture exact

```text
app/(creation)/_layout.tsx
app/(creation)/activity-selection.tsx
app/(creation)/exercise.tsx
app/(tabs)/_layout.tsx
app/__tests__/creationLayout.test.tsx
app/__tests__/rootLayoutGesture.test.tsx
app/_layout.tsx
src/domain/activities/ActivityDefinition.ts
src/domain/activities/ActivityDefinitionRepository.ts
src/domain/activities/__tests__/ActivityDefinition.test.ts
src/domain/activities/index.ts
src/domain/sessions/SessionDraft.ts
src/domain/sessions/__tests__/SessionDraft.test.ts
src/domain/sessions/__tests__/composition.test.ts
src/domain/sessions/composition.ts
src/features/activities/ActivityCard.tsx
src/features/activities/ActivityCatalogueList.tsx
src/features/activities/ActivityDefinitionService.ts
src/features/activities/ActivityDefinitionServiceContext.tsx
src/features/activities/ActivityDefinitionServiceProvider.tsx
src/features/activities/ActivityEditorForm.tsx
src/features/activities/ActivitySelectionScreen.tsx
src/features/activities/CatalogueCreateOptions.tsx
src/features/activities/__tests__/ActivityCard.test.tsx
src/features/activities/__tests__/ActivityCatalogueList.test.tsx
src/features/activities/__tests__/ActivityDefinitionService.test.ts
src/features/activities/__tests__/ActivityEditorForm.test.tsx
src/features/activities/__tests__/ActivitySelectionScreen.test.tsx
src/features/activities/__tests__/CatalogueCreateOptions.test.tsx
src/features/activities/__tests__/useActivityCatalogue.test.ts
src/features/activities/useActivityCatalogue.ts
src/features/sessions/CatalogueScreen.tsx
src/features/sessions/CategoriesScreen.tsx
src/features/sessions/CompositionScreen.tsx
src/features/sessions/ExerciseScreen.tsx
src/features/sessions/SessionDraftContext.tsx
src/features/sessions/SessionDraftProvider.tsx
src/features/sessions/SessionServiceProvider.tsx
src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx
src/features/sessions/__tests__/CatalogueScreen.test.tsx
src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx
src/features/sessions/__tests__/CategoriesScreen.test.tsx
src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx
src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx
src/features/sessions/__tests__/CompositionScreen.test.tsx
src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx
src/features/sessions/__tests__/ExerciseScreen.test.tsx
src/features/sessions/__tests__/SessionDraftContext.test.tsx
src/features/sessions/__tests__/SessionDraftProvider.test.tsx
src/features/sessions/__tests__/SessionServiceProvider.test.tsx
src/features/sessions/__tests__/compositionGesture.test.ts
src/features/sessions/__tests__/compositionPresentation.test.ts
src/features/sessions/compositionGesture.ts
src/features/sessions/compositionPresentation.ts
src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts
src/infrastructure/database/__tests__/initializeDatabase.test.ts
src/infrastructure/database/__tests__/migrateDatabase.test.ts
src/infrastructure/database/constants.ts
src/infrastructure/database/migrateDatabase.ts
src/infrastructure/database/migrations/migration006.ts
src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
src/infrastructure/database/types/DatabaseRows.ts
src/shared/i18n/resources/fr.ts
src/shared/ui/ScreenShell.tsx
src/shared/ui/SegmentedControl.tsx
src/shared/ui/__tests__/ScreenShell.test.tsx
src/shared/ui/__tests__/SegmentedControl.test.tsx
src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx
src/shared/ui/__tests__/navigationLayout.test.ts
src/shared/ui/navigationLayout.ts
```

Aucun autre chemin applicatif ou test n’est requis par ce plan.



### scope_allow machine

```text
app/(creation)/_layout.tsx
app/(creation)/activity-selection.tsx
app/(creation)/exercise.tsx
app/(tabs)/_layout.tsx
app/__tests__/creationLayout.test.tsx
app/__tests__/rootLayoutGesture.test.tsx
app/_layout.tsx
src/domain/activities/ActivityDefinition.ts
src/domain/activities/ActivityDefinitionRepository.ts
src/domain/activities/__tests__/ActivityDefinition.test.ts
src/domain/activities/index.ts
src/domain/sessions/SessionDraft.ts
src/domain/sessions/__tests__/SessionDraft.test.ts
src/domain/sessions/__tests__/composition.test.ts
src/domain/sessions/composition.ts
src/features/activities/ActivityCard.tsx
src/features/activities/ActivityCatalogueList.tsx
src/features/activities/ActivityDefinitionService.ts
src/features/activities/ActivityDefinitionServiceContext.tsx
src/features/activities/ActivityDefinitionServiceProvider.tsx
src/features/activities/ActivityEditorForm.tsx
src/features/activities/ActivitySelectionScreen.tsx
src/features/activities/CatalogueCreateOptions.tsx
src/features/activities/__tests__/ActivityCard.test.tsx
src/features/activities/__tests__/ActivityCatalogueList.test.tsx
src/features/activities/__tests__/ActivityDefinitionService.test.ts
src/features/activities/__tests__/ActivityEditorForm.test.tsx
src/features/activities/__tests__/ActivitySelectionScreen.test.tsx
src/features/activities/__tests__/CatalogueCreateOptions.test.tsx
src/features/activities/__tests__/useActivityCatalogue.test.ts
src/features/activities/useActivityCatalogue.ts
src/features/sessions/CatalogueScreen.tsx
src/features/sessions/CategoriesScreen.tsx
src/features/sessions/CompositionScreen.tsx
src/features/sessions/ExerciseScreen.tsx
src/features/sessions/SessionDraftContext.tsx
src/features/sessions/SessionDraftProvider.tsx
src/features/sessions/SessionServiceProvider.tsx
src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx
src/features/sessions/__tests__/CatalogueScreen.test.tsx
src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx
src/features/sessions/__tests__/CategoriesScreen.test.tsx
src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx
src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx
src/features/sessions/__tests__/CompositionScreen.test.tsx
src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx
src/features/sessions/__tests__/ExerciseScreen.test.tsx
src/features/sessions/__tests__/SessionDraftContext.test.tsx
src/features/sessions/__tests__/SessionDraftProvider.test.tsx
src/features/sessions/__tests__/SessionServiceProvider.test.tsx
src/features/sessions/__tests__/compositionGesture.test.ts
src/features/sessions/__tests__/compositionPresentation.test.ts
src/features/sessions/compositionGesture.ts
src/features/sessions/compositionPresentation.ts
src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts
src/infrastructure/database/__tests__/initializeDatabase.test.ts
src/infrastructure/database/__tests__/migrateDatabase.test.ts
src/infrastructure/database/constants.ts
src/infrastructure/database/migrateDatabase.ts
src/infrastructure/database/migrations/migration006.ts
src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
src/infrastructure/database/types/DatabaseRows.ts
src/shared/i18n/resources/fr.ts
src/shared/ui/ScreenShell.tsx
src/shared/ui/SegmentedControl.tsx
src/shared/ui/__tests__/ScreenShell.test.tsx
src/shared/ui/__tests__/SegmentedControl.test.tsx
src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx
src/shared/ui/__tests__/navigationLayout.test.ts
src/shared/ui/navigationLayout.ts
```


## Tests — fermeture d’impact machine

Les tests suivants sont ouverts en écriture par la fermeture déterministe d’impact et font partie du contrat de plan :

- `app/__tests__/creationLayout.test.tsx`
- `app/__tests__/rootLayoutGesture.test.tsx`
- `src/domain/sessions/__tests__/SessionDraft.test.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx`
- `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CategoriesScreen.test.tsx`
- `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/features/sessions/__tests__/SessionDraftContext.test.tsx`
- `src/features/sessions/__tests__/SessionDraftProvider.test.tsx`
- `src/features/sessions/__tests__/SessionServiceProvider.test.tsx`
- `src/features/sessions/__tests__/compositionGesture.test.ts`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/infrastructure/database/__tests__/initializeDatabase.test.ts`
- `src/infrastructure/database/__tests__/migrateDatabase.test.ts`
- `src/shared/ui/__tests__/ScreenShell.test.tsx`
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `src/shared/ui/__tests__/navigationLayout.test.ts`

<KODJO_MODIFIED_MODULES_JSON>
[
  {
    "path": "app/(creation)/_layout.tsx",
    "change": "MODIFY"
  },
  {
    "path": "app/(creation)/activity-selection.tsx",
    "change": "CREATE"
  },
  {
    "path": "app/(creation)/exercise.tsx",
    "change": "MODIFY"
  },
  {
    "path": "app/(tabs)/_layout.tsx",
    "change": "MODIFY"
  },
  {
    "path": "app/__tests__/creationLayout.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "app/__tests__/rootLayoutGesture.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "app/_layout.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/activities/ActivityDefinition.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/activities/ActivityDefinitionRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/activities/index.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/sessions/SessionDraft.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/composition.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/composition.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/activities/ActivityCard.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivityCatalogueList.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivityDefinitionService.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivityDefinitionServiceContext.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivityDefinitionServiceProvider.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivityEditorForm.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/ActivitySelectionScreen.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/CatalogueCreateOptions.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/activities/useActivityCatalogue.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/sessions/CatalogueScreen.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/CategoriesScreen.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/CompositionScreen.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/ExerciseScreen.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/SessionDraftContext.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/SessionDraftProvider.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/SessionServiceProvider.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/compositionGesture.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/compositionGesture.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/compositionPresentation.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/constants.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/migrateDatabase.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/migrations/migration006.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/types/DatabaseRows.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/i18n/resources/fr.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/ScreenShell.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/SegmentedControl.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/__tests__/navigationLayout.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/navigationLayout.ts",
    "change": "MODIFY"
  }
]
</KODJO_MODIFIED_MODULES_JSON>
PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "63a3c26ed492f7c0925cfb57419f3dc2dcc5e476",
  "scan_sha256": "38427d297cc454eb365de48acd986449a69548111914790d62488c24da210ab7",
  "modified_modules": [
    {
      "path": "app/(creation)/_layout.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/(creation)/activity-selection.tsx",
      "change": "CREATE"
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/(tabs)/_layout.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/__tests__/rootLayoutGesture.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/_layout.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/activities/ActivityDefinitionRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/activities/index.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivityCatalogueList.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivityDefinitionService.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceContext.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceProvider.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/CatalogueCreateOptions.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/__tests__/useActivityCatalogue.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/activities/useActivityCatalogue.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/compositionGesture.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrations/migration006.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/ScreenShell.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/SegmentedControl.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/shared/ui/__tests__/ScreenShell.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/__tests__/SegmentedControl.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/__tests__/navigationLayout.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/navigationLayout.ts",
      "change": "MODIFY"
    }
  ],
  "rows": [
    {
      "path": "app/(creation)/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/(creation)/activity-selection.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/(tabs)/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/__tests__/rootLayoutGesture.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/ActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityCatalogueList.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityDefinitionService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/CatalogueCreateOptions.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/useActivityCatalogue.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/useActivityCatalogue.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/compositionGesture.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrations/migration006.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/ScreenShell.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/SegmentedControl.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/ScreenShell.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/SegmentedControl.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/navigationLayout.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/navigationLayout.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "La migration 006 et l’ajout de lignes de données sont additifs ; le contrat du repository de Séances couvert par ce test ne change pas."
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 148,
      "classification": "TEST_UNAFFECTED",
      "justification": "Classification explicitement fixée par le plan : aucun contrat couvert par ce test ne change dans V2-CAT-01."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 128,
      "classification": "TEST_UNAFFECTED",
      "justification": "La migration additive et l’extension des types de lignes ne modifient pas le contrat du repository de Catégories."
    },
    {
      "path": "app/(creation)/categories.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Wrapper de route explicitement déclaré inchangé ; le contrat de montage de CategoriesScreen est conservé."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Wrapper de route explicitement déclaré inchangé ; les adaptations restent dans l’écran et le contexte de Composition."
    },
    {
      "path": "app/(tabs)/index.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CatalogueScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Wrapper de route explicitement déclaré inchangé ; CatalogueScreen conserve son contrat de montage."
    },
    {
      "path": "src/domain/sessions/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/composition.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le barrel consomme des modules de session dont les changements restent compatibles et n’exige aucune modification de ses exports."
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Classification explicitement fixée : le service ne consomme que SessionDraft, toCreateSessionInput et toUpdateSessionInput, sans changement de contrat consommé."
    },
    {
      "path": "src/infrastructure/database/ExpoDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’évolution des constantes de base reste compatible ; aucune modification de la connexion SQLite ou de son contrat n’est requise."
    },
    {
      "path": "src/infrastructure/database/initializeDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’initialisation conserve son contrat et utilise le cycle de migration existant, complété sans changement d’API consommée."
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contrôle d’intégration consomme le migrateur sans changement de contrat ; la migration 006 est additive."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’extension additive de DatabaseRows ne change pas le contrat ni les opérations du repository de Catégories."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Les types et constantes évoluent de façon additive ; le repository de Séances ne nécessite aucune adaptation."
    },
    {
      "path": "src/shared/i18n/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le barrel i18n continue d’exposer la même ressource avec des traductions ajoutées ; aucun changement de contrat consommé n’est démontré."
    }
  ],
  "scope_allow": [
    "app/(creation)/_layout.tsx",
    "app/(creation)/activity-selection.tsx",
    "app/(creation)/exercise.tsx",
    "app/(tabs)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/composition.ts",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityCatalogueList.tsx",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityDefinitionServiceContext.tsx",
    "src/features/activities/ActivityDefinitionServiceProvider.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "src/features/activities/useActivityCatalogue.ts",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionGesture.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration006.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/ScreenShell.tsx",
    "src/shared/ui/SegmentedControl.tsx",
    "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "src/shared/ui/__tests__/navigationLayout.test.ts",
    "src/shared/ui/navigationLayout.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "bed140fac4dd5507d9d3a1f2eca821008e26efb8",
  "scan_revision": "63a3c26ed492f7c0925cfb57419f3dc2dcc5e476",
  "write_scope": [
    "app/(creation)/_layout.tsx",
    "app/(creation)/activity-selection.tsx",
    "app/(creation)/exercise.tsx",
    "app/(tabs)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/composition.ts",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityCatalogueList.tsx",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityDefinitionServiceContext.tsx",
    "src/features/activities/ActivityDefinitionServiceProvider.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "src/features/activities/useActivityCatalogue.ts",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionGesture.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration006.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/ScreenShell.tsx",
    "src/shared/ui/SegmentedControl.tsx",
    "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "src/shared/ui/__tests__/navigationLayout.test.ts",
    "src/shared/ui/navigationLayout.ts"
  ],
  "required_test_writes": [
    "app/__tests__/creationLayout.test.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "src/shared/ui/__tests__/navigationLayout.test.ts"
  ]
}
</KODJO_PLAN_CONTRACT_JSON>

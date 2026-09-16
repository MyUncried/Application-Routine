# Plan technique initial — V2-CAT-01

## 1. Identité et verdict

- Tranche : `V2-CAT-01`
- Issue : `#150`
- Source produit/documentaire immuable : `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`
- Mission de planification : `.github/orchestration/v2-slices/V2-CAT-01/planning-mission.md`
- Mode : `PLAN_ONLY`
- Implémentation autorisée : **NON**

Verdict : **PLAN_READY_FOR_INDEPENDENT_REVIEW**

Aucune clarification produit bloquante n’est identifiée à ce stade. Le périmètre est borné par l’Issue #150 ; la documentation et Figma servent uniquement à déterminer le comportement et le rendu des éléments déjà inclus.

---

## 2. Constat de l’existant

### 2.1 Catalogue actuel

Le code courant ne possède qu’un Catalogue fonctionnel de Séances.

- `src/features/sessions/CatalogueScreen.tsx`
  - charge les Séances via `useSessionCatalogue()` ;
  - affiche `SessionCard` ;
  - possède déjà le sélecteur visuel `Activités / Séances / Circuits`, mais `Activités` et `Circuits` sont désactivés ;
  - l’action `Créer` navigue directement vers `/composition` ;
  - aucun `ActivityDefinitionRepository` n’existe dans le code.
- `src/features/sessions/useSessionCatalogue.ts` charge uniquement les Séances.
- `src/features/sessions/SessionCard.tsx` porte la carte de Séance existante.

Écart : le segment `Activités` doit devenir fonctionnel, afficher un Catalogue d’`ActivityDefinition`, permettre création et modification, sans recherche/filtre/tri/archivage/suppression/swipe dans cette tranche.

### 2.2 Modèle et persistance

Le domaine courant connaît les Activités uniquement comme contenu de Séance (`SessionActivity` / brouillon de Composition). Il n’existe pas de définition autonome persistante de Catalogue.

- `src/domain/sessions/Session.ts`
- `src/domain/sessions/SessionDraft.ts`
- `src/domain/sessions/SessionRepository.ts`
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts`

La base est actuellement à la version `5` :

- migrations `001` à `005` présentes ;
- `migration005` appartient à la bilatéralité ;
- `migrateDatabase.ts` s’arrête à `version = 5`.

Écart : créer une persistance autonome minimale pour `ActivityDefinition`, sans convertir les `SessionActivity` existantes et sans implémenter les opérations exclues.

### 2.3 Éditeur d’Activité

`src/features/sessions/ExerciseScreen.tsx` contient déjà l’éditeur fonctionnel complet d’une Activité de Séance :

- Nom ;
- Description ;
- Zones corporelles ;
- Durée / Répétitions / À l’échec ;
- Séries ;
- Pause ;
- Récupération ;
- côté ;
- synthèse ;
- roulettes ;
- garde d’abandon.

Mais l’écran est fortement couplé à `SessionDraftContext` et écrit dans le brouillon de Séance à la fin.

Écart : réutiliser le même formulaire pour une `ActivityDefinition` persistante sans dupliquer les règles de validation, de calcul, de présentation ou de bilatéralité.

### 2.4 Ajout d’Activité depuis Composition

`CompositionScreen.tsx` navigue aujourd’hui directement vers `/exercise` pour créer une Activité de Séance. Il n’existe pas de sélection depuis un Catalogue d’Activités persistantes.

Écart : intercaler le choix documenté :

1. sélectionner une Activité existante depuis le Catalogue des Activités ;
2. créer une nouvelle Activité.

La copie issue du Catalogue doit devenir une `SessionActivity` indépendante ; une Activité créée directement depuis Composition ne doit pas créer d’`ActivityDefinition`.

### 2.5 Navigation basse

`app/(tabs)/_layout.tsx` possède une barre personnalisée `BottomTabBar` avec quatre destinations historiques et Recherche. Le rendu repose sur :

- `src/shared/ui/navigationLayout.ts` ;
- `src/shared/ui/tokens.ts` ;
- `src/shared/ui/KodjoIcon.tsx` ;
- `src/shared/i18n/resources/fr.ts`.

Écarts inclus :

- destination `Catalogues` et icône courante ;
- hauteur/marges verticales équilibrées ;
- séparation visible avec la zone centrale ;
- Recherche réalignée sans agrandissement ;
- cadre sélectionné visible ;
- glissement continu du cadre sélectionné lors d’un changement de destination.

### 2.6 Contrôles segmentés

`ExerciseScreen.tsx` et `CatalogueScreen.tsx` rendent actuellement des segments par styles conditionnels ; la sélection change immédiatement de style.

Écart : introduire une primitive réutilisable dont le cadre de sélection est centré verticalement et se translate de l’option courante vers la nouvelle, sans disparition/réapparition.

### 2.7 Swipe dans Composition

Le swipe concerné existe déjà dans `CompositionScreen.tsx`, avec actions `Dupliquer / Supprimer` fonctionnelles.

Écart borné :

- la carte doit suivre le geste gauche ;
- révélation progressive du bloc ;
- geste droit valide requis pour refermer ;
- suppression des déclenchements parasites ;
- coins gauches du bloc d’actions arrondis ;
- espace canonique entre carte et bloc, couleur de fond du Tour.

Aucun swipe Catalogue n’est ajouté.

### 2.8 Catégories

`CategoriesScreen.tsx` porte le parcours existant de sélection/création puis enregistrement de la Séance.

Écarts :

- centrer `Créer une catégorie` ;
- après validation finale, transition horizontale : nouvel écran depuis la droite, écran courant vers la gauche.

### 2.9 Préparation exécution

Aucun moteur d’exécution ne doit être créé. Les seuls travaux admis sont les états d’écran déjà documentés avec `Déployer` / `Démarrer` visibles mais désactivés, ainsi qu’une architecture qui n’empêche pas ultérieurement deux origines d’exécution : Activité seule / Séance.

---

## 3. Matrice périmètre → état actuel → écart

| Sous-périmètre | État actuel | Écart à traiter |
|---|---|---|
| Segment Activités | visible mais désactivé | activer et afficher le Catalogue Activités |
| Segment Séances | fonctionnel | préserver |
| Segment Circuits | visible, désactivé | préserver désactivé |
| Catalogue Activités | absent | créer affichage + ouverture + création + modification |
| Recherche/filtre/tri Activités | absent | **ne pas créer** |
| Archivage/restauration/suppression Activités | absent | **ne pas créer** |
| Création Catalogue | `Créer` va directement à Composition | insérer options Activité / Séance / Circuit désactivé / Annuler |
| Animation options | absente | apparition progressive et rapide |
| Éditeur Activité de Séance | existant | factoriser la partie formulaire pour réusage persistante |
| Éditeur ActivityDefinition | absent | créer adaptateur persistant sur formulaire commun |
| Médias | bouton historique désactivé | rendre la section documentée Déployer/Condenser + placeholder désactivé |
| Synthèse | nom non gras selon état courant | nom en gras uniquement |
| Ajout depuis Composition | création directe uniquement | choix Catalogue ou création |
| Copie ActivityDefinition → SessionActivity | absente | créer copie indépendante, sans lien dynamique |
| Sauvegarde automatique vers Catalogue depuis Composition | absente | préserver absente ; préparer seulement le découplage métier |
| Navigation basse | ancien libellé/icônes/géométrie | appliquer référence courante + animation du cadre sélectionné |
| Segmented controls | styles statiques | cadre animé et centré |
| Swipe Composition | révélation actuelle non conforme | translation de carte + bloc conforme |
| Swipe Catalogues | hors périmètre | ne rien ajouter |
| Icône Côté carte | position actuelle | décaler selon marge demandée |
| Bouton Créer catégorie | position actuelle | centrage horizontal |
| Transition après Catégorie | retour actuel | transition droite→gauche documentée |
| Déployer/Démarrer | partiellement visibles selon écrans | présents là où documentés, toujours désactivés |
| Moteur exécution | absent | **reste absent** |

---

## 4. Architecture technique cible minimale

### 4.1 Nouveau domaine `ActivityDefinition`

Créer un domaine autonome, sans faire d’`ActivityDefinition` un alias de `SessionActivity`.

Fichiers proposés :

- `src/domain/activities/ActivityDefinition.ts` — entité et entrées create/update ;
- `src/domain/activities/ActivityDefinitionRepository.ts` — contrat minimal ;
- `src/domain/activities/activityDefinitionValidation.ts` uniquement si les validations ne peuvent pas être réutilisées directement depuis les règles déjà partagées ; sinon ne pas créer ce fichier.

Le modèle doit réutiliser les types métier déjà canoniques lorsque possible : mode d’exécution, `SideMode`, bornes Séries/Pause/Récupération, Zones corporelles.

Contrat repository **strictement limité à la tranche** :

- `create` ;
- `findById` ;
- `list` des définitions actives dans l’ordre documentaire applicable ;
- `update`.

Ne pas ajouter `archive`, `restore`, `delete`, recherche ou filtre dans ce contrat tant qu’ils restent hors périmètre.

### 4.2 Migration additive

Créer `src/infrastructure/database/migrations/migration006.ts` et porter `DATABASE_VERSION` de `5` à `6`.

La migration crée uniquement les structures nécessaires aux définitions autonomes et à leurs relations effectivement nécessaires dans cette tranche, notamment les Zones corporelles.

Contraintes :

- ne modifier aucune migration `001..005` ;
- ne convertir aucune `SessionActivity` existante ;
- ne créer aucune définition silencieusement ;
- ne créer aucune table/colonne d’Exécution, résultat, suivi ou média réel ;
- ne préimplémenter ni archivage ni suppression si non requis par le modèle minimal retenu ;
- migration idempotente dans le mécanisme séquentiel existant.

Modifier :

- `src/infrastructure/database/constants.ts` ;
- `src/infrastructure/database/migrateDatabase.ts` ;
- `src/infrastructure/database/types/DatabaseRows.ts` si les rows sont centralisées ;
- tests de migration et d’intégration native associés.

### 4.3 Repository SQLite et service

Créer :

- `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts` ;
- `src/features/activities/ActivityDefinitionService.ts` ;
- `src/features/activities/ActivityDefinitionServiceContext.tsx` ou intégrer le service au provider DB existant si cela évite un provider racine supplémentaire.

Le service expose les opérations incluses seulement : liste, lecture, création, modification.

Le provider doit partager la même ouverture SQLite que le `SessionServiceProvider` ; ne pas ouvrir une seconde base ni dupliquer l’initialisation/migration.

### 4.4 Copie vers Composition

Créer un service de copie borné, soit :

- `src/features/activities/CompositionActivityService.ts`, ou
- une fonction dédiée dans un service déjà responsable de la Composition si la structure existante le permet sans couplage circulaire.

Responsabilité : convertir une `ActivityDefinition` sélectionnée en nouveau `SessionDraftExercise` / `SessionActivity` indépendant en copiant toutes les propriétés métier applicables, avec nouvel identifiant d’occurrence.

Aucun lien dynamique n’est conservé après copie.

La fonction doit être testable sans React.

### 4.5 Formulaire partagé

Refactoriser `ExerciseScreen.tsx` de manière minimale :

- extraire la partie formulaire/présentation/validation dans un composant commun, par exemple `src/features/activities/ActivityEditorForm.tsx` ;
- conserver un adaptateur `ExerciseScreen` pour le contexte Composition ;
- créer un adaptateur `ActivityDefinitionEditorScreen` pour création/modification persistante.

Le formulaire commun reçoit :

- valeur initiale ;
- mode `create | edit` ;
- titre/contexte ;
- callback de validation ;
- callback de sortie ;
- aucune connaissance de `SessionDraftContext` ou du repository.

Ainsi :

- le parcours Composition continue à écrire uniquement dans le brouillon de Séance ;
- le parcours Catalogue appelle `ActivityDefinitionService` ;
- les règles d’UI et de validation restent uniques.

La factorisation ne doit pas modifier les calculs ou comportements de bilatéralité déjà validés.

### 4.6 Catalogue unifié par type

Modifier `CatalogueScreen.tsx` pour porter un état de type de contenu `SESSION | ACTIVITY` ; `CIRCUIT` reste désactivé.

Ne pas transformer ce sélecteur en filtre.

Composants proposés :

- `src/features/catalogue/ContentTypeSelector.tsx` — segment partagé animé ;
- `src/features/activities/ActivityCatalogueList.tsx` ;
- `src/features/activities/ActivityCard.tsx` ;
- `src/features/activities/useActivityCatalogue.ts`.

Si la structure actuelle permet de garder `ContentTypeSelector` dans `CatalogueScreen.tsx` sans duplication, ne pas extraire artificiellement ; l’extraction est justifiée seulement si elle est réutilisée pour l’animation/règle transverse.

La carte Activité n’expose aucune action swipe dans cette tranche.

### 4.7 Options de création

Créer un composant borné, par exemple `CatalogueCreateOptions`, déclenché depuis `Créer` :

- Activité → éditeur de définition persistante ;
- Séance → Composition actuelle ;
- Circuit → visible, désactivé ;
- Annuler → fermeture.

L’apparition utilise une animation courte et progressive (`Animated` ou primitive déjà installée), sans nouvelle dépendance.

Aucune nouvelle route Circuit.

### 4.8 Ajout depuis Composition

Modifier l’action `Ajouter une activité` de `CompositionScreen.tsx` pour ouvrir le choix documenté :

- `Depuis le catalogue` → écran de sélection des `ActivityDefinition` ;
- `Créer une activité` → `ExerciseScreen` actuel.

Créer une route de sélection dans le groupe `(creation)` uniquement si les contrats d’écran la décrivent comme écran distinct. Le nom de route doit suivre la structure existante ; proposition : `app/(creation)/activity-selection.tsx` + `ActivitySelectionScreen.tsx`.

Sélection :

- charger les définitions via repository/service ;
- permettre la sélection selon le contrat courant ;
- validation crée les copies atomiquement dans le brouillon ;
- aucune modification des définitions sources.

Ne pas ajouter recherche/filtre/tri si exclus par la tranche, même si la documentation générale prévoit ces capacités plus tard.

### 4.9 Navigation basse et contrôle segmenté partagé

Créer ou compléter une primitive `SegmentedControl` commune dans `src/shared/ui/` :

- conteneur selon tokens existants ;
- indicateur sélectionné animé par translation ;
- centrage vertical invariant ;
- accessibilité `tablist/tab` ;
- option désactivée supportée.

L’utiliser au minimum pour :

- `Activités / Séances / Circuits` ;
- mode d’exécution dans l’éditeur d’Activité ;
- autres contrôles segmentés des écrans effectivement inclus, uniquement si déjà documentés comme correction de cette tranche.

Modifier `app/(tabs)/_layout.tsx` pour la barre basse :

- destination/libellé/icône `Catalogues` ;
- géométrie verticale ;
- espacement supérieur avec zone centrale ;
- Recherche sans agrandissement ;
- indicateur actif animé horizontalement.

Conserver les cibles tactiles minimales existantes.

### 4.10 Swipe Composition

Modifier uniquement le composant/couche de carte existante dans `CompositionScreen.tsx` ou extraire une petite primitive `SwipeActivityCard` si cela simplifie le geste sans refonte.

Le geste doit :

- suivre `translationX` pendant le swipe gauche ;
- borner la translation au seuil d’ouverture ;
- exposer progressivement le bloc ;
- ouvrir/refermer avec animation courte ;
- n’accepter le swipe droit de fermeture qu’après dépassement du seuil documenté ;
- neutraliser les déclenchements parasites entre tap, long press et swipe ;
- préserver l’appui court de modification et l’appui long de déplacement.

Aucune logique Dupliquer/Supprimer n’est redéveloppée ; les callbacks existants sont conservés.

### 4.11 Catégories et transition

Modifier `CategoriesScreen.tsx` :

- centrage horizontal du bouton ;
- après succès d’enregistrement, déclencher la transition de pile correspondante.

Privilégier une animation de navigation configurée au niveau du Stack `(creation)` plutôt qu’une animation locale d’écran, à condition qu’elle n’altère pas les autres transitions existantes. Si l’animation doit être spécifique, la borner à la sortie de `categories`.

### 4.12 Préparation exécution sans moteur

Ne créer aucun service d’exécution, plan d’exécution, résultat ou table d’exécution.

La préparation autorisée se limite à :

- rendre les états `Déployer` / `Démarrer` conformément aux écrans courants ;
- maintenir ces actions désactivées ;
- ne pas coupler `ActivityDefinition` à une Séance artificielle ;
- conserver un modèle propre permettant plus tard qu’une origine d’exécution référence soit une Activité ou une Séance.

Aucun enum `ExecutionOrigin`, aucune migration d’Exécution et aucun moteur n’est requis par cette tranche tant qu’aucun comportement exécutable ne les consomme.

---

## 5. Périmètre technique exact proposé

### 5.1 Fichiers à créer — production

1. `src/domain/activities/ActivityDefinition.ts`
2. `src/domain/activities/ActivityDefinitionRepository.ts`
3. `src/infrastructure/database/migrations/migration006.ts`
4. `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts`
5. `src/features/activities/ActivityDefinitionService.ts`
6. `src/features/activities/useActivityCatalogue.ts`
7. `src/features/activities/ActivityCard.tsx`
8. `src/features/activities/ActivityCatalogueList.tsx`
9. `src/features/activities/ActivityEditorForm.tsx`
10. `src/features/activities/ActivityDefinitionEditorScreen.tsx`
11. `src/features/activities/ActivitySelectionScreen.tsx` si le contrat d’écran impose un écran dédié de sélection
12. `src/shared/ui/SegmentedControl.tsx`
13. route(s) Expo correspondante(s) pour création/modification persistante et sélection depuis Composition, selon les contrats d’écran existants.

Les noms 7–13 sont des emplacements techniques proposés ; l’implémentation peut fusionner un fichier avec un consommateur existant si cela réduit réellement la surface sans dupliquer de logique. Toute suppression d’un fichier proposé doit conserver les responsabilités prévues.

### 5.2 Fichiers à modifier — production

- `app/_layout.tsx` ou `SessionServiceProvider.tsx` pour injection du repository/service ActivityDefinition via la même base ;
- `app/(tabs)/_layout.tsx` ;
- `app/(creation)/_layout.tsx` ;
- `src/features/sessions/CatalogueScreen.tsx` ;
- `src/features/sessions/CompositionScreen.tsx` ;
- `src/features/sessions/ExerciseScreen.tsx` ;
- `src/features/sessions/CategoriesScreen.tsx` ;
- `src/features/sessions/compositionPresentation.ts` uniquement pour le gras de nom si le rendu de synthèse passe par ce module ;
- `src/shared/ui/navigationLayout.ts` ;
- `src/shared/ui/tokens.ts` seulement si les valeurs canoniques ne sont pas déjà exprimées ;
- `src/shared/ui/KodjoIcon.tsx` / registre d’icônes uniquement si nécessaire à `Catalogues` ;
- `src/shared/i18n/resources/fr.ts` ;
- `src/infrastructure/database/constants.ts` ;
- `src/infrastructure/database/migrateDatabase.ts` ;
- `src/infrastructure/database/types/DatabaseRows.ts` si nécessaire ;
- provider/service DB existant pour instanciation du nouveau repository.

### 5.3 Fichiers explicitement à ne pas modifier sauf preuve contraire de compilation

- migrations `001..005` ;
- logique de calcul de bilatéralité déjà validée ;
- moteur d’exécution inexistant/futur ;
- Suivi ;
- médias fonctionnels ;
- Circuits ;
- logique d’archivage/suppression Catalogue Activités ;
- logique swipe des Catalogues.

---

## 6. Plan séquencé

### Étape 1 — Verrouiller les contrats ActivityDefinition

1. Définir le type autonome à partir des champs métier documentés déjà supportés par l’éditeur.
2. Réutiliser `SideMode`, modes d’exécution, validation et bornes existantes.
3. Définir repository minimal create/read/list/update.
4. Tests domaine des invariants et de la conversion copie.

Résultat vérifiable : le domaine compile sans dépendance UI/SQLite et ne contient aucune API hors scope.

### Étape 2 — Ajouter la persistance additive

1. `migration006` : table(s) ActivityDefinition + relation Zones corporelles nécessaire.
2. `DATABASE_VERSION = 6`.
3. Ajouter le passage version `5 → 6` dans `migrateDatabase.ts`.
4. Implémenter `SqliteActivityDefinitionRepository`.
5. Tests migration 0→6, 5→6, rollback, anciennes Séances intactes, create/update/list/get.

Résultat : définitions persistantes sans transformation d’Activités historiques.

### Étape 3 — Service et injection

1. Créer `ActivityDefinitionService`.
2. Instancier repository/service depuis l’ouverture SQLite existante.
3. Exposer contexte/hook stable.
4. Tests service sur erreurs repository et double opération si pertinent.

Résultat : UI indépendante de SQLite direct.

### Étape 4 — Factoriser l’éditeur sans régression

1. Extraire le formulaire commun depuis `ExerciseScreen`.
2. Préserver strictement les comportements actuels Composition.
3. Ajouter l’adaptateur persistent create/edit.
4. Implémenter nom en gras dans synthèse.
5. Afficher section Médias Déployer/Condenser + placeholder désactivé.
6. Tests existants de `ExerciseScreen` inchangés ou adaptés sans perte de couverture ; nouveaux tests create/edit persistent.

Résultat : un seul contrat UI métier d’Activité, deux destinations de sauvegarde séparées.

### Étape 5 — Catalogue Activités

1. Activer segment `Activités`.
2. Charger les ActivityDefinition.
3. Créer carte conforme et liste.
4. Tap carte → modification persistante.
5. `Créer` → écran d’options ; Activité → création, Séance → Composition, Circuit désactivé, Annuler ferme.
6. Animation courte/progressive des options.
7. Aucun swipe/recherche/filtre/tri/archive/suppression.

Résultat : Catalogue Activités complet dans le scope.

### Étape 6 — Ajout depuis Composition

1. Remplacer le lancement direct de l’éditeur par le choix documenté.
2. Branche Catalogue : sélectionner ActivityDefinition et copier en SessionActivity indépendante.
3. Branche Création : conserver création locale sans ActivityDefinition.
4. Vérifier retour à la Composition et ordre/position d’insertion selon contrat.
5. Tests : copie complète, nouvel ID, source inchangée, abandon sans effet, création locale non persistée au Catalogue.

Résultat : les deux parcours d’ajout sont fonctionnels sans synchronisation implicite.

### Étape 7 — Navigation basse et contrôles segmentés

1. Introduire `SegmentedControl` commun animé.
2. Remplacer les segments des écrans inclus.
3. Corriger navigation basse et son indicateur animé.
4. Mettre à jour icônes/libellés/tokens nécessaires.
5. Tests géométrie, accessibilité, disabled, changement de sélection, animation déclenchée.

Résultat : comportement transverse conforme sans refonte hors scope.

### Étape 8 — Swipe Composition et icône Côté

1. Corriger translation continue de carte.
2. Révélation progressive + seuils.
3. Bloc arrondi et espace canonique.
4. Préserver tap/long press/drag/duplicate/delete.
5. Déplacer icône Côté selon marge définie.
6. Tests gestes et non-régression.

Résultat : seule la Composition change ; Catalogues inchangés sur ce sujet.

### Étape 9 — Catégories et transitions

1. Centrer le bouton.
2. Configurer transition après succès.
3. Préserver atomicité et navigation d’erreur existantes.
4. Tests navigation/sauvegarde.

### Étape 10 — États préparatoires d’exécution

1. Relever dans les écrans inclus les occurrences documentées de `Déployer` / `Démarrer`.
2. Les rendre présents et disabled conformément aux contrats.
3. Vérifier qu’aucun handler d’exécution n’est créé.
4. Tests d’accessibilité `disabled` et absence d’effet.

### Étape 11 — Contrôle transversal et non-régression

1. TypeScript.
2. Lint.
3. Jest ciblé puis complet.
4. `git diff --check`.
5. Tests SQLite natifs/migrations.
6. Contrôle scope : aucune fonctionnalité exclue introduite.
7. Recette device : navigation, segments, swipe, animations, catalogue, création/modification, sélection depuis Composition.

---

## 7. Tests à créer / adapter

### Domaine

- ActivityDefinition valide pour Durée / Répétitions / À l’échec ;
- conservation Séries/Pause/Récupération/Zones/Côté ;
- conversion ActivityDefinition → occurrence indépendante ;
- nouvel ID d’occurrence ;
- source persistante inchangée après édition de la copie.

### Repository / SQLite

- migration 5→6 ;
- base neuve 0→6 ;
- migration sans création implicite de définitions depuis `activities` ;
- create/find/list/update ;
- ordre par dernière modification si requis pour l’affichage de base ;
- Zones corporelles persistées ;
- rollback transaction ;
- compatibilité des Séances existantes.

### Service

- création persistante ;
- modification persistante ;
- chargement catalogue ;
- erreur repository sans faux succès.

### UI Catalogue

- segment Séances/Activités fonctionnel ; Circuit disabled ;
- création options ;
- Annuler ;
- Activité → création ; Séance → Composition ; Circuit aucune navigation ;
- liste Activités ;
- tap → modification ;
- absence recherche/filtre/tri/swipe.

### UI Éditeur

- titres création/modification selon contexte ;
- préremplissage modification ;
- nom en gras dans synthèse ;
- Média visible, disclosure fonctionnel, placeholder disabled ;
- validation et roulettes préservées ;
- aucune sauvegarde Catalogue depuis création Composition.

### Composition

- choix Catalogue / Créer ;
- copie correcte dans le brouillon ;
- swipe gauche suit le doigt ;
- swipe droit valide ;
- Dupliquer/Supprimer préservés ;
- appui court et appui long non régressés ;
- géométrie du bloc et icône Côté.

### Navigation / SegmentedControl

- indicateur actif ;
- translation entre positions ;
- disabled ;
- accessibilité ;
- dimensions/marges calculées depuis tokens ;
- Recherche non agrandie.

### Catégories

- bouton centré ;
- transition après succès uniquement ;
- erreur sauvegarde ne navigue pas.

### Préparation exécution

- boutons présents aux écrans documentés ;
- `disabled=true` ;
- aucun effet de navigation/exécution.

---

## 8. Critères d’acceptation et preuves

| ID | Exigence | Preuve attendue |
|---|---|---|
| AC-CAT-01 | segment Activités actif | test UI + recette device |
| AC-CAT-02 | Catalogue affiche définitions persistantes | test service/repository + UI |
| AC-CAT-03 | création persistante | intégration UI→service→SQLite |
| AC-CAT-04 | modification persistante préremplie | intégration + réouverture |
| AC-CAT-05 | fonctions exclues absentes | contrôle scope + tests absence actions |
| AC-CREATE-01 | options Activité/Séance/Circuit/Annuler | test composant |
| AC-CREATE-02 | Circuit désactivé | accessibilité + absence handler métier |
| AC-CREATE-03 | apparition progressive | test Animated + recette perceptive |
| AC-ACT-01 | formulaire partagé sans divergence | tests communs Composition/Persistant |
| AC-ACT-02 | nom en gras | test rendu/style |
| AC-ACT-03 | Média visible mais inactif | test disclosure + disabled |
| AC-COMP-01 | choisir existante depuis Catalogue | intégration Composition |
| AC-COMP-02 | créer locale sans catalogue | repository Catalogue inchangé |
| AC-COMP-03 | copie indépendante | domaine + persistence Session |
| AC-NAV-01 | Catalogues/libellé/icône | test layout + device |
| AC-NAV-02 | marges verticales équilibrées | test tokens/layout + capture device |
| AC-NAV-03 | cadre actif glissant | test animation + device |
| AC-SEG-01 | segmented indicator centré/glissant | tests composant |
| AC-SWIPE-01 | carte suit geste | test geste avec translation |
| AC-SWIPE-02 | bloc conforme | test style + device |
| AC-SWIPE-03 | pas de swipe Catalogue | contrôle scope |
| AC-SIDE-01 | icône Côté décalée | test style + device |
| AC-CATG-01 | bouton catégorie centré | test style |
| AC-CATG-02 | transition droite→gauche | test navigation + device |
| AC-EXEC-01 | Déployer/Démarrer visibles disabled | test UI |
| AC-EXEC-02 | aucun moteur/exécution | contrôle scope/code search |
| AC-REG-01 | bilatéralité existante inchangée | Jest complet + tests ciblés existants |

---

## 9. Risques et garde-fous

### R1 — Couplage de `ExerciseScreen` au brouillon de Séance

Risque principal : dupliquer l’éditeur pour le Catalogue et créer deux règles métier divergentes.

Garde-fou : extraction d’un formulaire commun, adaptateurs de persistance séparés.

### R2 — Migration trop large

La documentation T03 générale prévoit aussi archivage et origine d’Exécution ; la tranche actuelle les exclut.

Garde-fou : `migration006` ne porte que les structures nécessaires au Catalogue Activités inclus. Toute structure d’Exécution, résultat, suivi, archive fonctionnelle ou média réel est interdite dans cette tranche.

### R3 — Régression Composition

`CompositionScreen.tsx` est volumineux et contient tap, long press, drag et swipe.

Garde-fou : correction gesture minimale, tests interaction spécifiques et conservation des callbacks métier existants.

### R4 — Animation transverse

L’introduction d’un indicateur animé dans les segments peut changer dimensions et accessibilité.

Garde-fou : composant unique, tokens existants, aucune valeur Figma locale improvisée, test des états disabled et focus.

### R5 — Navigation globale

La barre basse est absolue et certaines vues réservent sa hauteur via `navigationBarTotalHeight()`.

Garde-fou : toute modification de hauteur doit passer par `navigationLayout.ts`, et les consommateurs directs doivent être revérifiés, notamment le Catalogue.

### R6 — Préparation exécution interprétée comme moteur

Garde-fou : interdiction explicite de créer service, table, plan, résultat ou handler d’exécution. Seuls les écrans/états disabled documentés sont traités.

---

## 10. Proposition de `scope_allow`

Surface de production initiale proposée :

```text
app/_layout.tsx
app/(tabs)/_layout.tsx
app/(creation)/_layout.tsx
app/(creation)/*activity*.tsx
src/domain/activities/**
src/features/activities/**
src/features/sessions/CatalogueScreen.tsx
src/features/sessions/CompositionScreen.tsx
src/features/sessions/ExerciseScreen.tsx
src/features/sessions/CategoriesScreen.tsx
src/features/sessions/compositionPresentation.ts
src/shared/ui/SegmentedControl.tsx
src/shared/ui/navigationLayout.ts
src/shared/ui/tokens.ts
src/shared/ui/KodjoIcon.tsx
src/shared/i18n/resources/fr.ts
src/infrastructure/database/constants.ts
src/infrastructure/database/migrateDatabase.ts
src/infrastructure/database/migrations/migration006.ts
src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
src/infrastructure/database/types/DatabaseRows.ts
```

Surface tests : uniquement tests directs/consommateurs des modules ci-dessus, plus suites migration/SQLite/native integration et tests de non-régression Composition/navigation/éditeur.

Cette liste doit être fermée par le contrôle d’impact protocolaire avant autorisation d’implémentation ; tout importateur direct nécessaire doit être classifié explicitement, jamais ajouté silencieusement.

---

## 11. Points explicitement hors plan

- moteur d’exécution ;
- origine d’Exécution persistée ;
- historique / Suivi ;
- `Status / Badge` applicatif ;
- recherche/filtre/tri ActivityDefinition ;
- archive/restauration/suppression ActivityDefinition ;
- swipe/actions Catalogue ;
- import ou stockage Média ;
- Circuits fonctionnels ;
- corrections UI hors écrans inclus ;
- toute retouche cosmétique du contrôle Tour ;
- modification des calculs de bilatéralité validés.

---

## 12. État de sortie

`PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW`

Ce plan n’autorise aucune implémentation. La prochaine étape obligatoire est la contre-revue indépendante du plan, puis traitement des réserves éventuelles et approbation explicite du plan final par l’utilisateur.
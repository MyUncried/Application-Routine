[KODJO_V2] PLAN_OUTPUT
slice_id=V2-CAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json
source_head=b2d5db7bde4127bf85d60a7f4107e7b4ebd96265
protocol_execution_head=b2d5db7bde4127bf85d60a7f4107e7b4ebd96265
application_pr=181
application_head=e43004df9f04a10aa091ba28cc681592bea759ca
supersedes_plan_blob_oid=77955eb471b42ccaaab1dc42c5313c941e43cf3e
prior_review_blob_oid=845d920fe0e5dd1baf0d88d625f7da3d67d94670
planning_context_sha256=4b4b66d880afc02e642eb17b1a3fddb4d74696f020038d722757f09a4c9afafb
base_plan_comment_id=5749116249
independent_review_comment_id=5749145345
resumed_command_comment_id=5749154649
planning_contract=kodjo.plan-impact.v1
ui_planning_contract=kodjo.ui-plan-criteria.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# Plan technique final — V2-CAT-01

## 1. Statut, reprise et bornage

Ce document est un plan de planification en lecture seule. Aucun fichier ne doit être modifié, aucune implémentation ne doit être lancée, aucune fusion ni clôture n’est autorisée avant l’approbation utilisateur et la revue indépendante finale.

La commande de reprise courante est conservée : reprise après intégration de KPB-002, qualification Linux et Windows acquise, chemins protégés inchangés et évolution limitée au protocole. Le paquet canonique et son budget doivent être vérifiés avant appel. Cette opération n’est pas un rerun du prompt historique.

Le plan validé précédemment est conservé avec ses décisions produit, ses corrections documentaires A/B/C2 et ses exigences. Les quatre observations résiduelles sont désormais fermées :

1. `CompositionNavigationGuard.integration.test.tsx` est exclu du périmètre d’écriture et des tests à modifier. Il reste une régression inchangée, exécutée par Jest complet. Les scénarios d’abandon et de conservation du brouillon sont préservés.
2. `pendingSwipeRef` est documenté dans `CompositionScreen.tsx`. `compositionGesture.ts` reste limité aux calculs purs du geste.
3. Le contrat Catégories explicite la préservation du verrou existant, du bouton désactivé pendant sauvegarde, de l’absence de double enregistrement et de l’absence de double navigation.
4. Le contrat de sélection explicite la restauration du contexte et du scroll de Composition après annulation ou ajout, sans élargissement fonctionnel.

Le checkpoint ciblé acquis ne valide que l’ouverture visible du menu `Créer`. La tranche reste `NON_CONFORME / REQUALIFICATION_REQUIRED` jusqu’à la validation complète. Aucun code applicatif, aucune fusion et aucune clôture ne sont autorisés à ce stade.

Le périmètre reste limité aux corrections de présentation, navigation, sélection et Composition couvertes par les contrats T03. Il n’introduit ni manifeste V1, ni contrat de tranche V1, ni moteur d’exécution, ni recherche, ni filtrage fonctionnel, ni archivage, ni suppression, ni média réel, ni Circuit fonctionnel.

## 2. Décisions produit et techniques préservées

Les décisions suivantes restent inchangées :

- ouverture visible du menu `Créer` ;
- ordre exact `Une nouvelle activité / Une séance / Un circuit / Annuler` ;
- rangée Catalogue `Créer / Filtrer / Trier`, géométrie `108 × 32 pt`, gap `8 pt` et centrage ;
- titres contextuels des Catalogues et libellé permanent de navigation basse `Catalogues` ;
- formulaire partagé `ActivityEditorForm` et roulettes natives existantes ;
- calculs de durée, règles de bilatéralité, `sideMode`, bornes et séparation `ActivityDefinition` / `SessionActivity` ;
- verrou de sauvegarde existant, `isSavingRef`, chemin `catch` et réactivation après erreur ;
- centrage existant de `Créer une catégorie` ;
- cartes structurelles Compte à rebours initial et Fin de séance, non déplaçables ;
- duplication, suppression, appui court, appui long, réorganisation et règles de bilatéralité ;
- `compositionPresentation.ts` et son test ;
- `Session.ts`, `calculations.ts`, `sideMode.ts`, `SessionCard`, `SessionService` et autres modules gelés ou non affectés ;
- scénarios d’abandon et de conservation du brouillon de Composition ;
- absence de double sauvegarde et de double navigation dans Catégories.

Aucun changement métier ni remplacement du mécanisme de verrou existant n’est autorisé.

## 3. Constat et écarts à traiter

| Sous-périmètre | Existant | Écart à traiter | Preuve attendue |
|---|---|---|---|
| Arbre `Créer` | Le composant existe et l’ouverture est visible | Confirmer couverture de fenêtre, scrim inerte, vecteurs, ordre et isolation d’accessibilité | Tests fonctionnels, comparaison visuelle, iOS/Android |
| Carte Activité | `ActivityCard.tsx` existe mais son rendu est incomplet | Afficher les données dynamiques, la barre bleue, `Lecture` et `Déployer` visibles mais désactivés | Test de composant, comparaison visuelle, accessibilité |
| Sélection multiple | `ActivitySelectionScreen.tsx` existe | Ajouter compteur, CTA dynamique, invalidité de la sélection vide, gestion des identifiants obsolètes, ordre et atomicité | Tests composant/intégration, comparaison visuelle, appareil |
| Éditeur Activité | `ActivityEditorForm.tsx` est partagé | Réutiliser `SegmentedControl` et confirmer les invariants d’affichage, de synthèse, de Media et de libellés | Tests formulaire/adaptateurs, comparaison visuelle, accessibilité |
| Garde Catalogue | Retour direct et chargement d’une définition absente insuffisamment explicites | Préserver le brouillon, afficher l’erreur, libérer le verrou et permettre la reprise | Tests unitaires et d’intégration |
| Contexte Catalogue | Segment local conservé | Restaurer le contexte pendant l’aller-retour et revenir sur `Séances` après relance | Tests Catalogue/navigation, contrôle appareil |
| Catégories | Destination générique | Cibler Catalogue des séances / `Séances`, appliquer la transition canonique et préserver le verrou | Tests layout, écran et intégration |
| Swipe Composition | Calculs purs disponibles mais translation progressive incomplète | Faire suivre la carte au doigt, révéler progressivement les actions et limiter la fermeture au vrai swipe droit | Tests purs, rendu et appareil |
| Orchestration du swipe | `pendingSwipeRef` appartient à l’écran | Maintenir sa responsabilité dans `CompositionScreen.tsx` et séparer les calculs purs | Analyse statique, tests écran et gestes |
| Bloc d’actions | Coins et gap non conformes | Arrondir haut-gauche/bas-gauche, conserver le gap canonique et rendre `tourSurface` visible | Comparaison visuelle, appareil |
| Icône `Côté` | Position non conforme | Appliquer la marge droite prescrite sans modifier le domaine | Test rendu, comparaison visuelle |
| Garde Composition | Contrat déjà préservé | Ne pas modifier `CompositionNavigationGuard.integration.test.tsx` | Jest complet et preuve de contrat inchangé |

## 4. Périmètre applicatif autorisé

Les modules de production à modifier sont exactement les suivants :

- `app/(creation)/_layout.tsx` ;
- `src/features/activities/ActivityCard.tsx` ;
- `src/features/activities/ActivityEditorForm.tsx` ;
- `src/features/activities/ActivitySelectionScreen.tsx` ;
- `src/features/activities/CatalogueCreateOptions.tsx` ;
- `src/features/sessions/CatalogueScreen.tsx` ;
- `src/features/sessions/CategoriesScreen.tsx` ;
- `src/features/sessions/CompositionScreen.tsx` ;
- `src/features/sessions/ExerciseScreen.tsx` ;
- `src/features/sessions/compositionGesture.ts`.

Les tests à modifier sont exactement les suivants :

- `app/__tests__/creationLayout.test.tsx` ;
- `src/features/activities/__tests__/ActivityCard.test.tsx` ;
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx` ;
- `src/features/activities/__tests__/ActivitySelectionScreen.test.tsx` ;
- `src/features/activities/__tests__/CatalogueCreateOptions.test.tsx` ;
- `src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx` ;
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx` ;
- `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx` ;
- `src/features/sessions/__tests__/CategoriesScreen.test.tsx` ;
- `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` ;
- `src/features/sessions/__tests__/CompositionScreen.test.tsx` ;
- `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx` ;
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx` ;
- `src/features/sessions/__tests__/compositionGesture.test.ts`.

Aucun nouveau fichier de test n’est requis par le plan. `src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx` est explicitement exclu des écritures et des tests à modifier. Il reste un test de régression inchangé, exécuté par Jest complet, avec conservation des scénarios d’abandon et de brouillon.

Aucun composant métier ou Design System n’est créé. Les six consommateurs détectés par le scan direct-import restent hors du périmètre d’écriture et conservent leur contrat d’importation.

## 5. Réutilisation et décisions de composants

Les composants et primitives existants sont réutilisés :

- `KodjoIcon` et les vecteurs existants ;
- `SegmentedControl` ;
- `ScreenShell` ;
- `DurationWheelPicker`, `NumberWheelPicker`, `WheelPickerOverlay` et `WheelSelectionOverlay` ;
- `ExerciseExitConfirmModal` et `useCompositionExitGuard` ;
- `dimensions.compositionTourSection.inset` et `colors.tourSurface` ;
- conventions existantes de cartes et de navigation.

Les composants existants sont étendus en place. `React Native Modal` est utilisé uniquement comme primitive de couche native pour l’arbre `Créer`, afin de couvrir le shell et la barre d’onglets sœur du contenu.

La recherche de composants existants a été effectuée avant toute décision de création : aucun besoin ne justifie un nouveau composant métier ou Design System.

La séparation du geste est obligatoire :

- `compositionGesture.ts` contient uniquement translation, direction, seuils et décision de fermeture ;
- `CompositionScreen.tsx` contient l’orchestration visuelle, `pendingSwipeRef`, l’état de carte ouverte et le rendu progressif ;
- aucune attribution de `pendingSwipeRef` à `compositionGesture.ts` ne doit subsister.

## 6. Plan séquencé

### Étape 1 — Vérification préalable et scan direct-import

- Rejouer le scan déterministe sur l’arbre applicatif exact avant toute écriture.
- Confirmer que `CompositionNavigationGuard.integration.test.tsx` reste `TEST_UNAFFECTED`.
- Confirmer que les six importeurs restent `CONSUMER_UNAFFECTED`.
- Vérifier qu’aucun fichier créé ou modifié par confort n’est ajouté.
- Vérifier l’alignement entre le périmètre d’écriture, les modules listés et la matrice UI.

Résultat attendu : le périmètre machine et la prose sont identiques, sans ajout tacite.

### Étape 2 — Arbre `Créer`

- Préserver le déclencheur et l’ancrage déjà validés.
- Utiliser une couche native couvrant le shell et la barre d’onglets sœur.
- Afficher les quatre options dans l’ordre contractuel.
- Conserver `Un circuit` désactivé.
- Conserver `Annuler` sans fermeture implicite par le scrim.
- Isoler le focus et le hit-testing de l’arrière-plan.

Résultat attendu : l’ouverture déjà validée est conservée et le contrat complet est vérifiable.

### Étape 3 — Carte Activité et sélection multiple

- Compléter `ActivityCard` avec des données dynamiques uniquement.
- Garder `Lecture` et `Déployer` visibles mais désactivés, sans handler fonctionnel.
- Ajouter compteur, checkbox vectorielle, CTA dynamique et verrou de soumission.
- Rendre une sélection vide invalide : aucune donnée créée, aucun brouillon modifié, aucun Catalogue modifié.
- Retirer ou signaler les identifiants obsolètes avant la copie.
- Insérer les copies selon l’ordre visible filtré, jamais selon l’ordre des touchers.
- Restaurer explicitement le brouillon, le contexte et le scroll de Composition après annulation ou ajout.

Résultat attendu : sélection atomique, copies indépendantes, restauration du contexte et absence d’écriture pour une validation vide.

### Étape 4 — Éditeur et garde Catalogue

- Remplacer le segment local par `SegmentedControl` sans modifier les règles métier.
- Préserver `Durée totale`, `Durée totale >=`, la synthèse `Durée totale : ≥ ...`, le nom dynamique, le nom en gras uniquement dans la synthèse et la section Médias visible mais inactive.
- Maintenir le contrôle `Côté` à `74 × 42 pt` et l’ordre `Côté / Récupération / Durée totale`.
- Traiter explicitement une définition absente.
- En cas d’échec, conserver le brouillon, libérer `isSavingRef`, réactiver `Terminer` et permettre une nouvelle tentative.
- Conserver la garde d’abandon existante sans modifier `CompositionNavigationGuard.integration.test.tsx`.

Résultat attendu : aucun blocage permanent, aucune donnée codée en dur et aucune propagation entre définition persistante et copie de Séance.

### Étape 5 — Catégories et navigation

- Cibler explicitement `Catalogue des séances` et le segment `Séances` après sauvegarde.
- Utiliser la transition canonique : cible entrant depuis la droite, écran courant sortant vers la gauche.
- Préserver le verrou existant : bouton désactivé pendant sauvegarde, aucune double transaction, aucun double enregistrement et aucune double navigation.
- En cas d’erreur, rester sur Catégories, conserver le brouillon et réactiver l’action.

Résultat attendu : une seule sauvegarde et une seule navigation réussie, ou aucune navigation en cas d’échec.

### Étape 6 — Swipe, gap, coins et icône `Côté`

- Faire suivre la carte au déplacement horizontal réel.
- Révéler progressivement le bloc d’actions pendant le geste.
- N’autoriser la fermeture que par un vrai swipe droit commencé sur la carte ouverte.
- Conserver duplication, suppression, appui long, réorganisation et cartes structurelles.
- Arrondir explicitement les coins haut-gauche et bas-gauche du bloc d’actions.
- Utiliser la marge existante carte/cadre Tour et `colors.tourSurface` pour le gap visible, y compris pendant la translation.
- Corriger la marge droite de l’icône `Côté` sans modifier les calculs ni les énumérations de bilatéralité.

Résultat attendu : gestes intermédiaires vérifiables, rendu progressif et conformité visuelle aux frames et contrats concernés.

### Étape 7 — Vérifications finales

- Exécuter Jest complet, y compris les tests de régression inchangés.
- Exécuter TypeScript et lint.
- Effectuer les comparaisons visuelles Figma.
- Vérifier les largeurs 360, 402 et 440 points, les Safe Areas et le texte agrandi.
- Vérifier VoiceOver/TalkBack, le focus modal, les états désactivés et les cibles tactiles.
- Tester sur iOS et Android les couches natives, transitions, scroll et gestes.

Aucune preuve ciblée ne vaut conformité globale par inférence.

## 7. Données, persistance et compatibilité

Aucune migration, table, énumération ou modification de domaine n’est planifiée.

Les règles suivantes restent contractuelles :

- `ActivityDefinition` persistante et `SessionActivity` de Composition restent distinctes ;
- une activité créée depuis Composition reste propre à la Séance ;
- la sélection multiple crée des copies indépendantes en opération atomique ;
- une sélection vide ne crée aucune donnée ;
- `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT` restent inchangés ;
- les calculs de durée et de bilatéralité ne sont pas rouverts ;
- aucune exécution directe, aucun instantané `ACTIVITY`, aucun `SESSION_END` et aucun moteur ne sont ajoutés ;
- recherche, filtre, tri implicite et scroll restent temporaires et limités à l’aller-retour courant selon les contrats existants.

## 8. Navigation et conservation du contexte

- Le menu `Créer` ne se ferme pas par toucher implicite du scrim.
- `Annuler` restitue exactement le segment, la requête, le filtre, le tri implicite, le scroll et le brouillon précédents.
- L’annulation de la sélection multiple ne modifie pas Composition.
- L’ajout réussi restaure Composition enrichie ainsi que son contexte et son scroll.
- La sauvegarde Catégories cible toujours `Catalogue des séances` / `Séances`, indépendamment du dernier segment utilisé avant l’ouverture du parcours.
- Une relance complète revient sur `Séances` et ne restaure pas le segment Activités.
- Les transitions d’avancement suivent la convention droite-vers-gauche ; aucune animation locale concurrente n’est introduite.

## 9. Tests et preuves

### Tests à modifier

Les assertions des fichiers suivants sont adaptées aux changements planifiés :

- `app/__tests__/creationLayout.test.tsx` : transition, destination et comportement de pile ;
- `src/features/activities/__tests__/ActivityCard.test.tsx` : données dynamiques, actions visibles et désactivées ;
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx` : `SegmentedControl`, synthèse, libellés et états ;
- `src/features/activities/__tests__/ActivitySelectionScreen.test.tsx` : compteur, CTA, sélection vide, identifiants obsolètes et soumission atomique ;
- `src/features/activities/__tests__/CatalogueCreateOptions.test.tsx` : ordre, scrim, désactivation, couverture et accessibilité ;
- `src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx` : garde Catalogue, brouillon et reprise ;
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx` : contexte, segment, titres et restauration ;
- `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx` : sauvegarde unique, absence de double navigation et destination `Séances` ;
- `src/features/sessions/__tests__/CategoriesScreen.test.tsx` : centrage, verrou, erreur et destination ;
- `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` : annulation, ajout, restauration du contexte et du scroll ;
- `src/features/sessions/__tests__/CompositionScreen.test.tsx` : orchestration, translation, gap, coins, actions et icône `Côté` ;
- `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx` : garde Catalogue et conservation du brouillon ;
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx` : définition absente, erreur, reprise et invariants du formulaire ;
- `src/features/sessions/__tests__/compositionGesture.test.ts` : calculs purs, seuils, directions et fermeture autorisée.

### Régression inchangée

`src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx` n’est pas modifié et n’est pas ajouté au périmètre d’écriture. Il est exécuté par `npm test -- --runInBand` comme régression inchangée. Les scénarios d’abandon et de conservation du brouillon restent des invariants de préservation.

### Commandes obligatoires

- `npm test -- --runInBand` ;
- `npx tsc --noEmit` ;
- `npm run lint`.

### Comparaisons visuelles

Comparer les états affectés avec :

- `3787:5148` et `3841:8375` pour l’arbre `Créer` ;
- `3786:5093` pour le Catalogue Activités ;
- `3789:5349` et `3789:5405` pour la sélection ;
- `3879:5947` et `3879:6079` pour l’éditeur ;
- `2028:11808` pour les actions glissées ;
- `2028:11204` pour Catégories ;
- `2537:214` pour la navigation basse ;
- `2537:1033` pour `Déployer`.

### Accessibilité et appareils

- VoiceOver et TalkBack pour scrim, focus, disabled, compteur et CTA ;
- iOS et Android pour couverture native du menu, hit-testing, transitions et swipe ;
- largeurs 360, 402 et 440 ;
- Safe Areas, clavier et tailles de texte 100 %, 135 % et proches de 200 % ;
- cibles tactiles d’au moins `48 × 48 pt` lorsque le contrôle visuel est compact.

## 10. Critères d’acceptation

1. Le menu `Créer` s’ouvre visiblement, couvre la fenêtre utile, conserve l’arrière-plan non interactif et respecte l’ordre exact des options.
2. Chaque carte Activité affiche uniquement des données dynamiques et conserve `Lecture` et `Déployer` visibles mais désactivés.
3. La sélection vide est invalide et n’écrit rien ; une sélection valide copie atomiquement selon l’ordre de présentation.
4. Une annulation ou un ajout depuis Composition restaure le contexte, le brouillon et le scroll attendus.
5. L’éditeur conserve ses règles, roulettes, libellés, calculs et séparations de contexte.
6. Une définition absente ou une sauvegarde échouée laisse un brouillon récupérable et réactive l’action.
7. La sauvegarde Catégories conserve le bouton désactivé pendant sauvegarde, interdit tout double enregistrement et toute double navigation ; le succès cible `Séances` avec la transition canonique.
8. Le swipe suit le doigt, révèle progressivement les actions et ne se ferme que par un swipe droit valide depuis la carte ouverte.
9. Le bloc d’actions possède les coins haut-gauche et bas-gauche arrondis ; le gap est égal à la marge carte/cadre Tour et montre `tourSurface`.
10. L’icône `Côté` est déplacée selon la marge prescrite sans modification métier.
11. Les modules gelés et les tests de régression inchangés ne sont pas rouverts.
12. Les preuves fonctionnelles, statiques, visuelles, d’accessibilité et d’appareil sont produites séparément.

## 11. Risques résiduels et absence de clarification

Aucune clarification produit ou technique ne reste ouverte.

Les risques à contrôler pendant l’implémentation, sans élargir le périmètre, sont :

- couverture réelle de la barre d’onglets sœur par `Modal` natif ;
- différences iOS/Android de hit-testing et d’accessibilité ;
- stabilité du geste et de la révélation progressive sur appareils réels ;
- conservation du scroll lors des retours de modale et de sélection ;
- non-double-sauvegarde Catégories sous latence ;
- maintien des six consommateurs hors périmètre d’écriture après tout replay du scan.

Si un futur scan déterministe révèle un contrat importé différent, le plan devra être requalifié avant toute écriture. Aucune modification ne doit être ajoutée tacitement.

## 12. Verdict de planification

Le plan est prêt pour une dernière revue indépendante. Ce statut n’autorise ni implémentation, ni fusion, ni clôture. La validation ciblée reste limitée à l’ouverture du menu et ne certifie pas la conformité globale.


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "modified_modules": [
    {
      "path": "app/(creation)/_layout.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/CatalogueCreateOptions.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
      "change": "MODIFY"
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
      "path": "src/features/sessions/__tests__/compositionGesture.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "change": "MODIFY"
    }
  ],
  "scan_sha256": "4ab8aac0b0ceecacd592007d220ca4f7d3c80b2817fe14c199780e7bcb76cbf2",
  "rows": [
    {
      "path": "app/(creation)/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/CatalogueCreateOptions.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/compositionGesture.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/(creation)/activity-selection.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivitySelectionScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct d’ActivitySelectionScreen.tsx sans risque détecté ; la frontière de route et le contrat d’importation restent inchangés."
    },
    {
      "path": "app/(creation)/categories.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct de CategoriesScreen.tsx sans risque détecté ; le changement de destination et de transition reste encapsulé dans l’écran et le layout."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct de CompositionScreen.tsx sans risque détecté ; l’orchestration du swipe évolue derrière une interface de route inchangée."
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct d’ExerciseScreen.tsx sans risque détecté ; les corrections de garde et de reprise ne modifient pas le contrat de la route."
    },
    {
      "path": "app/(tabs)/index.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CatalogueScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct de CatalogueScreen.tsx sans risque détecté ; la restauration de contexte ne change pas l’interface consommée par l’onglet."
    },
    {
      "path": "src/features/activities/ActivityCatalogueList.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivityCard.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import l’identifie comme consommateur direct d’ActivityCard.tsx sans risque détecté ; la carte conserve son contrat d’utilisation et la liste ne nécessite aucune adaptation."
    }
  ],
  "scope_allow": [
    "app/(creation)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/compositionGesture.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

<KODJO_UI_CRITERIA_MATRIX_JSON>
{
  "schema": "kodjo.ui-criteria.v1",
  "criteria": [
    {
      "criterion_id": "UI-CAT-R-001",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-03 §§7-13,18-20",
        "requirement": "L’arbre Créer conserve son ouverture visible déjà validée, affiche les quatre options dans l’ordre exact, utilise les vecteurs contractuels, garde Circuit désactivé, couvre le contenu et la navigation basse, bloque l’arrière-plan et ne se ferme pas par toucher implicite du scrim. L’ouverture ciblée est PASS, mais la conformité globale du contrat reste à requalifier."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "ACCESSIBILITY",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/activities/CatalogueCreateOptions.tsx : composant existant et déclencheur inspectés",
        "src/shared/ui/KodjoIcon.tsx : vecteurs existants inspectés",
        "React Native Modal : primitive de couche native inspectée"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/activities/CatalogueCreateOptions.tsx",
      "decision_justification": "Étendre l’arbre existant en conservant son ouverture validée, tout en ajoutant la couverture native, les vecteurs, l’ordre contractuel et l’isolation du scrim, sans créer de composant métier.",
      "change_targets": [
        "src/features/activities/CatalogueCreateOptions.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "ACCESSIBILITY_CHECK",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-002",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-02 §§5-9,12,18-20",
        "requirement": "Chaque carte d’Activité affiche une marque bleue, un nom dynamique, les Zones, le mode et la cible, les Séries, la Pause, la Récupération, ainsi que Lecture et Déployer visibles mais désactivés, sans swipe ni action de gestion. L’état actuel reste à requalifier."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "ACCESSIBILITY"
      ],
      "reuse_search": [
        "src/features/activities/ActivityCard.tsx : carte existante inspectée",
        "src/shared/ui/KodjoIcon.tsx : vecteurs existants inspectés",
        "src/features/sessions/SessionCard.tsx : convention consultée, composant gelé"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/activities/ActivityCard.tsx",
      "decision_justification": "Compléter la carte existante avec les données contractuelles sans activer Lecture, Déployer, swipe, archivage, suppression ou autre gestion exclue.",
      "change_targets": [
        "src/features/activities/ActivityCard.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityCard.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "ACCESSIBILITY_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-003",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-07 §§7-20; CE-T03-07 §16; docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md §Sélection multiple",
        "requirement": "La sélection multiple reprend la présentation contractuelle, les cartes détaillées, la checkbox vectorielle, le compteur, le CTA dynamique, l’invalidité d’une sélection vide, le retrait et le recalcul des identifiants obsolètes avec information utilisateur, l’ordre de présentation et l’atomicité. Après annulation ou ajout, le contexte, le brouillon et le scroll de Composition sont restaurés sans élargissement fonctionnel."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "ACCESSIBILITY",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/activities/ActivitySelectionScreen.tsx : écran existant inspecté",
        "src/shared/ui/ScreenShell.tsx : shell existant inspecté",
        "src/shared/ui/KodjoIcon.tsx : vecteurs de sélection inspectés",
        "src/features/sessions/CompositionScreen.tsx : restauration du contexte et du scroll inspectée",
        "app/(creation)/activity-selection.tsx : frontière de route inspectée"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/activities/ActivitySelectionScreen.tsx",
      "decision_justification": "Compléter l’écran et son verrou de soumission, puis préserver explicitement la restauration du brouillon, du contexte et du scroll de Composition après annulation ou insertion, sans ajouter recherche ni filtre fonctionnel.",
      "change_targets": [
        "src/features/activities/ActivitySelectionScreen.tsx",
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "ACCESSIBILITY_CHECK",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-004",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-04 §§7-18; D-137; D-181; D-182; D-185",
        "requirement": "Le formulaire partagé conserve les roulettes natives, les validations, la synthèse calculée, Durée totale/Durée totale >=, la synthèse Durée totale : ≥, l’ordre Côté/Récupération/borne, Côté 74×42, le placeholder dynamique, le nom non codé en dur, le nom en gras uniquement dans la synthèse et la section Médias visible mais inactive."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "ACCESSIBILITY",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/activities/ActivityEditorForm.tsx : formulaire déjà partagé inspecté",
        "src/features/sessions/ExerciseScreen.tsx : adaptateurs Catalogue et Composition inspectés",
        "src/features/sessions/DurationWheelPicker.tsx : primitive native inspectée",
        "src/features/sessions/NumberWheelPicker.tsx : primitive native inspectée",
        "src/features/sessions/WheelPickerOverlay.tsx : primitive native inspectée",
        "src/shared/ui/SegmentedControl.tsx : composant partagé inspecté"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/activities/ActivityEditorForm.tsx",
      "decision_justification": "Corriger les invariants du formulaire déjà partagé et remplacer seulement le segment local par la primitive commune, sans refaire l’extraction ni les roulettes.",
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx",
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "ACCESSIBILITY_CHECK",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-005",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-01/02 §§4-5,15-20; D-167; D-168; D-184",
        "requirement": "Les titres, l’ordre updatedAt DESC, la rangée Catalogue et la restauration du contexte courant sont déterministes. Après le parcours Catégories, la cible est Catalogue des séances / segment Séances. Le contexte et le scroll de Composition sont aussi préservés lors des retours d’ajout ou d’annulation."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/sessions/CatalogueScreen.tsx : écran et état local inspectés",
        "src/features/sessions/CategoriesScreen.tsx : retour et destination inspectés",
        "src/features/sessions/__tests__/CatalogueScreen.test.tsx : couverture existante inspectée"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/sessions/CatalogueScreen.tsx",
      "decision_justification": "Préserver les titres et la rangée déjà conformes, puis compléter la restauration du contexte Catalogue et les retours déterministes sans ajouter de fonction Catalogue.",
      "change_targets": [
        "src/features/sessions/CatalogueScreen.tsx",
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-006",
      "source": {
        "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
        "locator": "Écran 6 – Catégories de la séance; D-178; CE-T03-16 §§12,14,19",
        "requirement": "Créer une catégorie reste centré. Une sauvegarde réussie entre dans Catalogue des séances, sélectionne Séances et utilise la transition droite-vers-gauche ; une erreur ne navigue pas. Le verrou existant est préservé : bouton désactivé pendant la sauvegarde, aucune double transaction, aucun double enregistrement et aucune double navigation. Aucun mécanisme métier existant n’est remplacé."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/sessions/CategoriesScreen.tsx : centrage, verrou et sauvegarde inspectés",
        "app/(creation)/_layout.tsx : pile et transition inspectées",
        "app/__tests__/creationLayout.test.tsx : tests de layout inspectés"
      ],
      "component_decision": "EXTEND",
      "selected_component": "app/(creation)/_layout.tsx",
      "decision_justification": "Compléter la transition de la pile et le ciblage explicite vers Séances en conservant le centrage, `isSavingRef`, le bouton désactivé pendant sauvegarde et la protection contre tout double enregistrement ou double navigation.",
      "change_targets": [
        "app/(creation)/_layout.tsx",
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "tests": [
        "app/__tests__/creationLayout.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-007",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-08 §§7-20; D-175; D-176; Issue #150 points 8-9",
        "requirement": "Le swipe suit le doigt, révèle progressivement les actions, ne se ferme que par un véritable swipe droit commencé sur la carte ouverte, conserve Duplication/Suppression, l’appui long, la réorganisation et les cartes structurelles. Le bloc d’actions possède des coins haut-gauche et bas-gauche arrondis, et le gap entre carte et actions égale la marge carte/cadre Tour avec le fond du Tour visible. La référence pendingSwipeRef relève de CompositionScreen.tsx ; compositionGesture.ts conserve uniquement les calculs purs."
      },
      "risk_types": [
        "FUNCTIONAL",
        "VISUAL",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/sessions/CompositionScreen.tsx : orchestration, pendingSwipeRef, rendu des cartes et actions inspectés",
        "src/features/sessions/compositionGesture.ts : calculs purs, seuils et directions inspectés",
        "src/features/sessions/__tests__/compositionGesture.test.ts : tests de calcul importés inspectés",
        "src/shared/ui/tokens.ts : marge et couleur de surface Tour inspectées"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/sessions/CompositionScreen.tsx",
      "decision_justification": "Corriger l’orchestration visuelle et la géométrie dans CompositionScreen.tsx, tout en limitant compositionGesture.ts aux fonctions pures de geste et en préservant les comportements validés.",
      "change_targets": [
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/compositionGesture.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx",
        "src/features/sessions/__tests__/compositionGesture.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-008",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-04 §17; CE-T03-04 §16; CE-T03-04 §18",
        "requirement": "Une définition absente ou une sauvegarde échouée produit une erreur explicite, conserve le brouillon, libère le verrou, réactive Terminer et applique la garde d’abandon Catalogue. Les scénarios d’abandon et de conservation du brouillon de Composition restent inchangés."
      },
      "risk_types": [
        "FUNCTIONAL",
        "ACCESSIBILITY"
      ],
      "reuse_search": [
        "src/features/sessions/ExerciseScreen.tsx : adaptateur Catalogue, chargement, catch et isSavingRef inspectés",
        "src/features/sessions/ExerciseExitConfirmModal.tsx : dialogue existant inspecté",
        "src/features/sessions/useCompositionExitGuard.ts : mécanisme de garde inspecté",
        "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx : régression inchangée identifiée"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/sessions/ExerciseScreen.tsx",
      "decision_justification": "Compléter le chargement, la définition absente et la garde Catalogue en conservant le catch, le verrou de sauvegarde, la conservation du brouillon et les scénarios de garde de Composition sans modifier leur suite de régression.",
      "change_targets": [
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
        "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "ACCESSIBILITY_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-009",
      "source": {
        "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
        "locator": "Contrat d’affichage commun; Écran 3; Écran 4; CE-T03-01/02/04",
        "requirement": "Les zones bleues, boutons d’action, Safe Areas, cibles tactiles, responsive 360/402/440, bouton Côté et surfaces d’arrière-plan restent conformes dans les écrans corrigés, sans refonte de shell ou de navigation."
      },
      "risk_types": [
        "VISUAL",
        "ACCESSIBILITY",
        "DEVICE"
      ],
      "reuse_search": [
        "src/shared/ui/ScreenShell.tsx : shell et Safe Areas inspectés",
        "src/features/sessions/CatalogueScreen.tsx : zones Catalogue inspectées",
        "src/features/sessions/ExerciseScreen.tsx : bandeau et CTA inspectés",
        "src/features/sessions/CompositionScreen.tsx : shell Composition et Côté inspectés",
        "src/features/sessions/CategoriesScreen.tsx : bouton centré inspecté"
      ],
      "component_decision": "REUSE",
      "selected_component": "src/shared/ui/ScreenShell.tsx",
      "decision_justification": "Réutiliser les primitives existantes et contrôler leurs consommateurs ; aucune refonte de shell, de navigation basse ou de géométrie déjà validée n’est autorisée.",
      "change_targets": [
        "src/features/sessions/CatalogueScreen.tsx",
        "src/features/sessions/CategoriesScreen.tsx",
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx"
      ],
      "proof_required": [
        "VISUAL_COMPARE",
        "ACCESSIBILITY_CHECK",
        "DEVICE_CHECK"
      ]
    },
    {
      "criterion_id": "UI-CAT-R-010",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-08 §§8-9,19-20; D-176; Issue #150 points 8-9",
        "requirement": "Le bloc d’actions du swipe possède des coins haut-gauche et bas-gauche arrondis. L’espace entre la carte déplacée et les actions est égal à la marge entre carte et cadre Tour, laisse voir le fond du Tour et reste présent pendant la translation progressive."
      },
      "risk_types": [
        "VISUAL",
        "DEVICE"
      ],
      "reuse_search": [
        "src/features/sessions/CompositionScreen.tsx : styles activityRowActions et layout de carte inspectés",
        "src/shared/ui/tokens.ts : inset compositionTourSection et colors.tourSurface inspectés",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx : rendu existant inspecté"
      ],
      "component_decision": "EXTEND",
      "selected_component": "src/features/sessions/CompositionScreen.tsx",
      "decision_justification": "Corriger uniquement la géométrie et la présentation du bloc existant en réutilisant la marge et la couleur Tour canoniques, sans créer de composant d’action ni de valeur arbitraire.",
      "change_targets": [
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx"
      ],
      "proof_required": [
        "VISUAL_COMPARE",
        "DEVICE_CHECK"
      ]
    }
  ],
  "preservation": {
    "preserve": [
      {
        "target": "Ouverture visible actuelle du menu Créer",
        "justification": "Le checkpoint ciblé l’a validée ; toute correction doit conserver le cycle d’ouverture déjà observable."
      },
      {
        "target": "Rangée Créer/Filtrer/Trier et géométrie 108×32 avec gap 8",
        "justification": "La rangée est une décision Figma et documentaire déjà validée ; elle ne doit pas être régressée."
      },
      {
        "target": "Titres déterministes des Catalogues et libellé permanent Catalogues",
        "justification": "Ces décisions sont validées par D-167 et les contrats T03 ; aucune modification de libellé n’est requise."
      },
      {
        "target": "Formulaire ActivityEditorForm partagé entre Catalogue et Composition",
        "justification": "Le formulaire partagé est une décision d’architecture et de présentation validée ; seuls ses invariants sont contrôlés."
      },
      {
        "target": "Roulettes natives, calculs, validations et séparation ActivityDefinition/SessionActivity",
        "justification": "Ces contrats sont validés et hors réouverture ; aucune réimplémentation métier n’est planifiée."
      },
      {
        "target": "Catch de sauvegarde, isSavingRef et bouton désactivé pendant sauvegarde",
        "justification": "Le mécanisme existant protège contre toute double sauvegarde et double navigation ; il doit être préservé, pas remplacé."
      },
      {
        "target": "Scénarios de garde Composition et conservation du brouillon",
        "justification": "Aucun changement nécessaire n’est démontré dans CompositionNavigationGuard.integration.test.tsx ; la suite reste inchangée et exécutée en régression."
      },
      {
        "target": "Centrage de Créer une catégorie",
        "justification": "Le centrage est déjà conforme ; la révision porte seulement sur la destination et la transition."
      },
      {
        "target": "Navigation basse, SegmentedControl, Safe Areas et cartes structurelles",
        "justification": "Les primitives et décisions correspondantes sont validées ; les consommateurs doivent les préserver."
      }
    ],
    "change": [
      {
        "target": "Couches, vecteurs et interaction de l’arbre Créer",
        "justification": "La conformité complète du scrim, de la couverture native, des vecteurs et de l’accessibilité doit être requalifiée malgré l’ouverture déjà validée."
      },
      {
        "target": "Carte Activité et sélection multiple",
        "justification": "Le rendu contractuel, la sélection vide, l’atomicité, l’ordre et la restauration du contexte restent à compléter."
      },
      {
        "target": "Configuration segmentée et invariants de ActivityEditorForm",
        "justification": "Le formulaire existe déjà mais doit réutiliser le contrôle segmenté partagé et expliciter ses états contractuels."
      },
      {
        "target": "Chargement, garde Catalogue et reprise d’erreur de l’éditeur",
        "justification": "Une définition absente ou une sauvegarde échouée doit laisser un brouillon récupérable et permettre une nouvelle tentative."
      },
      {
        "target": "Destination Catégories et transition canonique",
        "justification": "Le retour doit cibler explicitement Catalogue des séances / Séances, avec une seule navigation après une sauvegarde réussie."
      },
      {
        "target": "Swipe horizontal, orchestration pendingSwipeRef, bloc d’actions, gap, coins et icône Côté",
        "justification": "Les écarts visuels et gestuels sont localisés dans CompositionScreen.tsx et compositionGesture.ts ; les calculs métier restent inchangés."
      }
    ],
    "forbidden": [
      {
        "target": "Moteur, route ou exécution réelle",
        "justification": "Hors périmètre impératif de V2-CAT-01 et explicitement exclu par la frontière T03/T04."
      },
      {
        "target": "Recherche, filtre fonctionnel, tri utilisateur, archivage, restauration et suppression",
        "justification": "Exclus par le périmètre de la tranche révisée."
      },
      {
        "target": "Médias réels, Circuits fonctionnels et Status / Badge applicatif",
        "justification": "Seuls les états visuels désactivés prévus par les contrats sont concernés."
      },
      {
        "target": "Modification de Session.ts, calculations.ts, sideMode.ts, SessionCard, SessionService, compositionPresentation.ts et CompositionNavigationGuard.integration.test.tsx",
        "justification": "Ces modules sont gelés, non affectés ou couverts par une régression inchangée ; aucune écriture de confort n’est autorisée."
      }
    ]
  }
}
</KODJO_UI_CRITERIA_MATRIX_JSON>

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW

<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 1,
  "protocol_commit": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "ui_applicable": true,
  "ui_paths": [
    "app/(creation)/_layout.tsx",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/compositionGesture.ts"
  ],
  "criterion_count": 10,
  "matrix_sha256": "a3c2aa8e052960900e752bab8e41faaceea004da8fa409d5cea5ce5eaed6e2fb"
}
</KODJO_UI_PLAN_CONTRACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "write_scope": [
    "app/(creation)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/compositionGesture.ts"
  ],
  "required_test_writes": [
    "app/__tests__/creationLayout.test.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts"
  ]
}
</KODJO_PLAN_CONTRACT_JSON>

<KODJO_PLAN_TRANSITION_JSON>
{
  "schema_version": "kodjo.protocol.v2.plan-review-transition.0.6.25",
  "source_head": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "protocol_execution_head": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "bootstrap_path": ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
  "status": "PASS",
  "reason": null,
  "protected_paths": [
    ".github/orchestration/v2-activation-registry.json",
    ".github/orchestration/v2-slices/V2-CAT-01/independent-review.md",
    ".github/orchestration/v2-slices/V2-CAT-01/planning-mission.md",
    ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
    ".github/orchestration/v2-slices/V2-CAT-01/technical-plan.md",
    "docs/INDEX.md",
    "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
    "docs/PRODUCT.md",
    "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
    "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
    "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
    "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
    "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
    "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
    "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
    "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
    "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
    "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
    "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
    "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
    "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md"
  ],
  "changed_paths": [],
  "protocol_changes": [],
  "protected_blobs": [
    {
      "path": ".github/orchestration/v2-activation-registry.json",
      "source_oid": "7a5241f9333cbd128c1f0f2e1bcddf3c46ab20eb",
      "execution_oid": "7a5241f9333cbd128c1f0f2e1bcddf3c46ab20eb"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/independent-review.md",
      "source_oid": "845d920fe0e5dd1baf0d88d625f7da3d67d94670",
      "execution_oid": "845d920fe0e5dd1baf0d88d625f7da3d67d94670"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/planning-mission.md",
      "source_oid": "11e54c5bf7efe7367e825c042fd6b9303e16756b",
      "execution_oid": "11e54c5bf7efe7367e825c042fd6b9303e16756b"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
      "source_oid": "d94b0df4af5e8e0bbefb1c494a3d1134cd85124c",
      "execution_oid": "d94b0df4af5e8e0bbefb1c494a3d1134cd85124c"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/technical-plan.md",
      "source_oid": "77955eb471b42ccaaab1dc42c5313c941e43cf3e",
      "execution_oid": "77955eb471b42ccaaab1dc42c5313c941e43cf3e"
    },
    {
      "path": "docs/INDEX.md",
      "source_oid": "2b3546868ffdbf7170f0c74c23210aea4daef559",
      "execution_oid": "2b3546868ffdbf7170f0c74c23210aea4daef559"
    },
    {
      "path": "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
      "source_oid": "3f906269888ab779f840fa6e08a76a7df1af5dd5",
      "execution_oid": "3f906269888ab779f840fa6e08a76a7df1af5dd5"
    },
    {
      "path": "docs/PRODUCT.md",
      "source_oid": "70b1cd4443795bdbcdbb897fe82f3376399dcefb",
      "execution_oid": "70b1cd4443795bdbcdbb897fe82f3376399dcefb"
    },
    {
      "path": "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
      "source_oid": "b260059a7a3de61e404967a81c02efebe959417e",
      "execution_oid": "b260059a7a3de61e404967a81c02efebe959417e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "source_oid": "2af376b78b4f638c2868861331fbc86a34b628a6",
      "execution_oid": "2af376b78b4f638c2868861331fbc86a34b628a6"
    },
    {
      "path": "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
      "source_oid": "327b0e9969202c8912789611bf624e2f8fc64e4e",
      "execution_oid": "327b0e9969202c8912789611bf624e2f8fc64e4e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
      "source_oid": "8b298db3b0cd3ecb2f025fe4c8ec16c062c2beef",
      "execution_oid": "8b298db3b0cd3ecb2f025fe4c8ec16c062c2beef"
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "source_oid": "c3dedcefd1023eb619ada51fc9c0f7f5a840af2e",
      "execution_oid": "c3dedcefd1023eb619ada51fc9c0f7f5a840af2e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "source_oid": "c5acf766b1c6e986bf98244f6208076d9d033aca",
      "execution_oid": "c5acf766b1c6e986bf98244f6208076d9d033aca"
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
      "source_oid": "c2c319a0075ecbd042d50559212a810dff265315",
      "execution_oid": "c2c319a0075ecbd042d50559212a810dff265315"
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "source_oid": "bc80fe71bef7fe3c5c63171ff0e80a52a6ef769e",
      "execution_oid": "bc80fe71bef7fe3c5c63171ff0e80a52a6ef769e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
      "source_oid": "770f8a8c02285f5e7bd454c44d7725b162090a47",
      "execution_oid": "770f8a8c02285f5e7bd454c44d7725b162090a47"
    },
    {
      "path": "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
      "source_oid": "ea5c33e3c3f8d446478a7e96a69aa6562d497caa",
      "execution_oid": "ea5c33e3c3f8d446478a7e96a69aa6562d497caa"
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "source_oid": "876f104f183114dd96410ddd1f2a6dae82c9a21d",
      "execution_oid": "876f104f183114dd96410ddd1f2a6dae82c9a21d"
    },
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "source_oid": "5d4da4a64b677761a9070b1cfd8e8888659b7b8d",
      "execution_oid": "5d4da4a64b677761a9070b1cfd8e8888659b7b8d"
    },
    {
      "path": "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md",
      "source_oid": "506528425028003e278b2e6aded6cb86b1057ec7",
      "execution_oid": "506528425028003e278b2e6aded6cb86b1057ec7"
    }
  ],
  "product_source_evidence": [
    {
      "path": "docs/PRODUCT.md",
      "declared_sha256": "e7b541ac38aa7cdafa84adb8791b2936c6a2515ddc0d750a9887fc739f67cc33",
      "source_sha256": "c1bdf3e7ac30e1ebdf586b1cde0b66a2885c355d9340075a6287c0146aacc73d",
      "execution_sha256": "c1bdf3e7ac30e1ebdf586b1cde0b66a2885c355d9340075a6287c0146aacc73d",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/INDEX.md",
      "declared_sha256": "9a06be0f88a4933fc7d226b3d6fb71b39f9f7eeb91edfc7ae1c1334cfce68d88",
      "source_sha256": "c0a144c67c1fc94cf0619c3081bdc5652928344353e6bb8cebf033876569501a",
      "execution_sha256": "c0a144c67c1fc94cf0619c3081bdc5652928344353e6bb8cebf033876569501a",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
      "declared_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "source_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "execution_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "declared_hash_matches_source": true,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "declared_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "source_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "execution_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "declared_hash_matches_source": true,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
      "declared_sha256": "a5d59c17a20c75d475507dbecbd9991a7badd54640eb70e1196fab60b23164ce",
      "source_sha256": "c96ab94dca83a2e868de5b691c257484c9654a0978f08df8e1d26751e84a25e9",
      "execution_sha256": "c96ab94dca83a2e868de5b691c257484c9654a0978f08df8e1d26751e84a25e9",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
      "declared_sha256": "e6d11c07be3f5f7735bd518e13d25b107028d223b599e5e543e7eab50802263c",
      "source_sha256": "3fb103d67ab21f36c354d89625e90e77a83c45a3b4fd8f2dac97c4472158d4a9",
      "execution_sha256": "3fb103d67ab21f36c354d89625e90e77a83c45a3b4fd8f2dac97c4472158d4a9",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "declared_sha256": "1e9db752cbde1382747733fa976921f8c745c5b91e59a1c100ee97db1ff7976f",
      "source_sha256": "5685e61185e916b726427b11dfeededd2f1a38ec51d444d714a6d6fe81624698",
      "execution_sha256": "5685e61185e916b726427b11dfeededd2f1a38ec51d444d714a6d6fe81624698",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "declared_sha256": "19c3f09580f30c59c83ae1bb03f478598fa81414c5a427abc34cef2492b99b58",
      "source_sha256": "51ed514a7e4b5219ee4366efe4577cf8b721671b99a27f8df58bab54ae12eca5",
      "execution_sha256": "51ed514a7e4b5219ee4366efe4577cf8b721671b99a27f8df58bab54ae12eca5",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "declared_sha256": "f2c79ad1e4d4e6a8a78b17570dac136a4ba675e470d8d3fd28dec54437c0161b",
      "source_sha256": "fea3cec46e94fb2eafef00414c34826bfd42d516861ac8c31b11d4f69fbdf7a1",
      "execution_sha256": "fea3cec46e94fb2eafef00414c34826bfd42d516861ac8c31b11d4f69fbdf7a1",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
      "declared_sha256": "775d55ed3804425563c3d072b4ef0d5fc3fc5f3a8b0b8e99d01a99a8ae0cef84",
      "source_sha256": "599cf0bda959be4a5cf397eaf99a255c0c002c42f007a814cd516a565f530f4c",
      "execution_sha256": "599cf0bda959be4a5cf397eaf99a255c0c002c42f007a814cd516a565f530f4c",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
      "declared_sha256": "233fcac8e351152e443bf1054594bcd358bb65ca8b776ace3717bb78b4f003bb",
      "source_sha256": "2742fd91b1fff691d80cd1a93ebc9ce0637b0c8e3fafd311e4f8c46b428ab984",
      "execution_sha256": "2742fd91b1fff691d80cd1a93ebc9ce0637b0c8e3fafd311e4f8c46b428ab984",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
      "declared_sha256": "349c24d7d88e9c9989d065c92fec386e02b8e8d1dd0eb03ea38e5746ad26d3a5",
      "source_sha256": "2ef5b59f5623da5ac1ca891cd8137396c1b6959c3670b1036ddc9d0f8c4d222a",
      "execution_sha256": "2ef5b59f5623da5ac1ca891cd8137396c1b6959c3670b1036ddc9d0f8c4d222a",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "declared_sha256": "2154f66cc21a349dbf926785abc002f4737c7fd225b9976dccb1fc8774902a41",
      "source_sha256": "6eb228565adc229ba355e696714461be0d128ad563006b4a693f2392a1a18b56",
      "execution_sha256": "6eb228565adc229ba355e696714461be0d128ad563006b4a693f2392a1a18b56",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "declared_sha256": "b288655be2d0392363bee3b39f6d96c9a333e60209b95de0dcdf9fa375b9293f",
      "source_sha256": "eba8b139f9fc8c3a76af138c65ab015e2a3630b202eaba6bf6ab389025f36a3c",
      "execution_sha256": "eba8b139f9fc8c3a76af138c65ab015e2a3630b202eaba6bf6ab389025f36a3c",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
      "declared_sha256": "cdbea10df53d81cdde02c367b5fc8ec4063eb939ee2356c7076ad4b7090cf373",
      "source_sha256": "752d5284f8a65177d81aea6fe2a7f8f3d671a5e29fda5d117a9c91334a207143",
      "execution_sha256": "752d5284f8a65177d81aea6fe2a7f8f3d671a5e29fda5d117a9c91334a207143",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md",
      "declared_sha256": "e5b1d2c275ada45f5ca6fc058ddfed5e0ac7ca8d2415ee0be919873050329653",
      "source_sha256": "2e4b9e1d86d50d80d806258ab2dcb2eba0d1849d092ff5012d779891b69b0d96",
      "execution_sha256": "2e4b9e1d86d50d80d806258ab2dcb2eba0d1849d092ff5012d779891b69b0d96",
      "declared_hash_matches_source": false,
      "transition_matches": true
    }
  ],
  "policy": {
    "classifier_sha256": "a954d5be623a9d8e0481821957af30ff5ab61d85a047fc90396aa9bd6581f852",
    "blobs": [
      {
        "path": "scripts/kodjo/verify-plan-review-transition.js",
        "source_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4",
        "execution_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan.yml",
        "source_oid": "9136f43182ed6dcd51482626c29655c3edc3bd64",
        "execution_oid": "9136f43182ed6dcd51482626c29655c3edc3bd64"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan-review.yml",
        "source_oid": "9e63fc578bcf269eeb8fec120d90db4f4ce147be",
        "execution_oid": "9e63fc578bcf269eeb8fec120d90db4f4ce147be"
      }
    ]
  }
}
</KODJO_PLAN_TRANSITION_JSON>

# KODJO Protocol V2 — addendum normatif 0.6.51

## 1. Objet et statut

Cette version candidate complète la spécification 0.6.47 et consolide les évolutions PE-27 à PE-38 préparées dans la PR #250.

Elle est **NON RETESTÉE** tant que la qualification Linux/Windows, les scénarios de non-régression et l’audit indépendant Claude décrits ci-dessous n’ont pas été exécutés avec succès. Elle ne devient active qu’après fusion explicite.

Les invariants antérieurs restent applicables sauf contradiction explicitement remplacée ci-dessous.

## 2. Handoff utilisateur actionnable — PE-29

Un `PLAN_HANDOFF_READY` qui requiert une décision utilisateur doit :

- identifier le commentaire canonique exact ;
- publier `approval_action=ADD_REACTION_+1` ;
- publier `next_action=ADD_REACTION_THEN_COMMENT` et la commande `[KODJO_V2] VALIDATE_PLAN_HANDOFF` avec l'identifiant exact du commentaire ;
- fournir `approval_url`, lien direct vers ce commentaire ;
- rester bloqué jusqu’à la réaction 👍 du propriétaire autorisé, suivie de la commande de validation sur l'issue.

Aucune Lean Request n’est créée avant ce gate.

## 3. Clôture canonique — PE-30

Après `FINAL_VERIFICATION` réussie, une tranche V2 doit passer de `ACTIVE` à `CLOSED` dans `.github/orchestration/v2-activation-registry.json`.

La clôture :

- est idempotente ;
- lie le `final_head`, la revue d’implémentation et l’approbation device/humaine ;
- refuse une seconde clôture portant des preuves différentes ;
- publie un checkpoint `[KODJO_V2] SLICE_CLOSED` ;
- ne rend plus la tranche admissible comme `ACTIVE`.

La fermeture d’Issue ou la fusion de PR ne sont pas des conditions universelles de clôture.

## 4. Continuité opératoire — PE-31

Avant de conclure qu’un objet GitHub attendu n’existe pas ou qu’une transition est bloquée, le cockpit doit relire l’état GitHub courant des objets causalement concernés.

Toute transition canonique non décisionnelle disponible est poursuivie jusqu’au prochain vrai gate utilisateur ou jusqu’à un blocage technique démontré.

Une limitation externe durable déjà identifiée ne provoque pas de boucle de retries. L’absence de capacité outil doit être distinguée d’un gate protocolaire.

Cette obligation est normative pour le cockpit ; elle ne doit pas être simulée par une voie alternative non qualifiée.

## 5. Planification déterministe — PE-27, PE-32, PE-33, PE-34

### 5.1 Identités et chemins

Toute identité calculable est produite mécaniquement :

- chemins Git existants ;
- clés des candidats du scan ;
- `criterion_id` UI ;
- `assertion_id` UI ;
- `requirement_id` ;
- `finding_id` ;
- hashes, scopes et agrégats.

Un `MODIFY` doit exister exactement au HEAD source. Un `CREATE` doit être absent et situé dans un emplacement autorisé.

Le modèle ne recopie pas librement les chemins des candidats de scan : il ne fournit que leur classification sémantique et sa justification.

### 5.2 Assertions UI atomiques — PE-27

Tout nouveau plan UI utilise `kodjo.ui-criteria.v2`.

Chaque critère contient des assertions indépendamment falsifiables avec :

- `assertion_id` stable ;
- source exacte ;
- `property_type` ;
- résultat observable `expected` ;
- preuves requises.

Une exigence ne peut pas être compressée dans un verdict global lorsque plusieurs propriétés peuvent échouer indépendamment.

Les plans historiques v1 restent lisibles sans rétrofit.

### 5.3 Requirement contract unifié

Tout plan produit un contrat versionné couvrant UI et non-UI :

- `KODJO_REQUIREMENT_CONTRACT_JSON` ;
- `KODJO_TEST_CONTRACT_JSON` ;
- `KODJO_BOUNDARY_CONTRACT_JSON` ;
- `KODJO_PLAN_CLARIFICATIONS_JSON`.

Les exigences non-UI ne restent jamais uniquement en prose.

Le statut global du plan est dérivé mécaniquement des classifications et clarifications élémentaires.

### 5.4 Révision après REVISE

La revue publie des findings structurés et stables.

Un `REVISE` rouvre uniquement les requirements, critères, chemins ou sections ciblés par des findings bloquants, plus les dépendances causalement démontrées.

Les éléments non contestés restent opposables et ne sont pas reconstruits opportunistement.

## 6. Développement, tests et preuves déterministes — PE-34/35

Le développement consomme le même contrat d’exigences approuvé.

Les faits calculables ne reposent plus sur l’auto-déclaration du modèle :

- fichiers modifiés ;
- fichiers hors scope ;
- checks réellement exécutés ;
- codes de sortie ;
- compteurs Jest ;
- preuve de dérive après checks ;
- bindings `requirement → test → proof`.

Les preuves `FUNCTIONAL_TEST` et `STATIC_ANALYSIS` sont dérivées des résultats runner lorsque ces résultats existent.

Les preuves `VISUAL_COMPARE` et `DEVICE_CHECK` ne peuvent pas devenir PASS automatiquement.

Le verdict agrégé de revue et `device_gate_required` sont calculés mécaniquement à partir des statuts élémentaires ; le modèle ne choisit pas ces agrégats.

## 7. Hiérarchie de traitement des erreurs — PE-35

Toute erreur est classée avant retry :

1. `PREVENTABLE_BY_DETERMINISM` → corriger la cause protocolaire, aucun retry nominal ;
2. `RESIDUAL_AUTOCORRECTABLE` → correction bornée au delta, au plus une reprise automatique lorsque les préconditions de recovery sont démontrées ;
3. `HUMAN_DECISION_REQUIRED` → arrêt sur gate utilisateur.

Une boucle de retry ne remplace jamais la déterminisation d’un fait calculable.

## 8. VISUAL_CORRECTION directe — PE-28

Une non-conformité device/visuelle peut ouvrir directement `VISUAL_CORRECTION` si et seulement si :

- même tranche ;
- même binding de plan approuvé ;
- correction dans le scope déjà autorisé ;
- aucune nouvelle exigence produit ;
- contrat pertinent inchangé.

Le protocole publie alors `CONTRACT_UNCHANGED` et interdit une replanification artificielle.

Si une nouvelle exigence, un scope élargi ou un changement de contrat est démontré, le statut est `CONTRACT_CHANGED` et la replanification redevient obligatoire.

## 9. Cycle de vie des artifacts — PE-36

Les artifacts Actions sont classés par rôle :

- `TEMPORARY_TRANSPORT` ;
- `RECOVERY_REQUIRED` ;
- `DIAGNOSTIC` ;
- `DURABLE_EVIDENCE_SOURCE` ;
- `UNKNOWN`.

Un snapshot complet du dépôt ne doit pas être créé s’il n’est consommé ni par recovery ni par preuve.

La recovery garde la rétention la plus longue réellement nécessaire dans la limite du dépôt ; les diagnostics temporaires utilisent une rétention courte.

Avant une exécution coûteuse dépendant d’un nouvel upload, le workflow vérifie le volume d’artifacts actuellement stocké lorsque l’API le permet. Une saturation durable bloque avant appel IA.

La preuve durable reste distincte de l’artifact Actions temporaire.

La certification facultative d’un ancien artifact de recovery expiré produit un diagnostic explicite ; son absence ne bloque pas la qualification du HEAD courant. Les contrôles de recovery et les preuves requis par cette qualification restent bloquants.

## 10. Efficience des qualifications — PE-37/PE-38

### 10.1 Supersession

Une qualification de PR strictement liée au HEAD courant utilise une concurrence par PR et `cancel-in-progress: true`.

Un nouveau HEAD supersède les qualifications read-only de l’ancien HEAD.

Cette règle ne s’applique jamais à un writer, une recovery, une publication ou une transition dont l’interruption pourrait perdre un état durable.

### 10.2 Prévention des runs inutiles

Lorsque la criticité est connaissable par des chemins statiques versionnés, le trigger GitHub doit empêcher la création du workflow lourd.

Lorsque la criticité exige une inspection, au plus un classifier léger est créé ; les jobs lourds sont conditionnés à son résultat.

Catégories minimales :

- `RUNTIME_PROTOCOL_CHANGE` ;
- `NORMATIVE_PROTOCOL_CHANGE` ;
- `NON_NORMATIVE_DOCUMENTATION` ;
- `UNKNOWN`.

`UNKNOWN` reste fail-safe et impose la qualification complète **dans les deltas mixtes dont un chemin protocolaire a déclenché le pilote**. Le pilote couvre le protocole : les PR exclusivement applicatives (`app/**`, `src/**`) relèvent de la CI applicative et ne créent aucun run pilote. Ce cas est la seule divergence volontaire entre le filtre natif et le classifier.

Le routeur ne reçoit que `issue_comment.created`. Les clauses de dispatch des gates délégués y sont conservées pour la parité avec `comment-routes.json` ; un dispatch manuel cible directement le workflow worker.

Un fichier n’est jamais classé non normatif du seul fait de son extension Markdown.

## 11. Qualification requise avant activation

La version 0.6.51 ne peut être déclarée conforme qu’après :

1. suite pilote complète Linux ;
2. syntaxe de tous les workflows ;
3. suite pilote complète Windows sur runner persistant ;
4. scénarios PE-27 à PE-38 ;
5. vérification du cycle artifact/quota ;
6. vérification de supersession et de prévention des runs inutiles ;
7. audit indépendant Claude couvrant intégralement la matrice `2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md`, déclenché sur la PR candidate seulement après le PASS du pilot Linux/Windows lié au même HEAD ;
8. absence de finding bloquant résiduel ou traitement explicite de chaque finding.

Jusqu’à ces preuves : **NON RETESTÉ**.


## Corrections du contre-audit du HEAD 8247c316

Les nouveaux plans sont générés avec `kodjo.ui-criteria.v3`. Les contrats v1/v2 déjà approuvés restent lisibles et leurs identités ne sont pas réécrites. V3 conserve les assertions atomiques et impose les IDs canoniques partagés à tous les verifiers.

Chaque fichier non-test de `scope_allow` doit être lié à une exigence UI ou non-UI. `non_ui_coverage=NONE` ne peut exempter un fichier mutable sans exigence. Une exigence non-UI sans test exige `no_automated_test_reason` (au moins 40 caractères), reproduit comme `NO_AUTOMATED_TEST` dans le test contract. Avec des tests, le générateur produit `no_automated_test_reason=NONE`.

PRESERVE et FORBIDDEN imposent un locator explicite PATH, SYMBOL ou SEMANTIC. FILE_UNCHANGED et SYMBOL_UNCHANGED utilisent `expected=UNCHANGED` et comparent l’état cumulatif à la baseline opposable, même si le dernier incrément ne touche plus le locator. Un objet Git source absent rend la preuve NON_VERIFIABLE. PATH/FILE_UNCHANGED compare les objets Git de la baseline et du HEAD revu. Une restauration réelle à la baseline peut donc redevenir PASS. Pour FORBIDDEN uniquement, PATH/PATH_ABSENT avec `expected=ABSENT` représente un fichier ou sous-arbre prospectif : absent de la baseline lors de la génération, il doit rester absent du HEAD et des fichiers non suivis, y compris ignorés. Ce locator ne requiert pas de fichier préexistant et ne peut pas être utilisé en PRESERVE. Une preuve machine FAIL ou NON_VERIFIABLE ne peut jamais être remplacée par PASS dans la revue. SYMBOL prouve uniquement la conservation octet pour octet d'une déclaration de fonction nommée, unique, au niveau supérieur ; les syntaxes non prises en charge restent NON_VERIFIABLE, jamais PASS. Il ne prétend pas prouver l'équivalence comportementale ni les dépendances externes du symbole. SEMANTIC impose une justification distincte d'absence de locator ; un chemin explicite dissimulé dans cette justification est refusé. Le reviewer conserve les jugements sémantiques résiduels.

Un REVISE moderne sans findings structurés est refusé. Le statut LEGACY_UNBOUNDED est réservé aux anciens plans sans contrats exigences/atomiques ; il est consommé par le workflow, publié dans PLAN_OUTPUT et conserve la revue indépendante complète.

`normative-inputs.json` est la liste versionnée des documents consommés par les contrôles ; les rapports de preuve non listés ne déclenchent pas la qualification native. Les trois rapports normatifs sont réinclus après l'exclusion globale des rapports. `audit-deferrals.json` conserve les priorités originales, dont P-16 reste P1 explicitement différé ; il n'étend aucune dispense à un autre ID. L'audit doit toujours signaler honnêtement les limites restantes.

## Précisions après audit indépendant du 30 septembre

Tout script protocolaire exécuté après un checkout applicatif doit être figé avant cette bascule, avec ses dépendances transitives, puis invoqué par son chemin runtime. La reprise de revue et la clôture ne dépendent pas de scripts présents dans la baseline produit. Le transport obligatoire de l'audit impose un préflight de quota avant Claude. Ce contrôle d'inventaire ne réserve pas le quota et ne garantit pas la disponibilité du service d'upload.

La compatibilité des identités positionnelles v2 est réservée à la consommation des contrats déjà embarqués et approuvés. La génération de nouveaux plans reste v3 et canonique. Pour les preuves fonctionnelles, la voie historique est exclusivement la classe fermée des matrices v1 sans contrat d'exigences, déjà liées à un plan approuvé par les gates de provenance. Elle est exposée comme HISTORICAL_V1_ONLY dans l'entrée de revue ; aucun plan v2/v3 ne peut y accéder en supprimant ou altérant les preuves. Les nouveaux plans v1 ne sont pas productibles par le validateur courant. Une preuve fonctionnelle exacte absente pour un plan contractuel est NON_VERIFIABLE, même avec Jest global vert.

L'héritage non-UI compare les champs opposables et les preuves normalisées, indépendamment de l'ordre des clés. Les sections de scope en prose incluent aussi les chemins assets et extensions non JS/TS. Un finding bloquant PLAN est refusé sauf NON_UI_COVERAGE ; les corrections sont ciblées par chemins ou identités exactes, sans autorisation générale implicite.

### Rétentions exécutables et autorité de reprise causale

`verify-artifact-retention.js` confronte chaque upload KODJO à `artifact-policy.js` avant qualification. Les preuves de qualification disposable restent 90 jours ; les reçus de publication d’audit restent 14 jours. Un nom non reconnu bloque ce contrôle et est classé UNKNOWN/critique avec une rétention conservatoire de 90 jours ; il ne devient jamais implicitement purgeable.

La reprise automatique de planification accepte comme commande le commentaire bot PLAN_REVIEW_OUTPUT REVISE uniquement si son issue, slice, lien source_plan_comment_id et HEAD sont ceux du plan bot causal. INITIAL exige aussi planning_mode=INITIAL. La commande est réhydratée avant le gate et toute génération ; les commandes utilisateur et leur paire explicite de commentaires restent acceptées.

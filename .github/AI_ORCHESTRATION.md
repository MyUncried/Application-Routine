# KODJO — protocole d’orchestration du développement — V1.3

Ce fichier est le contrat permanent d’orchestration pour les tranches `Txx-Sxx`.

V1.3 conserve les barrières de conformité de V1.2 et remplace la reconstruction exhaustive du contexte à chaque run par une orchestration incrémentale : contexte de travail persistant lorsqu’il est réellement disponible, checkpoint compact de secours, delta vérifié et lectures ciblées.
La parité textuelle exhaustive avec V1.2 reste `NON VÉRIFIABLE` tant qu’un audit différentiel dédié n’a pas comparé les deux textes ; cette limite de preuve n’autorise aucune suppression ni aucun affaiblissement d’une barrière connue.


## Évolutions V1.2 → V1.3

V1.3 conserve explicitement les barrières V1.2 : revue indépendante ChatGPT avant implémentation, `PLAN_APPROVED` obligatoire, désignation d’un écrivain, contrôle du contexte Git, interdiction des réalignements Git spontanés, arrêt sur ambiguïté nécessaire et traçabilité GitHub. Elle ajoute `ORCHESTRATION_FAILURE`, la continuité de session lorsqu’elle est réellement disponible, checkpoint + delta vérifié, lecture ciblée, sortie structurée et performance comme exigence d’orchestration. Ces optimisations ne diminuent aucun contrôle de conformité.

## Principes directeurs

1. **Sources de vérité ≠ contexte de travail.** GitHub, documentation, Figma et registre des décisions restent les sources de vérité. Une session ou un checkpoint IA accélère le travail mais ne remplace jamais ces sources.
2. **Une information est vérifiée une fois par l’acteur le mieux placé pour la vérifier.** Les contrôles déterministes de transport, identité GitHub, branche, HEAD, état d’Issue, intégrité et delta sont réalisés par l’orchestration lorsqu’elle en a les moyens ; Claude Code ne les rejoue pas sans raison probante.
3. **Delta plutôt qu’historique.** Une reprise reçoit les changements depuis le dernier état validé, pas l’historique brut complet du bloc ou de l’Issue.
4. **Lecture ciblée.** Claude Code part des fichiers et sources concernés par la tranche et étend sa recherche uniquement lorsqu’une dépendance ou contradiction concrète le justifie.
5. **Continuité sans confiance aveugle.** Réutiliser une session existante lorsqu’elle réduit réellement les relectures ; si la reprise de session n’est pas disponible ou fiable, reprendre depuis un checkpoint compact et le delta vérifié.
6. **Performance = exigence d’orchestration.** Une consommation manifestement disproportionnée par rapport au travail utile est un défaut à diagnostiquer. Elle ne se corrige pas par une hausse mécanique des limites ni par la suppression de contrôles de conformité.
7. **Pas de seuil artificiel de tours.** Aucun nombre fixe de tours ne définit à lui seul succès, échec ou escalade. Les tours, la durée, les refus de permissions, les relectures et les coûts observables sont des signaux diagnostiques. L’escalade repose sur la stagnation, les répétitions sans information nouvelle ou une consommation disproportionnée, pas sur un compteur isolé. Lorsqu’un runner impose un paramètre de type `max-turns`, sa valeur est exclusivement un coupe-circuit technique de sécurité, jamais le dimensionnement normal de la tâche. Son atteinte déclenche `ORCHESTRATION_FAILURE` et un diagnostic de cause ; elle n’autorise jamais une augmentation automatique du plafond.

## Rôles

- **ChatGPT** prépare la tranche et son périmètre, contrôle les sources de vérité, réduit le contexte transmis, révise le plan avant implémentation, contre-vérifie indépendamment le développement et les tests, demande les reprises et autorise la clôture.
- **Claude Code** analyse le delta et les sources ciblées, propose le plan, le révise si demandé, implémente uniquement après `PLAN_APPROVED`, exécute les tests, produit les preuves, corrige les écarts et réalise un self-check direct du travail.
- **GitHub / orchestration** transporte et matérialise les sources, vérifie les préconditions déterministes disponibles, calcule le delta, conserve la traçabilité et publie les résultats.
- **Utilisateur** n’intervient que pour un arbitrage produit réel, une validation UX/perceptive, un test physique nécessaire, un changement de périmètre ou un coût additionnel significatif nécessitant son accord.

## Sources de vérité

1. Documentation fonctionnelle = comportements et règles métier.
2. Documentation technique = contraintes et choix d’implémentation.
3. Figma = rendu visuel et états d’interface représentés.
4. Registre des décisions = arbitrages explicitement validés.
5. GitHub = état traçable de la tâche, branche, commits, PR, commentaires et preuves d’orchestration.

Ne jamais inventer une règle. Une ambiguïté nécessaire non résolue par les sources déclenche `CLARIFICATION_REQUIRED`. Une inconnue non nécessaire à la tranche est reportée sans décision implicite.
Ne pas anticiper une tranche ultérieure. Modifier uniquement ce qui est nécessaire à la tranche approuvée.

## Machine à états

Cycle nominal :

`SPEC_PREPARED → PLAN_DRAFT → PLAN_READY_FOR_REVIEW → PLAN_REVIEW → PLAN_APPROVED → IMPLEMENTING → IMPLEMENTATION_READY_FOR_REVIEW → IMPLEMENTATION_REVIEW → FINAL_VERIFICATION → READY_TO_CLOSE → CLOSED`

Boucles :

- `PLAN_REVIEW → PLAN_CHANGES_REQUESTED → PLAN_DRAFT → PLAN_READY_FOR_REVIEW → PLAN_REVIEW`
- `IMPLEMENTATION_REVIEW → CHANGES_REQUESTED → IMPLEMENTING → IMPLEMENTATION_READY_FOR_REVIEW → IMPLEMENTATION_REVIEW`
- `IMPLEMENTATION_REVIEW → RETEST_REQUIRED → IMPLEMENTING → IMPLEMENTATION_READY_FOR_REVIEW → IMPLEMENTATION_REVIEW`

États exceptionnels :

- `CLARIFICATION_REQUIRED` : décision nécessaire non déterminable par les sources.
- `WORKTREE_LOCKED` : conflit, divergence Git, verrou ou concurrence d’écriture observée.
- `ARBITRAGE` : décision utilisateur réellement nécessaire.
- `USER_VALIDATION` : contrôle humain réellement nécessaire ou stagnation démontrée d’une boucle de revue.
- `ORCHESTRATION_FAILURE` : défaut technique de transport, session, sortie structurée, permissions, runner, wrapper ou autre mécanisme d’orchestration. Cet état ne doit jamais être transformé en arbitrage produit.

`PLAN_READY_FOR_REVIEW`, `IMPLEMENTATION_READY_FOR_REVIEW`, `CLARIFICATION_REQUIRED`, `WORKTREE_LOCKED`, `USER_VALIDATION` et `ARBITRAGE` sont des barrières d’arrêt. `ORCHESTRATION_FAILURE` arrête le run technique mais appelle un diagnostic/reprise d’orchestration, pas une décision produit. `PLAN_CHANGES_REQUESTED`, `CHANGES_REQUESTED` et `RETEST_REQUIRED` autorisent uniquement le travail explicitement demandé. Le silence ne vaut jamais approbation.

Une stagnation dont la cause démontrée est technique, contextuelle, liée au transport, aux permissions ou aux outils relève de `ORCHESTRATION_FAILURE`. Une stagnation de fond dans une boucle de revue, malgré des sources, un contexte et des outils corrects, peut relever de `USER_VALIDATION`. Si le contenu de la stagnation exige une décision produit, fonctionnelle, UX ou de périmètre, `ARBITRAGE` prévaut ; `USER_VALIDATION` est réservé aux contrôles humains ne nécessitant pas de décision produit.

Après résolution d’un `ARBITRAGE` ou d’un `USER_VALIDATION`, la décision ou validation humaine est enregistrée dans l’Issue/PR, le contexte autorisé et son delta sont revalidés, puis la reprise s’effectue depuis le dernier état stable compatible ; aucune autorisation d’écriture antérieure n’est supposée encore valide.

## Barrière avant implémentation

Claude Code ne modifie aucun fichier métier d’une nouvelle tranche avant publication explicite par ChatGPT de `PLAN_APPROVED` désignant le contexte autorisé, le mode et l’écrivain.

Un `PLAN_APPROVED` autorise uniquement l’exécution du plan approuvé. Toute divergence de branche/HEAD, bascule de mode, concurrence ou changement substantiel du périmètre invalide l’autorisation jusqu’à revalidation appropriée.

Les verdicts fonctionnels normaux de `PLAN_REVIEW` sont `PLAN_APPROVED`, `PLAN_CHANGES_REQUESTED` et `CLARIFICATION_REQUIRED`. Les états exceptionnels `WORKTREE_LOCKED`, `ARBITRAGE`, `USER_VALIDATION` et `ORCHESTRATION_FAILURE` restent applicables pendant la revue si leurs conditions sont effectivement observées.

## Continuité de contexte par bloc `Txx`

### Session persistante

Lorsque la plateforme permet réellement d’identifier et de reprendre une session Claude Code, une session de travail est associée au bloc `Txx` et réutilisée entre ses tranches et entre plan/corrections/implémentation lorsque cela est compatible avec le contexte autorisé.

La reprise de session est une optimisation, jamais une source de vérité ni une capacité supposée. Elle doit être testée de bout en bout. Si elle échoue, le protocole bascule sur le checkpoint sans diminuer les contrôles.

Une session reprise reçoit le delta depuis le dernier checkpoint validé. Elle ne doit pas relire l’historique complet par défaut.

### Checkpoint compact

L’orchestration maintient un checkpoint compact après chaque tranche clôturée et à chaque barrière stable qui doit pouvoir servir de point de reprise : `PLAN_READY_FOR_REVIEW`, `PLAN_APPROVED`, `IMPLEMENTATION_READY_FOR_REVIEW`, fin d’une revue avant demande de correction, ainsi qu’avant un arrêt `ARBITRAGE`, `USER_VALIDATION`, `CLARIFICATION_REQUIRED`, `WORKTREE_LOCKED` ou `ORCHESTRATION_FAILURE` lorsque les informations nécessaires sont disponibles. Un checkpoint intermédiaire n’accorde jamais à lui seul une autorisation d’écriture.

Le checkpoint contient au minimum lorsque disponible :

- bloc et dernière tranche validée ;
- HEAD/checkpoint Git ;
- architecture/composants déjà établis nécessaires à la continuité ;
- décisions actives pertinentes et décisions supersédées depuis le checkpoint précédent ;
- références vérifiables des sources documentaires/décisionnelles pertinentes utilisées pour le produire (chemin et, lorsque disponible, commit/hash/version ou autre identifiant de fraîcheur) ;
- fichiers structurants connus ;
- tests/preuves validés pertinents ;
- points ouverts ;
- identifiant de session Claude si la reprise est validée.

Le checkpoint n’est pas un nouvel historique narratif. Chaque nouveau checkpoint remplace le checkpoint opérationnel précédent du bloc concerné ; il n’est pas cumulatif. Les anciens checkpoints peuvent rester disponibles comme preuves d’audit mais ne sont jamais concaténés au contexte courant. Il doit rester minimal, structuré et reconstructible depuis les sources de vérité. Avant réutilisation, l’orchestration vérifie sa relation avec le HEAD et le delta courant **et** revalide la fraîcheur des sources documentaires/décisionnelles pertinentes référencées. Une décision supersédée, une source plus récente pertinente, un checkpoint incohérent, incomplet ou devenu obsolète invalide les éléments concernés ; ils sont recalculés depuis la source de vérité et ne sont jamais acceptés silencieusement.

### Delta de reprise

Pour une nouvelle tranche ou une reprise, l’orchestration prépare autant que possible :

- tâche et critères d’acceptation ;
- HEAD actuel et HEAD du checkpoint ;
- commits/fichiers modifiés entre les deux ;
- nouvelles décisions ;
- décisions modifiées ou supersédées ;
- nouveaux commentaires de revue pertinents ;
- sources documentaires/Figma réellement concernées ;
- points ouverts.

Les données GitHub brutes peuvent être conservées comme preuves d’audit, mais elles ne sont pas injectées intégralement dans le contexte Claude lorsque le paquet vérifié contient déjà l’information nécessaire. Toute donnée brute exceptionnellement transmise à une IA doit être structurée et segmentée ou paginée selon sa nature ; un blob massif monoligne ou non délimité est interdit.

## Routage des commentaires GitHub

`kodjo-v2-comment-router.yml` est le seul abonné natif à `issue_comment.created`.
Les traitements de commentaires sont appelés comme workflows réutilisables, avec
leurs conditions et permissions propres. Un commentaire ordinaire ne doit jamais
recréer un run distinct pour chaque traitement. Les routes sont inventoriées dans
`.github/orchestration/comment-routes.json` et contrôlées par les tests du pilote.
Toute nouvelle commande doit être ajoutée au routeur, sans réintroduire un abonnement
natif dans son traitement. Les déclencheurs manuels et dispatchs restent indépendants.
Routine Dev observe la revue exacte dans la tentative du routeur, ou la fin d'une
revue autonome ; aucune approbation ni identité de HEAD n'est déduite du seul succès
du routeur. Rapport :
`.github/orchestration/reports/2026-09-29_COMMENT_WORKFLOW_FANOUT_FIX.md`.

## Contrôles déterministes avant appel IA

Lorsque le runner/orchestrateur dispose des capacités nécessaires, il contrôle avant de lancer Claude :

- dépôt et Issue/PR attendus ;
- état de l’Issue/PR pertinent ;
- branche autorisée ;
- HEAD/baseline et relation avec le checkpoint ;
- fraîcheur des sources documentaires/décisionnelles pertinentes référencées par le checkpoint ;
- propreté ou état Git requis selon le mode ;
- delta de commits/fichiers ;
- intégrité des fichiers matérialisés ;
- disponibilité des entrées obligatoires ;
- disponibilité effective des outils et permissions indispensables à la phase.

Si un outil ou une permission indispensable manque, le run IA n’est pas lancé tant que le défaut peut être détecté au préflight ; l’échec est corrigé ou classé `ORCHESTRATION_FAILURE`. Une capacité non indispensable est retirée du chemin nominal plutôt que testée répétitivement par Claude.

Si ces contrôles échouent, ne pas consommer une session Claude pour les refaire. Corriger ou classer l’échec au niveau orchestration/Git.

Les empreintes, manifestes et validations de transport sont calculés dans l’environnement qui peut réellement y accéder. Claude ne doit pas être chargé de recalculer une preuve inaccessible à son sandbox.

## Paquet de contexte IA

Le chemin nominal fournit un paquet structuré et compact, par exemple :

- `SOURCE_ATTESTATION`
- `TASK`
- `ACCEPTANCE_CRITERIA`
- `ACTIVE_DECISIONS`
- `NEW_DECISIONS`
- `SUPERSEDED_DECISIONS`
- `CODE_DELTA`
- `DOC_UI_DELTA`
- `OPEN_POINTS`
- `CHECKPOINT`

`SOURCE_ATTESTATION` est produit par GitHub / l’orchestration après les contrôles déterministes disponibles. Avant publication de `PLAN_APPROVED`, ChatGPT effectue un contrôle indépendant ponctuel de cohérence entre cette attestation et l’état GitHub / les sources de vérité réellement accessibles, au minimum sur les champs critiques pertinents. Ce sondage reste ciblé et ne devient jamais une seconde reconstruction exhaustive du contexte ; toute divergence significative déclenche revalidation ou `ORCHESTRATION_FAILURE` avant `IMPLEMENTING`. Il atteste au minimum, lorsque ces éléments sont applicables et vérifiables : dépôt, Issue/PR, branche, HEAD/baseline ou checkpoint, relation du delta, intégrité des entrées matérialisées, fraîcheur des sources documentaires/décisionnelles pertinentes et résultat du préflight. Il doit distinguer explicitement les éléments `VERIFIED`, `FAILED` et `NON_VÉRIFIABLE`. Il n’atteste jamais un fait que le producteur n’a pas contrôlé. Son absence, son invalidité ou une contradiction avec le paquet/delta déclenche `ORCHESTRATION_FAILURE` ou une revalidation par l’orchestration ; Claude ne transforme jamais cette anomalie en conformité implicite.

Avant toute entrée en `IMPLEMENTING`, les champs critiques d’autorisation — dépôt, branche, HEAD/baseline autorisé, relation du delta/checkpoint, fraîcheur des sources documentaires/décisionnelles pertinentes, mode et écrivain — doivent être `VERIFIED`. Un champ critique `FAILED` ou `NON_VÉRIFIABLE` interdit l’écriture et déclenche revalidation ou `ORCHESTRATION_FAILURE`. Les champs non critiques peuvent rester `NON_VÉRIFIABLE` uniquement si cette absence de preuve est explicitement tracée et n’affecte ni le périmètre, ni les critères d’acceptation, ni l’autorisation d’écriture.

Éviter toute duplication d’une même source dans le prompt et dans un fichier à relire. Les historiques bruts ne sont consultés que si une contradiction, une lacune de traçabilité ou une revue précise l’exige, et restent soumis à la règle de structuration/segmentation des données brutes.

## Stratégie de lecture Claude

Claude commence par les points d’entrée explicitement concernés. Il suit ensuite uniquement les dépendances nécessaires.

Une lecture globale d’un chapitre, de l’arbre ou de l’historique est justifiée seulement si :

1. le delta indique un changement transverse ;
2. une décision dépend explicitement de cette source ;
3. une contradiction concrète est détectée ;
4. une preuve de blast radius ne peut pas être obtenue par recherche ciblée.

La propagation transverse documentaire reste obligatoire lorsqu’une décision l’exige, mais elle se réalise par recherche ciblée de formulations et dépendances, pas par relecture systématique de tous les chapitres.

## Plan

Le plan doit être suffisamment précis pour permettre la revue et borner l’implémentation, sans simuler à l’avance tout le développement.

Format logique :

```text
TÂCHE
Txx-Sxx

COMPRÉHENSION
...

PÉRIMÈTRE / FICHIERS IMPACTÉS
...

PLAN D’IMPLÉMENTATION
1. ...
2. ...

MIGRATION / DONNÉES
Aucune | ...

TESTS PRÉVUS
...

RISQUES / EFFETS DE BORD
...

AMBIGUÏTÉS
Aucune | ...

STATUT
PLAN_READY_FOR_REVIEW
```

Lorsque le transport le permet, la sortie machine utilise de vrais champs structurés (`status`, `task`, `scope`, `files_create`, `files_modify`, `implementation_steps`, `migration`, `tests`, `risks`, `ambiguities`, `evidence`) plutôt qu’un unique champ contenant un long texte Markdown. Le workflow rend ensuite cette structure lisible dans GitHub.

Une ambiguïté est classée avant escalade :

- **technique déterminable** : résoudre à partir du code/contraintes existants ;
- **fonctionnelle/UX nécessaire** : rechercher docs/Figma/registre, puis `CLARIFICATION_REQUIRED` si réellement indéterminable ;
- **non nécessaire à la tranche** : reporter sans inventer de défaut ;
- **extension optionnelle** : exclure du plan sauf décision explicite de périmètre.


## Matérialisation et publication des sorties IA

Toute sortie IA valide destinée à GitHub est matérialisée de manière déterministe et vérifiée après publication.

La construction du payload doit éviter toute interprétation non intentionnelle par le shell et préserver exactement les champs structurés attendus. Une publication n’est considérée réussie qu’après obtention d’un identifiant de ressource GitHub et, lorsque pertinent, contrôle des champs critiques effectivement publiés.

Si la sortie IA est déjà valide mais que seule sa matérialisation ou sa publication échoue, l’incident est classé `ORCHESTRATION_FAILURE`. L’orchestration retente uniquement l’étape de publication à partir de la sortie IA déjà validée. Elle ne rappelle l’IA que si cette sortie est absente, invalide ou devenue incompatible avec le contexte courant.

## Contexte d’exécution autorisé

Toute écriture est bornée par : tâche active, état du protocole, branche, HEAD/baseline, mode `LOCAL` ou `CLOUD`, écrivain, périmètre approuvé et opérations Git autorisées.

Claude ne réalise jamais spontanément `reset`, `rebase`, merge, force-push, changement de branche/baseline ou réalignement d’historique pour rendre le contexte conforme.

Une bascule `LOCAL ↔ CLOUD` invalide l’autorisation d’écriture précédente et exige une nouvelle approbation explicite du contexte `mode + écrivain`.

### Mode `LOCAL`

Une seule session est écrivain d’un même worktree physique. Avant écriture, acquérir le verrou non commité résolu par `git rev-parse --git-path ai-orchestration-writer.lock`. S’il existe déjà ou si sa création échoue : `WORKTREE_LOCKED`.

Le contrôle best-effort local vérifie au minimum branche/HEAD, relation avec `origin`, stabilité de `git status --porcelain`, worktrees attendus, absence d’`index.lock`, verrou d’écrivain et absence de changement observé pendant la fenêtre de diagnostic. Il ne prétend jamais prouver l’absence absolue de concurrence.

Un verrou résiduel n’est jamais supprimé spontanément ; reprise seulement après `[ChatGPT] WORKTREE_RESUME_APPROVED`.

### Mode `CLOUD`

Avant écriture, vérifier dépôt, branche, base/head et état distant pertinents. Un push concurrent, une avancée distante inattendue ou une divergence entraîne `WORKTREE_LOCKED`, sans rebase/reset/force-push implicite.

Une tâche cloud ne suppose jamais l’accès à un fichier uniquement local, appareil physique, émulateur local ou secret local. Les secrets ne sont jamais copiés dans un prompt ou le dépôt.

## Désignation de l’écrivain

Le `[ChatGPT] PLAN_APPROVED` désigne explicitement `mode + écrivain`. Une session non désignée n’écrit pas.

Les marqueurs `[ChatGPT] WRITER_ASSIGNED: ...` et `[ChatGPT] WRITER_RELEASED` sont réservés aux relais/changements d’écrivain. Un conflit de désignation ne se résout jamais par auto-attribution.

## Performance et sobriété opérationnelle

La performance est un critère de qualité du protocole au même titre que la traçabilité et la conformité. L’objectif est de minimiser le travail sans valeur probante : relectures, recherches redondantes, reconstruction d’historique, appels refusés, tests sans rapport avec le périmètre et prose machine inutile.

### Signaux à observer

Lorsque disponibles, tracer notamment :

- durée de la phase IA ;
- nombre de tours/appels ;
- volume de contexte fourni ;
- relectures répétées d’une même source ;
- recherches sans information nouvelle ;
- refus de permissions/outils ;
- erreurs de sortie structurée ;
- consommation/coût réellement observable ;
- proportion du travail consacrée à l’orchestration plutôt qu’à la tâche.

Aucun seuil fixe de tours n’est une règle de conformité. Un grand nombre de tours peut être légitime pour une implémentation complexe ; un faible nombre peut masquer une analyse insuffisante. Le diagnostic est qualitatif et fondé sur la progression utile. Une limite `max-turns` éventuellement exigée par le runner reste un coupe-circuit technique ; son atteinte est une anomalie `ORCHESTRATION_FAILURE`, jamais un motif suffisant pour relever automatiquement cette limite.

### Détection de stagnation

Un run est suspect lorsque plusieurs itérations successives :

- relisent/recherchent la même information sans nouvelle évidence ;
- échouent sur la même permission ou le même outil ;
- reconstruisent un historique déjà attesté ;
- explorent des zones sans lien démontré avec la tranche ;
- produisent surtout du méta-travail d’orchestration.

Dans ce cas, ne pas augmenter mécaniquement les limites. Réduire/corriger le contexte, déplacer le contrôle vers le runner approprié, reprendre depuis checkpoint ou corriger l’outil. Si le run ne peut pas produire son résultat à cause de ce défaut : `ORCHESTRATION_FAILURE`.

### Permissions et outils

Une permission refusée doit être interprétée une fois. Si l’opération n’est pas indispensable, utiliser une voie autorisée ou supprimer cette tentative du workflow. Ne jamais répéter automatiquement une commande déjà refusée sans changement de contexte d’autorisation.

Les outils autorisés sont minimaux mais suffisants pour la phase. Une extension d’outil doit être motivée par une preuve nécessaire, pas par confort exploratoire.

### Modèle IA

Le modèle est choisi qualitativement selon complexité, surface et risque. Un modèle plus coûteux est justifié par une difficulté démontrée, pas par un échec d’orchestration. La reprise de contexte et la réduction du corpus sont privilégiées avant une escalade de modèle.

## Ressources IA

Les ressources pilotent la méthode, jamais le niveau de conformité.

Valeurs : `OK`, `BAS`, `CRITIQUE`, `NON VÉRIFIABLE`. Toute métrique inaccessible est `NON VÉRIFIABLE` ; aucune estimation plausible n’est inventée.

Distinguer consommation d’abonnement, API facturable, GitHub Actions et autres coûts seulement lorsqu’ils sont réellement observables. Un coût additionnel significatif nécessitant une décision utilisateur peut déclencher `ARBITRAGE`.

## Implémentation après `PLAN_APPROVED`

Lorsque la reprise de session est techniquement disponible, validée et compatible avec le contexte autorisé, l’implémentation réutilise la continuité du plan et reçoit le plan approuvé + le delta de revue. Si cette continuité n’est pas disponible ou fiable, elle repart du checkpoint compact + delta vérifié, sans reconstruire l’analyse générale du bloc.

Claude modifie uniquement le périmètre approuvé et ses dépendances indispensables démontrées. Une dépendance nouvellement découverte qui modifie substantiellement le plan déclenche une reprise de revue appropriée.

Après `CHANGES_REQUESTED` ou `RETEST_REQUIRED`, conserver le contexte de tâche et transmettre uniquement la demande de correction et le delta depuis le dernier état. Aucun nettoyage/refactoring opportuniste hors périmètre.

## Conservation des acquis / Change Control

Introduite par `[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA ROULETTE + VERROU DE CAPITALISATION` (2026-09-04), à la suite d’une régression majeure où une correction locale de la roulette de Composition avait entraîné le remplacement complet d’une primitive native déjà acceptée par une réimplémentation maison, présentée à tort comme équivalente sur la seule base d’une suite Jest verte.

Un composant, écran, comportement ou choix technique déjà validé explicitement, ou constituant la dernière version de référence acceptée, devient une **BASELINE GELÉE**.

Dès lors :

1. Toute nouvelle mission est un **delta** appliqué à cette baseline, jamais une autorisation de réécriture générale.
2. Tout élément non explicitement ouvert par la mission en cours est hors périmètre et doit rester inchangé.
3. Une correction locale n’autorise ni changement de primitive, ni remplacement de composant, ni refonte d’architecture, ni réécriture massive des tests.
4. Si Claude estime qu’une substitution ou une refonte est indispensable, il doit s’arrêter **avant tout code** avec le statut `CHANGE_REQUEST_REQUIRED` et fournir : le blocage démontré ; l’alternative proposée ; les fichiers et comportements touchés ; les acquis qui risquent d’être perdus ; les tests et preuves de non-régression envisagés. Une autorisation ChatGPT distincte est obligatoire avant tout code.
5. Le silence ou l’ambiguïté d’une instruction ne vaut jamais autorisation de remplacer un acquis.
6. Avant modification, Claude établit la liste `PRESERVE / CHANGE / FORBIDDEN` du périmètre concerné. Après modification, le rapport de mission démontre que chaque élément `PRESERVE` est resté inchangé.
7. Une suite Jest verte ne permet jamais, à elle seule, de remplacer une preuve visuelle ou tactile sur appareil réel.
8. Tout diff dépassant le composant ciblé, ses styles strictement dépendants et ses tests ciblés impose un arrêt `SCOPE_EXPANSION_REQUIRED`.

`CHANGE_REQUEST_REQUIRED` et `SCOPE_EXPANSION_REQUIRED` sont des barrières d’arrêt au même titre que celles de la machine à états principale (§ « Machine à états ») : elles interdisent l’écriture tant qu’une autorisation `PLAN_APPROVED` distincte ne les lève pas explicitement.

## Priorité aux primitives natives de l’OS

Introduite par la même autorisation REWORK06 (2026-09-04), à la suite du remplacement non autorisé d’une roulette native iOS (`@expo/ui/swift-ui`, `pickerStyle("wheel")`) par une réimplémentation React Native personnalisée.

1. Lorsqu’une primitive native iOS ou Android existe pour l’interaction demandée, Claude doit **systématiquement la privilégier**.
2. Il est interdit de remplacer une primitive native disponible par une réimplémentation personnalisée React Native, un assemblage de `ScrollView`, une imitation graphique ou une bibliothèque tierce uniquement pour faciliter le style ou les tests.
3. Si le rendu natif nécessite une adaptation de conteneur, de largeur, d’alignement ou d’habillage, corriger l’intégration autour de la primitive native sans remplacer son mécanisme d’interaction.
4. Une dérogation n’est possible que si Claude démontre, avant tout code, que la primitive native ne peut pas satisfaire une exigence fonctionnelle validée. Il doit alors s’arrêter en `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`, documenter les preuves, les impacts et l’alternative, puis attendre une autorisation ChatGPT explicite avant tout code.
5. L’absence de couverture Jest, la difficulté de mocker la primitive, ou l’impossibilité pour Claude d’obtenir lui-même une capture device ne constituent jamais une justification de remplacement.
6. Les tests doivent vérifier que la branche concernée utilise réellement la primitive native attendue et qu’aucun fallback personnalisé ne lui est substitué silencieusement.

`NATIVE_PRIMITIVE_EXCEPTION_REQUIRED` est une barrière d’arrêt au même titre que `CHANGE_REQUEST_REQUIRED`/`SCOPE_EXPANSION_REQUIRED` ci-dessus.

## Rapport après implémentation

Le rapport humain reste lisible dans GitHub, mais lorsque le transport le permet sa sortie machine est structurée. Les champs minimaux sont : `status`, `task`, `summary`, `files_modified`, `acceptance_criteria`, `tests_run`, `tests_not_run`, `plan_deviations`, `limitations`, `technical_decisions`, `clarifications`, `performance`, `commit`, `self_check`. `performance` contient, lorsque observables, `ai_duration`, `turns_or_calls`, `permission_denials`, `context_assessment`, `cost_or_consumption`, `inefficiencies`, `action`. Le workflow rend ensuite cette structure lisible ; l’orchestrateur ne doit pas dépendre du reparsing d’un bloc Markdown libre pour détecter stagnation ou échec.

Format humain de référence :

```text
TÂCHE
Txx-Sxx

STATUT
IMPLEMENTATION_READY_FOR_REVIEW

RÉSUMÉ
...

FICHIERS MODIFIÉS
...

CRITÈRES D’ACCEPTATION
AC-xx : CONFORME | PARTIELLEMENT CONFORME | NON CONFORME | NON VÉRIFIABLE
Preuve : ...

TESTS EXÉCUTÉS
commande : ...
résultat : PASS | FAIL

TESTS NON EXÉCUTÉS
...
raison : ...

ÉCARTS AU PLAN APPROUVÉ
Aucun | ...

LIMITATIONS
...

DÉCISIONS TECHNIQUES
...

À CLARIFIER
Aucun | ...

PERFORMANCE / RESSOURCES
Durée IA : ... | NON VÉRIFIABLE
Tours/appels : ... | NON VÉRIFIABLE
Permissions refusées : ... | NON VÉRIFIABLE
Contexte : OK | ÉLEVÉ | À COMPACTER | NON VÉRIFIABLE
Coût/consommation : ... | NON VÉRIFIABLE
Inefficacités observées : Aucune | ...
Action : CONTINUER | OPTIMISER | ORCHESTRATION_FAILURE | ARBITRAGE

COMMIT
...

SELF-CHECK CLAUDE
...
```

Une affirmation sans preuve n’est pas une conformité.

## Revue indépendante ChatGPT

ChatGPT confronte indépendamment :

`spécification → plan approuvé → diff réel → tests → résultat`.

La revue recherche : critère non démontré, omission, hors-périmètre, écart au plan, test insuffisant, cas limite, régression, dette injustifiée, décision produit implicite, contradiction documentaire et inefficacité d’orchestration manifeste.

Lorsque GitHub permet un contrôle direct, ChatGPT vérifie directement les fichiers, patches, commits, branches et métadonnées pertinentes plutôt que de se fonder uniquement sur le rapport Claude.

Le self-check Claude est une relecture directe de son travail, mais n’est pas une indépendance d’agent. La revue ChatGPT est le contrôle par un système distinct.

## Vérification finale

`FINAL_VERIFICATION` n’est pas une seconde reconstruction du contexte ni, par défaut, un nouvel appel Claude. Elle est réalisée par ChatGPT avec les contrôles GitHub déterministes disponibles après une revue d’implémentation conforme. Elle vérifie uniquement les preuves finales nécessaires : diff/commit final, critères d’acceptation, tests requis, branche et HEAD attendus, état Git final, contradictions ou points nécessaires encore ouverts et conformité des artefacts temporaires.

Si `FINAL_VERIFICATION` est conforme : `READY_TO_CLOSE`. Si elle révèle un écart d’implémentation ou de test : retour explicite à `IMPLEMENTATION_REVIEW` avec `CHANGES_REQUESTED` ou `RETEST_REQUIRED` selon la nature de l’écart. Si elle révèle une ambiguïté nécessaire : `CLARIFICATION_REQUIRED`. Si elle révèle un défaut Git/concurrence : `WORKTREE_LOCKED`. Si elle révèle un défaut technique d’orchestration : `ORCHESTRATION_FAILURE`. Une nouvelle analyse substantielle revient ainsi à l’état de revue approprié au lieu d’élargir silencieusement `FINAL_VERIFICATION`.

## Preuves Git

Adapter la preuve à l’état réel :

- non suivi : `git status --porcelain` + contrôle direct ;
- indexé : `git diff --cached` ;
- commité : comparaison baseline autorisée ↔ `HEAD` ;
- final : branche attendue, synchronisation connue avec `origin`, état propre sauf exception autorisée.

Pour Unicode/BOM/fins de ligne ou autre propriété exacte pertinente, compléter par une vérification adaptée. Ne pas généraliser les contrôles coûteux sans besoin.

Une déclaration d’agent n’est jamais une preuve lorsque l’état peut être contrôlé directement.

## Traçabilité GitHub

Chaque tranche porte une Issue. Plans, verdicts ChatGPT, rapports et corrections sont tracés dans l’Issue ou la PR associée.

Les messages ChatGPT sont préfixés `[ChatGPT]`. Claude récupère les **nouveaux verdicts pertinents depuis le dernier checkpoint** ; il n’a pas à relire tout l’historique de commentaires lorsque l’orchestration atteste le delta.

Les données brutes et manifests peuvent être conservés pour audit sans être injectés au modèle.

## Stratégie de branche T01

`feat/creation-seance-catalogue` reste la branche de bloc de `T01`. Tous les commits `T01-Sxx` y sont réalisés jusqu’à clôture du bloc. Chaque tranche à partir de T01-S08 conserve sa propre Issue. Une PR unique intègre le bloc T01 vers `main` à sa clôture.

Cette stratégie doit être réévaluée explicitement au démarrage de T02.

## Nettoyage et clôture

`READY_TO_CLOSE` exige simultanément : plan approuvé ; implémentation conforme ; AC démontrés ; tests requis réussis ou impossibilités documentées ; revue ChatGPT conforme ; `FINAL_VERIFICATION` conforme ; self-check Claude conforme ; validation utilisateur si requise ; aucun point nécessaire à clarifier ; aucune contradiction connue résiduelle ; état Git final conforme et traçable.

Avant `CLOSED`, supprimer uniquement les artefacts temporaires dont le nettoyage est prévu et vérifier qu’aucun résidu ou commit involontaire n’a été intégré.

### `DELIVERY_REPORT_GATE`

Consolidation normative (2026-09-03) de l’exigence de livraison documentaire définie dans `CLAUDE.md` (« Livraison documentaire obligatoire de chaque mission ») — applicable ici à toute mission conduite sous ce protocole, quel que soit son type (diagnostic, audit, développement, correction, revue, test, investigation).

`DELIVERY_REPORT_GATE` échoue si l’un des éléments suivants manque :

- fichier Markdown présent dans le répertoire prévu (`.github/orchestration/reports/`) ;
- fichier suivi par Git ;
- commit contenant le rapport ;
- chemin communiqué ;
- hash communiqué ;
- état Git communiqué ;
- résultats des tests consignés (ou mention explicite qu’aucun test n’était applicable).

Une mission dont `DELIVERY_REPORT_GATE` échoue doit être déclarée **LIVRAISON INCOMPLÈTE**, jamais **TERMINÉE**. `READY_TO_CLOSE`/`CLOSED` exigent donc, en plus des conditions énumérées ci-dessus, un `DELIVERY_REPORT_GATE` conforme.

Cette obligation ne peut être suspendue que par une instruction explicite contenant exactement `EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION` (voir `CLAUDE.md`). Aucune instruction ponctuelle interdisant les modifications, les commits ou les livraisons (« ne modifier aucun fichier », « diagnostic seul », « ne créer aucun commit », « analyse uniquement ») ne suspend implicitement cette obligation — elle s’interprète comme une interdiction limitée aux fichiers applicatifs, jamais au rapport documentaire lui-même.

*Portée de cette consolidation* : ce protocole est la V1.3, la seule effectivement active et présente sur la branche de bloc `feat/creation-seance-catalogue` à la date de cette consolidation (confirmé par audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`, section « traçabilité du protocole »). La V1.4 existe uniquement comme PR #33 (`docs: consolidate KODJO orchestration V1.4 LOCAL`, branche `orchestration/v1-4-local`), **non fusionnée et absente de l’arbre de travail courant** — `DELIVERY_REPORT_GATE` n’a donc pas pu y être inscrit directement sans une opération de branche non sollicitée par cette mission (changement de branche/checkout hors périmètre d’une mission documentaire ponctuelle, et proscrit spontanément par ce protocole lui-même, section « Contexte d’exécution autorisé »). Cette même consolidation reste à reporter dans `KODJO_ORCHESTRATION_V1_4_LOCAL.md` avant ou lors de la fusion de la PR #33.

## Audit du protocole et évolution

Toute évolution du protocole doit être auditée sur quatre axes :

1. **Conformité** : aucune barrière critique perdue ;
2. **Traçabilité** : chaque décision/reprise reste reconstructible ;
3. **Robustesse** : les pannes techniques ne deviennent pas des décisions produit ;
4. **Performance** : le protocole évite la reconstruction inutile du contexte et le méta-travail disproportionné.

Lorsqu’un audit est demandé à Claude Code ou à un autre agent, le prompt d’audit doit explicitement demander d’identifier les mécanismes susceptibles de provoquer relectures, boucles, permissions refusées, inflation de contexte, duplication de preuves ou consommation disproportionnée. L’auditeur ne doit pas proposer d’améliorer la performance en supprimant une barrière de conformité ; il doit rechercher d’abord une meilleure allocation des responsabilités, un meilleur transport du contexte et une réduction du travail redondant.
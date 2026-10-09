# KODJO — continuité et reprise du protocole V1.3

Ce document est une extension normative de `.github/AI_ORCHESTRATION.md`. Il précise les règles de reprise événementielle et de continuité ChatGPT sans modifier les barrières, sources de vérité ni autorisations d’écriture définies par le protocole principal. En cas de contradiction, aucune règle de ce document ne peut réduire une barrière du protocole principal ; le point doit être classé `CLARIFICATION_REQUIRED` avant modification du comportement.

## Reprise événementielle

Chaque arrêt ou barrière qui exige une action ultérieure doit publier dans GitHub un état de reprise structuré contenant au minimum, lorsque applicable :

- `state` : état courant de la machine ;
- `waiting_for` : acteur ou événement attendu ;
- `next_actor` : acteur qui doit reprendre après satisfaction de la barrière ;
- `resume_from` : dernier état stable compatible ou référence du checkpoint ;
- `reason` : raison de l’arrêt ;
- `required_input` : arbitrage, validation, correction ou preuve attendue ;
- `branch` et `head` attendus ;
- référence de la tranche, Issue/PR et checkpoint concernés.

Une transition n’est jamais déduite du simple fait qu’un nouveau commentaire existe. L’orchestration vérifie que l’événement reçu correspond à `waiting_for`, satisfait réellement `required_input` et reste compatible avec le checkpoint, le delta, la branche et le HEAD courants.

### Arbitrage durable avant sollicitation utilisateur

Un état `ARBITRAGE` ne doit jamais dépendre de la mémoire du tour ChatGPT/Work qui a présenté la question. Avant toute sollicitation de l’utilisateur, l’arbitrage est matérialisé durablement dans GitHub puis relu et vérifié.

L’état durable contient au minimum, lorsque applicable et disponible :

- `test_id` ou référence de la tranche active ;
- `arbitration_id` unique ;
- `checkpoint=ARBITRAGE` ;
- question ou décision demandée ;
- choix autorisés et signification de chaque choix ;
- `status=OPEN` ;
- `resume_from` ;
- source/checkpoint causal ;
- Issue/PR associée ;
- référence du contexte Work actif lorsque la plateforme permet de l’identifier sans inventer d’identifiant technique ;
- `business_write` ;
- `implementation_authorized` ;
- mode et écrivain applicables lorsqu’ils sont pertinents.

La conversation sert d’interface utilisateur ; GitHub porte l’état durable nécessaire pour reconstruire l’arbitrage. Une réponse courte telle que `A`, `B` ou `C` ne doit pas exiger que le tour Work suivant conserve en mémoire la question précédente.

La réponse utilisateur est matérialisée comme un événement distinct et liée à `arbitration_id`. L’application d’une décision est dédupliquée au minimum par `arbitration_id + response_event_id`. Après une décision valide, l’arbitrage passe de `OPEN` à `RESOLVED` avant la reprise. Une décision déjà résolue ne peut pas être appliquée une seconde fois.

### Convention de choix A / B / C

Lorsqu’un arbitrage présente deux options prédéfinies, il propose par défaut :

- `A` — première option prédéfinie ;
- `B` — seconde option prédéfinie ;
- `C` — autre.

`A` ou `B` exactement correspond à la signification durable publiée pour ce choix.

`C` représente une alternative utilisateur et n’est jamais converti silencieusement en `A` ou `B`.

Deux formes sont acceptées :

1. `C — <alternative>` : la définition est enregistrée durablement ; si elle est suffisamment déterminée pour produire un résultat observable et compatible avec les barrières du protocole, elle peut être résolue comme `choice=C`, `choice_type=OTHER` ; sinon la clarification strictement nécessaire est demandée.
2. `C` seul : `choice=C`, `choice_type=OTHER`, `definition_status=MISSING` ; l’arbitrage reste `OPEN` et ChatGPT demande à l’utilisateur de décrire l’alternative. La définition ultérieure est enregistrée avant toute résolution.

Une question, un commentaire ou une demande d’explication pendant `ARBITRAGE` est une non-décision. Elle est tracée lorsqu’elle participe à la causalité de la reprise, l’arbitrage reste `OPEN`, ChatGPT répond à la question, puis réaffiche ou rappelle les choix sans reprendre la chaîne.

Une réponse hors des choix définis dont la signification ne peut pas être déterminée est `CLARIFICATION_REQUIRED` ou une non-décision selon son contenu ; elle n’est jamais corrigée ou interprétée silencieusement comme un choix prédéfini.

### Après arbitrage ou validation utilisateur

Lorsqu’un état `ARBITRAGE`, `USER_VALIDATION` ou `CLARIFICATION_REQUIRED` attend une réponse utilisateur :

1. la réponse est enregistrée dans l’Issue/PR de la tranche ;
2. la reprise doit passer par ChatGPT comme orchestrateur avant tout nouvel appel d’écriture à Claude ;
3. ChatGPT récupère uniquement l’état de reprise, la réponse utilisateur, le checkpoint et le delta nécessaires ;
4. ChatGPT vérifie que la réponse lève la barrière et détermine l’état suivant ;
5. si Claude doit reprendre, ChatGPT publie le verdict ou l’autorisation correspondant à l’état suivant ;
6. GitHub/orchestration déclenche alors Claude avec le contexte compact et vérifié prévu par le protocole principal.

Une réponse utilisateur ne constitue jamais à elle seule une autorisation d’écriture pour Claude. Les exigences `PLAN_APPROVED`, contexte autorisé, mode, écrivain et champs critiques `VERIFIED` restent applicables.

### Priorité `ARBITRAGE` / `USER_VALIDATION`

Lorsqu’une situation pourrait relever des deux états, la cause de fond détermine le classement. Si la décision attendue porte sur le produit, le périmètre, une règle fonctionnelle ou UX, le classement est `ARBITRAGE`. Si aucune décision produit n’est nécessaire et que l’intervention humaine porte uniquement sur la qualité ou la procédure de revue, un contrôle perceptif, un test physique ou une stagnation de revue démontrée, le classement est `USER_VALIDATION`. Un défaut technique reste `ORCHESTRATION_FAILURE`.

`CLARIFICATION_REQUIRED` s’applique lorsqu’une information indispensable ne peut pas encore être déterminée à partir des sources disponibles. Si cette clarification établit qu’une décision produit, UX, fonctionnelle ou de périmètre doit effectivement être prise par l’utilisateur, l’état est requalifié en `ARBITRAGE` ; il ne reste pas artificiellement en `CLARIFICATION_REQUIRED`.

### Réveil automatique GitHub → Work démontré

Le test intégré `KODJO-V13-T1T9-20260829-01` a démontré, dans la configuration Work testée, le transport suivant :

`GitHub Actions → pull_request:synchronize → tâche Work configurée pour les commit updates → message spontané dans le même fil Work`.

Le signal est produit sous l’identité normale `github-actions[bot]`, sans PAT utilisateur ni usurpation d’identité. Les commentaires PR publiés par `github-actions[bot]` n’ont pas réveillé Work dans les essais effectués ; ils restent utilisables comme registre durable, mais ne sont pas le signal nominal de réveil Work dans cette configuration.

Le mécanisme nominal sépare obligatoirement :

1. **état durable** : commentaire/checkpoint/résultat GitHub contenant l’information réellement à traiter ;
2. **signal technique** : commit isolé dont la fonction est de provoquer `pull_request:synchronize`, sans décision métier.

Avant émission du signal, l’état durable est publié puis relu et vérifié. Le signal conserve un identifiant logique reconstructible, par exemple `signal_id = test_id:transition_id:source_comment_id`, ainsi que son `signal_commit_sha`. Un même état causal déjà signalé et traité ne provoque ni nouveau réveil inutile ni nouvel appel IA.

Le commit de signal ne touche pas au code métier. Les workflows sans rapport avec l’orchestration doivent être filtrés autant que possible pour ne pas être déclenchés inutilement par ces commits.

Cette démonstration porte sur la configuration effectivement testée ; elle ne vaut pas garantie universelle pour toute tâche Work ou tout type d’événement GitHub. Si la tâche Work active n’est pas configurée pour ce transport ou si le réveil attendu ne peut pas être prouvé, le mécanisme est `NON VÉRIFIABLE` ou `ORCHESTRATION_FAILURE` selon l’impact, et aucun réveil n’est supposé par défaut.

### Mode de repli manuel

Si aucun mécanisme GitHub → Work démontré et configuré n’est disponible pour la conversation active :

- arbitrage/validation donné directement dans la conversation ChatGPT active : ChatGPT l’enregistre dans GitHub puis reprend le protocole sans exiger une seconde instruction utilisateur lorsque l’environnement le permet ;
- arbitrage/validation donné dans GitHub ou hors de la conversation ChatGPT active : l’utilisateur réactive ChatGPT avec le prompt standard `Reprends le protocole KODJO.` ;
- après ce prompt, ChatGPT retrouve l’état actif depuis GitHub, vérifie checkpoint/delta/branche/HEAD et orchestre la suite ; l’utilisateur n’a pas à déterminer quel workflow, agent ou état doit être relancé.

L’absence du mécanisme automatique GitHub → Work n’est pas assimilée à un arbitrage produit. Si une reprise attendue ne peut pas être reconstruite ou exécutée à cause d’une capacité technique manquante, elle relève de `ORCHESTRATION_FAILURE` ; le prompt standard reste le mécanisme manuel de réactivation lorsque cette limitation est connue et explicitement documentée.

Le polling de GitHub par ChatGPT n’est pas retenu comme solution nominale de reprise.

## Prompt standard de reprise

Le prompt utilisateur canonique est :

`Reprends le protocole KODJO.`

Ce prompt est volontairement indépendant du bloc et de la tranche. À sa réception, ChatGPT doit, dans la mesure où GitHub contient les preuves nécessaires :

1. identifier la tranche active et son Issue/PR ;
2. déterminer l’état courant et le dernier état stable ;
3. lire l’état de reprise, `waiting_for`, `next_actor` et `required_input` ;
4. récupérer le dernier checkpoint et le delta depuis ce checkpoint ;
5. intégrer les arbitrages, validations et verdicts nouveaux pertinents ;
6. revalider activement branche, HEAD, mode, écrivain, fraîcheur documentaire/décisionnelle et toutes les conditions d’autorisation applicables ;
7. reprendre lui-même la phase ChatGPT ou déclencher Claude lorsque la machine à états et les barrières l’autorisent ;
8. poursuivre jusqu’à la prochaine barrière nécessitant réellement l’utilisateur ou jusqu’à clôture conforme.

ChatGPT ne demande pas à l’utilisateur de recopier l’historique, de nommer la tranche, de choisir le workflow ou de reconstruire manuellement l’état si ces informations sont vérifiables dans GitHub. Une information indispensable absente ou contradictoire est recherchée de façon ciblée dans les sources de vérité ; si elle ne peut pas être reconstruite avec preuve suffisante, la reprise est `ORCHESTRATION_FAILURE` ou `CLARIFICATION_REQUIRED` selon qu’il s’agit respectivement d’un défaut de continuité technique ou d’une ambiguïté produit réelle.

## Résilience à la limite ou à la perte d’une conversation ChatGPT

La continuité du projet ne doit jamais dépendre de la disponibilité indéfinie d’une conversation ChatGPT. Une conversation peut atteindre sa limite, devenir inaccessible, être remplacée ou perdre le contexte opérationnel sans que cela rompe la machine à états.

ChatGPT est un orchestrateur remplaçable ; GitHub et les autres sources de vérité définies dans le protocole principal portent l’état durable et les preuves nécessaires à la reprise.

Le checkpoint destiné à permettre une reprise par une nouvelle conversation ChatGPT doit contenir ou référencer de manière vérifiable, lorsque applicable :

- bloc et tranche actifs ;
- Issue/PR active ;
- état courant de la machine et dernier état stable ;
- `waiting_for`, `next_actor`, `resume_from`, `reason` et `required_input` ;
- branche, HEAD/checkpoint et relation du delta ;
- plan approuvé ou référence vérifiable vers celui-ci ;
- décisions actives pertinentes et arbitrages reçus depuis le checkpoint ;
- points ouverts et barrières encore actives ;
- mode et écrivain, qui doivent être revalidés activement avant toute réutilisation ;
- session Claude réutilisable uniquement si sa reprise a été validée ;
- références des preuves et sources nécessaires, sans recopier l’historique brut.

Lorsqu’une conversation ChatGPT approche d’une limite connue ou qu’un changement de conversation est prévu, ChatGPT doit s’assurer qu’un checkpoint de reprise suffisamment frais est persisté avant de dépendre d’un nouveau contexte conversationnel, dans la mesure où l’environnement permet cette anticipation. Une limite atteinte sans anticipation ne doit toutefois pas rendre le projet irrécupérable : une nouvelle conversation utilise le prompt standard et reconstruit l’état depuis GitHub/checkpoint/delta.

Une nouvelle conversation ChatGPT ne traite jamais la mémoire ou un résumé conversationnel comme source de vérité. Elle revalide les éléments critiques à partir de GitHub et des sources définies par le protocole principal, puis utilise le delta plutôt que de relire tout l’historique.

Si GitHub ne contient pas suffisamment d’informations pour déterminer de façon vérifiable la tranche, l’état, le checkpoint ou l’acteur suivant, ChatGPT ne demande pas par défaut à l’utilisateur de reconstruire l’historique de mémoire. Il tente d’abord une récupération ciblée depuis les sources disponibles. L’impossibilité technique de reconstruire l’état durable est `ORCHESTRATION_FAILURE` et doit être corrigée dans le mécanisme de persistance avant de prétendre à une reprise automatique fiable.

## Pistes d’évolution du transport et de la continuité

Les pistes non démontrées ou non retenues dans le chemin nominal sont consignées dans `.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md` lorsqu’elles doivent être conservées pour étude. Elles ne constituent pas des capacités acquises ni des règles d’exécution tant qu’elles n’ont pas été décidées et démontrées.

Le polling GitHub n’est pas retenu comme mécanisme nominal.

## Durcissement des reprises et de l’autorisation d’écriture

Les règles suivantes complètent explicitement le protocole principal et s’appliquent à toute reprise, y compris lorsqu’une session Claude existante est techniquement réutilisable.

### Fraîcheur documentaire comme condition critique

Avant toute entrée ou réentrée en `IMPLEMENTING`, la fraîcheur des sources documentaires et décisionnelles pertinentes référencées par le checkpoint fait partie des champs critiques d’autorisation. Elle doit être `VERIFIED` au même titre que le dépôt, la branche, le HEAD/baseline autorisé, la relation du delta/checkpoint, le mode et l’écrivain. Une fraîcheur pertinente `FAILED` ou `NON VÉRIFIABLE` interdit l’écriture jusqu’à revalidation ou classement `ORCHESTRATION_FAILURE`.

Cette exigence précise la relation du delta/checkpoint du protocole principal : une relation Git correcte ne suffit pas si une décision ou une source documentaire pertinente a été supersédée ou ne peut plus être attestée fraîche.

Pour une source non versionnée dans Git, la fraîcheur n’est `VERIFIED` que si l’orchestration dispose d’un identifiant de fraîcheur vérifiable adapté à cette source, par exemple un identifiant de version/révision ou un horodatage exposé par l’API ou le connecteur faisant autorité. Le protocole ne présume pas qu’un mécanisme particulier existe pour Figma ou un registre externe. En l’absence d’un tel identifiant vérifiable, la fraîcheur reste `NON VÉRIFIABLE` et l’écriture demeure bloquée ; la définition et la validation du mécanisme concret relèvent de l’orchestrateur/intégration concerné et doivent être établies avant d’en dépendre dans un run d’écriture.

### Aucune dispense liée à la continuité de session

La reprise d’une session Claude est uniquement une optimisation de contexte. Elle ne dispense jamais du `SOURCE_ATTESTATION`, du preflight ni de la vérification de tous les champs critiques avant `IMPLEMENTING`. Une session reprise ne conserve aucune autorisation d’écriture implicite provenant d’un état antérieur ; l’autorisation applicable est celle revalidée pour le contexte courant.

La continuité d’une même session Claude n’est considérée `DÉMONTRÉE` que si l’orchestration peut prouver l’identité de session entre la session demandée en reprise et la session retournée. La cohérence du contenu ne suffit pas. À défaut, la reprise est qualifiée `NEW_SESSION_CHECKPOINT_DELTA` ou `NON VÉRIFIABLE` selon les preuves disponibles.

### Reprise après `ORCHESTRATION_FAILURE`

Après résolution d’un `ORCHESTRATION_FAILURE`, aucune autorisation d’écriture antérieure n’est supposée encore valide, y compris si une session Claude peut être techniquement reprise ou si un `PLAN_APPROVED` existait avant l’échec. Avant toute réentrée en `IMPLEMENTING`, ChatGPT/l’orchestration revalide le dernier état stable compatible, le checkpoint et son delta, la branche, le HEAD, le mode, l’écrivain et tous les champs critiques. Une écriture ou un commit partiel éventuellement produit avant l’échec fait partie du delta à examiner et ne vaut jamais preuve que l’autorisation précédente reste applicable.

Si une sortie IA valide existe déjà et reste compatible avec le contexte courant, un défaut ultérieur de publication, transport ou réveil ne justifie pas de rappeler cette IA. La reprise réutilise la sortie valide et retente uniquement l’étape défaillante, conformément au protocole principal.

### Reprise après `WORKTREE_LOCKED`

`WORKTREE_LOCKED` suit les mêmes exigences de reprise que les autres barrières stables. Avant `WORKTREE_RESUME_APPROVED`, l’état de reprise doit identifier, lorsque applicable, `waiting_for`, `next_actor`, `resume_from`, `reason` et `required_input`. Après résolution de la cause du verrou, ChatGPT revalide le contexte autorisé, le checkpoint, le delta, la branche, le HEAD et les champs critiques ; aucune autorisation d’écriture antérieure n’est supposée encore valide.

`WORKTREE_RESUME_APPROVED` ne peut être publié qu’après cette revalidation. Il autorise uniquement la reprise depuis le dernier état stable compatible et ne vaut jamais nouveau `PLAN_APPROVED` si celui-ci a été invalidé par un changement de contexte ou de périmètre.

## Checkpoints : remplacement, non accumulation

Chaque nouveau checkpoint d’un bloc remplace le checkpoint opérationnel précédent de ce bloc. Il n’est jamais construit par accumulation de l’historique des checkpoints. Les anciens checkpoints peuvent rester accessibles comme preuves GitHub d’audit, mais ils ne sont pas concaténés au contexte de travail courant. Le checkpoint actif reste compact et ne contient que l’état nécessaire à la reprise.

`CLARIFICATION_REQUIRED` est une barrière stable génératrice de checkpoint au même titre que `ARBITRAGE`, `USER_VALIDATION`, `WORKTREE_LOCKED` et `ORCHESTRATION_FAILURE` lorsque les informations nécessaires sont disponibles.

## Contre-vérification de `SOURCE_ATTESTATION`

Avant de publier `PLAN_APPROVED`, ChatGPT effectue un contrôle indépendant ponctuel de cohérence entre `SOURCE_ATTESTATION` et l’état GitHub/sources de vérité réellement accessibles, au minimum sur les champs critiques pertinents. Ce contrôle est un sondage ciblé et ne doit pas devenir une seconde reconstruction exhaustive du contexte. Toute divergence significative invalide l’attestation concernée et déclenche revalidation ou `ORCHESTRATION_FAILURE` avant toute entrée en `IMPLEMENTING`.

## Parité V1.2

V1.3 affirme conserver les barrières V1.2 explicitement listées dans le protocole principal. Cette affirmation ne constitue pas une preuve d’une comparaison ligne à ligne exhaustive avec le texte V1.2. Tant qu’un audit différentiel dédié n’a pas été exécuté avec V1.2 comme source, la parité textuelle exhaustive V1.2 reste `NON VÉRIFIABLE` ; cela n’autorise ni suppression ni affaiblissement d’une barrière connue.

## VNext piloté par ChatGPT — relais du plan PRE-4

Pour PRE-4 uniquement, le pilote ChatGPT utilise l'extension `.github/orchestration/KODJO_VNEXT_CHATGPT_PRE4_REVIEW_RELAY.md` : une demande immuable publiée dans GitHub déclenche le reviewer Claude existant sur le runner ; ChatGPT récupère et vérifie le reçu depuis les artefacts GitHub. Aucun transfert de commande, identifiant ou rapport n'est demandé à l'utilisateur. Un incident de publication se reprend depuis la réponse sauvegardée ; une tentative ambiguë ne permet pas de rappeler Claude implicitement.

La fusion de cette extension est autorisée par l’utilisateur le 9 octobre après validation des correctifs parallèles. Son exécution reste préparatoire jusqu'à clôture de PRE-3 (#340) et instruction explicite de démarrage PRE-4. Elle ne change pas les portes humaines, les contrôles VNext ni la variante pilotée par Claude (#344). Elle n'ajoute pas de réveil automatique Work et ne transforme pas les preuves historiques V1.3 en qualification PRE-4.

### Relais commun des revues VNext — pilote ChatGPT

Pour PRE-4, appliquer `.github/orchestration/KODJO_VNEXT_CHATGPT_AGENT_RELAY.md` : un seul transport pour revue de plan, complément de portée et revue d’implémentation, réponses refusées comprises. Le pilote récupère les preuves GitHub lui-même ; aucun transfert technique par l’utilisateur. Les validations métier, portes humaines et workflows d’écriture existants restent obligatoires. Une opération non inscrite dans l’inventaire est un incident d’orchestration ; elle ne justifie pas un copier-coller utilisateur. Aucun réveil automatique de conversation ni activation PRE-3 n’est ajouté.

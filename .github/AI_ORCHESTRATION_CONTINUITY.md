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

### Reprise automatique cible et mode transitoire

La cible est une reprise événementielle automatique : lorsqu’un événement GitHub satisfait une barrière et désigne ChatGPT comme `next_actor`, l’orchestration doit pouvoir réactiver ChatGPT puis poursuivre la machine à états jusqu’à la prochaine barrière humaine réelle.

Cette capacité ne doit jamais être supposée. Tant que le réveil automatique GitHub → conversation ChatGPT n’est pas démontré de bout en bout, il est déclaré indisponible et le mode transitoire suivant s’applique :

- arbitrage/validation donné directement dans la conversation ChatGPT active : ChatGPT l’enregistre dans GitHub puis reprend le protocole sans exiger une seconde instruction utilisateur ;
- arbitrage/validation donné dans GitHub ou hors de la conversation ChatGPT active : l’utilisateur réactive ChatGPT avec le prompt standard `Reprends le protocole KODJO.` ;
- après ce prompt, ChatGPT retrouve l’état actif depuis GitHub, vérifie checkpoint/delta/branche/HEAD et orchestre la suite ; l’utilisateur n’a pas à déterminer quel workflow, agent ou état doit être relancé.

L’absence du mécanisme automatique GitHub → ChatGPT n’est pas assimilée à un arbitrage produit. Si une reprise attendue ne peut pas être reconstruite ou exécutée à cause d’une capacité technique manquante, elle relève de `ORCHESTRATION_FAILURE` ; le prompt standard reste le mécanisme manuel de réactivation tant que cette limitation est connue et explicitement documentée.

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

## Pistes de solution pour le réveil automatique GitHub → ChatGPT

Les pistes retenues pour étude ultérieure sont :

- webhook/API GitHub vers un orchestrateur OpenAI capable de reprendre la machine à états ;
- service intermédiaire d’orchestration KODJO recevant les événements GitHub et appelant l’acteur IA approprié.

Ces pistes sont des options d’architecture à valider et non des capacités actuellement acquises. Le polling n’est pas retenu.

## Durcissement des reprises et de l’autorisation d’écriture

Les règles suivantes complètent explicitement le protocole principal et s’appliquent à toute reprise, y compris lorsqu’une session Claude existante est techniquement réutilisable.

### Fraîcheur documentaire comme condition critique

Avant toute entrée ou réentrée en `IMPLEMENTING`, la fraîcheur des sources documentaires et décisionnelles pertinentes référencées par le checkpoint fait partie des champs critiques d’autorisation. Elle doit être `VERIFIED` au même titre que le dépôt, la branche, le HEAD/baseline autorisé, la relation du delta/checkpoint, le mode et l’écrivain. Une fraîcheur pertinente `FAILED` ou `NON_VÉRIFIABLE` interdit l’écriture jusqu’à revalidation ou classement `ORCHESTRATION_FAILURE`.

Cette exigence précise la relation du delta/checkpoint du protocole principal : une relation Git correcte ne suffit pas si une décision ou une source documentaire pertinente a été supersédée ou ne peut plus être attestée fraîche.

### Aucune dispense liée à la continuité de session

La reprise d’une session Claude est uniquement une optimisation de contexte. Elle ne dispense jamais du `SOURCE_ATTESTATION`, du préflight ni de la vérification de tous les champs critiques avant `IMPLEMENTING`. Une session reprise ne conserve aucune autorisation d’écriture implicite provenant d’un état antérieur ; l’autorisation applicable est celle revalidée pour le contexte courant.

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
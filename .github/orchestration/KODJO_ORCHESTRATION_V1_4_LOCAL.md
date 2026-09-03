# KODJO — Orchestration V1.4 — LOCAL

Statut : **protocole candidat consolidé — option 3 : Claude Code local avec réveil manuel minimal**.

Ce document consolide le chemin nominal local à partir des barrières V1.3, des preuves techniques obtenues le 2 septembre 2026 et de la décision d’exploitation du 3 septembre 2026. Il ne modifie aucune règle métier de KODJO.

## 1. Décision d’architecture

Le chemin nominal est :

`ChatGPT / Work → GitHub → utilisateur (réveil minimal) → Claude Code local → GitHub → ChatGPT / Work`

Claude Code local est l’unique écrivain de code dans le chemin nominal.

Le réveil de Claude Code local est **manuel et minimal**. L’utilisateur ne recopie ni mission, ni plan, ni contexte : GitHub porte le checkpoint durable nécessaire à la reprise.

Instruction canonique de reprise :

`Reprends le protocole KODJO depuis le dernier checkpoint GitHub.`

Sont exclus du chemin nominal :

- Claude Cloud comme exécuteur ;
- fallback Cloud ↔ Local ;
- déclenchement automatique de Claude Code par GitHub Actions/self-hosted runner ;
- SessionStore externe ;
- AWS / S3 / Redis / PostgreSQL pour la continuité Claude ;
- Managed Agents ;
- reconstruction manuelle de la mission par l’utilisateur.

Le runner Windows self-hosted déjà installé et les micro-tests associés restent des preuves techniques historiques et peuvent rester présents. Ils ne constituent plus le moteur nominal du développement et ne doivent pas déclencher automatiquement Claude sans nouvelle décision explicite.

## 2. Preuve technique acquise

Micro-test : `KODJO-CLAUDE-LOCAL-SESSION-RESUME-03`.

BASE : GitHub Actions run `33607498284`.

RESUME : GitHub Actions run `33607899039`.

Session Claude : `e5a9723c-007a-4524-accc-17a1f7c24246`.

Résultats vérifiés :

- deux workflow runs distincts ;
- même runner local, même machine, même identité Windows, même configuration Claude et même nom de projet ;
- BASE terminé avant RESUME ;
- transcript natif local présent avant RESUME ;
- RESUME exécuté explicitement avec `--resume` et l’identifiant de session BASE ;
- identifiant de session retourné identique ;
- restitution correcte d’un marqueur aléatoire mémorisé en BASE ;
- aucune réinjection du marqueur dans le prompt RESUME ;
- aucun fork ;
- aucun fallback ;
- verdict final : `DEMONSTRATED` ;
- compteur définitif : 2/2 appels Claude.

Cette preuve établit une capacité locale. L’option 3 n’exige pas que GitHub Actions l’utilise comme mécanisme de réveil automatique.

## 3. Configuration locale de référence

Claude Code local reste l’exécuteur de développement. La configuration démontrée comprend Claude Code `2.1.257` sous le compte Windows `hadjo` et une authentification `claude.ai` / `firstParty` / abonnement `pro`.

Le runner `KODJO-LOCAL-RUNNER` (GitHub Actions runner `2.336.0`, labels `self-hosted`, `Windows`, `X64`, `kodjo-claude-local`) est conservé comme infrastructure technique déjà validée, mais il est **hors chemin nominal de réveil Claude** sous l’option 3.

Aucune nouvelle licence, API Anthropic ou automatisation du runner n’est requise par l’option 3.

## 4. Authentification locale

Claude Code doit être authentifié dans l’environnement local utilisé par l’utilisateur. Une perte d’authentification relève de `ORCHESTRATION_FAILURE`, jamais d’un arbitrage produit.

Les contrôles détaillés d’expiration OAuth démontrés avec le runner restent une référence diagnostique ; ils ne créent pas une obligation d’exécuter Claude via GitHub Actions.

## 5. Continuité de reprise nominale

GitHub est le mécanisme durable de reprise entre acteurs.

Lorsque Claude doit reprendre, l’utilisateur saisit uniquement :

`Reprends le protocole KODJO depuis le dernier checkpoint GitHub.`

Claude doit alors, avant toute écriture :

1. lire le dernier checkpoint durable applicable ;
2. vérifier branche, HEAD, mode, écrivain, périmètre et autorisation ;
3. lire uniquement les sources fraîches et deltas nécessaires ;
4. reprendre au dernier état stable autorisé ;
5. refuser l’écriture si le checkpoint ne permet pas de déterminer la reprise sans ambiguïté.

La session native Claude locale peut être réutilisée lorsqu’elle est disponible, mais elle n’est pas la source de vérité et sa reprise automatique n’est pas une exigence de l’option 3.

## 6. État durable et reprise

GitHub reste le plan de contrôle durable.

Une transition importante doit pouvoir être reconstruite sans dépendre de la mémoire de ChatGPT, de Work ou de Claude. L’état durable conserve au minimum, selon la phase :

- tranche / Issue / PR ;
- état courant ;
- branche et HEAD ;
- mode et écrivain ;
- autorisation d’écriture ;
- dernier état stable ;
- décision ou arbitrage actif ;
- résultat de test/revue ;
- acteur attendu pour la suite ;
- lorsque pertinent, identifiant de session Claude locale disponible.

Avant toute demande de réveil manuel de Claude, le checkpoint doit déjà contenir les informations nécessaires à la reprise. L’utilisateur n’est jamais utilisé comme transport manuel du contexte.

## 7. Machine à états locale simplifiée

Le cycle nominal peut être représenté par :

`READY → MANUAL_CLAUDE_WAKE → LOCAL_CLAUDE_RUNNING → VERIFY → PASS → COMMIT/PUSH → CHATGPT_WORK_CONTROL → DONE`

Boucles et barrières :

- `LOCAL_CLAUDE_RUNNING → ARBITRAGE → CHATGPT/USER → checkpoint → MANUAL_CLAUDE_WAKE` ;
- `LOCAL_CLAUDE_RUNNING → ORCHESTRATION_FAILURE → AUTO_RECOVERY` lorsque la reprise est sûre, sinon checkpoint → `MANUAL_CLAUDE_WAKE` ;
- `VERIFY → FAIL → checkpoint → MANUAL_CLAUDE_WAKE → VERIFY` ;
- toute divergence substantielle de périmètre ou invalidation de l’autorisation revient à la barrière appropriée avant écriture.

`MANUAL_CLAUDE_WAKE` est un transport humain minimal, pas un état métier ni une décision. `ARBITRAGE` et `ORCHESTRATION_FAILURE` conservent leur sens normatif V1.3.

## 8. Rôles

### ChatGPT / Work

- prépare et contrôle le périmètre ;
- vérifie les sources de vérité et décisions applicables ;
- contrôle indépendamment le plan ;
- publie/contrôle le checkpoint de reprise ;
- arbitre après une barrière ;
- réalise la contre-vérification indépendante ;
- autorise la clôture selon les preuves.

### GitHub / GitHub Actions

- porte l’état durable et la traçabilité ;
- vérifie les préconditions déterministes automatisables ;
- transporte les signaux vers Work lorsqu’un transport a été démontré/configuré ;
- conserve checkpoints, résultats et décisions sans publier de secrets ;
- ne déclenche pas Claude Code local dans le chemin nominal option 3.

### Claude Code local

- démarre/reprend après l’instruction canonique de l’utilisateur ;
- reconstruit sa mission depuis GitHub ;
- analyse les sources et le delta ciblés ;
- écrit uniquement lorsqu’il est autorisé ;
- implémente, teste, corrige et self-check ;
- publie le résultat/checkpoint requis ;
- ne décide pas à la place de l’utilisateur d’un arbitrage produit/UX/périmètre.

### Utilisateur

Interventions nominales :

1. réveil minimal de Claude Code local avec l’instruction canonique ;
2. décision métier/fonctionnelle réellement non déterminable par les sources ;
3. décision produit, périmètre ou UX réellement non arbitrée ;
4. barrière de sécurité pour une action difficilement réversible ou à impact externe significatif ;
5. validations physiques nécessaires, notamment sur iPhone.

L’utilisateur ne recopie jamais le plan, la mission, les erreurs techniques ou le contexte GitHub.

## 9. Barrières V1.3 conservées

V1.4 LOCAL conserve notamment :

- sources de vérité distinctes du contexte IA ;
- aucune règle inventée ;
- modification minimale ;
- `PLAN_APPROVED` avant écriture d’une nouvelle tranche ;
- contexte Git/branche/HEAD contrôlé ;
- écrivain unique ;
- fraîcheur documentaire/décisionnelle ;
- arbitrage durable A/B/C + `OTHER` ;
- une question pendant un arbitrage n’est pas une décision ;
- `ORCHESTRATION_FAILURE` séparé des décisions produit ;
- récupération de publication sans rappel IA lorsqu’un résultat valide existe ;
- revue indépendante ChatGPT ;
- preuve avant verdict de conformité ;
- métriques observables sans assimiler un coût non vérifiable à zéro ;
- réveil Work uniquement par un transport réellement démontré/configuré.

## 10. Ce qui change par rapport à V1.3 et au premier candidat V1.4

1. Claude Cloud n’est plus un exécuteur nominal.
2. Claude Code local reste l’unique écrivain de développement.
3. Le réveil de Claude local est volontairement manuel et minimal.
4. Le self-hosted runner n’est pas utilisé comme moteur nominal de réveil Claude.
5. GitHub reste la mémoire durable permettant une reprise sans recopier la mission.
6. La continuité native locale démontrée reste une capacité disponible, pas une dépendance obligatoire du protocole.
7. Aucun fallback Cloud n’est autorisé.
8. Les coordinations, checkpoints et revues restent automatisés autant que possible hors réveil Claude local.

## 11. Transport GitHub → Work

La preuve V1.3 suivante reste acquise dans la configuration testée :

`GitHub Actions → pull_request:synchronize → tâche Work configurée pour les commit updates → message spontané dans le même fil Work`.

Ce transport peut automatiser la sollicitation de ChatGPT/Work. Il ne doit pas être confondu avec le réveil de Claude local, qui reste manuel sous l’option 3.

## 12. Métriques

Pour chaque phase Claude observable, conserver lorsque disponible : durée, tours, coût Claude déclaré, session éventuelle, mode de reprise, résultat/verdict et appels consommés.

Les coûts Claude et OpenAI/Work sont distingués. Une métrique non accessible est `NON_VÉRIFIABLE`, jamais zéro par défaut.

## 13. Conditions avant une écriture métier

Avant toute écriture métier avec V1.4 LOCAL option 3 :

1. vérifier les barrières V1.3 conservées ;
2. vérifier l’état Git réel et le dernier checkpoint ;
3. vérifier la fraîcheur des sources documentaires/Figma/décisions ;
4. établir explicitement mode, écrivain, périmètre et `authorized_head` ;
5. publier un checkpoint de reprise complet ;
6. seulement ensuite demander à l’utilisateur le réveil minimal de Claude local.

L’instruction manuelle de réveil ne vaut jamais autorisation d’écriture à elle seule.

## 14. Livraison des rapports

Cette section est normative et permanente. Elle s’applique à toute mission d’orchestration confiée à Claude sous V1.4 LOCAL.

### 14.1 Double livraison obligatoire

À la fin de chaque audit, revue, correction ou tranche de développement, Claude doit :

1. afficher le rapport final complet dans la conversation ;
2. enregistrer exactement le même contenu, sans résumé ni information retranchée, dans un fichier Markdown encodé en UTF-8.

Le contenu affiché à l’écran et le contenu du fichier Markdown doivent être identiques.

### 14.2 Répertoire et nommage canoniques

- Répertoire canonique unique : `.github/orchestration/reports/`
- Convention de nommage : `<PERIMETRE>_<TYPE>_YYYYMMDD.md`

Si le répertoire n’existe pas, il est créé uniquement au moment de l’enregistrement du rapport concerné. Aucun autre fichier de compte rendu ne doit être créé.

### 14.3 Contenu minimal du rapport

Le rapport doit au minimum indiquer : identifiant/objectif, branche, HEAD, documents consultés, fichiers examinés/modifiés, commandes/tests et résultats, constats/écarts/risques/limites, verdict et prochaines actions.

### 14.4 Mission en lecture seule

Lorsqu’une mission est explicitement déclarée « en lecture seule », la création du seul fichier de rapport dans `.github/orchestration/reports/` constitue une exception d’écriture autorisée. Cette exception n’autorise aucune modification du code, de la configuration, des tests ou de la documentation produit.

### 14.5 Commit et poussée

Aucun rapport ne doit être commité ou poussé sans autorisation explicite.

### 14.6 Clôture de mission

En fin de mission, Claude doit afficher le chemin du rapport, le résultat de `git status --short` et le commit HEAD courant. Si la création du fichier échoue, Claude doit le signaler explicitement et conserver le rapport complet à l’écran.

### 14.7 Valeur du rapport

Un rapport ne constitue pas à lui seul une validation : son verdict reste soumis à la revue indépendante et aux barrières prévues par le protocole.

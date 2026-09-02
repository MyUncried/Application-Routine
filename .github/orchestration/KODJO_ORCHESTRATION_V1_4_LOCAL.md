# KODJO — Orchestration V1.4 — LOCAL

Statut : **protocole candidat consolidé après preuve de continuité Claude Local**.

Ce document consolide le chemin nominal local à partir des barrières V1.3 qui restent applicables et des preuves techniques obtenues le 2 septembre 2026. Il ne modifie aucune règle métier de KODJO et n’autorise aucune reprise de T01-S09 à lui seul.

## 1. Décision d’architecture

Le chemin nominal est exclusivement :

`ChatGPT / Work → GitHub → GitHub Actions → runner Windows self-hosted → Claude Code local → GitHub → ChatGPT / Work`

Claude Code local est l’unique écrivain de code dans le chemin nominal.

Sont exclus du chemin nominal :

- Claude Cloud comme exécuteur ;
- fallback Cloud ↔ Local ;
- SessionStore externe ;
- AWS / S3 / Redis / PostgreSQL pour la continuité Claude ;
- Managed Agents ;
- reconstruction du contexte Claude comme substitut nominal à une session locale réutilisable.

Si le PC ou le runner local est indisponible, l’orchestration attend ou échoue techniquement. Elle ne bascule jamais silencieusement vers Claude Cloud.

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
- seul le SHA-256 du marqueur a été persisté dans GitHub ;
- aucune réinjection du marqueur dans le prompt RESUME ;
- aucun `--fork-session` ;
- aucun fallback ;
- verdict final : `DEMONSTRATED` ;
- compteur définitif : 2/2 appels Claude.

Cette preuve démontre la continuité Claude Code locale dans la configuration testée. Elle ne transforme pas une session Claude en source de vérité : GitHub, la documentation, Figma et le registre des décisions conservent leurs rôles V1.3.

## 3. Configuration locale de référence démontrée

Runner :

- machine : `RMAN` ;
- runner : `KODJO-LOCAL-RUNNER` ;
- GitHub Actions runner : `2.336.0` ;
- labels : `self-hosted`, `Windows`, `X64`, `kodjo-claude-local` ;
- installation : `C:\actions-runner` ;
- service Windows : `actions.runner.MyUncried-Application-Routine.KODJO-LOCAL-RUNNER` ;
- compte du service : `.\hadjo` ;
- profil : `C:\Users\hadjo`.

Claude Code :

- version démontrée : `2.1.257` ;
- exécutable : `C:\Users\hadjo\AppData\Roaming\npm\claude.cmd` ;
- authentification : `claude.ai`, `firstParty`, abonnement `pro` ;
- `CLAUDE_CONFIG_DIR=C:\kodjo-local-test\claude-config` pour les micro-tests ;
- shell GitHub Actions validé : Windows PowerShell 5.1 (`powershell`) ;
- invocation Windows : `claude.cmd`.

Variables de dépôt utilisées pour la configuration locale :

- `KODJO_LOCAL_RUNNER_NAME=KODJO-LOCAL-RUNNER` ;
- `KODJO_LOCAL_TEST_ROOT=C:\kodjo-local-test` ;
- `KODJO_LOCAL_CLAUDE_CONFIG_DIR=C:\kodjo-local-test\claude-config`.

La variable d’armement des micro-tests n’est pas une exigence fonctionnelle du protocole nominal ; elle appartient aux barrières de lancement des tests techniques.

## 4. Authentification locale

Le préflight doit contrôler l’authentification avant tout appel modèle lorsqu’il peut le faire sans appel modèle.

L’expérience du micro-test a établi qu’un `claude.cmd auth status` positif ne suffit pas à prouver qu’un appel modèle réussira : un access token expiré a coexisté avec `loggedIn=true`. Le chemin local doit donc refuser l’appel lorsque l’expiration du credential local est détectable et dépassée.

Une réauthentification explicite de la configuration isolée a ensuite produit un access token valide dans le contexte du service runner, puis un appel Claude réel depuis ce runner a réussi.

L’authentification est une précondition technique. Son échec relève de `ORCHESTRATION_FAILURE`, jamais d’un arbitrage produit.

## 5. Continuité de session nominale

Pour un bloc de travail compatible avec la continuité locale, l’orchestration conserve l’identifiant de session Claude retourné par le premier appel valide et le réutilise lors des appels suivants avec :

`claude.cmd -p --resume <session_id> ...`

La continuité exige au minimum :

- même machine locale ;
- même identité Windows du runner ;
- même `CLAUDE_CONFIG_DIR` ;
- même contexte de projet attendu ;
- transcript natif correspondant présent ;
- identifiant de session demandé explicitement ;
- absence de `--fork-session` ;
- absence de fallback Cloud.

`CLAUDE_CODE_PROJECT_DIR_NAME` peut être fixé par l’orchestration lorsqu’un nom stable est nécessaire pour garantir la localisation déterministe des transcripts entre runs.

Une session reprise accélère la continuité cognitive de Claude mais ne dispense jamais de vérifier les préconditions Git, la fraîcheur des sources, le mode, l’écrivain, le périmètre et les autorisations applicables.

## 6. État durable et reprise

GitHub reste le plan de contrôle durable.

Une transition importante doit pouvoir être reconstruite sans dépendre de la mémoire de ChatGPT, de Work ou de Claude. L’état durable conserve au minimum, selon la phase :

- tranche / Issue / PR ;
- état courant ;
- branche et HEAD ;
- mode et écrivain ;
- autorisation d’écriture ;
- session Claude locale réutilisable lorsqu’elle a été établie ;
- dernier état stable ;
- décision ou arbitrage actif ;
- résultat de test/revue ;
- acteur ou événement attendu pour la suite.

Les preuves de transport, claims et résultats sont publiés avant d’être utilisés comme base d’une transition suivante lorsque cette publication fait partie de la sécurité de la transition.

Un défaut de publication après un résultat IA valide ne justifie pas automatiquement un nouvel appel IA. L’orchestration récupère et republie le résultat existant lorsqu’une récupération forensique fiable est possible.

## 7. Machine à états locale simplifiée

Le cycle d’exécution local peut être représenté par :

`READY → LOCAL_CLAUDE_RUNNING → VERIFY → PASS → COMMIT/PUSH → CHATGPT_WORK_CONTROL → DONE`

Boucles et barrières :

- `LOCAL_CLAUDE_RUNNING → ARBITRATION_REQUIRED → CHATGPT/USER → LOCAL_CLAUDE_RESUME` ;
- `LOCAL_CLAUDE_RUNNING → TECHNICAL_FAILURE → AUTO_RECOVERY → LOCAL_CLAUDE_RESUME` lorsque la reprise est sûre ;
- `VERIFY → FAIL → LOCAL_CLAUDE_RESUME → VERIFY` ;
- toute divergence substantielle de périmètre ou invalidation de l’autorisation revient à la barrière appropriée avant écriture.

Cette vue simplifiée ne supprime pas les barrières V1.3 de plan, autorisation, contexte Git, source de vérité, revue indépendante ou sécurité. Elle réduit les appels et transitions artificiellement séparés lorsqu’une même session Claude locale peut poursuivre le travail.

## 8. Rôles

### ChatGPT / Work

- prépare et contrôle le périmètre ;
- vérifie les sources de vérité et les décisions applicables ;
- contrôle indépendamment le plan avant implémentation ;
- arbitre la reprise après une barrière ;
- réalise la contre-vérification indépendante du développement et des tests ;
- autorise la clôture selon les preuves.

### GitHub / GitHub Actions

- porte l’état durable et la traçabilité ;
- vérifie les préconditions déterministes ;
- déclenche le runner local ;
- conserve les identifiants de session, checkpoints, résultats et décisions nécessaires sans publier de secrets ;
- transporte les signaux de reprise ;
- distingue défaut d’orchestration, défaut IA et défaut métier.

### Claude Code local

- analyse les sources et le delta ciblés ;
- propose/révise le plan ;
- écrit uniquement lorsqu’il est autorisé ;
- implémente, teste, corrige et self-check dans la même session lorsque la continuité est compatible ;
- ne décide pas à la place de l’utilisateur d’un arbitrage produit/UX/périmètre.

### Utilisateur

Intervention nominalement réservée à :

1. décision métier/fonctionnelle réellement non déterminable par les sources ;
2. décision produit, périmètre ou UX réellement non arbitrée ;
3. barrière de sécurité pour une action difficilement réversible ou à impact externe significatif.

Les erreurs techniques, problèmes de transport, échecs de compilation/test, choix d’implémentation réversibles et reprises techniques ne sont pas transformés artificiellement en demandes utilisateur.

## 9. Barrières V1.3 conservées

V1.4 LOCAL conserve notamment :

- sources de vérité distinctes du contexte IA ;
- aucune règle inventée ;
- modification minimale ;
- `PLAN_APPROVED` avant écriture d’une nouvelle tranche ;
- contexte Git/branche/HEAD contrôlé ;
- écrivain unique ;
- fraîcheur documentaire/décisionnelle comme précondition critique lorsqu’elle est pertinente ;
- arbitrage durable A/B/C + `OTHER` ;
- une question pendant un arbitrage n’est pas une décision ;
- reprise après arbitrage via ChatGPT avant nouvelle écriture ;
- `ORCHESTRATION_FAILURE` séparé des décisions produit ;
- récupération de publication sans rappel IA lorsqu’un résultat valide existe ;
- revue indépendante ChatGPT ;
- preuve avant verdict de conformité ;
- mesure des performances et coûts observables sans assimiler un coût non vérifiable à zéro ;
- réveil Work uniquement par un transport réellement démontré/configuré.

## 10. Ce qui change par rapport au chemin nominal V1.3

1. Claude Cloud n’est plus un exécuteur nominal.
2. La continuité Claude locale est une capacité **démontrée**, et non une hypothèse.
3. La session native locale devient le mécanisme nominal de continuité Claude lorsque ses préconditions sont satisfaites.
4. Checkpoint + delta restent des mécanismes de traçabilité/reconstruction et de reprise de l’orchestrateur, mais ne servent plus de substitut nominal à la mémoire Claude tant que la session locale valide est disponible.
5. Les multiples appels Claude artificiellement séparés (`INITIAL`, `CORRECTION`, `RETEST`, `MID_RESUME`, `FINAL`) peuvent être regroupés dans une même session locale persistante lorsque les barrières et autorisations restent valides.
6. Aucun fallback Cloud n’est autorisé.

## 11. Transport GitHub → Work

La preuve V1.3 du transport suivant reste acquise dans la configuration testée :

`GitHub Actions → pull_request:synchronize → tâche Work configurée pour les commit updates → message spontané dans le même fil Work`.

Le signal technique doit rester séparé de l’état durable et ne touche pas au code métier. Les commentaires GitHub seuls ne sont pas supposés réveiller Work lorsqu’ils n’ont pas été démontrés comme déclencheurs.

## 12. Métriques

Pour chaque phase Claude observable, conserver lorsque disponible :

- durée ;
- nombre de tours ;
- coût Claude déclaré ;
- identifiant de session ;
- mode de reprise ;
- résultat/verdict ;
- appels Claude consommés.

Les coûts Claude et les éventuels coûts OpenAI/Work sont distingués. Une métrique OpenAI/Work non accessible est `NON_VÉRIFIABLE`, jamais zéro par défaut.

## 13. Conditions avant reprise d’une tranche métier

Avant de reprendre T01-S09 ou une autre tranche métier avec V1.4 LOCAL :

1. vérifier que le présent protocole et ses dépendances d’orchestration ne contredisent pas les barrières V1.3 conservées ;
2. matérialiser le workflow local nominal ou l’adaptation minimale des workflows nécessaires ;
3. vérifier l’état Git réel de la tranche et son dernier checkpoint autorisé ;
4. vérifier la fraîcheur des sources documentaires/Figma/décisions concernées ;
5. établir explicitement le mode et l’écrivain ;
6. seulement ensuite reprendre la machine métier au dernier état stable démontré.

Aucune réussite du micro-test de session n’autorise à elle seule une écriture métier.

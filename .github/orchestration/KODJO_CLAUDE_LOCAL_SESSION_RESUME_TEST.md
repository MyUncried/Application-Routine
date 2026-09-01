# KODJO-CLAUDE-LOCAL-SESSION-RESUME-01 — préparation

Statut : `PREPARED_NOT_READY_FOR_BASE`

Compteur Claude : `0/2`

## Question testée

Une session Claude Code créée dans un workflow run GitHub Actions sur un runner
self-hosted Windows persistant peut-elle être reprise nativement dans un second
workflow run distinct, sur le même PC et sous la même identité locale ?

## Architecture

`GitHub → GitHub Actions → runner self-hosted Windows KODJO → Claude Code CLI local → filesystem local persistant`

Aucun runner GitHub hébergé, backend externe, SessionStore, Managed Agent,
serveur supplémentaire ou fallback Cloud n’est autorisé.

## État local fixe attendu

Le runner doit porter simultanément les labels :

- `self-hosted`
- `Windows`
- `X64`
- `kodjo-claude-local`

Trois variables de dépôt doivent être définies puis prouvées :

- `KODJO_LOCAL_RUNNER_NAME` : nom exact du runner GitHub ;
- `KODJO_LOCAL_TEST_ROOT` : répertoire absolu stable, par exemple
  `C:\KODJO\claude-local-session-resume-01` ;
- `KODJO_LOCAL_CLAUDE_CONFIG_DIR` : répertoire absolu persistant réservé au test,
  par exemple `C:\KODJO\claude-local-session-resume-01\claude-config`.

Les deux appels utilisent aussi
`CLAUDE_CODE_PROJECT_DIR_NAME=kodjo-local-session-resume-01`. Cette convention
requiert Claude Code `>=2.1.234`; le dispositif exige `>=2.1.248` afin de disposer
également du mode `--restricted`. La version réellement installée est capturée
par le préflight ; aucune installation ou mise à jour automatique n’est faite.

## Fondement documentaire

La documentation Claude Code actuelle indique que :

- les conversations sont sauvegardées continuellement dans des transcripts
  locaux et restent reprenables après la fin du processus ;
- une session non interactive peut être reprise explicitement avec
  `claude -p --resume <session-id>` ;
- les transcripts résident par défaut sous
  `~/.claude/projects/<project>/<session-id>.jsonl` ;
- `CLAUDE_CONFIG_DIR` déplace ce stockage ;
- `CLAUDE_CODE_PROJECT_DIR_NAME`, avec `CLAUDE_CONFIG_DIR`, stabilise le nom du
  répertoire de projet à partir de la version 2.1.234 ;
- `--fork-session` crée volontairement une autre session et est donc interdit ;
- `--no-session-persistence` et `CLAUDE_CODE_SKIP_PROMPT_HISTORY` désactivent la
  persistance et sont donc interdits.

Sources officielles :

- https://code.claude.com/docs/en/sessions
- https://code.claude.com/docs/en/cli-reference
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

Hypothèse soumise au micro-test : deux processus Claude Code distincts utilisant
le même stockage persistant et le même nom de projet retrouveront effectivement
le transcript BASE par son ID. Le workflow ne présente pas cette hypothèse comme
déjà démontrée.

## Préflight sans Claude

Le workflow `kodjo-claude-local-runner-preflight.yml` doit être exécuté deux fois :

1. `WRITE` vérifie le runner, la machine, l’utilisateur système, les chemins,
   Claude Code, sa version, `--resume`, l’authentification via
   `claude auth status`, puis écrit une sentinelle locale et sa preuve GitHub ;
2. `READ`, dans un run distinct, relit la même sentinelle au même chemin sur la
   même machine et sous le même utilisateur, puis publie une preuve durable.

Ces commandes ne démarrent aucune session et n’appellent aucun modèle.

BASE reste interdit tant que `PREFLIGHT.read.json` n’est pas présent et cohérent
sur la branche d’état, et tant que la variable
`KODJO_LOCAL_SESSION_TEST_ARMED` n’est pas explicitement fixée à `true`.

## BASE puis RESUME

Le workflow `kodjo-claude-local-session-resume-test.yml` contient deux stages
manuels. Il ne les enchaîne pas automatiquement.

### BASE — appel 1/2

Après validation des préflights, BASE :

1. génère un marqueur aléatoire en mémoire sur le runner ;
2. calcule son SHA-256 ;
3. crée et relit `BASE.claim.json` avant l’appel ;
4. exécute une seule fois Claude Code local en mode non interactif, restreint et
   sans outils ;
5. transmet le marqueur uniquement dans le prompt BASE ;
6. persiste uniquement le hash, le `session_id`, les métriques exposées et les
   métadonnées techniques ;
7. laisse le processus et le workflow se terminer complètement.

### RESUME — appel 2/2

Dans un autre workflow run, RESUME :

1. relit `BASE.result.json` depuis GitHub ;
2. vérifie la présence locale du transcript portant le session ID BASE sans en
   publier le contenu ;
3. crée et relit `RESUME.claim.json` avant l’appel ;
4. exécute exactement `claude -p --resume <BASE_SESSION_ID>` avec le même
   `CLAUDE_CONFIG_DIR`, le même nom de projet, le même working directory, le même
   utilisateur, le même runner et la même installation ;
5. n’utilise jamais `--fork-session`, `--continue`, `--fallback-model` ni un
   autre runner ;
6. demande uniquement la restitution du marqueur de l’étape précédente ;
7. compare le SHA-256 de la réponse au hash BASE et ne publie pas le marqueur en
   clair.

## Anti-réinjection

Le marqueur n’est pas un input GitHub. Il n’est écrit dans aucun fichier GitHub,
artifact, commentaire, variable d’environnement persistée, checkpoint, delta ou
JSON de preuve. La sortie brute de BASE n’est pas publiée. Seul son hash
SHA-256 est durable. Le prompt RESUME est une constante du workflow et ne reçoit
aucune donnée BASE autre que le session ID.

Le transcript local natif peut contenir le prompt BASE et son marqueur : c’est
précisément l’unique canal de continuité testé.

## Verrous et récupération

La branche dédiée `test-state/claude-local-session-resume-01` contient les
claims et résultats. Un groupe `concurrency` unique sérialise tous les runs.

- absence de claim : stage disponible ;
- `BASE.claim.json` présent : BASE ne peut plus appeler Claude, même après
  `Re-run jobs` ;
- `RESUME.claim.json` présent : RESUME ne peut plus appeler Claude ;
- aucun retry Claude automatique ;
- une panne après appel déclenche uniquement une récupération forensique depuis
  le stockage local et les métadonnées existantes ; elle ne rappelle jamais le
  modèle.

Le chemin d’appel ne contient que deux commandes `claude -p` possibles, chacune
placée derrière son claim exclusif. Il n’existe aucun fallback ou troisième
stage.

## Verdict

`DÉMONTRÉE` seulement si les runs sont distincts, le runner/machine/utilisateur/
chemins sont identiques, BASE est complètement terminé, RESUME demande l’ID
BASE sans fork ni fallback, l’identité de session est compatible avec une vraie
reprise, et le hash du marqueur restitué correspond sans réinjection.

`NON DÉMONTRÉE` si la session est introuvable, si une nouvelle session/fork/
fallback apparaît, ou si le marqueur est absent ou incorrect.

`NON VÉRIFIABLE` si les traces ne suffisent pas à établir l’identité technique
effective malgré un comportement apparemment correct.

## Barrières permanentes

`business_write=false`, `implementation_authorized=false`,
`mode=LOCAL_READ_ONLY`, `writer=NONE`.

Le test ne touche aucun code métier, T01-S09, Figma, décision MVP ou document
normatif V1.3.

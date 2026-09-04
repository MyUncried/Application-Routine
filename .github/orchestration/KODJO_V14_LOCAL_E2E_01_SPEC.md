# KODJO — V1.4 LOCAL — E2E-01

Test ID : `KODJO-V14-LOCAL-E2E-01`

Statut : **PÉRIMÈTRE GELÉ — aucun appel Claude autorisé par ce document**.

Objectif : qualifier avec deux appels Claude maximum la chaîne réelle `checkpoint GitHub → contrôles → runner Windows → Claude Code local → contrôle du diff → commit/push → pull_request:synchronize → ChatGPT/Work → checkpoint de reprise → Claude --resume → publication finale` avant T01-S09.

Code métier : interdit.

Branche d'exécution dédiée : `orchestration/v1-4-local-e2e-01`.

Écritures Claude autorisées uniquement :
- `.github/orchestration/e2e/KODJO_V14_LOCAL_E2E_SENTINEL.md` ;
- `.github/orchestration/reports/KODJO_V14_LOCAL_E2E_01_*.md`.

Budget : BASE `1/2`, RESUME `2/2`. Tout échec avant invocation ne consomme pas le budget ; toute invocation réelle compte. Aucun troisième appel pour sauver E2E-01.

Préflight obligatoire avant chaque appel : dépôt, branche, HEAD autorisé, runner exact, worktree propre, `claude.cmd`, OAuth non expiré, `LOCAL_WRITE`, writer `CLAUDE_LOCAL`, checkpoint non consommé, anti-doublon ; RESUME exige en plus session BASE et transcript natif unique.

BASE doit créer une session, mémoriser un marqueur non persisté en clair, modifier la sentinelle, produire le rapport, puis laisser GitHub Actions contrôler les chemins et publier le résultat.

RESUME doit être un run distinct, utiliser `--resume <session_id BASE>`, restituer le marqueur sans réinjection, conserver le même session_id, modifier la sentinelle et produire le rapport final. `--fork-session` et tout fallback Cloud sont interdits.

Axes critiques requis `DEMONSTRATED` : `PREFLIGHT_AND_HEAD_GUARD`, `LOCAL_CLAUDE_EXECUTOR`, `NO_CLOUD_FALLBACK`, `WRITE_PATH_CONFINEMENT`, `CHECKPOINT_AND_DUPLICATE_GUARD`, `BASE_SESSION_PERSISTENCE`, `GITHUB_TO_WORK_WAKEUP`, `CHATGPT_REVIEW_HANDOFF`, `SESSION_RESUME`, `NO_CONTEXT_REINJECTION`, `FINAL_GITHUB_PUBLICATION`, `FINAL_E2E_CHAIN`.

`PUBLICATION_RECOVERY` n'est exercé que si un incident survient naturellement ; sinon `NOT_EXERCISED` n'est pas bloquant.

Verdicts : `DEMONSTRATED`, `PARTIALLY_DEMONSTRATED`, `NOT_DEMONSTRATED`. Aucun critère ne sera assoupli rétroactivement.

Le test ne provoque pas artificiellement une batterie de pannes et ne touche pas au produit. Avant BASE, le workflow doit être présent sur `main`, la branche E2E doit être propre et armée avec son HEAD exact, et aucune autre exécution ne doit écrire dans le même worktree runner.
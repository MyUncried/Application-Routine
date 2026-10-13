# PRE3-340 — pourquoi les commits de la correction revue 1 sont restés locaux

## Identité de la mission

- **Identifiant** : PRE3-340_DIAGNOSTIC-PUSH-NON-PUBLIE (diagnostic en lecture seule).
- **Objectif** : expliquer pourquoi `12506088`, `11447e6d` et `9f5cee0e` n'ont pas été publiés par la session de correction, alors que la mission demandait leur publication.
- **Branche et commit de départ** : `pre3-dev-local` à `9f5cee0e7049494033908fcec586b0c37587e168`, suivie par `origin/feat/pre3-exercice-20261009` et à jour avec elle depuis le push manuel d'Hermann.
- **Périmètre demandé** : la mission de correction, le rapport publié, l'historique de session, les journaux Claude disponibles et les traces Git. Aucun correctif, push, build, relance ni changement de configuration.
- **Périmètre traité** : tout le périmètre demandé. Seul ce rapport a été ajouté.

## Sources examinées

- `docs/preparation/PRE-3/planification/execution/preuves/mission-correction-revue1.md` (mission exacte) et `docs/preparation/PRE-3/planification/execution/mission-developpement.md`.
- `.github/orchestration/reports/2026-10-10_PRE3-340_REVUE-IMPLEMENTATION-1.md` et `.github/orchestration/reports/2026-10-10_PRE3-340_CORRECTION-REVUE1.md`.
- Journal de session Claude Code `~/.claude/projects/c--Dev-Application-routine/365adf19-b8fb-402a-b547-ac0de1a9bee4.jsonl`, avec ses horodatages UTC. Les heures de Paris s'obtiennent en ajoutant 2 h.
- `git reflog` et `git log` du worktree `pre3dev`, ainsi que les fichiers de permissions `.claude/settings.local.json`, `.claude/settings.json` et `~/.claude/settings.json`, lus sans modification.

## Chronologie (heure de Paris)

| Heure | Événement | Preuve |
|---|---|---|
| 09/10 18:29 et 18:35 | Deux refus « Out-of-Place Publication » pendant les **revues du plan**. Ils portent sur des commandes `fetch`/`rev-parse` de `plan/pre3-vnext-20261008`. Ce sont des opérations distinctes de celle diagnostiquée ici | Journal, lignes 331–332 et 341–342 |
| 09/10 18:43 → 18:46 | Hermann autorise trois permissions exactes pour la branche du **plan**. Elles sont ajoutées puis retirées de `settings.local.json`. Aucune ne concernait `feat/pre3-exercice-20261009` | Journal, lignes 385 et 410 (Edit) |
| 09/10 22:00:30 | Push de la **livraison initiale** : `git push origin HEAD:refs/heads/feat/pre3-exercice-20261009 2>&1 \| tail -5`. Résultat : `c1ea664e..96c46c74`, réussi. Aucune règle de permission ne couvrait ce push : il a été accepté par le classifieur du mode auto | Journal, lignes 2975 et 2980 |
| 10/10 01:34:05 | Le contexte de session est compacté : la conversation reprend depuis un résumé | Journal, ligne 3671 |
| 10/10 01:36:10 → 01:37:49 | Commits locaux `12506088`, `11447e6d` et `9f5cee0e` | `git reflog` |
| 10/10 01:37:53 et 01:37:57 | `git fetch origin feat/pre3-exercice-20261009` puis `git rev-parse FETCH_HEAD`, qui renvoie `94c8512e…` | Journal, lignes 3821–3825 |
| 10/10 01:38:00 | **Tentative de push** : `git push origin HEAD:refs/heads/feat/pre3-exercice-20261009` (sans force, sans pipe) | Journal, ligne 3827 |
| 10/10 01:38:15 | **Refus** : « Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Out-of-Place Publication]. » La commande n'a pas été exécutée : il n'y a aucune sortie Git | Journal, ligne 3828 |
| 10/10 01:38:23 et suivantes | Aucune nouvelle tentative. Le compte rendu final déclare la livraison incomplète et donne la commande à exécuter | Journal, lignes 3830–3831 |
| Ensuite | Hermann exécute le push à la main : `94c8512e..9f5cee0e`, sans force. Il soumet aussi une build Routine Dev | Faits fournis par Hermann ; non retrouvés dans le journal de cette session |

## Réponses aux questions

1. **Quelle instruction imposait le push.** La demande d'Hermann : « publie les preuves sur la même branche pour revue indépendante, sans fusion ni modification du protocole ». La mission, § « Publication et point d'arrêt » : « Avancer jusqu'au candidat corrigé et testé, publier sans force sur la même branche, commandes Git séparées et contrôle de la tête distante. » Pour le cas d'échec, la même section prévoit : « Si une permission/authentification ou un moyen de rendu/build manque, conserver le travail et donner un blocage précis. »
2. **Un push a-t-il été tenté avant Hermann.** Oui, une fois, le 10/10 à 01:38:00 (Paris), soit 2026-10-09T23:38:00.698Z. Commande : `git push origin HEAD:refs/heads/feat/pre3-exercice-20261009`. Résultat : refusé avant exécution. Preuve : journal de session, lignes 3827 et 3828.
3. **Provenance du refus.** Il vient du classifieur du **mode auto de Claude Code**, côté client et avant toute exécution. Il ne vient ni de GitHub, ni de Git, ni d'une authentification. Motif affiché : `[Out-of-Place Publication]`.
   - Ce refus porte sur le push de `feat/pre3-exercice-20261009`. Les refus du 09/10 à 18:29 et 18:35 portaient sur un fetch et un rev-parse de la branche du plan : même libellé, mais opération et branche différentes.
   - Aucune règle de permission ne couvrait ce push, ni à 22:00 ni à 01:38. Les permissions temporaires du plan avaient été retirées à 18:46, et aucune règle `git push` n'existe dans les fichiers de configuration.
4. **Arrêt de la session.** Un push a bien été tenté. La session s'est arrêtée parce que le refus lui interdisait de retenter l'opération sous une autre forme. Elle a appliqué la consigne « conserver le travail et donner un blocage précis ». Ce n'est ni un oubli, ni une interruption, ni une instruction contradictoire.
5. **Le compte rendu final.**
   - **Dans la conversation**, il dit clairement que la publication n'a pas eu lieu : « rien n'est publié », « État Git : … local 3 commits en avance sur le distant (`94c8512e`), non poussé », « Livraison incomplète tant que le push n'est pas fait ». Il ne revendique aucune publication.
   - Il contient une formulation ambiguë : « comme pour la publication du plan PRE-3 ». Elle rapproche ce refus de celui des revues du plan, ce qui peut entretenir la confusion entre les deux opérations.
   - **Le rapport versionné** `2026-10-10_PRE3-340_CORRECTION-REVUE1.md` a été committé **avant** la tentative. Il ne revendique pas de publication (« à vérifier par fetch avant le push »). Mais il **ne consigne pas le refus** : la trace durable du blocage n'existe que dans la conversation et dans ce diagnostic.
6. **Qui devait déclencher la build.**
   - **Pas cette mission.** Elle demandait de « préparer le candidat installable/version + commande de build et procédure bornée » lorsqu'aucun environnement de rendu n'est disponible. Elle ajoutait : « Si une permission/authentification ou un moyen de rendu/build manque, conserver le travail et donner un blocage précis. »
   - **Le pilote, après revue.** La revue 1 (`REVUE-IMPLEMENTATION-1.md`) indique : « Après corrections publiées : revue indépendante des corrections et de leurs effets transverses, compléter l'examen du diff applicatif restant, puis recette appareil bornée et build. Aucune fusion avant ces preuves. » La mission de développement confie au pilote ChatGPT « la recette et la livraison installable ».
   - La session a donc correctement laissé la build non lancée. La build soumise par Hermann est une décision distincte, qui intervient avant la seconde revue indépendante.

## Cause

**Cause démontrée** : le seul push tenté a été refusé avant exécution par le classifieur du mode auto de Claude Code (`[Out-of-Place Publication]`). Aucune règle de permission ne couvrait cette commande. Conformément au refus et à la mission, la session a conservé le travail et signalé le blocage.

**Cause indéterminée** : pourquoi le même classifieur a accepté une commande équivalente le 09/10 à 22:00, puis l'a refusée le 10/10 à 01:38. La différence plausible est la compaction de contexte intervenue entre les deux : l'instruction d'Hermann n'était plus qu'un résumé, et non le message d'origine. Aucune trace du raisonnement du classifieur n'est disponible : cette hypothèse n'est pas démontrée.

## Fait / preuve / conséquence

| Fait | Preuve | Conséquence |
|---|---|---|
| La mission exigeait une publication sans force sur la même branche | `mission-correction-revue1.md`, § « Publication et point d'arrêt » | Le push faisait partie de la livraison |
| Le push a été tenté une fois, à 01:38:00 | Journal, ligne 3827 | Il n'y a pas eu d'oubli |
| Refus du classifieur du mode auto, motif `Out-of-Place Publication`, sans exécution Git | Journal, ligne 3828 | Le distant est resté à `94c8512e` |
| Aucune règle de permission ne couvrait ce push | `settings*.json` ; règles temporaires du plan retirées à 18:46 | Le résultat dépendait du seul classifieur |
| La même commande avait été acceptée à 22:00 | Journal, lignes 2975 et 2980 (`c1ea664e..96c46c74`) | Le comportement du classifieur n'est pas stable d'une tentative à l'autre |
| Une compaction est intervenue entre les deux tentatives | Journal, ligne 3671 | Hypothèse plausible, non démontrée, de cette instabilité |
| Le compte rendu conversationnel déclarait « non poussé » et « livraison incomplète » | Journal, ligne 3831 | Aucune publication n'a été revendiquée |
| Le rapport versionné a été committé avant la tentative et ne mentionne pas le refus | `git reflog` (01:37:49) et contenu du rapport | La trace durable du blocage manquait jusqu'à ce diagnostic |
| La build relevait du pilote, après la revue des corrections | `REVUE-IMPLEMENTATION-1.md` (fin), `mission-developpement.md` (« recette et livraison installable ») | La session ne devait pas lancer de build |

## Mesures minimales recommandées (non appliquées)

1. Avant une mission qui doit publier, ajouter une règle de permission exacte et temporaire pour ce push : `Bash(git push origin HEAD:refs/heads/<branche>)`. La retirer après vérification du distant, comme pour la publication du plan. La publication ne dépend alors plus du classifieur, et aucun contrôle global n'est désactivé.
2. Committer le rapport de mission **après** la tentative de push, ou ajouter un commit documentaire d'état lorsque le push est refusé. Le rapport versionné doit consigner la commande, l'heure et le motif exact d'un refus.
3. Dans le compte rendu, rattacher chaque refus à l'opération et à la branche concernées, sans analogie avec un refus antérieur portant le même libellé.

## Hypothèses non démontrées

- L'effet de la compaction sur la décision du classifieur.
- Le push et la build réalisés par Hermann : ils sont repris tels qu'il les a énoncés et ne figurent pas dans ce journal. Le dépôt confirme seulement que `pre3-dev-local` est désormais à jour avec `origin/feat/pre3-exercice-20261009`. Cela ne prouve rien sur l'échec antérieur.

## Modifications, tests et état Git

- **Modifications** : ajout de ce seul rapport. Aucun fichier applicatif modifié.
- **Tests** : aucun test applicable (diagnostic sur journaux et traces) ; aucune relance.
- **Hors périmètre, non corrigé** : le rapport `CORRECTION-REVUE1.md` n'est pas amendé.
- **Vérifications sur appareil** : aucune propre à ce diagnostic.
- **Fichier ajouté** : `.github/orchestration/reports/2026-10-10_PRE3-340_DIAGNOSTIC-PUSH-NON-PUBLIE.md`.
- **Commit final** : commit documentaire local contenant ce rapport (hash communiqué dans la réponse).
- **État Git** : non poussé, conformément à l'interdiction de push de cette mission.

# KODJO — Protocole générique par tranche V1

## Objet

Ce document définit l'infrastructure permanente utilisée à partir de T01-S10. Une tranche ne crée plus son propre protocole : elle instancie ce protocole par un manifeste versionné.

Le protocole T01-S09 reste actif et inchangé jusqu'à sa clôture. Aucun fichier générique ne peut intercepter un marqueur S09.

## Répartition des responsabilités

- ChatGPT Work : pilote, reconstruit l'état GitHub, prépare les événements autorisés et contrôle les gates.
- OpenAI : construit le plan et réalise la revue indépendante de l'implémentation.
- Claude Code local : revoit le plan puis développe dans une session dédiée à la tranche.
- Utilisateur : approuve le plan et le rendu visuel.
- GitHub : source de vérité des états, manifests, commentaires, commits, runs, logs et artefacts.

## Unité de configuration

Chaque tranche possède un unique fichier `.github/orchestration/slices/<slice_id>.yml` conforme à `slice-manifest.schema.json`.

Le manifeste contient les paramètres variables : identifiant, Issue, branche, baseline, tranche précédente, état, sources, périmètre, gates et sessions. Les workflows ne doivent contenir aucun numéro d'Issue, SHA, identifiant de commentaire ou identifiant de session propre à une tranche.

## États

`AWAITING_SLICE_SPEC` → `SPEC_PREPARED` → `PLAN_BUILDING` → `PLAN_REVIEW` → `PLAN_USER_GATE` → `IMPLEMENTING` → `IMPLEMENTATION_REVIEW` → `VISUAL_USER_GATE` → `FINALIZING` → `DONE`.

États techniques d'arrêt : `WAITING_FOR_PREVIOUS_SLICE`, `CLARIFICATION_REQUIRED`, `USAGE_LIMIT`, `ORCHESTRATION_FAILURE`.

## Événements canoniques

Les commandes transportées dans l'Issue utilisent le préfixe `[KODJO_SLICE]` et portent obligatoirement `slice_id`, `manifest_path` et les références causales attendues.

Activités : `START_PLAN`, `PLAN_REVISE`, `PLAN_APPROVE`, `IMPLEMENTATION_REVISE`, `VISUAL_REVISE`, `VISUAL_APPROVE`, `FINALIZE`.

Une commande sans manifeste actif, sur une autre Issue, une autre branche ou un autre HEAD est rejetée avant tout appel IA.

## Parsing des événements GitHub — règles normatives et permanentes

Ces règles s'appliquent à tout workflow qui lit un commentaire, un corps d'événement, une sortie d'étape ou un contenu récupéré par l'API GitHub.

1. **Normalisation avant parsing.** Tout corps entrant doit être converti dans une représentation canonique avant la première extraction ou validation : fins de ligne CRLF et CR normalisées en LF, ou suppression explicite de tout caractère CR sur chaque valeur extraite. Aucun contrôle typé ne peut porter sur une valeur contenant encore un caractère CR.
2. **Marqueur exact.** Le marqueur de commande ou de sortie est la première ligne normalisée complète. Il doit être comparé exactement à un marqueur canonique. Les recherches par sous-chaîne et les correspondances de préfixe ambiguës sont interdites.
3. **Séparation routage/parsing.** La condition GitHub Actions ne sert qu'à router un événement non ambigu. Le gate relit et valide ensuite le marqueur exact, l'auteur, l'Issue, le commentaire source et les références causales avant tout appel IA.
4. **Source autoritative relue.** Lorsqu'un événement désigne un commentaire source, le workflow doit relire ce commentaire par son identifiant via l'API GitHub, vérifier qu'il appartient à l'Issue attendue et qu'il provient de l'auteur autorisé, puis parser le corps relu après normalisation.
5. **Extraction déterministe.** Chaque champ obligatoire doit être présent une seule fois, extrait après normalisation et validé selon son type exact. Un champ absent, dupliqué, vide, suffixé par CR ou mal formé arrête le gate.
6. **Compatibilité Bash.** Avec `set -o pipefail`, une validation ne doit pas utiliser un producteur potentiellement long relié à `grep -q` ou à un consommateur qui ferme le tube prématurément. Les commentaires longs doivent être matérialisés ou comparés sans risque de `SIGPIPE`.
7. **Compatibilité GitHub Expressions.** Dans une expression GitHub Actions, `\n` écrit dans un littéral entre apostrophes représente les caractères antislash et `n`, pas un saut de ligne. Toute construction nécessitant un saut de ligne doit employer une valeur réellement évaluée, par exemple `fromJSON('"\n"')`, et être vérifiée avec le moteur ou le comportement GitHub attendu.
8. **Lectures privées authentifiées.** Toute lecture distante d'un dépôt privé doit utiliser explicitement une authentification disponible à l'étape concernée. Après un checkout avec `persist-credentials: false`, les commandes Git réseau telles que `git ls-remote`, `git fetch` ou `git pull` sans authentification explicite sont interdites. Pour lire un HEAD ou une référence distante, le workflow doit privilégier l'API GitHub authentifiée par `GH_TOKEN` avec la permission minimale `contents: read`. La présence du token doit être vérifiée dans les conditions réelles du runner.
9. **Frontière IA.** Toute erreur de routage, de normalisation, de récupération, d'authentification ou de parsing est un `ORCHESTRATION_FAILURE`. Elle doit arrêter le workflow avant OpenAI ou Claude et ne constitue jamais un verdict fonctionnel ou technique sur le lot.
10. **Frontières de langages.** Une valeur typée doit être validée dans le langage qui la consomme directement. Les expressions régulières transportées à travers plusieurs interpréteurs (GitHub Expressions, YAML, Bash, PowerShell, Ruby, JSON) sont interdites lorsqu'une validation native mono-langage est possible. Le test permanent inspecte le fichier final tel qu'exécuté et exerce au moins une valeur valide et une valeur invalide.

### Contrôles obligatoires avant modification d'un bridge

Toute création ou modification d'un workflow de bridge doit être contrôlée sans IA sur la totalité du chemin déterministe, depuis l'événement jusqu'au dernier gate précédant l'appel IA.

La matrice minimale comprend :

- le corps GitHub autoritatif réel concerné par la reprise ;
- LF, CRLF et fins de ligne mixtes ;
- commentaire court et commentaire long ;
- marqueur valide, marqueur voisin, suffixé ou seulement préfixé ;
- champ obligatoire absent, vide, dupliqué, mal formé ou terminé par CR ;
- auteur incorrect, autre Issue, commentaire source inexistant ou de mauvais type ;
- HEAD, branche, baseline, manifeste et références causales conformes et non conformes ;
- Bash avec `pipefail` lorsque le workflow l'utilise ;
- PowerShell lorsque le workflow l'utilise ;
- lectures d'un dépôt privé avec les credentials persistants désactivés ;
- permissions minimales et disponibilité effective du token à chaque commande réseau ;
- validation syntaxique YAML du fichier final.

Un test de fonction isolée ou une reproduction simplifiée ne suffit pas. Le correctif ne peut être déclaré vérifié qu'après réussite du gate complet avec les payloads autoritatifs réels et des cas négatifs représentatifs. Le résultat des contrôles et leurs limites d'environnement doivent être rapportés explicitement.

Les modifications de fixtures, marqueurs et champs structurés doivent cibler une ligne ou un bloc exact. Les remplacements globaux par sous-chaîne sont interdits lorsqu'une clé peut être suffixe d'une autre clé (par exemple `head`, `base_head`, `source_head`). Après modification, chaque champ causal de la fixture autoritative doit être asserté séparément.

Le fichier de test final doit être exécuté intégralement, depuis un arbre contenant tous les fichiers qu'il inspecte. Exécuter seulement un préfixe, une fonction isolée ou la partie sémantique ne qualifie pas le test final. Toute assertion statique doit produire un libellé d'échec nominatif ; un arrêt silencieux par `set -e` est interdit pour les contrôles permanents.

## Périmètre incrémental — règles normatives et permanentes

Lorsqu'un plan approuvé est découpé en plusieurs lots, le lot autorisé est une donnée causale structurée et non une indication narrative.

1. **Identifiant obligatoire.** Chaque déclencheur d'implémentation, sortie d'implémentation et sortie de revue porte exactement un champ `increment=LOT_<n>_OF_<total>`, avec `1 <= n <= total`.
2. **Propagation sans perte.** La sortie d'implémentation recopie l'incrément du déclencheur autorisé et son identifiant `source_implementation_trigger_comment_id`. La revue relit ce déclencheur autoritatif et refuse toute absence, duplication ou incohérence de tranche, Issue, plan, revue de plan, session ou HEAD.
3. **Reprise historique explicite.** Une ancienne sortie ne portant pas ces champs ne peut être récupérée que si le déclencheur de reprise fournit explicitement `source_implementation_trigger_comment_id`. Il est interdit d'inférer le lot depuis une phrase libre du rapport.
4. **Revue bornée.** Une revue intermédiaire évalue uniquement les exigences que le plan approuvé alloue au lot indiqué. L'absence d'éléments affectés à un lot ultérieur est différée et ne peut constituer ni défaut, ni périmètre incomplet, ni preuve manquante.
5. **Contexte obligatoire.** Le prompt de revue contient l'identifiant du lot, la sortie d'implémentation autoritative, le plan approuvé, les fichiers modifiés et le diff. Il indique explicitement la frontière du lot et les éléments différés.
6. **Preuves déterministes.** Le résultat des gates Jest et TypeScript exécutés immédiatement avant la revue fait autorité. La revue peut critiquer un échec réel ou une couverture insuffisante dans le lot courant, mais ne peut déclarer ces contrôles non exécutés.
7. **Verdict hors périmètre.** Un verdict construit sans lot causal valide, ou bloqué uniquement par un lot ultérieur, est une sortie d'orchestration non exploitable. Il ne peut déclencher ni correction Claude, ni gate utilisateur, ni lot suivant.
8. **Test de non-régression.** Toute modification de la chaîne incrémentale doit tester sans IA au minimum : propagation nominale, reprise historique explicitement liée, champ absent, dupliqué ou mal formé, bornes invalides, incohérences de causalité, et présence des garde-fous de périmètre dans le prompt final.
9. **Baseline de tranche distincte de la base d'incrément.** `manifest.baseline_head` est la baseline immuable du plan ou de la tranche ; `IMPLEMENTATION_OUTPUT.base_head` est le HEAD causal immédiatement antérieur à l'implémentation ou à la correction examinée. Le gate interdit de les supposer égaux. Il vérifie par l'API GitHub authentifiée que la base d'incrément descend de la baseline (statut `identical` ou `ahead`), que le HEAD publié descend strictement de cette base (statut `ahead`) et que le HEAD distant de la branche est exactement le HEAD publié. Cette règle doit être testée avec une base égale, une base descendante, une base divergente ou antérieure, un HEAD identique ou divergent et des SHA mal formés.

## Publication et reprise après commit — règles normatives et permanentes

1. **Transport compatible.** Les workflows ne doivent employer que des options dont la disponibilité a été vérifiée sur la version réelle du CLI du runner. Pour publier un commentaire et récupérer son identifiant, la voie canonique est l'API GitHub authentifiée (`gh api --method POST`) avec un payload JSON, et non une option propre à une version récente de `gh issue comment`.
2. **Test de capacité.** Le test permanent du bridge interdit les commandes connues incompatibles, notamment `gh issue comment --json`, et vérifie la présence du transport API canonique.
3. **Commit sans sortie.** Si le commit est poussé mais que la publication échoue, le développement est matériellement terminé. Il est interdit de rappeler Claude ou de recréer le commit pour réparer un défaut de transport.
4. **Récupération déterministe.** L'événement exact `RECOVER_IMPLEMENTATION_PUBLICATION` relit le déclencheur d'implémentation autoritatif, contrôle l'Issue, le manifeste, la branche, le parent direct et le HEAD distant, puis réexécute Jest et TypeScript avant de publier la sortie manquante.
5. **Pas de verdict implicite.** La récupération ne modifie aucun fichier applicatif et ne vaut pas revue. Elle publie uniquement l'état transporté, puis déclenche la revue indépendante normale par `repository_dispatch`.
6. **Idempotence causale.** Toute sortie récupérée porte le même `increment`, la même session, le même plan et le même `source_implementation_trigger_comment_id` que l'exécution originale.
7. **Permissions par opération.** Tout workflow appelant l'endpoint `repository_dispatch` doit déclarer `contents: write`; `contents: read` est insuffisant et produit `Resource not accessible by integration`. La suite permanente recherche tous les appels à cet endpoint et refuse ceux dont la permission effective manque.
8. **Relance idempotente.** Avant de republier une sortie récupérée, le workflow recherche sur toutes les pages une sortie bot portant le même HEAD et le même déclencheur causal. Il la réutilise si elle est unique et s'arrête si plusieurs sorties existent.

## Déblocage contrôlé après défaillance d'orchestration répétée

Le bridge automatisé n'est pas une condition fonctionnelle de validité d'une revue. Après deux `ORCHESTRATION_FAILURE` consécutifs sur la même transition, toute nouvelle relance du workflow est interdite jusqu'à qualification hors production.

ChatGPT Développement peut alors utiliser un mode de déblocage explicite, sans Claude et sans développement :

1. vérifier dans GitHub l'absence d'un verdict exploitable portant le même `source_implementation_comment_id` et le même HEAD ;
2. reconstruire depuis GitHub le plan approuvé, la sortie d'implémentation, le déclencheur causal, le diff exact et les preuves déterministes ;
3. réaliser directement une unique revue OpenAI indépendante, strictement bornée à l'incrément autorisé ;
4. publier dans l'Issue une unique sortie canonique `[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT` contenant les mêmes champs causaux que le workflow ;
5. qualifier cette sortie comme `MANUAL_OPENAI_ESCAPE_HATCH` avec l'identité de l'opérateur et les références des runs d'orchestration défaillants ;
6. ne déclencher ni correction, ni gate suivant, ni lot suivant automatiquement.

Ce chemin est un contournement contrôlé et traçable du transport défaillant, jamais un PASS du workflow. Le workflow reste `NON RETESTÉ` jusqu'à un essai de qualification séparé. La reprise du protocole fonctionnel appartient ensuite à ChatGPT Développement.

## Gates permanents

1. Gate d'entrée : manifeste valide, tranche précédente `DONE`, Issue/branche/baseline exactes.
2. Gate plan : plan OpenAI identifié, revue Claude sur le même plan, verdict conforme.
3. Gate développement : approbation utilisateur causale, nouvelle session DEV dédiée, worktree propre.
4. Gate technique : périmètre autorisé, Jest complet, TypeScript, commit transportant tous les fichiers évalués.
5. Gate visuel : approbation utilisateur liée au HEAD exact après revue technique.
6. Gate final : revalidation du HEAD, tests, preuves et publication du checkpoint `DONE`.

## Continuité Claude

Une tranche crée une session REVIEW et une session DEV distinctes. Les corrections reprennent uniquement la session de leur activité. Une session d'une tranche antérieure n'est jamais réutilisée.

Les limites d'usage, erreurs API, sorties invalides et erreurs de transport restent des états techniques ; elles ne deviennent jamais un verdict fonctionnel.

## Budget Claude Code — règles normatives et permanentes

La sécurité du protocole ne justifie jamais de retransmettre à Claude un contexte qu'une session conservée possède déjà. Ces règles s'appliquent à toutes les tranches et ne peuvent être contournées silencieusement.

1. **Contexte complet une seule fois.** Le plan approuvé, sa revue, les sources documentaires et les instructions structurelles complètes ne sont transmis que lors de la création de la session Claude concernée.
2. **Reprise strictement différentielle.** Tout appel `--resume` transmet uniquement : `slice_id`, `session_id`, HEAD exact, identifiants causaux et nouvelle instruction ou nouveau feedback. Il est interdit d'y recopier le plan, la revue, les décisions, les rapports ou les documents déjà présents dans la session.
3. **Session obligatoire.** Une correction ou une continuation reprend la session existante de son activité. Aucun fallback vers une nouvelle session n'est autorisé. Si la session est indisponible, le protocole s'arrête et demande une décision explicite.
4. **Sources à la demande.** Lors d'une reprise, Claude ne relit que les fichiers nommément nécessaires au delta. Il ne reconstruit pas l'ensemble du dépôt, de la documentation ou de l'historique.
5. **Sortie différentielle.** Claude rapporte uniquement les changements, contrôles et nouveaux blocages du tour courant ; il ne répète pas les analyses et preuves déjà publiées.
6. **Un appel par transition.** Aucun retry Claude automatique, aucun appel parallèle et aucun second appel pour reformuler une sortie exploitable. Les erreurs de transport utilisent les artefacts conservés.
7. **Limite d'usage.** Un état `USAGE_LIMIT` arrête immédiatement la chaîne. Il n'entraîne aucun retry avant l'heure de réinitialisation annoncée et ne crée jamais une nouvelle session. Si la limite survient après des tours ou des écritures possibles, le worktree du runner est présumé récupérable jusqu'à preuve contraire. Avant tout checkout ultérieur, une reprise explicitement liée au `failed_run_id` et au même `source_head` conserve les modifications suivies et non suivies dans un stash Git puis les rétablit après le checkout exact. Un worktree sale sans cette causalité est rejeté. Si les métriques démontrent une session devenue massive, si la limite a absorbé le budget restant sur un delta court, ou si une règle antérieure interdisait déjà sa reprise, cette session est définitivement abandonnée : la continuation utilise `session_rollover=AUTHORIZED_AFTER_USAGE_LIMIT`, crée une nouvelle session `ROLLOVER_COMPACT` depuis le HEAD et le worktree récupérés, et transmet uniquement le delta. Le plan, les revues, la documentation complète et l'ancien transcript ne sont pas retransmis. Le workflow refuse que la nouvelle session ait l'identifiant de la session épuisée. Il publie un commentaire canonique `USAGE_LIMIT` indiquant l'interdiction de toute reprise avant le reset.
8. **Découpage justifié.** Le fractionnement d'une implémentation doit répondre à une dépendance technique ou à un gate démontré ; il ne doit pas multiplier les appels Claude par commodité.
9. **Garde-fou exécutable.** Les workflows de reprise doivent refuser un prompt contenant les marqueurs de paquet complet (`APPROVED PLAN:`, `INDEPENDENT REVIEW:` ou équivalent).
10. **Traçabilité de consommation.** Chaque artefact de diagnostic conserve le mode `INITIAL` ou `RESUME_DELTA`, la session, le HEAD et la longueur du prompt, sans enregistrer de secret.

OpenAI PLAN, les revues OpenAI, GitHub Actions, Git, Jest et TypeScript ne consomment pas le crédit Claude Code. Ils ne doivent pas être déplacés dans un appel Claude lorsqu'ils peuvent rester déterministes ou être exécutés séparément.

## Activation de T01-S10

Le manifeste T01-S10 reste `WAITING_FOR_PREVIOUS_SLICE` tant que S09 n'a pas publié son checkpoint final. Après clôture de S09 seulement :

1. créer l'Issue S10 ;
2. inscrire son numéro et le HEAD final S09 dans le manifeste, avec l'état `AWAITING_SLICE_SPEC` ;
3. ChatGPT Développement construit avec l'utilisateur le contenu fonctionnel de l'Issue et du manifeste ;
4. après inscription de l'objectif, du périmètre et des critères d'acceptation, passer le manifeste à `SPEC_PREPARED` ;
5. contrôler le manifeste et les workflows génériques ;
6. autoriser `START_PLAN` en lecture seule.

Le développement S10 reste interdit avant le Gate plan utilisateur.

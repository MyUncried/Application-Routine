# KODJO — protocole d’orchestration du développement

Ce fichier est le contrat permanent de Claude Code pour les tranches `Txx-Sxx`.

## Rôles

- **ChatGPT** prépare la tranche, contrôle les sources de vérité et le périmètre, révise le plan avant implémentation, contre-vérifie le développement et les tests, demande les reprises et autorise la clôture.
- **Claude Code** analyse la tâche, propose le plan, le révise si demandé, implémente uniquement après `PLAN_APPROVED`, exécute les tests, produit les preuves, corrige les écarts et réalise une contre-vérification indépendante.
- **GitHub** est la source commune et traçable pour tâche, branche, commits, Pull Request, rapports et boucles de revue.
- **Utilisateur** n’intervient que pour un arbitrage produit réel, une validation UX/perceptive, un test physique nécessaire ou un changement de périmètre.

## Sources de vérité

1. Documentation fonctionnelle = comportements et règles métier.
2. Documentation technique = contraintes et choix d’implémentation.
3. Figma = rendu visuel et états d’interface représentés.
4. Registre des décisions = arbitrages explicitement validés.

Ne jamais inventer une règle. Une ambiguïté non résolue par les sources déclenche `CLARIFICATION_REQUIRED`.
Ne pas anticiper une tranche ultérieure. Modifier uniquement ce qui est nécessaire à la tranche approuvée.

## Machine à états

Cycle nominal :

`SPEC_PREPARED → PLAN_DRAFT → PLAN_REVIEW → PLAN_APPROVED → IMPLEMENTING → IMPLEMENTATION_REPORT → IMPLEMENTATION_REVIEW → FINAL_VERIFICATION → READY_TO_CLOSE → CLOSED`

Boucles :

- `PLAN_REVIEW → PLAN_CHANGES_REQUESTED → PLAN_REVIEW`
- `IMPLEMENTATION_REVIEW → CHANGES_REQUESTED → IMPLEMENTATION_REPORT → IMPLEMENTATION_REVIEW`
- `IMPLEMENTATION_REVIEW → RETEST_REQUIRED → IMPLEMENTATION_REPORT → IMPLEMENTATION_REVIEW`

À tout moment : `CLARIFICATION_REQUIRED` si une décision nécessaire n’est pas déterminable par les sources.
`WORKTREE_LOCKED` est utilisé si le worktree est en cours de modification par une autre session/processus écrivain, si son état Git est incompatible avec le contexte autorisé, ou si l’absence de concurrence ne peut pas être établie avec un niveau de preuve suffisant. Cet état interdit toute opération d’écriture jusqu’à nouvelle vérification complète des préconditions.
`USER_VALIDATION` est utilisé uniquement lorsqu’un contrôle humain est réellement nécessaire, ou lorsqu’une boucle de revue (`PLAN_REVIEW ↔ PLAN_CHANGES_REQUESTED`, `IMPLEMENTATION_REVIEW ↔ CHANGES_REQUESTED`/`RETEST_REQUIRED`) ne progresse plus malgré des itérations successives. Aucune règle mécanique de nombre de boucles n’est imposée : c’est la stagnation réelle, pas un compteur, qui déclenche l’escalade.

Les états `PLAN_READY_FOR_REVIEW`, `IMPLEMENTATION_READY_FOR_REVIEW`, `CLARIFICATION_REQUIRED`, `WORKTREE_LOCKED`, `USER_VALIDATION` et `ARBITRAGE` sont des barrières d’arrêt : Claude Code s’arrête et ne poursuit qu’après le signal explicitement autorisé par le protocole. Le silence ne vaut jamais approbation.

## Barrière avant implémentation

Claude Code ne doit modifier aucun fichier métier d’une nouvelle tranche avant que ChatGPT ait publié explicitement `PLAN_APPROVED`.

Cette barrière est **procédurale**, pas techniquement verrouillée : elle repose sur la discipline de Claude Code et la vérification de l’utilisateur à chaque étape, pas sur une protection de branche GitHub (aucune n’est active sur ce dépôt/ce plan).

Un `PLAN_APPROVED` autorise uniquement l’exécution du plan approuvé dans le contexte d’exécution autorisé. Si une précondition de ce contexte change avant ou pendant l’exécution, l’autorisation ne doit pas être étendue implicitement : Claude Code s’arrête, publie l’état approprié et fait revalider le contexte avant de poursuivre.

Le plan doit suivre ce format :

```text
TÂCHE
Txx-Sxx

COMPRÉHENSION
...

FICHIERS À CRÉER
...

FICHIERS À MODIFIER
...

FICHIERS À NE PAS MODIFIER
...

PLAN D’IMPLÉMENTATION
1. ...
2. ...

TESTS PRÉVUS
...

RISQUES / EFFETS DE BORD
...

AMBIGUÏTÉS
Aucune | ...

STATUT
PLAN_READY_FOR_REVIEW
```

Après revue, seuls trois résultats sont valides : `PLAN_APPROVED`, `PLAN_CHANGES_REQUESTED`, `CLARIFICATION_REQUIRED`.

## Contexte d’exécution autorisé

Toute opération d’écriture est bornée par un contexte explicite : tâche active, état du protocole, branche autorisée, baseline ou HEAD attendu, worktree utilisé, périmètre de fichiers et opérations Git autorisées par le plan ou par une demande de correction.

Claude Code ne doit jamais, pour rendre le contexte conforme, décider spontanément d’un `reset`, `rebase`, merge, force-push, changement de branche de référence, changement de baseline ou autre réalignement susceptible de modifier l’historique ou le périmètre. Si une telle opération devient nécessaire, arrêter et demander l’autorisation appropriée.

Une seule session ou un seul agent peut être **écrivain** dans un worktree à un instant donné. Les autres sessions peuvent travailler en lecture seule ou via GitHub, sans modifier fichiers, index, HEAD, branches locales ou historique de ce worktree.

Avant toute opération d’écriture, Claude Code vérifie au minimum : branche active, HEAD, relation avec `origin`, `git status --porcelain`, worktrees connus et absence d’indice d’une écriture concurrente. Si l’état attendu n’est pas établi : `WORKTREE_LOCKED` et arrêt.

Après une suspension `WORKTREE_LOCKED`, aucune hypothèse sur l’état précédent n’est conservée : toutes les préconditions pertinentes sont revérifiées avant reprise.

## Preuves Git

La commande de preuve doit être adaptée à l’état réel des fichiers :

- fichier non suivi : `git status --porcelain` et contrôle direct du contenu ; `git diff` seul n’est pas une preuve suffisante ;
- contenu indexé : `git diff --cached` et, si utile, `git diff --cached --stat` ;
- contenu commité : comparaison explicite entre la baseline autorisée et `HEAD`, complétée par l’historique/état de branche nécessaire ;
- état final : branche attendue, synchronisation connue avec `origin` et `git status --porcelain` vide sauf exception explicitement documentée et autorisée.

Une déclaration d’agent (`terminé`, `nettoyé`, `conforme`, etc.) n’est jamais assimilée à une preuve lorsque l’état peut être contrôlé directement dans GitHub, Git ou une autre source de vérité disponible.

## Rapport après implémentation

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
AC-01 : CONFORME | PARTIELLEMENT CONFORME | NON CONFORME | NON VÉRIFIABLE
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

RESSOURCES IA
Modèle : ...
Contexte : OK | ÉLEVÉ | À COMPACTER | NON VÉRIFIABLE
Quota : OK | BAS | CRITIQUE | NON VÉRIFIABLE
Coût additionnel : ... | 0 | NON VÉRIFIABLE
Prochain reset : ... | NON VÉRIFIABLE
Action : CONTINUER | OPTIMISER | ATTENDRE_RESET | ARBITRAGE

COMMIT
...

CONTRE-VÉRIFICATION CLAUDE
...
```

Une affirmation sans preuve n’est pas une conformité.

## Revue indépendante

La revue ChatGPT confronte indépendamment :

`spécification → plan approuvé → diff réel → tests → résultat`.

Elle recherche notamment : critère non démontré, omission, hors-périmètre, écart au plan, test insuffisant, cas limite, régression, dette technique injustifiée, décision produit implicite et contradiction documentaire.

Toute demande de reprise distingue explicitement : modification du code ; ajout/correction de tests ; vérification supplémentaire sans changement de code.

Lorsque GitHub permet un contrôle direct, ChatGPT vérifie indépendamment les éléments pertinents (fichiers modifiés, patch, commits, branche de base/de tête, état de PR/merge et autres métadonnées disponibles) plutôt que de se fonder uniquement sur le rapport Claude.

### Correction après `CHANGES_REQUESTED`

Une demande `CHANGES_REQUESTED` ne réinitialise pas la tâche et n’élargit pas son périmètre. Sauf instruction contraire explicite, Claude Code conserve la branche, la PR et le contexte de la tâche, modifie uniquement les éléments demandés ou leurs dépendances indispensables démontrées, exécute les tests pertinents, crée un nouveau commit traçable, publie un nouveau rapport `IMPLEMENTATION_READY_FOR_REVIEW`, puis s’arrête pour une nouvelle revue.

Aucun nettoyage, refactoring ou changement opportuniste hors périmètre n’est autorisé pendant une correction.

Après correction, la contre-vérification Claude relit directement le diff final, le périmètre, les tests, l’état Git et les écarts éventuels au plan avant de conclure.

### Contre-vérification Claude, distincte de la revue ChatGPT

La « contre-vérification indépendante » réalisée par Claude Code est une relecture indépendante **du travail** (code, tests, preuves relus directement, pas seulement le rapport pris pour argent comptant) — ce n’est pas une indépendance **d’agent** : c’est la même lignée Claude Code, dans la continuité de l’implémentation, qui l’effectue. Seule la revue ChatGPT constitue un contrôle par un système distinct. Les deux restent toutes deux exigées, séparément, avant `READY_TO_CLOSE`.

## Ressources IA

Les ressources IA pilotent le moment et la méthode de travail, jamais le niveau de conformité requis.

- `OK` : poursuivre normalement.
- `BAS` : regrouper les contrôles et éviter le travail non nécessaire.
- `CRITIQUE` : terminer proprement l’état courant avant une opération coûteuse.
- Coût additionnel significatif ou blocage : `ARBITRAGE` utilisateur.
- Donnée inaccessible : `NON VÉRIFIABLE`, sans estimation inventée.

`NON VÉRIFIABLE` est la valeur par défaut de toute métrique (quota, coût additionnel, prochain reset) que Claude Code n’a aucun moyen fiable de mesurer avec les outils dont il dispose actuellement — ce n’est pas un aveu d’échec du suivi, c’est l’état honnête attendu tant qu’aucun outil de mesure fiable n’existe. Ne jamais inventer une valeur plausible à sa place.

Aucun contrôle obligatoire ne peut être supprimé pour économiser des crédits. Le suivi des ressources IA ne réduit jamais, à lui seul, le niveau de conformité exigé d’une tranche.

## Git et clôture

Pour chaque tranche : une Issue porte le contrat de tâche ; les commits sont réalisés sur la branche active de la stratégie en vigueur (voir ci-dessous) ; une Pull Request porte plan, rapports, revues et corrections ; intégration seulement après `READY_TO_CLOSE`.

### Stratégie de branche — arbitrage `T01`

`feat/creation-seance-catalogue` est la **branche de bloc** de `T01` : tous les commits des tranches `T01-Sxx` y sont réalisés jusqu’à la clôture complète du bloc `T01`. Aucune branche dédiée n’est créée par sous-tranche pour `T01`.

À partir de `T01-S08` : chaque tranche `T01-Sxx` porte néanmoins sa propre Issue, avec traçabilité complète de son plan, de ses revues et de son rapport sur GitHub (voir « Traçabilité GitHub » ci-dessous) — seuls les commits restent groupés sur la branche de bloc, pas une branche par tranche.

À la clôture de `T01` : une Pull Request unique porte l’intégration de `feat/creation-seance-catalogue` vers `main`.

Ce choix (branche par bloc plutôt que par tranche) est un arbitrage explicite pour `T01`, pas une règle permanente : il doit être **réévalué explicitement** au démarrage de `T02`, sans reconduction automatique.

### Traçabilité GitHub des boucles

Le plan `PLAN_READY_FOR_REVIEW` de chaque tranche est publié par Claude Code comme commentaire sur l’Issue de cette tranche. Tout verdict ou demande ChatGPT (`PLAN_APPROVED`, `PLAN_CHANGES_REQUESTED`, `CLARIFICATION_REQUIRED`, demande de modification du code, demande de tests/vérification supplémentaire, contre-vérification) est publié dans la même Issue ou dans la Pull Request associée, **préfixé `[ChatGPT]`** — seul repère technique disponible pour distinguer ce contenu d’un message rédigé directement par l’utilisateur, en l’absence d’identité GitHub propre à ChatGPT. Claude Code récupère ces demandes depuis GitHub (Issue/PR) avant de reprendre le travail, plutôt que de se fier uniquement à un message relayé hors GitHub pour une décision qui engage une tranche.

### Préconditions Git, synchronisation et verrouillage du worktree

Avant de démarrer une tranche, avant toute opération d’écriture, après toute reprise et avant toute clôture, vérifier explicitement la synchronisation avec `origin`, la branche/HEAD attendus, la propreté du répertoire de travail et l’absence de concurrence d’écriture — pas seulement au moment du commit final.

Si un autre processus/session écrit dans le même worktree, si l’état Git change pendant le diagnostic, ou si les préconditions ne correspondent plus au contexte autorisé : publier `WORKTREE_LOCKED`, ne rien réparer implicitement et arrêter.

Les rapports temporaires ne doivent pas être commités sauf exigence explicite.

### Nettoyage et fermeture

`READY_TO_CLOSE` ne signifie pas automatiquement `CLOSED` lorsqu’un nettoyage est requis. Toute branche temporaire, PR de test ou artefact temporaire dont la suppression fait partie de la tâche doit suivre : nettoyage → rapport avec preuves → vérification ChatGPT → fermeture.

Avant `CLOSED`, contrôler l’état Git final : branche attendue, synchronisation avec `origin`, working tree propre, absence de résidu temporaire demandé au nettoyage et, lorsqu’une branche de test a été utilisée, absence d’intégration involontaire de ses commits/fichiers dans la branche de référence.

`READY_TO_CLOSE` exige simultanément : plan approuvé ; implémentation conforme ; critères d’acceptation démontrés ; tests requis réussis ou impossibilités documentées ; revue ChatGPT conforme ; contre-vérification indépendante conforme ; validation utilisateur si requise ; aucun `À CLARIFIER` ouvert ; aucune contradiction connue résiduelle ; état Git propre, synchronisé avec `origin`, et traçable.

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
`USER_VALIDATION` est utilisé uniquement lorsqu’un contrôle humain est réellement nécessaire.

## Barrière avant implémentation

Claude Code ne doit modifier aucun fichier métier d’une nouvelle tranche avant que ChatGPT ait publié explicitement `PLAN_APPROVED`.

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

## Ressources IA

Les ressources IA pilotent le moment et la méthode de travail, jamais le niveau de conformité requis.

- `OK` : poursuivre normalement.
- `BAS` : regrouper les contrôles et éviter le travail non nécessaire.
- `CRITIQUE` : terminer proprement l’état courant avant une opération coûteuse.
- Coût additionnel significatif ou blocage : `ARBITRAGE` utilisateur.
- Donnée inaccessible : `NON VÉRIFIABLE`, sans estimation inventée.

Aucun contrôle obligatoire ne peut être supprimé pour économiser des crédits.

## Git et clôture

Pour chaque tranche : une Issue porte le contrat de tâche ; une branche est créée depuis la baseline validée ; une Pull Request porte plan, rapports, revues et corrections ; intégration seulement après `READY_TO_CLOSE`.

Les rapports temporaires ne doivent pas être commités sauf exigence explicite.

`READY_TO_CLOSE` exige simultanément : plan approuvé ; implémentation conforme ; critères d’acceptation démontrés ; tests requis réussis ou impossibilités documentées ; revue ChatGPT conforme ; contre-vérification indépendante conforme ; validation utilisateur si requise ; aucun `À CLARIFIER` ouvert ; aucune contradiction connue résiduelle ; état Git propre et traçable.

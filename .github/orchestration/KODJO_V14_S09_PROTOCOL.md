# KODJO V1.4 — Protocole opérationnel T01-S09

## Décision d'architecture

T01-S09 utilise exclusivement Claude Code local via le runner auto-hébergé `KODJO-LOCAL-RUNNER` et la configuration Claude isolée validée par E2E-02. Aucun Claude Cloud et aucun fallback.

Le protocole distingue deux phases métier et deux gates humains obligatoires.

## Machine d'état

`PLAN_BUILDING` → `PLAN_INTERNAL_REVIEW` → `PLAN_READY_FOR_USER_APPROVAL` → **GATE HUMAIN PLAN** → `IMPLEMENTING` → `IMPLEMENTATION_INTERNAL_REVIEW` → `VISUAL_REVIEW_REQUIRED` → **GATE HUMAIN VISUEL** → (`VISUAL_REWORK` → `IMPLEMENTATION_INTERNAL_REVIEW` → `VISUAL_REVIEW_REQUIRED`)* → `S09_DONE`.

## Gate humain 1 — Plan

L'utilisateur est consulté uniquement lorsque le plan a déjà passé la revue interne ChatGPT/OpenAI et les corrections mineures automatiques.

Instruction utilisateur attendue :
- `APPROUVER PLAN S09` ; ou
- `CORRIGER PLAN S09 : <décision/écart fonctionnel>`.

Aucune implémentation métier ne peut commencer avant `APPROUVER PLAN S09`.

## Phase développement

Après approbation du plan, Claude Code local développe S09 en mode non interactif `acceptEdits`.

ChatGPT/OpenAI effectue les revues intermédiaires. Les écarts suivants ne créent pas de gate utilisateur :
- tests, lint, typage, erreurs de build ;
- écart de code par rapport au plan approuvé lorsque la correction ne modifie pas la décision produit ;
- micro-écart technique ou refactor local nécessaire à la conformité ;
- oubli documentaire/rapport directement déductible d'une règle déjà validée ;
- problème de chemin, format ou contrôle mécanique réparable sans arbitrage produit.

Claude peut être repris sur la même session pour corriger ces points. La boucle interne est bornée ; si elle ne converge pas, le protocole s'arrête en `ORCHESTRATION_FAILURE` au lieu d'élargir silencieusement le périmètre.

## Escalade avant le gate visuel

L'utilisateur n'est consulté avant le gate visuel que si une vraie décision est requise :
- contradiction entre documentation, Figma et plan approuvé ;
- changement de périmètre fonctionnel ;
- comportement UX non déterminable ;
- modification destructrice ou migration non prévue ;
- impossibilité de respecter le plan sans nouvelle décision produit.

Ces cas utilisent `USER_DECISION_REQUIRED` avec une question unique et les options nécessaires.

## Gate humain 2 — Revue visuelle

Lorsque les contrôles techniques et la revue interne sont conformes, le protocole publie `VISUAL_REVIEW_REQUIRED` et demande un test sur iPhone/Expo.

Instruction utilisateur attendue :
- `VALIDER VISUEL S09` ; ou
- `CORRIGER VISUEL S09 : <liste des écarts observés>`.

Un retour `CORRIGER VISUEL S09` relance Claude local sur la même tranche, puis ChatGPT/OpenAI recontrôle automatiquement avant de redemander la revue visuelle. Les micro-écarts détectés par la revue interne ne sont pas renvoyés à l'utilisateur.

## Clôture

`S09_DONE` n'est autorisé qu'après : plan approuvé, implémentation publiée, contrôles techniques conformes, revue interne conforme, gate visuel explicitement validé, rapport final et commit/push contrôlés.

## Garde-fous hérités d'E2E-02

- runner, repository, branche et HEAD contrôlés ;
- worktree propre avant tranche ;
- OAuth Claude local contrôlé avant appel ;
- `--permission-mode acceptEdits` ;
- `git status --porcelain --untracked-files=all` ;
- checkpoints consommables une seule fois ;
- écriture PowerShell 5.1-safe des propriétés de checkpoint ;
- session native Claude persistée et reprise explicitement ;
- aucun Claude Cloud ; aucun fallback ;
- commit/push uniquement après contrôles mécaniques ;
- rapports obligatoires et traçabilité des décisions.

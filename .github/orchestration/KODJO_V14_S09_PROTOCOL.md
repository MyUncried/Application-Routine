# KODJO V1.4 — Protocole opérationnel T01-S09

## Décision d'architecture

T01-S09 utilise exclusivement Claude Code local via le runner auto-hébergé `KODJO-LOCAL-RUNNER`. Aucun Claude Cloud et aucun fallback.

La continuité Claude est une exigence du protocole : la session historique S01-S08 certifiée par transcript, `99404ae0-19e3-4004-8dde-cd670588afb5`, est reprise pour le PLAN S09 et reste la même session pour les révisions du plan, l'implémentation et les corrections. La chaîne précédente créée dans la session `24f12227-7e4f-4fd1-8f4b-6b142fdc9346` est supersédée et ne peut produire aucun gate utilisateur.

La mémoire de cette session historique aide Claude à comprendre le code et les décisions techniques accumulées, mais ne constitue jamais une source de vérité. À chaque étape, Claude doit relire le HEAD courant et les sources Git/documentaires applicables.

Le protocole distingue deux phases métier et deux gates humains obligatoires.

## Machine d'état

`PLAN_BUILDING` → `PLAN_INTERNAL_REVIEW` → `PLAN_READY_FOR_USER_APPROVAL` → **GATE HUMAIN PLAN** → `IMPLEMENTING` → `IMPLEMENTATION_INTERNAL_REVIEW` → `VISUAL_REVIEW_REQUIRED` → **GATE HUMAIN VISUEL** → (`VISUAL_REWORK` → `IMPLEMENTATION_INTERNAL_REVIEW` → `VISUAL_REVIEW_REQUIRED`)* → `S09_DONE`.

## Phase PLAN — lecture seule et trace durable

La phase PLAN est strictement en lecture seule au niveau des outils Claude : aucun `Edit`, `Write`, commit ou push n'est autorisé.

Le commentaire GitHub `[KODJO_S09_PLAN_OUTPUT]` constitue la trace durable et le rapport officiel de la phase PLAN. Aucun rapport fichier dans le dépôt n'est exigé ni autorisé pendant cette phase. La revue automatique ne doit donc jamais demander un fichier de rapport PLAN absent.

L'enveloppe PowerShell 5.1 doit capturer séparément stdout et stderr de `claude.cmd`. Un message écrit sur stderr ne doit pas interrompre le workflow avant analyse du résultat. Si Claude retourne un JSON exploitable contenant le `session_id` certifié et un `result` non vide, ce résultat peut être publié même si le processus natif retourne un code non nul ; le code de sortie est alors journalisé comme avertissement. Si aucun JSON exploitable n'est disponible, le workflow s'arrête en échec technique avec un extrait de stderr.

## Gate humain 1 — Plan

L'utilisateur est consulté uniquement lorsque le plan a déjà passé la revue interne ChatGPT/OpenAI et les corrections mineures automatiques.

Instruction utilisateur attendue :
- `APPROUVER PLAN S09` ; ou
- `CORRIGER PLAN S09 : <décision/écart fonctionnel>`.

Aucune implémentation métier ne peut commencer avant `APPROUVER PLAN S09`.

## Phase développement

Après approbation du plan, Claude Code local développe S09 en mode non interactif `acceptEdits`, en reprenant exactement la même session `99404ae0-19e3-4004-8dde-cd670588afb5` que celle utilisée pour le plan.

ChatGPT/OpenAI effectue les revues intermédiaires contre les sources applicables : spécifications fonctionnelles, registre des décisions, contrats d'écran, Design System Foundation, modèle de données, architecture/API lorsque pertinents, code réel et Figma pour le rendu/les états UI concernés.

Les écarts suivants ne créent pas de gate utilisateur :
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

Un retour `CORRIGER VISUEL S09` relance Claude local dans la même session historique, puis ChatGPT/OpenAI recontrôle automatiquement avant de redemander la revue visuelle. Les micro-écarts détectés par la revue interne ne sont pas renvoyés à l'utilisateur.

## Clôture

`S09_DONE` n'est autorisé qu'après : plan approuvé, implémentation publiée, contrôles techniques conformes, revue interne conforme, gate visuel explicitement validé, rapport final et commit/push contrôlés.

## Garde-fous hérités d'E2E-02

- runner, repository, branche et HEAD contrôlés ;
- worktree propre avant tranche ;
- OAuth Claude local contrôlé avant appel ;
- `--permission-mode acceptEdits` pour les étapes d'écriture ;
- `git status --porcelain --untracked-files=all` ;
- checkpoints consommables une seule fois ;
- écriture PowerShell 5.1-safe des propriétés de checkpoint ;
- capture séparée stdout/stderr des processus natifs Claude dans les étapes headless ;
- session native Claude persistée et reprise explicitement ;
- session historique S01-S08 certifiée disponible avant tout appel S09 ;
- contrôle que tout retour Claude conserve exactement le même `session_id` ;
- relecture obligatoire des sources actuelles malgré la mémoire de session ;
- aucun Claude Cloud ; aucun fallback ;
- commit/push uniquement après contrôles mécaniques ;
- rapports obligatoires pour les phases d'écriture et traçabilité des décisions ;
- en phase PLAN, `[KODJO_S09_PLAN_OUTPUT]` est le rapport durable officiel.

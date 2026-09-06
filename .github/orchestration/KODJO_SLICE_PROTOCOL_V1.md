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

`SPEC_PREPARED` → `PLAN_BUILDING` → `PLAN_REVIEW` → `PLAN_USER_GATE` → `IMPLEMENTING` → `IMPLEMENTATION_REVIEW` → `VISUAL_USER_GATE` → `FINALIZING` → `DONE`.

États techniques d'arrêt : `WAITING_FOR_PREVIOUS_SLICE`, `CLARIFICATION_REQUIRED`, `USAGE_LIMIT`, `ORCHESTRATION_FAILURE`.

## Événements canoniques

Les commandes transportées dans l'Issue utilisent le préfixe `[KODJO_SLICE]` et portent obligatoirement `slice_id`, `manifest_path` et les références causales attendues.

Activités : `START_PLAN`, `PLAN_REVISE`, `PLAN_APPROVE`, `IMPLEMENTATION_REVISE`, `VISUAL_REVISE`, `VISUAL_APPROVE`, `FINALIZE`.

Une commande sans manifeste actif, sur une autre Issue, une autre branche ou un autre HEAD est rejetée avant tout appel IA.

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

## Activation de T01-S10

Le manifeste T01-S10 reste `WAITING_FOR_PREVIOUS_SLICE` tant que S09 n'a pas publié son checkpoint final. Après clôture de S09 seulement :

1. créer l'Issue S10 ;
2. inscrire son numéro et le HEAD final S09 dans le manifeste ;
3. passer le manifeste à `SPEC_PREPARED` ;
4. contrôler le manifeste et les workflows génériques ;
5. autoriser `START_PLAN` en lecture seule.

Le développement S10 reste interdit avant le Gate plan utilisateur.

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
7. **Limite d'usage.** Un état `USAGE_LIMIT` arrête immédiatement la chaîne. Il n'entraîne aucun retry avant l'heure de réinitialisation annoncée et ne crée jamais une nouvelle session.
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

@docs/AGENTS.md

## Méthode de travail dans ce clone

Ce clone utilise BMad Method tel qu'installé, avec ses skills et son déroulement standard. `/bmad-help` indique l'étape suivante. Aucun raccordement, adaptateur ni protocole hybride n'est en place.

Les exigences produit, les conventions du code, les commandes de vérification et les pièges connus sont dans `AGENTS.md`.

Aucune tranche n'est sélectionnée par défaut. Le choix d'un périmètre — PRE-4, PRE-5 ou autre — est une décision de mission, prise au moment de la mission.

## Protocole VNext : référence inactive ici

Ce clone ne charge plus l'orchestration VNext. Ces fichiers sont conservés comme références historiques consultables, sans force obligatoire dans ce clone :

- `.github/AI_ORCHESTRATION.md` et `.github/AI_ORCHESTRATION_CONTINUITY.md`
- `.github/orchestration/` (protocole, files, checkpoints, rapports)
- `scripts/kodjo/` et `tests/kodjo/`
- `.github/orchestration/archive/CLAUDE_VNEXT_INSTRUCTIONS_2026-10-16.md` — contenu VNext retiré de ce fichier, conservé verbatim

Ne s'appliquent donc pas aux missions menées ici : `PLAN_APPROVED`, désignation d'écrivain et verrou d'écrivain, contrats et bootstraps de tranche, file de travail et runner, rapport de mission obligatoire à chaque mission, diagnostic historique préalable, barrières d'arrêt du protocole.

Les exigences produit que ces documents portaient sont reprises dans `AGENTS.md` : priorité aux primitives natives de l'OS, non-remplacement d'un composant déjà accepté, et le fait qu'une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel. Aucun contrôle de qualité produit n'a été supprimé.

Le détail du découplage, la liste des règles retirées du contexte actif et la justification de chacune sont dans `.github/orchestration/reports/2026-10-16_BMAD-DECOUPLAGE-VNEXT.md`.

Ce découplage est local à ce clone. Il ne modifie ni l'environnement VNext, ni PRE-4, ni les autres clones. Ne pas modifier les fichiers du protocole depuis ce clone.

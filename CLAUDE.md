# CLAUDE.md — clone BMAD PRE-6 (KODJO-BMAD-PRE6)

> Fichier **propre au worktree `C:\Dev\KODJO-BMAD-PRE6` et à ses branches PRE-6**. Il n'est pas livré dans `main` : à la livraison, il est exclu avec `AGENTS.md`, comme pour PRE-4 et PRE-5.
> Le `CLAUDE.md` de `main` (chantier documentaire OpenSpec) reste tel quel sur `main`. Il est consultable par `git show main:CLAUDE.md` ; son original est dans `openspec/instructions/originaux/CLAUDE.md`.

@AGENTS.md
@docs/AGENTS.md

## Méthode

BMad Method **6.12.4** (modules `core` et `bmm`). Cette installation est une copie locale de celle du clone PRE-5 ; elle n'est pas versionnée (`_bmad/`, `.claude/skills/bmad-*`, exclus par `.git/info/exclude`). Les scripts s'exécutent avec `uv`, et `/bmad-help` indique l'étape suivante.

`_bmad/custom/config.toml` dirige les artefacts PRE-6 vers `_bmad-output/pre6/` (`planning-artifacts/`, `implementation-artifacts/`). Les artefacts de PRE-4 (racine de `_bmad-output/`) et de PRE-5 (`_bmad-output/pre5/`) sont des références en lecture seule.

## Périmètre et autorisations

- **Avant la validation explicite du plan par Hermann**, le travail se limite à la planification, à l'analyse et aux artefacts de `_bmad-output/pre6/`.
- **Après cette validation et l'étape 0 de réconciliation** (`_bmad-output/pre6/planning-artifacts/epics.md`), le développement applicatif est autorisé dans `app/`, `src/` et les tests associés, pour les seules stories du plan PRE-6.
- Expo, EAS et les dépendances (`app.json`, `app.config.js`, `eas.json`, `package.json`) ne sont modifiés que si une story l'exige et le justifie. Aucune nouvelle version majeure ou expérimentale (dépendance ou BMAD) sans l'accord de Hermann.
- Commits locaux autorisés sur les branches PRE-6. Push, PR et fusion : seulement sur demande explicite de Hermann. Aucun commit, aucune fusion et aucun push directs sur `main`.
- Les spécifications produit (`docs/Specifications-fonctionnelles/`, `docs/*.md`) ne sont corrigées qu'après validation par Hermann d'un lot proposé.

## Interdits permanents

- Aucune modification de `C:\Dev\KODJO-BMAD-PRE5` (worktree, branche, processus de clôture), ni des autres clones (`KODJO-BMAD-PRE4`, `Application-routine*`).
- Aucune modification de `.github/` (workflows, orchestration VNext).
- Figma en lecture seule. Aucun EAS, aucune build distante.
- Ne pas lancer `start-kodjo.ps1`, qui change de branche et tire.

## Règles d'analyse

- Documentation = comportements et calculs ; Figma = rendu visuel. Une valeur lue dans une capture n'est jamais une règle.
- Le document le plus récent ne remplace pas automatiquement les autres. Un remplacement doit être explicite : décision Dxxx qui nomme la règle remplacée, ou mention « remplacé par ».
- Ne jamais inventer une règle. Une ambiguïté nécessaire est soumise à Hermann avec ses sources exactes (fichier et ligne) et une proposition d'arbitrage. Les arbitrages en cours sont ARB-1 à ARB-3 dans `epics.md`.
- Une suite de tests verte ne vaut pas preuve sur appareil : les jalons de recette iPhone J0 à J3 sont définis dans `epics.md`.

## Références inactives dans ce clone

- **OpenSpec** (`openspec/`, compétences `openspec-*`, commandes `/opsx:*`) : chantier documentaire distinct. Ses obligations, dont le bilan dans un change OpenSpec, ne s'appliquent pas à PRE-6.
- **VNext** (`.github/AI_ORCHESTRATION*.md`, `.github/orchestration/`, `scripts/kodjo/`, `tests/kodjo/`) : références historiques, sans force obligatoire ici. Les exigences produit qu'elles portaient sont reprises dans `AGENTS.md`.

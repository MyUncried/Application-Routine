# CLAUDE.md — clone BMAD PRE-7 (KODJO-BMAD-PRE7)

> Fichier **propre au clone `C:\Dev\KODJO-BMAD-PRE7` et à ses branches PRE-7**. Il n'est pas livré dans `main` : à la livraison, il est exclu avec `AGENTS.md`, comme pour PRE-4, PRE-5 et PRE-6.
> Le `CLAUDE.md` de `main` reste tel quel sur `main` (`git show main:CLAUDE.md`).

@AGENTS.md
@docs/AGENTS.md

## Méthode

BMad Method **6.12.4** (modules `core` et `bmm`), copie locale de l'installation du clone PRE-6, non versionnée (`_bmad/`, `.claude/skills/bmad-*`, exclus par `.git/info/exclude`). Les scripts s'exécutent avec `uv`, et `/bmad-help` indique l'étape suivante.

`_bmad/custom/config.toml` dirige les artefacts PRE-7 vers `_bmad-output/pre7/` (`planning-artifacts/`, `implementation-artifacts/`). Les artefacts de PRE-4 (racine de `_bmad-output/`), PRE-5 (`pre5/`) et PRE-6 (`pre6/`) sont des références en lecture seule.

## Périmètre et autorisations

- Plan PRE-7 approuvé par Hermann le 24/10/2026 : `_bmad-output/pre7/planning-artifacts/epics.md` (6 epics, 13 stories ; axe A MFN, axe B finalisation de l'éditeur d'Exercice).
- Développement autorisé dans `app/`, `src/` et les tests associés pour les seules stories du plan, enchaînées sans nouvelle approbation. Lot documentaire de l'Epic 0 autorisé, avec sa propagation.
- Expo, EAS et les dépendances (`app.json`, `app.config.js`, `eas.json`, `package.json`) ne sont modifiés que si une story l'exige et le justifie. Aucune nouvelle version majeure ou expérimentale (dépendance ou BMAD) sans l'accord de Hermann.
- Commits locaux autorisés sur les branches PRE-7. Push, PR et fusion : seulement sur demande explicite de Hermann (la fusion finale sur `main` fera l'objet d'une autorisation distincte). Aucun commit, aucune fusion et aucun push directs sur `main`.
- Hors Epic 0, les spécifications produit (`docs/Specifications-fonctionnelles/`, `docs/*.md`) ne sont corrigées qu'après validation par Hermann d'un lot proposé.
- Aucun audit, revue, test ou condition de blocage en plus de ceux prévus par BMAD et le plan.

## Interdits permanents

- Aucune modification des autres clones (`KODJO-BMAD-PRE4`, `KODJO-BMAD-PRE5`, `KODJO-BMAD-PRE6`, `Application-routine*`).
- Aucune modification de `.github/` (workflows, orchestration VNext).
- Figma en lecture seule. Aucun EAS, aucune build distante.
- Ne pas lancer `start-kodjo.ps1`, qui change de branche et tire.
- La migration 012 (réinitialisation ponctuelle des Exercices et Séances, D-440 assouplie) n'est chargée sur l'iPhone de Hermann qu'après l'avoir prévenu (jalon JA1).

## Règles d'analyse

- Documentation = comportements et calculs ; Figma = rendu visuel. Une valeur lue dans une capture n'est jamais une règle.
- Le document le plus récent ne remplace pas automatiquement les autres. Un remplacement doit être explicite : décision Dxxx qui nomme la règle remplacée, ou mention « remplacé par ».
- Ne jamais inventer une règle. Une ambiguïté nécessaire est soumise à Hermann avec ses sources exactes (fichier et ligne) et une proposition d'arbitrage.
- Numérotation : D-436 à D-440 = MFN ; D-441 à D-444 = PRE-6 ; D-445 = décision de main (PR #397) ; D-446 = chantier des phases PRE-7 (rapproché de PHC-20261026) ; D-447 = décision éditeur PRE-7 ; suivantes à partir de D-448.
- Une suite de tests verte ne vaut pas preuve sur appareil : jalons de recette iPhone JB, JA1 et JA dans `epics.md`.

## Références inactives dans ce clone

- **OpenSpec** (`openspec/`, compétences `openspec-*`, commandes `/opsx:*`) : chantier documentaire distinct, sans obligation ici.
- **VNext** (`.github/AI_ORCHESTRATION*.md`, `.github/orchestration/`, `scripts/kodjo/`, `tests/kodjo/`) : références historiques, sans force obligatoire ici.

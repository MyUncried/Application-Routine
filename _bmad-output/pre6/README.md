# PRE-6 — Évolution de la Composition de séance (planification BMAD)

Statut : **plan proposé, en attente de validation explicite de Hermann.** Aucun développement, aucune modification applicative, documentaire ou Figma.

| Rubrique | Contenu |
|---|---|
| Objectif | Construire le plan BMAD de PRE-6 : Composition des séances libres, plus un socle commun réutilisable par les formats. |
| Branche et commit de départ | `plan/pre6-bmad`, depuis `ad189847` (fusion PRE-5 #389, `origin/main` au 20/10/2026). Worktree `C:\Dev\KODJO-BMAD-PRE6`, distinct de PRE-5. |
| Périmètre traité | Analyse du code, des chapitres 07 à 13, des DSF Circuits et Formats, et de 15 frames Figma (lecture seule) ; architecture cible ; epics et stories ; étape de réconciliation ; recette ; risques ; arbitrages. |
| Hors périmètre | Toute story de développement ; worktree et clôture PRE-5 ; push, PR, fusion ; corrections documentaires (proposées seulement). |

## Artefacts

- `etat-de-depart.md` : baseline PRE-5, acquis du code, écarts E1 à E13, sources retenues, relevé Figma.
- `planning-artifacts/architecture-pre6.md` : AD-34 à AD-45, points d'attache réservés aux formats.
- `planning-artifacts/epics.md` : étape 0 (réconciliation), 4 epics et 14 stories, ordre, jalons iPhone J0 à J3, risques, arbitrages ARB-1 à ARB-3, raccordements.
- `implementation-artifacts/sprint-status.yaml` : toutes les stories en `backlog`.

## Hypothèses non démontrées

- Aucune autre correction PRE-5 n'arrivera après `ad189847`. C'est à confirmer à l'étape 0.
- `ExecutionParametersDraft` contient la logique « le tableau suit N » sous une forme extractible en fonction pure (AD-39). C'est à vérifier en story 1.4.
- Le plan a été rédigé avant l'installation de BMAD dans ce worktree. Depuis le 20/10, BMad 6.12.4 (core, bmm) est installé ici, en copie de PRE-5. Les en-têtes de `epics.md` ont été normalisés au format attendu par `sprint_plan.py` (`## Epic N:`, `### Story N.M:`), sans autre modification. `sprint-status.yaml` a été généré par ce script et validé (aucun problème signalé).

## Note sur le livrable

Le `CLAUDE.md` racine est celui du clone de révision OpenSpec : il impose un bilan dans `openspec/changes/<change>/`. Aucun change OpenSpec n'est actif, et ce chantier est un plan BMAD. Le présent README tient lieu de bilan : il en reprend le contenu minimal et le fichier est committé localement.

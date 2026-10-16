# Mission BMAD-HELP — état initial de l'installation BMad (PRE5)

## Identifiant et objectif

- **Identifiant** : `BMAD-HELP-ETAT-INITIAL-20261016`
- **Type** : diagnostic / orientation (aucune modification applicative)
- **Objectif** : déterminer la position courante dans le workflow BMad, les artefacts
  déjà produits et la prochaine étape recommandée/requise, en réponse à l'invocation
  utilisateur `/bmad-help`.

## Branche et commit de départ

- Branche : `bmad/pre5-preparation`
- HEAD de départ : `6656fefc58330955f5ad74d513ce616ea51809b0`
  (`[VNext] PRE-4: poursuivre la revue avec le dossier Figma lisible et les 92 cibles conservées`)

## Périmètre demandé

Analyse de l'état BMad courant et recommandation de la prochaine étape.

## Périmètre réellement traité

Identique au périmètre demandé. Sources lues :

- `_bmad/_config/bmad-help.csv` (catalogue des skills installés)
- `_bmad/config.toml`, `_bmad/config.user.toml`, `_bmad/custom/config.toml`,
  `_bmad/custom/config.user.toml` (via `uv run _bmad/scripts/resolve_config.py`)
- `_bmad-output/` (répertoire d'artefacts résolu)
- `docs/` (`project_knowledge` résolu)
- `.claude/skills/` (skills matérialisés)
- état Git

## Constats

### C1 — BMad est installé mais aucun artefact n'a été produit

- Deux modules sont inventoriés dans le catalogue : `BMad Method` et `Core`.
- 29 skills sont matérialisés dans `.claude/skills/`.
- Le répertoire d'artefacts résolu `_bmad-output/` **existe mais est vide** :
  aucun `planning-artifacts/`, aucun `implementation-artifacts/`.
- Conclusion : **aucune phase BMad n'est démarrée**. Aucun brief, PRD, UX, spec,
  architecture, epics/stories ni fichier de statut de sprint n'existe.

### C2 — Configuration résolue

| Clé | Valeur résolue | Origine |
| --- | --- | --- |
| `core.user_name` | `Hermann` | `config.user.toml` (surcharge `BMad`) |
| `core.communication_language` | `French` | `config.user.toml` (surcharge `English`) |
| `core.document_output_language` | `French` | `config.toml` |
| `core.output_folder` | `_bmad-output` | `config.toml` |
| `modules.bmm.user_skill_level` | `intermediate` | `config.toml` / `config.user.toml` |
| `modules.bmm.planning_artifacts` | `{project-root}/_bmad-output/planning-artifacts` | `config.toml` |
| `modules.bmm.implementation_artifacts` | `{project-root}/_bmad-output/implementation-artifacts` | `config.toml` |
| `modules.bmm.project_knowledge` | `{project-root}/docs` | `config.toml` |

Aucune surcharge n'est présente dans `_bmad/custom/` (fichiers réduits à leurs
commentaires d'exemple).

### C3 — Contexte brownfield riche, non encore raccordé à BMad

`project_knowledge` pointe sur `docs/`, qui contient un corpus important
(documents DSF, arbitrages, matrices Figma, inventaires, journaux). Le dépôt porte
par ailleurs un protocole d'orchestration propre (`.github/AI_ORCHESTRATION.md` V1.3
et son extension de continuité). Ce corpus n'est référencé par **aucun** artefact BMad
à ce jour.

Aucun `AGENTS.md` n'existe à la racine du dépôt. Le seul fichier `AGENTS.md` présent
est `docs/AGENTS.md`, qui se limite à une consigne de lecture des docs Expo versionnées.
Le bloc géré par `bmad-project-context` n'est donc pas installé.

### C4 — Portes requises restant toutes ouvertes

Les lignes `required=true` du catalogue sont, dans l'ordre de flux :

1. `bmad-prd` (phase `2-planning`) — non démarré
2. `bmad-architecture` (phase `plan`) — non démarré
3. `bmad-create-epics-and-stories` (phase `plan`) — non démarré
4. `bmad-sprint-planning` (phase `plan`) — non démarré
5. `bmad-build` (phase `ship`) — non démarré

### C5 — Installation BMad non suivie par Git

`git status --porcelain` signale `?? .claude/skills/` et `?? _bmad/` : l'installation
BMad et les skills ne sont pas encore versionnés sur `bmad/pre5-preparation`. Ce constat
est relevé à titre informatif ; la décision de versionner relève de l'utilisateur et
sort du périmètre de ce diagnostic.

## Preuves et tests

Aucun test logiciel n'était applicable à cette mission (diagnostic d'état, sans
modification applicative).

Commandes de preuve exécutées :

| Commande | Résultat |
| --- | --- |
| `cat _bmad/_config/bmad-help.csv` | 28 lignes de catalogue (2 modules, 2 lignes `_meta`) |
| `uv run _bmad/scripts/resolve_config.py --project-root .` | JSON fusionné (cf. C2) |
| `ls -la _bmad-output` | répertoire vide (`.` et `..` uniquement) |
| `ls .claude/skills` | 29 entrées |
| `ls AGENTS.md` | absent |
| `git status --porcelain` | `?? .claude/skills/`, `?? _bmad/` |
| `git rev-parse HEAD` | `6656fefc58330955f5ad74d513ce616ea51809b0` |

## Hypothèses non démontrées

- **H1** : la branche `bmad/pre5-preparation` a été créée pour préparer l'adoption de
  BMad sur le périmètre PRE5. Déduit du seul nom de branche ; aucune Issue, aucun
  document ni aucun commit ne l'atteste. Non démontré.
- **H2** : la voie `bmad-spec` (condensation du corpus `docs/` existant) serait plus
  économique que la voie `bmad-product-brief → bmad-prd` pour ce dépôt brownfield.
  Jugement d'orientation fondé sur le volume de `docs/`, non sur une mesure. Non démontré.
- **H3** : l'articulation entre le cycle BMad et la machine à états du protocole
  V1.3 (`PLAN_APPROVED`, désignation d'écrivain, barrières d'arrêt) n'est définie par
  aucune source lue. Ce point reste ouvert et devra être arbitré avant toute phase
  d'écriture BMad sur le code applicatif.

## Modifications réalisées

Aucune modification applicative. Seul ce rapport documentaire a été créé :

- `.github/orchestration/reports/2026-10-16_BMAD-HELP-ETAT-INITIAL.md` (nouveau)

## Éléments non corrigés ou hors périmètre

- Versionnement de `_bmad/` et `.claude/skills/` : hors périmètre (C5).
- Création de tout artefact BMad (brief, PRD, spec, architecture) : hors périmètre
  d'un diagnostic ; relève des skills recommandés ci-dessous.
- Installation du bloc `AGENTS.md` géré : hors périmètre (relève de `bmad-project-context`).
- Articulation BMad ↔ protocole V1.3 : hors périmètre, à arbitrer (H3).

## Vérifications restant à effectuer sur appareil réel

Aucune. Cette mission ne touche ni au code applicatif, ni au rendu, ni au comportement
sur appareil.

## Prochaine étape recommandée

Optionnel, mais recommandé en premier pour un dépôt brownfield :

1. `[PC]` `bmad-project-context` — installe le bloc d'instructions agents à la racine.
2. `[SPC]` `bmad-spec` — condense le corpus `docs/` en un `SPEC.md` exploitable par
   les skills suivants.

Prochaine étape **requise** par le catalogue : `[PRD]` `bmad-prd`, puis la chaîne
`[CA]` → `[CE]` → `[SP]` → `[BD]`.

Chaque skill doit être lancé dans une fenêtre de contexte neuve.

## Fichiers modifiés

- `.github/orchestration/reports/2026-10-16_BMAD-HELP-ETAT-INITIAL.md`

## Commit final

Renseigné ci-dessous après commit — voir la section « État Git ».

## État Git

- Branche : `bmad/pre5-preparation`
- HEAD de départ : `6656fefc58330955f5ad74d513ce616ea51809b0`
- Fichiers non suivis conservés tels quels : `.claude/skills/`, `_bmad/`
- Aucun fichier applicatif modifié, indexé ou commité par cette mission.

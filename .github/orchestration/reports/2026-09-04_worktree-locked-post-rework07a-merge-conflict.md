# WORKTREE_LOCKED — divergence Git et fusion inachevée après REWORK07-A

## Identification

- **Mission** : reprise du protocole KODJO depuis le dernier checkpoint GitHub (`Continue le protocole KODJO depuis le dernier checkpoint GitHub.`), immédiatement après la clôture de REWORK07-A.
- **Nature** : diagnostic — aucune correction, aucune résolution de fusion, aucun fichier applicatif ou documentaire modifié par cette mission.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Déclencheur** : au premier contrôle Git de reprise (`git status`), le worktree local s'est révélé dans un état de fusion inachevée avec des conflits non résolus, jamais initiée par cette session — voir « Constats ».

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Dernier checkpoint connu de cette session (poussé et vérifié synchronisé à la clôture de REWORK07-A) : `25e55f71cb02140fec9d6b1735f0b0ca75008d83`
- **HEAD local constaté à cette reprise** : `3f4447a5126cb96cb0d8daf53f129f72f7764928` — commit **non produit par cette session**, absent de toute trace de cette conversation.
- **HEAD distant constaté à cette reprise** (`origin/feat/creation-seance-catalogue`, après `git fetch`) : `725dd33edbac5769e467508985a21a28f87de426`.
- **`MERGE_HEAD` présent** : `725dd33edbac5769e467508985a21a28f87de426` — une fusion est en cours, non terminée.
- Base commune des deux historiques (`git merge-base`) : `25e55f7` — confirme que la divergence part exactement du dernier état que cette session avait laissé propre et synchronisé.

## Périmètre demandé

Reprise standard du protocole : lire les commentaires GitHub depuis le dernier checkpoint, appliquer toute autorisation nouvellement publiée.

## Périmètre réellement traité

**Diagnostic uniquement.** Avant toute lecture de commentaire GitHub ou tentative d'implémentation, le contrôle Git de préconditions (branche/HEAD/propreté du worktree, obligatoire avant `IMPLEMENTING` per protocole) a révélé un état bloquant. Conformément à la barrière `WORKTREE_LOCKED` et à l'interdiction de réalignement Git spontané, **aucune tentative de résolution, d'abandon (`merge --abort`) ou de commit de fusion n'a été effectuée**. Seules des commandes de lecture strictement non destructives ont été exécutées (`git status`, `git log`, `git diff`, `git fetch`, `git merge-base`, lecture de fichiers) pour caractériser précisément l'incident.

## Constats

1. **Un commit local inconnu de cette session existe** : `3f4447a` (« docs(design): canonicaliser les contrôles UI et la section Tour »), auteur `Hermann Adjou`, horodaté `2026-09-04 11:20:11 +02:00`, posé directement sur `25e55f7` (mon dernier commit poussé). Cette session n'a produit aucun commit après `25e55f7` — ce commit provient d'une activité Git locale extérieure à cette conversation (très probablement l'utilisateur, directement ou via un autre outil, travaillant sur le même worktree physique pendant ou après la clôture de REWORK07-A).
2. **Trois commits distants inconnus de cette session existent également**, poussés par `MyUncried` entre `10:32` et `10:47` (soit avant le commit local ci-dessus) :
   - `2f506c1` — « docs(design): canonicaliser les sources des contrôles UI KODJO »
   - `447ad3d` — « docs(design): préserver le format du manifeste d'icônes »
   - `725dd33` — « docs(design): aligner les poignées d'activité avec le DSF »
3. **Une fusion (`git merge` ou `git pull`) entre ces deux historiques a été engagée mais jamais terminée** : `MERGE_HEAD` est présent, et **3 fichiers portent des marqueurs de conflit non résolus** (`<<<<<<<`/`=======`/`>>>>>>>`) :
   - `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` — 1 conflit.
   - `docs/Specifications-fonctionnelles/12 – Architecture technique.md` — 5 conflits.
   - `docs/Specifications-fonctionnelles/13 – Contrats d'écran.md` — 2 conflits.
4. **Des fichiers non conflictuels de cette même fusion sont déjà indexés (`git add` implicite de la fusion)**, prêts à être committés une fois les conflits résolus : `assets/icons/manifest.json` (nouvelles entrées `composition.fixed`, `wheel.action.cancel`, `wheel.action.validate`), `assets/icons/composition-fixed.svg`, `assets/icons/wheel-action-cancel.svg`, `assets/icons/wheel-action-validate.svg`, deux nouveaux rapports de mission (`2026-09-04_activity-card-movable-icons-alignment.md`, `2026-09-04_canonical-ui-controls-traceability.md`), et `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` (fusion propre, sans conflit).
5. **Nature des conflits** — inspection directe (lecture seule) des marqueurs :
   - `07 – Registre des décisions` : les deux côtés attribuent un contenu **différent** au même identifiant `D-100` (collision d'identifiant de décision — le côté local documente l'intégration de la synthèse au conteneur Tour, le côté distant documente une règle de traçabilité canonique des contrôles réutilisables et introduit un nouveau `D-101` sur `Action / Back`/icônes structurelles).
   - `12 – Architecture technique` : divergences sur plusieurs lignes du tableau de traçabilité canonique (Header/Back, Wheel Cancel/Validate, Tour Section) — le côté local porte des libellés plus détaillés (dimensions décomposées) et un paragraphe entier « Anatomie canonique — Nombre de tours » absent du côté distant à cet emplacement.
   - `13 – Contrats d'écran` : même paragraphe « conteneur extérieur / en-tête interne transparent » du Tour présent côté local, absent côté distant au même endroit ; une clause de test bloquant plus détaillée côté local.
   - Dans les trois fichiers, le motif est cohérent : le côté local (`3f4447a`) a ajouté un contenu absent du côté distant (`725dd33`) au même emplacement structurel que des éditions distantes indépendantes — un conflit de contenu réel, pas un artefact mécanique trivial (fin de ligne, espace) résoluble sans arbitrage.
6. **Aucun fichier de code applicatif (`src/`) n'est concerné par ces conflits** — uniquement de la documentation (registre de décisions, architecture technique, contrats d'écran) et des assets/manifeste d'icônes, déjà indexés sans conflit.
7. **Absence de verrou d'écrivain (`ai-orchestration-writer.lock`)** : aucun fichier de verrou n'existe dans `.git/`, confirmant qu'aucune session Claude Code n'a revendiqué l'écriture pendant cet incident — la concurrence provient d'une activité Git extérieure au protocole d'écrivain unique (l'utilisateur directement, ou un autre outil), pas d'une collision entre deux sessions Claude Code.

## Preuves

```
git status --porcelain (extrait)
 A  .github/orchestration/reports/2026-09-04_activity-card-movable-icons-alignment.md
 A  .github/orchestration/reports/2026-09-04_canonical-ui-controls-traceability.md
 A  assets/icons/composition-fixed.svg
 M  assets/icons/manifest.json
 A  assets/icons/wheel-action-cancel.svg
 A  assets/icons/wheel-action-validate.svg
UU "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md"
 M "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md"
UU "docs/Specifications-fonctionnelles/12 – Architecture technique.md"
UU "docs/Specifications-fonctionnelles/13 – Contrats d'écran.md"

git status (résumé)
"Your branch and 'origin/feat/creation-seance-catalogue' have diverged,
and have 1 and 3 different commits each, respectively."
"You have unmerged paths."

git rev-parse -q --verify MERGE_HEAD
725dd33edbac5769e467508985a21a28f87de426

git merge-base HEAD origin/feat/creation-seance-catalogue
25e55f71cb02140fec9d6b1735f0b0ca75008d83

git log --oneline origin/feat/creation-seance-catalogue..HEAD
3f4447a docs(design): canonicaliser les contrôles UI et la section Tour

git log --oneline HEAD..origin/feat/creation-seance-catalogue
725dd33 docs(design): aligner les poignées d'activité avec le DSF
447ad3d docs(design): préserver le format du manifeste d'icônes
2f506c1 docs(design): canonicaliser les sources des contrôles UI KODJO

grep -c '^<<<<<<<' sur les 3 fichiers en conflit : 1, 5, 2 (total 8 hunks)
```

Aucune déclaration non vérifiée : chaque constat ci-dessus est directement issu d'une commande Git ou d'une lecture de fichier reproductible.

## Hypothèses non démontrées

- L'identité exacte de l'acteur ayant produit le commit local `3f4447a` et engagé la fusion inachevée n'est pas vérifiable depuis cet environnement au-delà du nom d'auteur Git (`Hermann Adjou`) et de l'horodatage — cette session ne peut pas confirmer s'il s'agit d'une action directe de l'utilisateur, d'un autre outil, ou d'une autre session Claude Code locale opérant hors de la protection du verrou d'écrivain.
- L'intention derrière la divergence du numéro de décision `D-100` (contenu différent de chaque côté) n'est pas déterminable sans arbitrage — impossible de savoir si l'un des deux contenus doit être renuméroté, fusionné, ou si l'un supersède l'autre.

## Modifications réalisées

**Aucune.** Ce rapport est purement diagnostique, conformément à `EXCEPTION EXPRESSE` non invoquée ici — le rapport documentaire reste dû et est produit ci-dessous, mais aucun fichier applicatif, documentaire métier ou de configuration n'a été modifié, résolu, committé ou abandonné par cette session.

## Éléments non corrigés ou hors périmètre

- La résolution des 8 conflits dans les 3 fichiers de documentation est explicitement hors périmètre de cette session tant qu'un arbitrage n'a pas déterminé quel contenu (local, distant, ou fusion des deux) doit prévaloir — en particulier la collision d'identifiant `D-100`.
- Aucune lecture des commentaires GitHub de l'Issue #35 n'a été effectuée au-delà de ce qui était nécessaire pour ce diagnostic : la reprise normale du protocole (lecture des nouveaux commentaires ChatGPT, éventuelle implémentation) est suspendue jusqu'à résolution de cet incident, conformément à la priorité de `WORKTREE_LOCKED` sur la poursuite normale du cycle.

## Vérifications restant à effectuer

- **Décision humaine/ChatGPT requise** sur la manière de réconcilier les 8 conflits, en particulier la collision `D-100` (renumérotation, fusion de contenu, ou suppression d'un côté) — ceci constitue une décision sur les sources de vérité (registre des décisions), explicitement réservée par le protocole KODJO à ChatGPT/l'utilisateur, jamais résolue unilatéralement par Claude.
- Une fois la fusion résolue et committée (par l'acteur désigné), revalidation complète du contexte avant toute reprise d'`IMPLEMENTING` : branche, HEAD, propreté du worktree, delta depuis le nouveau checkpoint — aucune autorisation d'écriture antérieure (y compris celle de REWORK07-A) n'est supposée encore valide après résolution d'un `WORKTREE_LOCKED`, conformément à `.github/AI_ORCHESTRATION_CONTINUITY.md`.
- Vérification, une fois la fusion terminée, que `tsc`/`eslint`/la suite Jest restent verts avec le contenu documentaire fusionné (aucun fichier `src/` n'est concerné par les conflits, mais les nouveaux assets/manifeste indexés méritent une relecture rapide).

## Fichiers modifiés

Aucun, par cette session. Liste des fichiers actuellement en attente dans l'index/le worktree du fait de la fusion externe inachevée (non produits par cette session) :

| Fichier | État |
|---|---|
| `assets/icons/manifest.json` | Modifié, indexé (fusion propre) |
| `assets/icons/composition-fixed.svg` | Nouveau, indexé (fusion propre) |
| `assets/icons/wheel-action-cancel.svg` | Nouveau, indexé (fusion propre) |
| `assets/icons/wheel-action-validate.svg` | Nouveau, indexé (fusion propre) |
| `.github/orchestration/reports/2026-09-04_activity-card-movable-icons-alignment.md` | Nouveau, indexé (fusion propre) |
| `.github/orchestration/reports/2026-09-04_canonical-ui-controls-traceability.md` | Nouveau, indexé (fusion propre) |
| `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` | Modifié, indexé (fusion propre) |
| `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | **Conflit non résolu** |
| `docs/Specifications-fonctionnelles/12 – Architecture technique.md` | **Conflit non résolu** |
| `docs/Specifications-fonctionnelles/13 – Contrats d'écran.md` | **Conflit non résolu** |

## Commit final et état Git

**Ce rapport ne peut techniquement pas être committé dans son état actuel** — impossibilité technique démontrée, pas une omission : tant que `MERGE_HEAD` existe et que des chemins non fusionnés (`UU`) subsistent dans l'index, Git refuse **toute** opération `git commit`, y compris restreinte à un fichier sans rapport avec les conflits (comportement Git documenté et constant : « fatal: Exiting because of unfinished merge », quel que soit le pathspec fourni). Cette contrainte a été vérifiée directement plutôt que supposée (voir la commande ci-dessous) :

```
git add "<ce rapport>"
git commit -m "docs: rapport WORKTREE_LOCKED"
→ error: Committing is not possible because you have unmerged files.
→ hint: Fix them up in the work tree, and then use 'git add/rm <file>'
→ hint: as appropriate to mark resolution and make a commit.
→ fatal: Exiting because of an unresolved conflict.
→ U	docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md
→ U	docs/Specifications-fonctionnelles/12 – Architecture technique.md
→ U	docs/Specifications-fonctionnelles/13 – Contrats d'écran.md
→ (exit code 128 — sortie exacte réellement capturée, pas une citation approximative)
```

Conformément à `CLAUDE.md` (« mission bloquée ou interrompue : un rapport d'état doit être produit et committé avant l'arrêt, **sauf impossibilité technique démontrée** »), le fichier de ce rapport est produit et versionnable, mais **non commité** — l'impossibilité est technique et démontrée ci-dessus, pas contournée par un choix de convenance. Il sera committé dès la première opportunité technique valide (soit par cette session après résolution/`WORKTREE_RESUME_APPROVED`, soit par l'acteur qui résout la fusion).

- Branche : `feat/creation-seance-catalogue`
- HEAD local au moment de ce rapport : `3f4447a5126cb96cb0d8daf53f129f72f7764928` (fusion en cours avec `725dd33edbac5769e467508985a21a28f87de426`)
- État Git final : **worktree non propre, fusion inachevée, non committable** — état à traiter par arbitrage avant toute reprise.

## Statut de reprise (`.github/AI_ORCHESTRATION_CONTINUITY.md`)

```
state: WORKTREE_LOCKED
waiting_for: résolution de la fusion (choix ChatGPT/utilisateur sur la réconciliation des 3 fichiers en conflit, notamment la collision d'identifiant D-100) puis WORKTREE_RESUME_APPROVED
next_actor: ChatGPT (arbitrage du contenu documentaire) puis utilisateur (résolution effective des conflits, cette session ne devant pas les résoudre unilatéralement) puis Claude Code (revalidation du contexte)
resume_from: 25e55f7 (dernier checkpoint stable connu de cette session, avant la divergence)
reason: fusion Git inachevée (MERGE_HEAD présent, 8 conflits non résolus dans 3 fichiers de documentation source de vérité) détectée au contrôle de préconditions de reprise, jamais initiée par cette session
required_input: décision sur la réconciliation du contenu conflictuel (notamment renumérotation ou fusion de D-100), puis résolution effective de la fusion par l'acteur désigné
branch: feat/creation-seance-catalogue
head_local: 3f4447a5126cb96cb0d8daf53f129f72f7764928
head_remote: 725dd33edbac5769e467508985a21a28f87de426
merge_base: 25e55f71cb02140fec9d6b1735f0b0ca75008d83
issue: #35
```

## Self-check Claude

- Aucune opération Git d'écriture ou destructrice n'a été exécutée : ni `merge --abort`, ni résolution de conflit, ni `commit`, ni `reset`, ni `checkout` de fichier. Seules des commandes de lecture ont servi au diagnostic.
- La tentative de commit du présent rapport a été réellement exécutée pour vérifier — et non supposer — l'impossibilité technique invoquée par l'exception `CLAUDE.md`.
- La cause racine (divergence Git externe à cette session, fusion inachevée) est distincte d'un `ORCHESTRATION_FAILURE` de transport/outillage : c'est une concurrence d'écriture sur le worktree physique, relevant explicitement de `WORKTREE_LOCKED` selon `.github/AI_ORCHESTRATION.md` (« Mode LOCAL »).
- Ce rapport sera committé dès que la fusion sera résolue par l'acteur désigné ; en l'état, son contenu est néanmoins consultable dans le worktree local.

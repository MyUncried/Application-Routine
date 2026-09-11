# Contre-audit indépendant final — PR #65 (KODJO V2 0.6.16)

## Identifiant et objectif de la mission

**Mission** : `CONTRE-AUDIT-PR65-KV2`
**Date** : 2026-09-11
**Objectif** : contre-audit indépendant final de la PR #65 de `MyUncried/Application-Routine` au commit `3e2f02e2d608c7f94e33082eeca00ec3f9363ebc`, portant sur le code réellement livré, les corrections `KV2-*`, les tests Ubuntu et Windows, le banc Windows PowerShell 5.1, l'isolation du runner, et la prise en compte de l'incident de suppression du delta non commité de `V2-BILAT-01`.

**Verdict demandé** : `RESUME_AUTHORIZED` ou `RESUME_BLOCKED`.

## Branche et commit de départ

| Élément | Valeur |
|---|---|
| Dépôt | `MyUncried/Application-Routine` |
| PR | #65 — `fix(protocol): harden KODJO V2 orchestration` |
| Branche PR | `protocol/kodjo-v2-0.6.16-hardening` |
| Commit audité (`headRefOid`) | `3e2f02e2d608c7f94e33082eeca00ec3f9363ebc` |
| Base | `9d314617f7e34c63d9f9991aa17ec6bff78a72c8` (= `origin/main` à la date de l'audit) |
| `mergeable` / `mergeStateStatus` | `MERGEABLE` / `CLEAN` |
| Diff net | 29 fichiers, +5302 / −116 |
| Branche locale de l'auditeur au démarrage | `main` à `7e4f6984a8aefb6018e908e183dd7dda56e2482d`, arbre propre |

Le commit audité correspond exactement au commit demandé. La base déclarée dans le corps de la PR (`9d31461…`) a été confrontée à `origin/main` : identique. Le compte de fichiers et de lignes calculé localement correspond exactement à celui publié par GitHub.

## Périmètre demandé

1. Code réellement livré au commit `3e2f02e2`.
2. Corrections `KV2-*` annoncées par `CHANGE_REPORT_0.6.16.md`.
3. Tests Ubuntu et Windows.
4. Banc d'intégration Windows PowerShell 5.1.
5. Isolation du runner.
6. Prise en compte de l'incident documenté de suppression du delta non commité de `V2-BILAT-01`.
7. Contrainte : ne rien modifier, ne pas relancer `V2-BILAT-01`.

## Périmètre réellement traité

L'intégralité du périmètre demandé a été traitée. Tous les points ont été vérifiés par contrôle direct des objets Git et par exécution locale, jamais sur la seule foi du rapport de la PR.

Une seule limite de preuve est assumée et nommée : le job Windows de qualification n'a pas pu être rejoué sur le runner auto-hébergé réel, hors de portée de l'auditeur. Il est attesté par le résultat CI du commit exact et reproduit à l'identique sur un poste Windows indépendant.

## Constats

### 1. Conformité du commit et de la base — CONFORME

`headRefOid` = `3e2f02e2d608c7f94e33082eeca00ec3f9363ebc`. `git merge-base origin/main 3e2f02e2` = `9d31461`, c'est-à-dire que la branche est exactement rebasée sur le HEAD de `main`. Aucun commit de `main` n'est absent de la PR.

### 2. CI du commit exact — CONFORME

Relevé via `repos/.../commits/3e2f02e2.../check-runs` :

| Job | Statut | Conclusion |
|---|---|---|
| `protocol` (ubuntu-latest) | `completed` | `success` |
| `protocol-windows-preflight` (self-hosted Windows) | `completed` | `success` |

### 3. Conservation à l'octet près des six demandes historiques — CONFORME

Les six blob OID de `.github/orchestration/queue/v2/` sont **strictement identiques** entre `9d31461` et `3e2f02e2`. Le diff net de la PR sous `queue/` ne contient qu'un ajout : `v2-consumed-registry.json`.

Les six `blob_oid` inscrits dans le registre d'obsolescence correspondent exactement aux OID réellement présents dans l'arbre. Vérification faite objet par objet.

### 4. Anti-rejeu — CONFORME, éprouvé de façon adverse

Épreuve conduite sur les **vrais** fichiers et le **vrai** registre, en rejouant chaque demande historique — suppression puis réintroduction dans un dépôt jetable :

| Épreuve | Résultat observé |
|---|---|
| Rejeu des 6 demandes historiques | `KODJO_QUEUE_CONSUMED_REFUSED` × 6 |
| Copie du contenu sous un nouveau nom de fichier | `KODJO_QUEUE_CONSUMED_REFUSED` (refus par `blob_oid`) |
| Relance de workflow (`run_attempt = 2`) | `KODJO_QUEUE_RERUN_REFUSED` |

Le refus est effectif par le chemin **et** par l'empreinte du contenu. Le renommage n'est pas une évasion.

### 5. Corrections `KV2-*` — CONFORMES au code livré

Contrôle ligne à ligne des corrections revendiquées. Points notables réellement démontrés dans le code :

- **KV2-02** — `git status --porcelain=v2 -z` : l'analyse des enregistrements a été vérifiée champ par champ contre le format Git — ordinaire 8 champs, renommage 9 champs plus enregistrement d'origine, non fusionné 10 champs, non suivi, ignoré, en-tête. L'analyse est exacte. Origine et destination d'un renommage sont toutes deux soumises au contrôle de périmètre.
- **KV2-02 / réserve 1** — la liste de publication est écrite en magie `:(literal)`, ce qui interdit à un chemin contenant un joker de capturer son voisin.
- **KV2-04** — écriture atomique `.tmp` puis `rename`, empreinte `payload_sha256` recalculée à la lecture, candidat illisible ignoré et non fatal.
- **KV2-05** — `source_head` est bien clé de sélection : `sameProvenance()` et `restoreFromPackage()` refusent un paquet capté sur une autre révision.
- **KV2-06** — la conservation précède le constat d'intégrité ; un paquet `REFS_MUTATED` est conservé puis explicitement refusé comme source de reprise.
- **KV2-07** — empreinte de **contenu** avant et après contrôles (`deltaFingerprint` / `fingerprintDrift`), qui détecte `MODIFIE`, `SUPPRIME`, `APPARU`, `DISPARU`, et non plus la seule comparaison d'ensembles de chemins.
- **KV2-09** — l'en-tête `extraheader` est posé puis retiré dans un `finally` ; le motif est ajouté au scanner, qui n'admet que les deux lignes exactes.
- **KV2-15** — `lstatSync` à la capture et à la restauration, avec refus explicite d'un lien symbolique.
- **KV2-19** — `npm ci` est bien exécuté **après** `git switch` sur `source_head`, et toute mutation du dépôt provoquée par l'installation est refusée nommément (`KODJO_QUEUE_DEPENDENCIES_MUTATED_REPO`).
- **KV2-23** — `lib/queue-contract.js` est la source unique ; les propriétés inconnues sont refusées.
- **KV2-24** — la réparation de `slice-bootstrap.schema.json` est réelle : une accolade fermante manquante rendait le fichier non analysable. Le fichier parse désormais.

**Preuve indépendante de la projection du schéma** : le fichier publié `lean-request.schema.json` est **byte-identique** à la sortie du générateur.

```
sha256 du blob commité   : 8f78786f06996ed2b49c7bbcd1c1d293f4b20429478f5a514fc41b8f641c909a
sha256 de la projection  : 8f78786f06996ed2b49c7bbcd1c1d293f4b20429478f5a514fc41b8f641c909a
```

### 6. Validation métier GitHub et identité du validateur — CONFORME, fermeture par défaut

`verify-authorizations.js` :

- sans client injecté et sans `KODJO_VERIFY_GITHUB=1`, l'admission échoue en `GITHUB_VERIFICATION_REQUIRED` ;
- le workflow `kodjo-v2-lean-queue.yml` pose bien `KODJO_VERIFY_GITHUB: '1'` sur l'étape qui appelle l'admission ;
- l'injection d'un client n'est atteignable que par l'API du module, utilisée par les essais, jamais par le point d'entrée CLI utilisé par le workflow ;
- `user_login` est obligatoire et doit désigner le propriétaire du dépôt ; un 👍 d'un autre compte est refusé et le nom du poseur est rapporté ;
- la revue indépendante est prouvée uniquement par des objets Git : `review_blob_oid` bien formé, présence au commit d'approbation **avec exactement cette empreinte**, verdict porté par le contenu, plan nommé par le contenu, et `REVIEW_PLAN_REVISION_MISMATCH` lorsque la révision déclarée ne porte pas le plan exécuté.

La limite `REVIEW_ACTOR_INDEPENDENCE_NOT_GUARANTEED` est nommée dans le code lui-même et remontée en sortie. Elle n'est pas masquée.

### 7. Index incomplet — CONFORME

`verify-staged-scope.js` compare l'index réel à la liste autorisée **dans les deux sens** : `KODJO_QUEUE_STAGED_SCOPE_VIOLATION` pour un chemin en trop, `KODJO_QUEUE_STAGED_INCOMPLETE` pour un chemin autorisé absent, `KODJO_QUEUE_NO_DELIVERY` pour un index vide. Un renommage indexé compte bien pour deux chemins. La remise à zéro de l'index (`git reset --quiet`) précède l'ajout borné, ce qui neutralise un contenu pré-indexé hors périmètre.

### 8. Isolation du runner — CONFORME

Le job `protocol-windows-preflight` ne fait **plus aucun `actions/checkout` à la racine de l'espace de travail**. Son unique checkout vise `_qualification/${{ github.run_id }}`, et les quatre étapes suivantes s'exécutent dans ce répertoire. Les étapes forensiques temporaires ajoutées pendant l'incident — inventaire des fichiers retenus, collecte du journal de session — ont été retirées par `cad0100`.

Le worktree persistant du runner n'est donc plus nettoyé par le job de qualification.

### 9. Incident de suppression du delta non commité de `V2-BILAT-01` — pris en compte, conclusions vérifiées

| Affirmation de la PR | Vérification indépendante |
|---|---|
| « Aucun commit ni fichier GitHub n'a été altéré » | **Confirmé.** Aucune branche `kodjo/v2-*` de livraison n'existe sur `origin`. Le delta n'a jamais atteint GitHub. |
| « Le journal de la session Claude a été sauvegardé » | **Confirmé.** Artefact `kodjo-bilateral-session-recovery-34574970004`, 550 491 octets, non expiré. |
| « L'état final exact des huit fichiers n'est pas reconstructible sans ambiguïté ; aucun développement déduit n'a été publié » | **Cohérent avec l'état observé.** Aucune livraison déduite n'existe. C'est le comportement protocolairement correct. |
| « Le job Windows utilise désormais un répertoire de qualification isolé par run » | **Confirmé** (voir § 8). |

**Point opérationnel daté** : l'artefact du journal de session expire le **2026-09-13T07:33:59Z**. C'est la seule trace survivante de la session perdue. S'il doit être conservé, il doit être téléchargé avant cette date. Ce point ne conditionne pas la fusion de la PR #65.

### 10. Absence de relance de `V2-BILAT-01` par la fusion — CONFORME

Point critique vérifié explicitement. `kodjo-v2-lean-queue.yml` se déclenche sur `push` vers `main` filtré par `.github/orchestration/queue/v2/*.json`.

Le diff net de la PR ne touche, sous `queue/`, que `.github/orchestration/queue/v2-consumed-registry.json`, qui **ne correspond pas** au filtre : `queue/v2-consumed-registry.json` n'est pas dans le répertoire `queue/v2/`.

**La fusion de la PR #65 ne déclenchera pas la file et ne relancera donc pas `V2-BILAT-01`.** En seconde barrière, même un déclenchement accidentel serait refusé : aucune demande ajoutée donne `KODJO_QUEUE_CARDINALITY_REFUSED`, et toute demande historique donne `KODJO_QUEUE_CONSUMED_REFUSED`.

## Preuves et tests

### Suite pilote — exécutée par l'auditeur sur Windows

Arbre du commit `3e2f02e2` extrait hors du dépôt audité (`git archive`), dépôt jetable, aucune modification du dépôt de travail.

```
commande : node tests/kodjo/run-all.js
résultat : tests 159 | pass 158 | fail 0 | skipped 1 | duration_ms 59299
```

**Reproduit exactement le chiffre annoncé par la PR pour Windows : 158 PASS, 1 SKIP.**

Le SKIP unique est identifié : `tests/kodjo/delta-scope.pilot.js:198`, test « réserve 1 · un chemin contenant un joker ne capture pas son voisin », conditionné par `skip: process.platform === 'win32' ? 'le caractère * est interdit par NTFS' : false`. Le saut est **justifié et strictement lié à la plateforme** : sur Ubuntu ce test s'exécute, ce qui explique le 159/159 annoncé. Aucune dissimulation d'échec.

### Banc d'intégration Windows PowerShell 5.1 — exécuté par l'auditeur

```
commande : PWSH=powershell.exe bash tests/kodjo/queue-integration/run-bench.sh
résultat : BANC: OK — 8/8 — code de sortie 0
```

Cas couverts et observés : `N1` nominal `IMPLEMENTED_AND_VERIFIED` ; `N2` renommage hors périmètre `SCOPE_VIOLATION` ; `N3` chemin accentué dans le périmètre `IMPLEMENTED_AND_VERIFIED` avec publication d'un seul chemin ; `N4` amorce de type invalide `KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID` ; `N5` amorce absente ; `N6` preuve déclarative `KODJO_QUEUE_CONTRACT_REFUSED` ; `N7` `REVIEW_PLAN_HASH_MISMATCH` ; `N8` demande nominale `ADMISE`.

Le banc exerce bien le parcours réel `run-queued-request.ps1` → `project-queued-request.js` → `start-kodjo-v2.ps1` → `run-local-claude.js`, avec pour seules doublures Claude et `gh`, et un `origin` nu local dont l'usage distant est explicitement refusé par le banc.

### Contrôles déterministes complémentaires — exécutés par l'auditeur

```
commande : node scripts/kodjo/validate-workflows.js
résultat : OK sur 46 workflows

commande : node scripts/kodjo/scan-remote-write-capability.js
résultat : NO_UNDECLARED_REMOTE_WRITE_CAPABILITY (52 fichiers analysés)

commande : analyse JSON de .github/orchestration/slice-bootstrap.schema.json
résultat : VALIDE

commande : comparaison sha256 projection / blob publié du schéma de file
résultat : IDENTIQUES
```

### Couverture adverse des invariants critiques — vérifiée

Chacun des diagnostics suivants est effectivement éprouvé par un test : `GITHUB_VERIFICATION_REQUIRED`, `GATE_USER_NOT_AUTHORIZED`, `GATE_REACTION_ABSENT`, `KODJO_QUEUE_STAGED_INCOMPLETE`, `KODJO_QUEUE_RERUN_REFUSED`, `KODJO_QUEUE_CONSUMED_REFUSED`, `REVIEW_PLAN_REVISION_MISMATCH`, `KODJO_QUEUE_UNKNOWN_PROPERTY`, `RECOVERY_SOURCE_HEAD_MISMATCH`, `RECOVERY_INTEGRITY_REFUSED`, `LEGACY_RECOVERY_BOOTSTRAP_ALREADY_USED`, `RECOVERY_PARTIAL_APPLY_REFUSED`.

## Hypothèses non démontrées

1. **Job Windows sur le runner auto-hébergé réel** : non rejoué par l'auditeur. Attesté par la conclusion `success` du check-run sur le commit exact et reproduit indépendamment sur un poste Windows tiers. L'environnement exact du runner reste `NON VÉRIFIABLE` par l'auditeur.
2. **Indépendance des acteurs de la revue** : `NON GARANTIE`, comme le code le déclare lui-même. Le contrôle établit que la revue existe, porte sur le plan exécuté et est habilitée — pas qu'elle émane d'une autre personne.
3. **Exhaustivité de l'audit de la spécification 0.6.16** : les 1837 lignes ajoutées ont été contrôlées sur les points de conformité de la révision — version courante, huit supersessions nommées, requalification de `contents: read`, §PARCOURS-LEAN. Une relecture normative intégrale ligne à ligne n'a pas été conduite et n'était pas demandée.
4. **Reconstructibilité du delta `V2-BILAT-01`** : non tentée et non demandée. La mission interdisait explicitement toute relance.

## Modifications réalisées

**Aucune modification applicative.** Le dépôt audité est resté strictement intact pendant toute la mission : `git status --porcelain` vide au démarrage comme à la fin, `HEAD` inchangé à `7e4f6984a8aefb6018e908e183dd7dda56e2482d`.

Toutes les épreuves ont été conduites sur des copies jetables hors du dépôt, dans le répertoire temporaire de session.

Seule modification documentaire : le présent rapport, conformément à l'obligation de livraison documentaire de `CLAUDE.md`, qui n'est pas suspendue par une instruction de non-modification applicative.

## Éléments non corrigés ou hors périmètre

Observations **non bloquantes** relevées pendant le contre-audit. Aucune ne conditionne la fusion ; elles sont consignées pour une tranche ultérieure.

1. **`resolve-run-directory.js` ne borne pas au run courant.** Il retourne le répertoire de run le plus récent par date de modification, sans lien avec le run en cours. Si un run meurt avant de créer son répertoire, l'artefact nommé pour ce run peut porter les données d'un run précédent. L'exploitation erronée est empêchée en aval : `restoreFromPackage()` refuse toute divergence de `slice_id`, `session_id`, `baseline_head` ou `source_head`. Écart d'étiquetage de diagnostic, pas de risque de restauration fautive.

2. **Duplication du littéral de version de schéma.** `run-queued-request.ps1` redéclare `kodjo.protocol.v2.lean-request.0.6.13` indépendamment de `lib/queue-contract.js`. Les deux concordent aujourd'hui, mais aucun test ne les épingle ensemble — la source unique revendiquée par `KV2-23` comporte donc encore ce contrôle redondant susceptible de dériver.

3. **Commentaire inexact dans le banc.** Les cas `N6`–`N8` annoncent être éprouvés « sur le module réellement appelé par le workflow, chaque demande ajoutée dans son propre commit », alors qu'ils appellent directement `validateQueueRequest` et `verify`, avec `void admit;`. `admit()` est bien couvert, mais par `tests/kodjo/queue-admission.pilot.js`, pas par le banc. Le commentaire surestime la portée du banc.

4. **Ancrage de l'identité du propriétaire.** `verify-authorizations.js` dérive le propriétaire autorisé de `bootstrap.repository`, un champ lu dans l'arbre, jamais confronté à `GITHUB_REPOSITORY` fourni par le runtime. Par ailleurs `slice-bootstrap.schema.json`, réparé par `KV2-24`, n'est appliqué nulle part dans le parcours lean. Sous le modèle de confiance du protocole — seuls des acteurs habilités poussent sur `main` — ce n'est **pas** une élévation de privilège, puisque forger cette chaîne exige déjà le droit de pousser sur `main`. C'est une occasion de défense en profondeur.

5. **Pagination des réactions.** `checkThumbsUp` lit `/reactions` sans pagination, soit 30 éléments par défaut. Au-delà, le 👍 du propriétaire pourrait être manqué. Le comportement resterait fermé (`GATE_REACTION_ABSENT`), donc sûr.

6. **Mojibake préexistant.** `run-local-claude.js` contient des libellés de diagnostic en UTF-8 doublement encodé (`modifiÃ©s`, `reÃ§u`). Préexistant sur `main`, 7 occurrences ; la PR en supprime 2 et n'en ajoute aucune. Cosmétique.

## Vérifications restant à effectuer sur appareil réel

Aucune vérification sur appareil mobile réel n'est applicable : la PR #65 ne touche aucun fichier applicatif du produit. Le diff porte exclusivement sur `.github/`, `scripts/kodjo/` et `tests/kodjo/`.

Reste à confirmer sur infrastructure réelle, hors de portée de l'auditeur :

1. Exécution du job `protocol-windows-preflight` sur le runner auto-hébergé — déjà `success` sur le commit audité, à reconfirmer après fusion sur `main`.
2. Téléchargement de l'artefact `kodjo-bilateral-session-recovery-34574970004` avant son expiration le **2026-09-13T07:33:59Z**, s'il doit être conservé.
3. Premier parcours de file réel après fusion, qui exercera pour la première fois en production la vérification GitHub obligatoire (`KODJO_VERIFY_GITHUB=1`) contre l'API réelle.

## Fichiers modifiés

| Fichier | Nature |
|---|---|
| `.github/orchestration/reports/2026-09-11_CONTRE-AUDIT-PR65-KV2.md` | Création — rapport de mission |

Aucun fichier applicatif, de script, de test ou de workflow n'a été modifié.

## État Git

- Dépôt audité `C:\Dev\Application-routine` : arbre propre, `HEAD` inchangé à `7e4f6984a8aefb6018e908e183dd7dda56e2482d` sur `main`.
- Le rapport est livré sur une branche documentaire dédiée, créée à partir de `origin/main` (`9d31461`) sans altérer ni l'arbre de travail, ni l'index, ni la branche `main` locale, ni la branche auditée `protocol/kodjo-v2-0.6.16-hardening`.
- Aucun `push`, `reset`, `rebase`, `merge` ni changement de branche n'a été effectué.

## Verdict

# `RESUME_AUTHORIZED`

Aucun défaut bloquant n'a été identifié.

Les six corrections exigées par la revue `CHANGES_REQUIRED` sont présentes dans le code livré et vérifiables. L'anti-rejeu est effectif par chemin et par empreinte, éprouvé de façon adverse sur les vrais fichiers. Les demandes historiques sont conservées à l'octet près. La validation métier GitHub est fermée par défaut. L'index est vérifié dans les deux sens. Les chiffres de tests annoncés sont exacts et reproduits indépendamment, et le SKIP unique est strictement lié à une contrainte NTFS. Le banc PowerShell 5.1 exerce le parcours réel et passe 8/8. L'isolation du runner corrige effectivement la cause de l'incident.

L'incident de perte du delta `V2-BILAT-01` n'a laissé aucune trace altérée sur GitHub, et la fusion de la PR #65 ne déclenche pas la file : `V2-BILAT-01` n'est pas relancé.

Les six observations du paragraphe « Éléments non corrigés ou hors périmètre » sont des améliorations de robustesse et de précision documentaire. Aucune ne compromet une barrière de conformité, et aucune n'exige de correction avant fusion.

---

*Contre-audit indépendant conduit sans modification du dépôt audité et sans relance de `V2-BILAT-01`, conformément au mandat.*

# Certification finale KODJO V2 — reprise `RESUME_DELTA`

## Verdict

**CERTIFIÉ — PASS**

Le parcours réel KODJO V2 d'interruption, de conservation du delta, de restauration depuis un artefact GitHub et de reprise `RESUME_DELTA` a été exécuté de bout en bout sur Windows PowerShell 5.1. Les onze exigences du périmètre sont démontrées sans correction, nettoyage manuel ni relance intermédiaire entre les deux phases finales.

La phase `INITIAL` et la phase `RESUME_DELTA` sont volontairement deux runs GitHub distincts : cette séparation est nécessaire pour prouver la disparition de l'état local et la restauration depuis un artefact durable.

## Références certifiées

| Élément | Valeur |
|---|---|
| Dépôt | `MyUncried/Application-Routine` |
| PR de certification | [#77](https://github.com/MyUncried/Application-Routine/pull/77) |
| Branche | `test/kodjo-v2-real-resume-delta-0.6.21` |
| Commit qualifié | `2959ce23e1fa4c011a93df21f36470d6f9ed90fa` |
| Baseline `main` pendant le test | `2cb6197198ae6e1f988a9472a3685048b832c8f4` |
| Tests pilotes | [run 34685870710](https://github.com/MyUncried/Application-Routine/actions/runs/34685870710) — `SUCCESS` |
| Phase `INITIAL` | [run 34686287653](https://github.com/MyUncried/Application-Routine/actions/runs/34686287653) — interruption contrôlée attendue |
| Phase `RESUME_DELTA` | [run 34686704447](https://github.com/MyUncried/Application-Routine/actions/runs/34686704447) — `SUCCESS` |
| Session Claude conservée | `9eb9b088-793d-4198-b675-4dd75d50a2d3` |
| Empreinte canonique du patch | `3af83bb232cc4d4574dfb075a1c0b6d3c72e1de19d4d943c4e3f5c88233f4bec` |

## Chronologie finale

Tous les horaires ci-dessous sont exprimés en heure de Paris le 12 septembre 2026.

| Étape | Horaire | Durée | Résultat |
|---|---:|---:|---|
| Commit correctif certifié | 11:26:47 | — | `2959ce2` |
| Tests pilotes | 11:26:52 → 11:33:39 | 6 min 47 s | PASS |
| `INITIAL` | 11:36:14 → 11:43:23 | 7 min 09 s | interruption contrôlée |
| Intervalle entre les runs | 11:43:23 → 11:46:11 | 2 min 48 s | — |
| `RESUME_DELTA` | 11:46:11 → 11:51:03 | 4 min 52 s | PASS |
| Parcours complet | 11:36:14 → 11:51:03 | 14 min 49 s | PASS |

Le statut GitHub rouge de la phase `INITIAL` est attendu : le workflow sort volontairement avec le code 75 après avoir produit et préservé les preuves de l'interruption contrôlée.

## Artefacts de preuve

| Phase | Artefact | Empreinte GitHub |
|---|---:|---|
| `INITIAL` | `10295398558` | `sha256:3139c7871c6bcd97599fb2edb534a32c6e544aa0a0d486f51e2086435103b696` |
| `RESUME_DELTA` | `10295957551` | `sha256:41a8baf1c62047dedb9fe38290a1591b33a5c0ccd84e5f1df83f247780274eba` |

Le paquet `INITIAL` contient le résultat, l'invocation, le paquet de reprise et le marqueur `controlled-interruption.json`. Le run de reprise télécharge ce même artefact au moyen de son identifiant de run source.

## Matrice de certification

| # | Exigence | Preuve observée | Verdict |
|---:|---|---|---|
| 1 | Invocation Claude sur une nouvelle tranche de fixture | `claude_invoked=true`, mode `INITIAL`, tranche `V2-QUALIF-01` | PASS |
| 2 | Interruption contrôlée après production d'un delta | `status=CONTROLLED_INTERRUPTION` après création de la fixture | PASS |
| 3 | Conservation du paquet de reprise | `recovery_package_preserved=true`, artefact INITIAL disponible | PASS |
| 4 | Suppression de l'état local du run | `local_run_state_deleted=true` | PASS |
| 5 | Restauration depuis l'artefact GitHub | téléchargement du run source `34686287653` par le run de reprise | PASS |
| 6 | Reprise `RESUME_DELTA` avec la même session | session source = session retournée = `9eb9b088-793d-4198-b675-4dd75d50a2d3` | PASS |
| 7 | Correspondance stricte run/request/session/source | contrôles des manifestes source, interruption, invocation et reprise | PASS |
| 8 | Delta final limité aux fixtures | seul `tests/fixtures/qualif-resume/result.txt` est modifié | PASS |
| 9 | Absence de perte du delta initial | empreintes source et reprise identiques : `3af83bb…f4bec` | PASS |
| 10 | Verrou libéré et runner nettoyé | verrou absent, `cleanup_status=PASS`, diagnostics vides dans les deux phases | PASS |
| 11 | Aucune publication distante par le test | `remote_branch_created=false`, `pull_request_created=false`, `integrated_in_main=false`; `main` inchangé pendant le test | PASS |

## Contrôles applicatifs et optimisation Jest

Les contrôles Jest, TypeScript et lint ont été exécutés avant et après chaque invocation Claude. Aucun test n'a été désactivé, sauté ou sélectionné partiellement.

| Phase | Contrôle | Avant Claude | Après Claude | Résultat |
|---|---|---:|---:|---|
| `INITIAL` | Jest — 1 024 tests | 112,138 s | 28,700 s | PASS |
| `INITIAL` | TypeScript | 3,527 s | 3,242 s | PASS |
| `INITIAL` | lint | 45,117 s | 11,343 s | PASS |
| `RESUME_DELTA` | Jest — 1 024 tests | 110,981 s | 27,562 s | PASS |
| `RESUME_DELTA` | TypeScript | 3,619 s | 3,160 s | PASS |
| `RESUME_DELTA` | lint | 45,110 s | 11,503 s | PASS |

L'optimisation Jest repose uniquement sur un répertoire de cache isolé, propre à chaque run, partagé entre le contrôle initial et le contrôle post-Claude. Le cache accélère les transformations lors du second passage sans mémoriser ni remplacer le verdict des tests. Le lint reste exécuté avec `--no-cache`.

## Défaut corrigé pendant la qualification

Le faux échec précédent comparait les octets du fichier restauré dans le worktree Windows, écrits en CRLF, à une empreinte initiale calculée en LF. Le contenu fonctionnel et le patch étaient pourtant identiques.

La règle certifiée compare désormais l'empreinte SHA-256 du patch canonique du paquet source à celle du paquet de reprise. Le contenu normalisé de la fixture reste contrôlé séparément. Le protocole de nettoyage n'a pas été modifié par cette correction.

## Conclusion

Le protocole KODJO V2 démontre la reprise réelle d'un delta après interruption, avec continuité de session, intégrité du paquet, confinement strict du périmètre et nettoyage complet du runner. Aucun incident résiduel bloquant n'est ouvert dans ce périmètre.

**Décision de certification : KODJO V2 `RESUME_DELTA` est certifié.**

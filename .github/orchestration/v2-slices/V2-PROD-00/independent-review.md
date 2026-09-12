<!--
Métadonnées de dépôt ajoutées par Codex ; le texte de la revue qui suit est
conservé mot pour mot.

Plan contrôlé : KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md
Fichier reçu : KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md
SHA-256 du texte reçu : 453895a6a351731cd61c420eeffa7458b03d4c2d7d31460babf901f02ea19894
-->

# Contrôle indépendant final — KODJO V2 parcours ordinaire

HEAD contrôlé : `90a88a96d9dd6ccd80e2f0611d20c6285f02e0b2`
Arbre source : `e69ddf4308de375ad3a4153436187ae6d4c1b000`
Base avant PR #78 : `e8df643fd9b556452fcd54ef2762aeee04990611`
Revue d'origine : `ORIGINAL-REVIEW.md`, HEAD revu `92eb816f`

Analyse seule. Aucun fichier modifié, aucune branche, aucun commit, aucun
workflow lancé, aucune IA invoquée.

## Intégrité du paquet

| Contrôle | Résultat |
|---|---|
| `SHA256SUMS.txt` | **12/12 OK** |
| Instantané source | `f52f43d218631a82b203e93a389d270119013c4e3232eb2246b3d2040df0e7a5`, conforme au sidecar |
| Plan du paquet contre plan du dépôt | **identiques**, octet pour octet |
| Diff `e8df643` → `90a88a9` | 16 fichiers, +772 / −15 |

Chaque levée ci-dessous est vérifiée sur l'instantané source et sur le diff,
pas sur `REMEDIATION-REPORT.md`. Quatre points ont été rejoués par exécution.

---

## État des réserves

### R-1 — Métriques corrompues quand le fichier de mesures est absent — **CLOSE**

`scripts/kodjo/cleanup-run-checkout.ps1`, `Write-Metrics`. La branche fautive
est remplacée par une distinction de type explicite :

```powershell
if ($metrics.storage -is [System.Collections.IDictionary]) {
  foreach ($key in $metrics.storage.Keys) { $storage[$key] = $metrics.storage[$key] }
} else {
  foreach ($property in $metrics.storage.PSObject.Properties) { … }
}
```

S'y ajoute une réamorce du schéma complet — `schema_version`, `github_run_id`,
`github_run_attempt`, `checkout`, `dependencies`, `toolchain`,
`package_lock_sha256` — lorsque le fichier était absent.

Rejeu exécuté sur PowerShell, chemin « fichier absent » :

```
storage = { volume_free_bytes_after_cleanup, kodjo_checkout_count_after_cleanup,
            checkout_bytes_before_cleanup }
schema_version = kodjo.protocol.v2.infrastructure-metrics.0.6.22
BOM présent : False
```

Les sept clés parasites `IsFixedSize`, `Values`, `IsReadOnly`,
`IsSynchronized`, `SyncRoot`, `Keys`, `Count` ont disparu. Couvert par l'essai
Windows « le nettoyage initialise des métriques saines si le fichier est
absent », qui assert explicitement l'absence de `Keys` et `Count`.

### R-2 — Instrumentation capable de rendre une tranche rouge — **CLOSE**

`.github/workflows/kodjo-v2-lean-queue.yml`. Les **trois** étapes
d'instrumentation portent désormais `continue-on-error: true` :

| Étape | `continue-on-error` |
|---|---|
| `Start infrastructure measurement` | **oui** — c'était la réserve |
| `Finish checkout measurement` | oui |
| `Preserve infrastructure metrics` | oui, et `if-no-files-found: warn` |

Le complément côté Node est présent : `record-infrastructure-metric.js`
introduit `optionalInteger()`, qui rend `null` au lieu de lever `*_INVALID`
quand une mesure de départ manque. Une mesure absente n'interrompt donc plus la
chaîne, ni à l'émission ni à la consommation.

Réponse à la question 2 de la mission : **non, l'instrumentation ne peut plus
rendre une tranche rouge**. Les trois points d'échec possibles sont neutralisés,
et le seul `throw` conservé sur ce chemin reste
`KODJO_QUEUE_DEPENDENCIES_FAILED`, qui sanctionne `npm ci` et non la mesure.

### R-3 — Checkout orphelin si l'utilitaire n'a pas été copié — **CLOSE**

L'étape `Clean current run checkout` comporte un repli autonome quand
`kodjo-cleanup-<run>-<attempt>.ps1` est absent. Le repli reprend **les mêmes
bornes** que l'utilitaire : `$runId -match '^[0-9]+$'`, chemin canonique égal à
`workspace/_kodjo/<run_id>`, parent égal à `_kodjo`, `RUN_CHECKOUT_IDENTITY_MISMATCH`
sinon, cinq tentatives bornées, `RUN_CHECKOUT_CLEANUP_FAILED` en cas d'échec.
La publication des métriques passe à `if-no-files-found: warn`, cohérente avec
son caractère non bloquant.

### R-4 — Point d'arrêt C4 absent du code — **CLOSE**

`scripts/kodjo/run-local-claude.js`. Le mécanisme existe, et sa position est
exactement celle exigée :

| Ligne | Élément |
|---|---|
| 732 | `writeRecoveryPackage(...)` — paquet atomique écrit |
| 740 | `if (certificationStopAfterRecoveryEnabled(request))` → `return 75` |
| 787 | `request.checks.map((name) => runCheck(...))` — premiers contrôles |

L'arrêt intervient donc **après** le paquet atomique et **avant** tout contrôle,
comme demandé. Le verrou d'exécution est libéré en amont, dans le `finally` de
l'invocation (ligne 705), donc l'arrêt ne laisse pas de verrou détenu.

Bornes d'activation, rejouées par exécution sur le module réel :

| Condition | Résultat |
|---|---|
| les quatre bornes réunies | `true` |
| hors GitHub Actions | `false` |
| hors file supervisée | `false` |
| variable absente — **état par défaut** | `false` |
| variable posée, autre tranche | `false` |
| variable posée à une autre valeur | `false` |
| tranche `V2-PROD-00` sans la variable | `false` |

La quadruple borne est effective : `GITHUB_ACTIONS === 'true'`,
`KODJO_SUPERVISED_QUEUE === '1'`,
`KODJO_CERTIFICATION_STOP_AFTER_RECOVERY === 'V2-PROD-00'` **et**
`request.slice_id === 'V2-PROD-00'`. Chacune est nécessaire. Le mécanisme est
inactif par défaut et impossible hors de la tranche exacte, en file GitHub
supervisée.

Le plan est aligné : la formulation au présent porte désormais sur un mécanisme
qui existe, nomme la variable, le statut `CONTROLLED_INTERRUPTION_AFTER_RECOVERY`
et la sortie 75.

### R-5 — Nom de l'artefact de métriques divergent du plan — **CLOSE**

Plan §9 : « Les mesures antérieures à `run-local-claude.js` vivent dans
l'artefact séparé `kodjo-v2-infrastructure-<run_id>-<attempt>`, qui contient le
fichier `kodjo-v2-infrastructure-<run_id>-<attempt>.json`. » Conforme au
workflow.

### R-6 — Garde anti-BOM ne couvrant pas le Lean Queue — **CLOSE**

Deux corrections, la seconde au-delà de ce qui était demandé :

- `kodjo-v2-lean-queue.yml` est ajouté à la liste gardée de l'essai « les
  preuves PowerShell sont écrites en UTF-8 sans BOM » ;
- les écritures passent à
  `[IO.File]::AppendAllText($env:GITHUB_ENV, "…`n", $utf8NoBom)`, **et** les
  deux écritures préexistantes vers `$GITHUB_OUTPUT` (lignes 333 et 350 du
  diff) ont été converties au même motif, alors qu'elles n'étaient pas visées
  par la réserve.

---

## Point 6 de la mission — le défaut du run #93

Le run `34708076159` (#93) a échoué sur Windows tandis qu'Ubuntu était vert. La
distinction demandée est nette et vérifiable dans le code final :

- **Comportement PowerShell testé** : l'essai comportemental de R-1, qui
  exécute réellement `cleanup-run-checkout.ps1` sous `powershell.exe`, avait
  **réussi** au run #93. Le nettoyage, l'identité et le schéma des métriques
  n'étaient pas en cause.
- **Défaut réel** : une assertion **structurelle** nouvelle lisait le YAML et
  exigeait `\n        continue-on-error: true\n`. Sur un runner Windows, le
  fichier arrive avec des fins de ligne CRLF ; la regex ne pouvait pas
  correspondre. C'est un défaut de portabilité de l'assertion, pas du protocole.
- **Correction** : `assert.match(block, /\r?\n        continue-on-error: true\r?\n/)`.
  L'exigence de fond est intacte — `continue-on-error: true` doit être présent
  dans le bloc de l'étape — seule la représentation des fins de ligne devient
  portable. Aucun assouplissement.

La correction est saine. Elle ne rend pas l'assertion plus permissive sur ce
qu'elle contrôle.

---

## Point 7 de la mission — garde-fous, cache, tranches

**Aucun garde-fou retiré ni conditionné.** J'ai audité les quinze lignes
supprimées, une par une : onze sont des remplacements d'écriture JSON ou de
sortie GitHub produisant un BOM, une est la lecture JSON de `lib/json.js`
remplacée par la version qui retire le BOM, une est une déclaration de
variables. Les deux seuls changements de comportement sont **durcissants** :
`if (!target) return null` devient un refus nommé en file supervisée, et
`throw 'KODJO_QUEUE_DEPENDENCIES_FAILED'` est déplacé après la mesure **en étant
conservé**. Aucune ligne `if-no-files-found` n'a été supprimée : les artefacts
de diagnostic et de reprise conservent leur réglage antérieur.

**Aucun cache ni contrôle ciblé activé.** Recherche sur le diff : aucune
occurrence de `actions/cache`, `cache:`, `TARGETED_FROM_DELTA` ou
`checks-impact-map`. La seule mention de `node_modules` reste la résolution du
binaire Jest pour relever sa version.

**Aucune tranche lancée par ce commit.** `V2-PROD-00` n'apparaît pas dans
`v2-activation-registry.json` — zéro occurrence — et `.github/orchestration/v2-slices/`
ne contient que `V2-BILAT-01`, `V2-QUALIF-00` et `V2-QUALIF-01`. Aucune demande
`V2-PROD-00` dans `queue/v2/`. Cohérent avec `METADATA.json` :
`campaign_activated: false`, `queue_request_created: false`,
`claude_invoked_by_validation: false`. L'issue #79 déclare elle-même que sa
création n'active rien.

---

## État des scénarios

| Scénario | État | Ce qui manque |
|---|---|---|
| **C1** — nominal jusqu'à la PR | **reste à exercer** | décisions humaines du plan §2 ; activation de `V2-PROD-00` ; création et préflight du périmètre `tests/kodjo-prod-qualif/` |
| **C2** — contrôle rouge, aucune publication | **reste à exercer** | mêmes prérequis que C1 ; le périmètre doit être réellement collecté par Jest pour qu'un contrôle puisse rougir |
| **C3** — reprise par `retry_of_run_id` | **reste à exercer** | mêmes prérequis, plus un run C2 produisant l'artefact source |
| **C4** — interruption contrôlée | **prêt côté mécanisme, reste à exercer** | mécanisme implémenté, borné et vérifié inerte ; exige C2 ou C1, l'activation de `V2-PROD-00`, et la décision explicite du plan §11 avant exécution |

Aucun des quatre n'est **bloqué** par un défaut protocolaire. Les quatre sont en
attente des mêmes prérequis humains et de périmètre.

Point de vigilance pour la préparation, et non une réserve :
`tests/kodjo-prod-qualif/` **n'existe pas encore** dans l'arbre fusionné, et
`jest.config.js` ne porte aucun `testMatch` explicite. Le préflight du plan §3 —
Jest collecte, TypeScript type-vérifie, lint parcourt, aucune importation depuis
`src/**` — reste entièrement à produire. C'est la première tâche de la
préparation versionnée, pas un manque de ce commit.

---

## Observations sans effet sur le verdict

1. **Garde structurelle partielle.** L'essai « toute instrumentation du Lean
   Queue est explicitement non bloquante » filtre les étapes sur
   `/(?:infrastructure measurement|metric)/i`. Ce motif capture
   `Start infrastructure measurement` et `Preserve infrastructure metrics`, mais
   **pas** `Finish checkout measurement`, dont le nom ne contient ni
   « infrastructure measurement » ni « metric ». Les trois étapes portent bien
   `continue-on-error: true` aujourd'hui — vérifié — mais la garde ne
   détecterait pas le retrait du drapeau sur la troisième. Correction d'un mot :
   ajouter `|measurement` à l'alternance, et porter le seuil de `>= 2` à `>= 3`.
2. **Mesure Claude perdue sur un arrêt C4.** Le `result.json` du statut
   `CONTROLLED_INTERRUPTION_AFTER_RECOVERY` n'inclut ni `claude_started_at`, ni
   `claude_finished_at`, ni `claude_duration_ms`, alors que ces valeurs sont
   calculées juste avant. Le plan §9 exige la durée Claude parmi les mesures
   obligatoires : un run C4 ne la fournira pas. Trois champs à reporter.

Aucune des deux ne bloque la fusion, déjà réalisée, ni le passage à la
préparation versionnée.

---

## Point 8 de la mission — passage à la préparation versionnée

**Oui.** La campagne peut passer à la préparation versionnée de `V2-PROD-00`.

Les six réserves sont closes et vérifiées sur la source, pas sur le rapport. Le
commit fusionné n'active aucune tranche, ne dépose aucune demande, n'invoque
aucune IA, et le mécanisme C4 est démontré inerte hors des quatre bornes.

Ordre recommandé pour la préparation, cohérent avec le plan §11 : créer le
périmètre `tests/kodjo-prod-qualif/` et produire son préflight ; activer
`V2-PROD-00` par bootstrap et entrée de registre ; puis seulement, poser le
commentaire soumis au 👍. Les deux observations ci-dessus peuvent être traitées
dans ce même lot.

Verdict: APPROVED

# VNext — périmètre figé et traçabilité de stabilisation

## Autorité et séparation des responsabilités

Décisions du 6 octobre 2026, conversation utilisateur : retrait HTML demandé
avant 187b8846 ; retrait total explicitement réitéré avant f15aa64e ; confirmation
qu'aucun contrôle visuel utilisateur n'est requis dans les tests jetables/réels ;
demande actuelle de revue profonde pour sortir des régressions. Ces décisions
priment sur les interprétations précédentes du banc de test.

| Couche | Ce qu'elle vérifie | Ce qu'elle ne doit pas demander |
|---|---|---|
| Protocole générique | Sources, exigences, scope, approbation, preuves, correction, reprise et clôture | Aucun mécanisme navigateur imposé par l'existence d'un type de preuve |
| Banc jetable / parcours réel de test | Vraies exécutions et refus sur une tâche artificielle, sans livrer l'application | Ni navigateur, ni rendu automatique, ni intervention visuelle de l'utilisateur |
| Validation produit | Fonctionnement et UX de l'application effectivement développée | Aucun PASS visuel déduit du pilote Boolean ; visuel réservé à l'utilisateur |

Les types `VISUAL_COMPARE` et `PENDING_DEVICE` dans les tests historiques servent
à vérifier la classification et le refus de fausses preuves par des fixtures
structurées. Ils n'exécutent aucun navigateur et ne demandent aucun contrôle
visuel à l'utilisateur pour ces tests. Les supprimer effacerait une protection
produit sans contribuer au retrait du navigateur.

## Chaîne des garanties et limites de preuve

Tous les chemins de modules ci-dessous sont sous `scripts/kodjo/lib/`, sauf
driver indiqué ; les tests sous `tests/kodjo/`. « Test » signifie une preuve
locale automatisée, pas un succès externe ou une approbation réelle du modèle.

| Obligation / instruction | Contrôle exécuté | Résultat / preuve accessible | Décision permise et test opposable |
|---|---|---|---|
| Source avant interprétation ; document/Figma ne changent pas d'autorité | `vnext-live-chain.observeSources`, `source-manifest`, `vnext-figma-launch` | Octets Git, fingerprints des unités, checkpoint de capture figée | Refus d'une source absente/réécrite ; `vnext-foundations`, `vnext-figma-launch-review` |
| Chaque exigence provient d'une unité source ; ambiguïté réellement nécessaire | `requirement-registry`, `planning-envelope` | Registry et DecisionRecord scellés | REQUIREMENTS_READY ou décision durable ; `vnext-requirement-registry`, `vnext-foundations` |
| Cibles existantes et nouveaux slots explicitement autorisés | `impact-graph` candidat Git et scan d'importeurs | CandidateManifest, DirectImportScan, ImpactGraph | IMPACT_READY, aucun path libre ; `vnext-impact-graph`, `vnext-git-batch` |
| Exigence → changement → test → preuve sans obligation cachée | `plan-contract`, `ui-atomicity-contract`, renderer de compatibilité | Plan canonique + projection Markdown décodée | PLAN_READY seulement si couverture exacte ; `vnext-plan-contract`, `vnext-ui-atomicity` |
| Pas de navigateur ni gate humain visuel dans le banc | Driver `qualify-vnext-figma-real-path`, packet scoped, règles CLAUDE/spec | Inventaire Figma OBSERVED_ONLY ; seul STATE Boolean DOCUMENT_ONLY requis | Aucun VISUAL_COMPARE obligatoire dans le plan du banc ; `vnext-figma-real-supervisor`, `vnext-functional-coherence` |
| CREATE concerne le nouveau comportement, pas remplacement de fichier | BINDING explicite ; ImpactGraph garde Screen/TEST MODIFY | Décision UI et scope inchangé du plan réel généré | Deux fichiers modifiables seulement ; `vnext-functional-coherence` |
| Deux transitions sur UN état partagé dans UN processus frais | `vnext-disposable-functional-contract.transitions`, appelé par `observe` | `execution.json` : ordre, nombre d'instances, valeurs retournées, scénarios | Première true puis deuxième false, sinon refus ; `vnext-functional-coherence` |
| Test livré distinct du contrôle indépendant de conservation | `runDeliveredTests`, puis `assertDelta` / child `preservation` | Receipt Node : cible, exit code, hashes Screen/TEST/KEEP + normal/sentinel | Un test vide ne suffit pas ; shared constant/missing/reforged refusé ; `vnext-functional-coherence` |
| Le reviewer peut effectivement lire les preuves annoncées | `compare`, `vnext-figma-implementation-review.prepare/actualFact` | Receipt embarqué dans execution.json, path externe et hash dans observed_files | Refus source dérivée ou artefact modifié ; `vnext-figma-launch-review`, `vnext-functional-coherence` |
| Revue sémantique distincte des gates mécaniques | `vnext-live-chain.reviewOrRecover`, `review-contract` | Réponse complète, process, hashes du dossier et cibles couvertes | APPROVE seulement avec couverture exacte ; `vnext-live-chain`, `vnext-review-contract` ; prochain vrai Claude reste à obtenir |
| Aucune écriture avant approbation exacte ; writer unique | `approval-handoff-contract`, `vnext-github-approval`, `vnext-preserved-controls`, admission | ApprovalTarget/Record et requête bit-for-bit + preuve GitHub | Refus actor/HEAD/mode/hash obsolète ; `vnext-approval-handoff`, `vnext-queue-admission` ; services GitHub injectés dans tests locaux |
| Scope et conservation après exécution du test | Driver `assertDelta`, `git-runtime-integrity` | Diff, fichiers non suivis, hashes avant/après, métadonnées Git | Refus helper/source auto-modifiée/shared modifié ; `vnext-figma-real-supervisor`, `vnext-v8-consolidation` |
| Correction causale, sans réécrire les acquis | `revision-contract`, `vnext-runtime.validateRevisionChain` ; faute Boolean bornée du driver | AllowedChangeSet, patch, finding ledger, bytes initial/corrigé | REVISION minimale ou arrêt si limite ; `vnext-revision-contract`, `vnext-functional-coherence` |
| Préserver une livraison déjà approuvée lors d'une correction | `vnext-delivery-preservation`, `vnext-post-acceptance` | Ancienne matrice + preuves conservées liées à la livraison et aux gaps owner | Pas de laundering FAIL/PENDING en PASS ; `vnext-delivery-preservation`, `vnext-proof-lifecycle`, `vnext-post-acceptance` |
| Transmettre le nouveau plan sans élargir les droits d'écriture | `vnext-runtime-plan`, `vnext-legacy-queue-adapter` | Identité de vue, journal, hashes du plan approuvé, lectures attestées | Restauration vérifiée, tampering préservé et refusé ; `vnext-runtime-plan`, `vnext-e2e-migration` |
| Réponse reçue / timeout / résultat partiel distincts | `vnext-review-process`, `vnext-live-chain.command` | stdout/stderr, signal/status/error, receipt complet ou interruption | Pas d'approbation après timeout ni de retry implicite ; `vnext-review-process`, `vnext-post-delivery-revision` |
| Reprise sans double appel ni double publication | `reviewOrRecover`, `execution-lock`, superviseurs et réservation GitHub | Dossier exact revalidé, started.json exclusif, réservation causale | Même résultat ou arrêt ambigu ; `vnext12-supervisor`, `vnext12-revision-supervisor`, `vnext-post-delivery-revision` |
| Conservation avant nettoyage | Driver `preserveFixture` | Bundle vérifié, delta patch, source livrée, hashes, status final | Nettoyage après preuve conservée ; sinon fixture retenue ; `vnext-figma-real-supervisor`, test clone réel du bundle |
| Qualification exacte et publication sans run actif | `vnext-github-qualification`, `vnext-publication`, writer-policy | Checks/run/SHA, checkpoint durable, lease de branche et inventaire de runs | Pas de publication opérationnelle si qualification manquante ; `vnext-proof-stability`, `vnext-remote-write-security` |
| Ordre contrôles → Claude → historiques | `kodjo-vnext12-disposable.yml` needs/if ; audit architecture séparé needs qualification | Jobs skipped après échec, qualification scope explicite | Historique non lancé après Claude REVISE ; `vnext-campaign-sequence` |
| Clôture et réserves restent explicites | `audit-convergence-contract`, `vnext-audit-register`, finalisation et device policy | Registre cumulatif et couverture distincte des preuves réelles | Pas d'APPROVE final fabriqué ; `vnext-audit-convergence`, `vnext-proof-lifecycle` ; PRE-1/cutover hors phase actuelle |

## Origines vérifiées et impossibilité de conclure trop tôt

- 37115247745 / 08cb8b93 et 36881458781 / 3a931996 sont des succès INITIAL et
  REVISION génériques conservés, pas le même benchmark Figma récent.
- c1ea9aef introduit le benchmark Figma ; 37325776512 / e0c766fe montre déjà une
  dépendance inconnue avant l'optimisation. Tous les défauts récents ne sont donc
  pas attribuables globalement à la réduction du dossier.
- b0bf7edf mélange réduction du transport, reconstruction et navigateur. Le
  navigateur est une extension non demandée, pas une conséquence nécessaire
  de l'optimisation. 187b8846 ne l'a retiré que partiellement, à tort.
- f15aa64e retire complètement le navigateur ; sa simplification omet dans le
  texte le rechargement du shared après effacement du cache. Le code de
  conservation reste correct mais son résultat n'est pas exposé explicitement.
- 37491799216 échoue en revue de plan avant implémentation, sans timeout et sans
  navigateur. Ses trois blocages ne sont pas trois défaillances nouvelles du
  runtime : une instruction fautive, une preuve mal exposée, une formulation
  ambiguë sur la continuité de l'état.

Références détaillées et preuves archivées : rapports
`2026-10-06_VNEXT_SYSTEMATIC_HISTORY.md`,
`2026-10-06_VNEXT_NO_BROWSER_REMOVAL.md`,
`2026-10-06_VNEXT_NO_BROWSER_RESULT_DIAGNOSTIC.md`.

La référence déterministe nouvelle confronte le vrai plan généré et le vrai
dossier de revue aux exécutions Node. Elle ne prouve pas encore qu'un vrai Claude
produira/lira correctement la livraison, ni l'absence de tout trou architectural.
La revue indépendante est requise avant préparation d'une relance réelle ; ses
findings doivent être confrontés au code et à l'autorité utilisateur.

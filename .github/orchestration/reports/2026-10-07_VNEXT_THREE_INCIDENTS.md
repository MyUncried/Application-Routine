# VNext — intégration des trois incidents, 7 octobre 2026

Mission `VNEXT_THREE_INCIDENTS`. Campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245`, tranche `VNEXT-12-QUALIF`, PR #269, branche `protocol/vnext-proof-stability-20260930`.

Départ local `f70c600d708aae5c77daa2661744067567e8e15e`, contrôleur publié `82e6ccc4dba4d124d77e9de4c9476d3d93421ed3`. Le départ local contient des rapports supplémentaires : publier seulement les fichiers de cette mission, sans réalignement ni force-push. Inventaire préalable : arbre local propre, aucune opération active sur les 249 runs de la branche examinés sur trois pages ; dernier réel REVISION #37548553181 terminé avec succès. Aucun doublon lancé.

## Diagnostic historique et conception

Analyse des consommateurs et de leur historique effectuée avant le choix des corrections. `dae652cfc31bdc7f36a2be604fc3ef16bb118b50` introduit la préservation de livraison ; `3ca40be0acf2001a59119ddfbec93c8ec171414a` raccorde la révision après acceptation et le plan exact ; `978d78198b27c55e56bff71a3dd0c310f5a3a50e` renforce les preuves et les dérogations. Ces mécanismes restent utilisés. Leur création n'est pas attribuée sans preuve à une optimisation de performance.

La réussite INITIAL #37538282108 et la réussite REVISION #37548553181 prouvent l'exécution et la vérification de leurs exemples. Elles ne comportent pas de clôture GitHub VNext. Les suites existantes peuvent appeler `verify-v2-finalization.js` dans une fixture ; cela ne constitue pas un consommateur opérationnel de clôture VNext. Lacune de raccordement démontrée par les points de sortie des deux superviseurs : ils terminent à l'implémentation vérifiée, sans `SLICE_CLOSED` VNext.

Le nouveau consommateur est exclusivement VNext. Il utilise la politique de preuves et la matrice complète existantes ; la finalisation V2, ses workflows, le registre V2 et PRE-2 ne sont pas modifiés. Une clôture locale de fixture porte explicitement `LOCAL_CERTIFICATION_DELIVERY`, `github_issue_closed=false`, `application_published=false` et n'est permise que pour `VNEXT-12-QUALIF`.

## Incident 1 — accessibilité et acceptation avec réserves

| Élément | Constat et traitement |
|---|---|
| Cause historique | Revue V2 APPROVE avec ACCESSIBILITY_CHECK/PENDING_DEVICE ; première finalisation #37244733631 refusée. Correction V2 #320, fusion `9fad303d`, puis premier contrôle passé à la tentative 2. Attribution à une divergence de règles, pas à l'optimisation VNext. |
| Couverture VNext avant correction | `device-proof-policy` commune aux vérificateurs de revue/finalisation et aux baselines VNext ; tests `vnext-proof-lifecycle` déjà présents. Types techniques PASS seulement ; accessibilité PASS ou attente ; dérogation DEVICE_CHECK conservée. Consommateurs : revue, `vnext-delivery-preservation`, `vnext-post-acceptance`, tests de finalisation de compatibilité. |
| Lacune | Aucun point de clôture VNext autonome ; une acceptation fonctionnelle et ses réserves ne possédaient pas de résultat VNext explicite distinct d'une conformité sur appareil. |
| Correction écrite | `vnext-finalization` et entrée `finalize-vnext-delivery` réutilisent `Delivery.validateUiProofs`, `validateNonUiProofs`, `Device.isDeferred`. Chaque attente acceptée produit une résolution USER_WAIVER référencée à la décision originale et reste PENDING_DEVICE. Preuves techniques échouées/manquantes refusées. Les dérogations nominatives et NOT_EXECUTED restent inchangées ; aucune attestation visuelle/accessibilité globale produite. |
| Tests | Suites de lifecycle et nouveaux négatifs : attente sans résolution, réserve inventée, mauvais HEAD, preuve manquante, FAIL/NON_VERIFIABLE/PENDING technique. Les suites existantes couvrent les assertions et dérogations non UI ; elles ne sont pas recréées. |
| Preuve sur données réelles | Rejeu en lecture seule de revue #5984104726, décisions #5985692286 et #5990475371, plan Git blob `014987f69b9738fbed839f9300733539b00505ca`. READY_TO_CLOSE, 31 attentes conservées, 31 résolutions comme dérogations utilisateur, deux réserves originales conservées, aucune conformité fabriquée. |
| Raccordement et limite | Entrée VNext appelée par l'étape ciblée de la campagne existante. Ce rejeu concerne les données réelles V2 clôturées ; il ne prouve pas une nouvelle finalisation GitHub VNext ni une conformité d'accessibilité. |

## Incident 2 — dernier incrément et livraison cumulative

| Élément | Constat et traitement |
|---|---|
| Cause historique | Tentative 2 #37244733631 : revue cumulative, finalisation limitée au dernier incrément, BodyZoneSelector absent à tort. #315/#318 avaient corrigé la revue ; #321, fusion `2a330266`, propage la couverture à la finalisation. Défaut de propagation d'un consommateur, sans attribution démontrée à l'optimisation VNext. |
| Couverture VNext avant correction | `vnext-delivery-preservation` distingue correction_write_scope et delivery_reference_scope, fusionne les critères conservés et impose FRESH_REVIEW_ALL_RETAINED_CRITERIA. Les contrats de plan/revue/requirements, l'adaptateur et `vnext-post-acceptance` le consomment. Tests de critère conservé, régression, remplacement et correction suivante déjà présents. |
| Lacune | Aucun consommateur final VNext ne produisait les deux listes Git et ne vérifiait les fichiers à la tête finale pour la clôture. La préservation historique ne suffit pas à certifier l'état actuel. |
| Correction écrite | Même calcul de couverture utilisé par le nouveau finaliseur : baseline et base d'incrément ancêtres de la tête approuvée ; listes séparées ; objets de fichiers réguliers présents dans l'arbre Git final ; cibles nouvellement livrées ou explicitement conservées. Revue fraîche et preuves techniques actuelles requises, PASS hérité refusé. Aucun élargissement de la portée de correction. |
| Tests | Livraison initiale et deux corrections ; fichier conservé ; suppression, absence, cible non livrée, régression/preserve FAIL, baseline sans filiation, tête différente, blob de plan différent et preuves d'une autre tête refusés. Les régressions fonctionnelles exécutées des critères conservés restent couvertes par la suite existante. |
| Preuve sur données réelles | Rejeu à `3780eb9287cf8bc60c79dc322c1662542469a389`, baseline `53cb05c782e17eb19d269f2724a0db3cfbceb1a2`, base du dernier incrément `10ac761ef453f360110bf7b668b3998487b071b3` : 28 fichiers incrémentaux, 146 cumulatifs ; BodyZoneSelector reconnu et présent dans l'arbre final. |
| Raccordement et limite | Consommateur VNext réel du rejeu ciblé ; données issues d'une livraison réelle antérieure. La preuve ne remplace pas une nouvelle revue de conformité de ce produit, ni plusieurs corrections exécutées par Claude dans une nouvelle PR VNext. |

## Incident 3 — versions exécutées et reprise

| Élément | Constat et traitement |
|---|---|
| Cause historique | Les tentatives 1/2/3 du routeur #37244733631 exécutent le même workflow à `b961719cd3e22704709d7c75c12b0a286bade2f1`. Les scripts sont relus depuis main, tandis qu'une relance garde la définition du workflow original. Le nouveau run #37281056162 à `2a3302669d211339031887914ebfd9ff354f06c8` réussit. Cause : sémantique de relance et sources de versions distinctes. |
| Couverture VNext avant correction | Têtes contrôleur et dossier approuvé distinctes, runtime gelé ; demande à consommation atomique, verrou de runner et reprise typée existants. Tests de concurrence et réponse perdue déjà présents. Consommateurs : superviseurs INITIAL/REVISION, live-chain, run-local-claude, consume-disposable-request/consume-queue-request. |
| Lacune | Pas de comparaison explicite des octets du workflow réellement exécuté avec ceux du contrôleur attendu ; pas de trace commune workflow/script/runtime/contrats. |
| Correction écrite | `vnext-execution-provenance` lit GITHUB_WORKFLOW_SHA/REF et les objets Git, vérifie les fichiers de travail des scripts contre leurs révisions exactes, conserve run/tentative et deux sources distinctes. Un workflow périmé demande un nouvel événement ; un runtime/contrat approuvé changé impose un nouveau handoff ; une correction du seul contrôleur conserve le runtime approuvé. Garde raccordée aux deux superviseurs et au passage ciblé, avant Claude/consommation. |
| Tests | Ancien workflow refusé, nouveau workflow reconnu ; contrôleur corrigé réellement lu dans un autre checkout que le runtime immuable ; dérive des sources refusée ; reprise de décision avec même tranche/revue/tête et référence originale ; décision différente refusée ; consommation atomique/concurrente et réponses perdues réutilisées ; fermeture locale idempotente et conflit refusé. |
| Preuve réelle disponible | Sources et tentatives V2 relues ; nouvelle décision #5990475371 renvoie à #5985692286, mêmes tête/revue/tranche et réserves. FINAL_OUTPUT #5990555369 et SLICE_CLOSED #5990557747 confirmés en lecture seule. Le passage ciblé enregistre sa propre provenance de workflow VNext ; aucune ancienne exécution n'est réétiquetée. |
| Limite | Le sélecteur de reprise fournit l'action appropriée ; il n'effectue pas de relance automatique de GitHub ni de nouveau marqueur humain. Ces actions appartiennent à la continuité existante et doivent respecter la consommation. Une interruption et reprise jusqu'à une clôture GitHub VNext restent à exercer. |

## Certification et preuves

Les cas sont inscrits dans `incidents/certification-cases.json` et dans le checkpoint existant. Nouvelle étape `CERTIFY_INCIDENTS` du workflow existant : suites limitées aux incidents et protections qu'ils consomment, puis rejeu des sources GitHub en lecture seule. Aucune nouvelle campagne, aucune session Claude, aucun navigateur, aucune qualification préalable Linux/Windows ou audit d'architecture ; INITIAL/REVISION/historiques acquis ne sont pas relancés.

- Nouveaux contrôles : 18 tests ciblés passent localement.
- Suites ciblées : **81 PASS, 0 FAIL, 1 SKIP**, résultat définitif consigné dans `evidence/vnext-incidents-20261007/targeted-tests.log` ; un test natif PowerShell est réservé au runner Windows.
- Vérification des consommateurs existants et de publication : 30 PASS, 0 FAIL, 0 SKIP, dans `wiring-tests.log`.
- Rejeu réel : `real-data-manifest.json`, `source-comments.json`, `source-attempts.json`, `real-data-replay.json` ; sources immuables et provenance retenues. Pas de fermeture locale fictive du cas PRE-2.
- Syntaxe JS, parsing YAML indépendant, politique d'écriture : PASS_WITH_FROZEN_LEGACY, aucun nouveau writer ; diff sans erreur. L'empreinte du workflow est actualisée dans la politique existante sans ajout de capacité.

**Statut : correction écrite et tests ciblés réussis ; raccordement au passage ciblé écrit ; certification opérationnelle complète NON OBTENUE.** Le cas END conserve NOT_EXECUTED pour une clôture GitHub VNext. Une fermeture locale de fixture et un rejeu V2, même verts, ne peuvent le fermer. Aucun contrôle sur appareil n'est requis par ces tests ; les réserves produit déjà décidées restent des réserves.

## Périmètre, fichiers et livraison

Fichiers : nouvelle entrée et module de finalisation VNext, module de provenance, script de certification ciblée, tests des incidents ; gardes des deux superviseurs ; workflow VNext existant ; validation de publication ; empreinte de politique ; request/checkpoint/cases de la campagne ; présent rapport et preuves. Aucun fichier V2/PRE-2 ou applicatif modifié.

La publication sélective doit partir du contrôleur publié ci-dessus avec contrôle de bail et relecture des opérations actives. Le commit publié, le run ciblé et l'état Git final sont renseignés dans le complément de livraison ; ne pas annoncer un run terminé avant observation de son résultat.

## Complément : premier passage réel ciblé et consommateur suivant

Commit publié `564acba33a19214032742c46a46f7c3ea431a32a`, run [37557921183](https://github.com/MyUncried/Application-Routine/actions/runs/37557921183) : **82 PASS, 0 FAIL, 0 SKIP** sur le runner Windows réel, rejeu réel PASS, INITIAL/REVISION/historiques et qualifications générales ignorés. Provenance enregistrée, ni Claude ni navigateur invoqué. Archive 11455990316, 32 544 octets, SHA-256 `055513d41de0b1efc601b20fafe55f06bc4e9b7b54a02629f1821d02f2834ab4`, conservée dans `evidence/vnext-incidents-20261007/37557921183/execution.zip`.

La vérification supplémentaire finalisation VNext → import de baseline reproduit `VNEXT_DELIVERY_BASELINE_NOT_APPROVED` (`consumer-before.log`). Cause introduite dans cette mission : nouvelle enveloppe VNext produite sans projection du format déjà consommé. Correctif minimal : projection compatible conservant tous les statuts/réserves, et lecture de la décision fonctionnelle originale dans le consommateur VNext, sans marqueur visuel requis. La même règle de résolution est partagée entre production et relecture ; une enveloppe rescellée qui enlève la décision, la résolution ou les réserves est refusée. Le consommateur recontrôle les sources humaines et les objets Git de la livraison. Aucune règle V2 n’est changée.

Tests complémentaires : finalisation → baseline → préservation suivante, absence de gate visuel pour l’acceptation fonctionnelle, falsification de résolution refusée ; relecture des données réelles jusqu’à l’admission de baseline PASS. Le passage suivant réutilise les 82 réussites et exécute seulement les deux suites affectées et ce rejeu étendu. La clôture GitHub VNext reste NON OBTENUE.

Précision de reprise : les scripts V2 étaient relus depuis main, mais les contrôleurs VNext sont gelés à la tête de leur événement. Une correction de script VNext exige donc aussi un nouvel événement si la tête initiale est ancienne ; une relance du même run ne suffit pas. Le sélecteur et son test expriment cette distinction. Le runtime approuvé et la décision applicable demeurent inchangés. Vérification complémentaire locale : **26 PASS, 0 FAIL, 0 SKIP**.

## Résultat final ciblé et état durable

Complément publié en `363e3d16eb821a4fc60b9763869405f805bb4fb8`, run [37559490452](https://github.com/MyUncried/Application-Routine/actions/runs/37559490452) : **26 PASS, 0 FAIL, 0 SKIP**, seules les suites finalization-incidents et delivery-preservation ont été exécutées. Le run réutilise explicitement #37557921183 ; les nombres se recouvrent et ne doivent pas être additionnés. Rejeu réel PASS, consommateur suivant `DELIVERY_BASELINE_ADMITTED`. Archives relues et digests vérifiés ; second ZIP 11455948259, 31 053 octets, SHA-256 `9bfa0d8182aa7be596394a792d07b06afa9f51995a14d14dd435fde00eba1ef1`.

Les provenances conservent séparément le workflow réellement chargé depuis refs/pull/269/merge et le contrôleur depuis la tête de PR. Dans ce passage en lecture seule, le champ runtime identifie l’entrée de finalisation exécutée ; il ne déclare pas une nouvelle exécution de l’application ni un nouveau développement Claude.

Correction écrite : oui. Tests automatiques et rejeu réel ciblé : réussis. Consommateur suivant : raccordé et vérifié. **Clôture GitHub opérationnelle VNext : non certifiée.** Le parcours réel actuel reste une livraison locale sans publication applicative, et la politique VNext n’autorise pas de writer de clôture produit. Le cas END reste ouvert ; une fixture SLICE_CLOSED locale et le succès V2 ancien ne le remplacent pas. Aucun changement de cette frontière n’est inclus dans la mission.

La demande passe à TARGETED_RESULT_RECORDED : publication du bilan et futurs commits documentaires ne doivent pas réexécuter les contrôles ni consommer de nouveau la demande. Aucun nouveau job ou déclencheur manuel n’est ajouté. Le dispatch terminal fait seulement sélectionner cet état ; les jobs de test et de développement restent ignorés.

État Git local propre après commit du présent bilan ; publications sélectives sans force-push. Le commit contenant ce bilan final est communiqué avec le lien du rapport après publication.

### Fichiers exacts de cette mission

- `.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json`
- `.github/orchestration/reports/2026-10-07_VNEXT_THREE_INCIDENTS.md`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37557921183/certification.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37557921183/execution-provenance.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37557921183/execution.zip`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37559490452/certification.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37559490452/execution-provenance.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/37559490452/execution.zip`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/consumer-before.log`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/consumer-completion.log`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/real-data-manifest.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/real-data-replay.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/source-attempts.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/source-comments.json`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/targeted-tests.log`
- `.github/orchestration/reports/evidence/vnext-incidents-20261007/wiring-tests.log`
- `.github/orchestration/vnext12/VNEXT-12-QUALIF/campaign-state.json`
- `.github/orchestration/vnext12/VNEXT-12-QUALIF/incidents/certification-cases.json`
- `.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json`
- `.github/workflows/kodjo-vnext12-disposable.yml`
- `scripts/kodjo/certify-vnext-incidents.js`
- `scripts/kodjo/execute-vnext12.js`
- `scripts/kodjo/finalize-vnext-delivery.js`
- `scripts/kodjo/lib/vnext-delivery-preservation.js`
- `scripts/kodjo/lib/vnext-execution-provenance.js`
- `scripts/kodjo/lib/vnext-finalization.js`
- `scripts/kodjo/lib/vnext-publication.js`
- `scripts/kodjo/qualify-vnext-figma-real-path.js`
- `tests/kodjo/vnext-finalization-incidents.pilot.js`

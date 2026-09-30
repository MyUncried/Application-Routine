# VNext — traitement ciblé de l’audit d’architecture

## Point de récupération vérifié

- #269 OPEN/DRAFT, branche `protocol/vnext-proof-stability-20260930`, HEAD source `a0e7379e166ec899180a186361f41123360ff908` ; base #268 `7176904974bffd1b5f01252724323a0fb2287442` inchangée.
- Run `36719499021` : qualifications Ubuntu/Windows SUCCESS ; architecture-audit SUCCESS signifie rapport livré, jamais APPROVE d’architecture.
- Rapport Claude : [source conservée](2026-09-30_VNEXT_ARCHITECTURE_36719499021_1.md), artefact `11101687312`, digest GitHub `sha256:387e0ba9fcf514a03f640dfe79f6b3c7fbc9607a7001c512fba549bbaa7a335b`.
- #267 MERGED au commit `48b444ededb735da47a42474c39e150224e92395`, candidat `771f5a40d231281188e5d470d6268f364ab7fd36`. Le corps courant cite qualification finale `36715298578` et reprise #249 `5911583358`. Aucune modification ou relance PRE-1 dans cette mission. La fusion du correctif n’est pas une preuve de fermeture de la slice PRE-1.
- Inventaire GitHub consulté : aucun run in_progress ; un run queued `34748621746`, workflow Lean Queue, datant du 13 septembre. Aucun retrait legacy ni absence de run reprenable n’est revendiqué. Ce run n’est pas annulé par cette mission.
- Le pilote historique `36719498905` reste FAILURE ; aucune réussite globale n’est déduite des qualifications dédiées.

## Dispositions des constats

La classification Claude est conservée. Les recommandations n’acquièrent pas de force normative par leur présence dans le rapport.

| Constat | Disposition ciblée | Preuve locale / limite |
|---|---|---|
| ARCH-ADAPTER-BLOBOID-NUL | Corrigé : NUL réel | Comparaison indépendante `git hash-object --stdin`, vide/LF/CRLF/Unicode |
| ARCH-ADAPTER-NEWLINE-JOIN | Corrigé : véritables lignes LF | Extraction `operation_kind` sur une ligne ; fichiers matérialisés et hashes Git indépendants |
| ARCH-ADAPTER-PATH-BACKSLASH | Corrigé : refus antislash, absolus et segments dot | Traversal Windows et Unix refusé ; aucune matérialisation distante |
| ARCH-SCANNER-DESTINATION-REGEX | Corrigé : classe whitespace réelle | Destination REST `repos/some-owner/x/contents/f` préservée |
| ARCH-RUNTIME-REVISION-OUTCOME-TRUSTED | Corrigé au runtime : reconstruction avec base/next artifacts | Outcome re-scellé à compteur nul refusé ; base liée à son graphe |
| ARCH-DIRECTSCAN-NOT-REDERIVED | Corrigé au runtime : scan rejoué sur Git | Scan amputé re-scellé refusé ; cible de scan encore liée aux MODIFY par ImpactGraph |
| ARCH-CANDIDATE-MANIFEST-NOT-BOUND-AT-GATE | Runtime lié au Git tree/application_head | Faux arbre refusé ; le transport GitHub courant reste à implémenter |
| ARCH-REVIEWCONTEXT-NO-REBUILD | Approval et final audit reconstruisent ReviewContext | Catalogue vide re-scellé refusé avant approbation et audit final |
| ARCH-REGISTER-GATE-DEMOTION | Toute variation de classe/sévérité/gate exige cause ; phases fermées | Démotion sans nouvelle preuve refusée ; références de preuve pas encore résolues par GitHub |
| ARCH-UI-APPLICABILITY-LEGACY-HEURISTIC | Requirement UI source-first + garde conservateur désormais VNext | UI hors racines reconnue ; dépendance au prédicat legacy retirée ; tests candidats exclus |
| ARCH-ERROR-POLICY-SWALLOWS-UNAVAILABLE | Correction compatible : WAIT_FOR_PROOF avant catégorie VNEXT générique | Toujours auto_retry=false ; pas d’activation réelle |
| ARCH-PACKET-ESM-BLIND | Refus explicite ESM statique non couvert | Dépendances inconnues restent NON_VERIFIABLE ; CommonJS lit les objets Git au revision exact |
| ARCH-REVISION-NEGATIVE-UNEXERCISED | Partiellement fermé | Outcome falsifié testé ; toutes les combinaisons transport/cause/ledger non E2E |
| ARCH-LF-CRLF-TAUTOLOGICAL | Fermé pour le contrat d’octets | Vrai Markdown CRLF refusé, OID indépendant différent ; publication Windows sans filtres reste à exercer |
| ARCH-PROJECTION-SELF-REFERENTIAL | Préparation stable avant approbation et admission testées en dépôt Git | Octets identiques avant/après approbation du commit ; consommateur `verify-authorizations.js` appelé avec fixture GitHub ; workflow/queue réels non raccordés |
| ARCH-AUDIT-MANIFEST-UNVERIFIED-FINGERPRINTS | Liaison candidat corrigée, fingerprints encore à résoudre | Candidate protocolaire différent refusé ; lecture des références normatives au SHA réel reste nécessaire |
| ARCH-ANTIREGRESSION-CARDINALITY-ONLY | Inventaire individuel ajouté ; certification toujours refusée | 165 INC, 138 T, 115 paragraphes sources ; substitution d’ID à cardinalité égale refusée ; aucune équivalence individuelle fictive |
| ARCH-TWO-CONVERGENCE-MECHANISMS | Liaison locale ajoutée au runtime | Registre HANDOFF lié lot/HEAD ; révision +1, limite figée, sujets conservés ; preuves/acteur non authentifiés à distance |
| ARCH-RESERVE-ON-PROOF-UNAVAILABLE | Conséquence de règle existante §23.1 : réserve ne ferme pas preuve obligatoire | Même ACCEPT_RESERVE laisse WAIT_FOR_PROOF ; tests refusent HANDOFF ; aucune nouvelle dérogation structurante |
| ARCH-CI-PATH-FILTER | CLAUDE.md inclus | Qualification distante du nouveau HEAD à vérifier ; aucun nouvel appel architecture sur synchronize |
| ARCH-MATRIX-LITERAL-NEWLINE | Correction documentaire minimale | Règles 5 et 6 séparées ; historique non modifié |
| ARCH-EXT-REGEX-UNESCAPED, ARCH-SHALLOW-FREEZE | Préférences non promues en exigences | Pas de correction opportuniste |
| ARCH-AUDIT-PROMPT-SELF-SUPPLIED | Recommandation tracée ; non appliquée à l’audit déjà exécuté | Artefact candidat/mission conservé, pas de second appel IA |
| ARCH-ATTESTATION-VALIDATE-SKIPS-FROZEN-ACCOUNTING | Ouvert avant cutover | validateAttestation ne reçoit pas encore policy complète |
| ARCH-CUTOVER-ATTESTATION-NOT-RECOMPUTED | Ouvert avant cutover | Attestation live à l’activation encore requise ; pas d’activation |
| ARCH-SCANNER-SURFACE-INCOMPLETE | Ouvert avant opposition effective | Extensions/racines/curl/Octokit/flow YAML/intégrité du scanner non entièrement couverts ; F01 historique exact non requalifié comme garantie exhaustive |
| ARCH-RETIREMENT-BARRIERS-UNEXERCISED | Ouvert avant cutover | Barrières avec vraie liste frozen et runs/replays à démontrer ; run legacy queued observé |
| ARCH-NO-PRODUCTION-CONSUMER | Ouvert pour VNext-12 | Aucun orchestrateur VNext réel, appels IA et entrée queue n’exercent encore tous ces contrats |
| ARCH-APPROVAL-TRANSPORT-UNAUTHENTICATED | Ouvert pour approbation réelle | Résoudre auteur/réaction et révocation depuis GitHub ; les chaînes fixture ne sont pas une authentification |

## Matrice historique et règles hors invariants

[Disposition individuelle](../KODJO_VNEXT_HISTORICAL_DISPOSITION.md) et [données source](../KODJO_VNEXT_HISTORICAL_DISPOSITION.json) conservent une ligne par INC/T, règle/scénario exact, responsabilité, chemins de mécanismes/tests candidats, preuve historique, statut courant et fermeture restante.

La lecture individuelle a été effectuée. Les équivalences ne sont pas qualifiées : les tests candidats sont des pistes, pas des preuves de couverture individuelle. Les 115 paragraphes normatifs hors code ont été extraits inclusivement ; leur qualification en clauses réellement applicables reste ouverte. Aucun ancien résultat PASS n’est réutilisé pour certifier VNext.

L’inventaire a révélé les lignes T-108/T-109 au format historique à six cellules : elles sont interprétées explicitement, sans modifier le registre canonique ni inventer une preuve supplémentaire. INC-084/T-057 (plafond historique) et T-100 (boucle transitive) portent une supersession ciblée ; leurs autres garanties restent à préserver.

Le validateur `vnext-historical-coverage.js` refuse une readiness par simple cardinalité. Il est testable mais pas encore raccordé à un workflow VNext-12, qui n’existe pas dans cette mission.

## Validation et risques

- Qualification locale avant publication : `node --test tests/kodjo/vnext-*.pilot.js` ; 173 tests / 173 PASS / 0 FAIL / 0 SKIP. Log local `/tmp/vnext-tests.log` ; aucune qualification distante du delta n’est encore revendiquée.
- YAML indépendant : 63 workflows acceptés ; invariants exécutables workflows PASS.
- Seconde passe ciblée : 19 documents liés contrôlés, aucun lien relatif manquant ; copie du rapport Claude identique aux octets du report.md d’artefact ; anciennes séquences sur-échappées absentes de l’adaptateur ; comparaison aux fichiers GitHub du HEAD source ; revue directe des chemins runtime→approval/revision, source UI→criteria et NON_VERIFIABLE→gate ; contrôle des anciennes chaînes dans les projections et du rapport source intact.
- Pas de modification applicative, PRE-1, #250/#252, queue active, registre legacy ou workflow legacy gelé. Pas de merge, activation, cutover, audit final ou VNext-12.
- Les signatures runtime/final audit sont resserrées : les appelants de test sont adaptés, les futurs appelants opérationnels devront fournir les artefacts exigés. VNext reste inerte.

## Suite bornée

1. Qualifier les corrections sur Linux/Windows au nouveau HEAD exact, sans rappeler l’audit architecture déjà reçu.
2. Résoudre les responsabilités et équivalences individuelles historiques ; extraire/qualifier les clauses réellement normatives des paragraphes inclusifs.
3. Raccorder producteurs, résolution des preuves, registre, transport authentifié et admission queue aux consommateurs réels.
4. Fermer les obligations requises avant VNext-12 ; dériver les scénarios depuis les lignes individuelles.
5. VNext-12 réel ensuite ; audit FINAL seulement après E2E, dossier complet et qualification exacte.

**État : correction contractuelle livrée pour qualification ; VNext global NON QUALIFIÉ.** Les lacunes ouvertes restent visibles ; aucun APPROVE n’est fabriqué.

## Qualification distante du premier delta et correction Windows

Premier delta publié : `bc8148b9682985fe97e6ab1c8d0357a567aeb9ef`, PR #269.
Run `36732616505` : Ubuntu SUCCESS ; Windows FAILURE (170 PASS / 3 FAIL /
0 SKIP), exclusivement `VNEXT_HISTORY_SOURCE_CHANGED` dans la nouvelle
suite de couverture historique. Le checkout Windows transforme LF en CRLF.
Correction : lecture des sources par `git show` au commit résolu exact,
conformément à INC-137 ; aucune normalisation implicite du contenu et aucun
affaiblissement des hashes. Fixture core.autocrlf=true avec vrais fichiers
CRLF : objets Git reconnus, lecture brute du checkout refusée.

Pilote historique `36732616506` : job protocol/Linux SUCCESS consulté ;
job Windows encore queued lors de la consultation. La suite locale élargie
sur le snapshot ne vaut pas qualification : 12 échecs faute de tokenizer
installé et 2 contrôles nécessitant l’historique Git absent du snapshot.
Les preuves CI au HEAD exact et clone complet priment sur ce snapshot.
Aucun échec historique n’est transformé en PASS fictif.

## Suite séquentielle : qualification et intégration préparatoire

HEAD `5c55d98b2cb4cc72139234207966f8e0184a972e`, run
[36733560820](https://github.com/MyUncried/Application-Routine/actions/runs/36733560820) :
Ubuntu et Windows SUCCESS, 174 PASS chacun, 0 FAIL, 0 SKIP ; syntaxe,
invariants workflows et whitespace SUCCESS. Architecture-audit SKIPPED,
conformément à l’absence de réaudit sur synchronize. Le pilote
[36733560836](https://github.com/MyUncried/Application-Routine/actions/runs/36733560836)
passe sur Linux ; son préflight Windows était queued au dernier contrôle.

Delta suivant : fichiers de transport préparables avant approbation,
contrôle des objets Git au commit approuvé, reconstruction canonique et
appel en lecture seule au consommateur legacy. L’ApprovalTarget exact doit
être présent dans le commentaire et la réaction ne doit pas précéder sa
dernière édition. Tests nominaux et refus en dépôt jetable avec API de
fixture : aucune approbation réelle fabriquée, aucun fichier de queue réel
créé, aucune activation modifiée. Le raccordement workflow/runner et les
contrats d’implémentation downstream restent ouverts.

La classification normative couvre 117 unités (115 paragraphes et 2 formats
plan/rapport), au texte et hash exacts, avec responsabilité/phase. Les deux
formats auparavant exclus sont réintégrés. Le validateur reconstruit la
couverture exhaustive depuis la source et refuse toute omission. Des flags
CONFORME ne remplacent pas les preuves individuelles résolues au candidat.
Les 165 incidents et 138 tests ne sont toujours pas certifiés équivalents.

Validation locale du delta : 179 tests VNext PASS / 0 FAIL / 0 SKIP ;
63 workflows YAML et invariants exécutables PASS. Cette validation locale
doit encore être qualifiée sur les deux OS au prochain commit publié.

État : étapes 1–2 qualifiées au HEAD ci-dessus ; étape 3 en cours, admission
préparatoire contribuant à ses preuves ; étape 4 non intégrée en production ;
étape 5 non déclenchée faute de clôture des prérequis. Aucun cutover/merge.

## Qualification de l’admission préparatoire et seconde lecture historique

Commit `c8f4ab49f3b2e0760aa2abbd4f880cb1ba5c5fd9`, run
[36736143207](https://github.com/MyUncried/Application-Routine/actions/runs/36736143207) :
179 PASS / 0 FAIL / 0 SKIP sur Ubuntu et Windows, syntaxe/invariants/whitespace
SUCCESS ; audit architecture SKIPPED. Pilote `36736143210` : Linux SUCCESS,
préflight Windows queued au contrôle. Cela qualifie les tests de préparation
et d’admission avec fixtures, pas un producteur/workflow VNext de production.

Seconde lecture des tables : T-113 à T-138 comportent neuf colonnes et placent
les références de test avant le résultat historique. Le premier inventaire
les interprétait comme le tableau à huit colonnes ; correction des 26
résultats/références sans changement des statuts de conformité VNext.
T-108/T-109 ont six colonnes et ne définissent aucun attendu distinct :
`expected_result=null`, sans duplicata inventé. Les 303 lignes exactes et
leurs hashes sont désormais conservés. Le validateur compare chaque champ
interprété à sa source et refuse une règle ou un résultat substitué.

Validation locale suivante : 180 tests VNext PASS / 0 FAIL / 0 SKIP.
La qualification distante de ce dernier correctif documentaire/validateur
reste nécessaire. Matrice globale toujours NOT_READY ; aucun scénario
historique fermé sur la seule réussite d’une suite.

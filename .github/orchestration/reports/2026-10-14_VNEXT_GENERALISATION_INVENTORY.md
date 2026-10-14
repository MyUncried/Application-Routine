# VNext — inventaire des activations, dépendances de tranche et raccordements

Date : 14 octobre 2026. Dépôt : MyUncried/Application-Routine.

## Conclusion

Le routage général vers VNext est activé pour les nouvelles tranches, mais le parcours opérationnel de revue ChatGPT/Claude reste limité à PRE-4. Le retour automatique commun ne couvre que les trois opérations de ce relais. Le contrôle de publication/CI conserve une dépendance à l'ancienne campagne de qualification. Le candidat #358 ajoute encore une option explicite pour la source fonctionnelle atomique ; la généralisation par défaut annoncée n'est pas encore publiée dans ce candidat.

L'inventaire distingue sept familles de corrections opérationnelles (N01–N07), une incohérence de configuration à vérifier (N08), et les constantes de qualification/héritage (H01–H05). Il ne confond pas activation de VNext, admission du relais, configuration d'une opération et autorisation humaine d'un développement.

## Baselines et portée

- `main` figé : `55aa34480d51472b540156e2e664b8528c511f6b`.
- PR #358, non fusionnée au contrôle : `363e27a7126b93e452f7ad6cb5c7ec17da6cc125`.
- Branche de préparation PRE-4 : `a7e5d2abccfe12888776f6aef57a19afc39e311a`, données et constructeurs de plan séparés du moteur commun.
- Variante Claude #344 : ouverte, non fusionnée, tête `9947f5223f4da59144f081ee57b0ea156bf957c6`. Ses trois fichiers de code ajoutés ont été lus séparément ; ils ne sont pas présentés comme du code en service dans main.
- Automatisations Work : état lu directement dans le compte. Les identifiants, activations et destinations observés sont consignés ci-dessous.

Inventaire statique : 1451 fichiers textuels versionnés, dont 230 fichiers sous scripts/kodjo, 75 workflows, 176 fichiers de tests et 970 autres fichiers de configuration, documentation ou preuve (dont trois instructions racines). Tous les fichiers scripts/kodjo exécutables pertinents sont inclus ; le fichier de règles d'exclusion du sous-projet n'est pas une unité exécutable. Aucun composite .github/actions n'existe dans ce tree. Le graphe des imports require littéraux des dix entrées opérationnelles comporte 95 fichiers ; les chargements dynamiques, adaptateurs de capture et appels de workflows ont été examinés séparément.

Méthode : extraction depuis les blobs du SHA figé (pas depuis les modifications locales), balayage intégral des scripts et workflows, recherche indépendante des identités/branches/numéros/options, vérification des appels et des consommateurs, lecture des contrats normatifs, comparaison avec les automatisations. Le filtre de motifs ciblés produit 23 fichiers avec occurrences sur 305 scripts/workflows ; les autres fichiers ont également fait l'objet du balayage, sans que l'absence de motif constitue une certification de conformité.

Exhaustivité : inventaire statique au tree et aux configurations explicités, concernant les dépendances de tranche, activations et raccordements. Ce rapport n'est pas un audit de correction de tous les algorithmes ni une qualification dynamique de chaque tranche. Aucun modèle, cycle produit, nouveau run de certification ou correctif n'a été lancé par cet inventaire. Les CI de #358 déjà engagées appartiennent au chantier précédent.

## Corrections opérationnelles

| ID | Étape | Décision attendue | Statut | Évidence exacte au SHA main | Conséquence et correction restante |
|---|---|---|---|---|---|
| N01 | Admission de revue | Toute nouvelle tranche VNEXT autorisée utilise le même relais | NON CONFORME | agent-relay.js:12–14 ; chatgpt-plan-review.js:15–16 ; KODJO_VNEXT_CHATGPT_AGENT_RELAY.md:3 | Les deux validateurs exigent littéralement VNEXT-PRE-4. Remplacer cette réserve par la vérification de l'identité, du routage VNEXT et des autorisations de la tranche fournie ; garder dépôt, acteur et hashes vérifiés. |
| N02 | Prérequis de lancement | Vérifier les dépendances réellement déclarées par l'opération | NON CONFORME | lib/vnext-agent-relay.js:30 ; les deux validateurs refusent également issue_number=340 | Le moteur commun exige la fermeture de #340 pour toute demande. Décorréler la condition PRE-3/PRE-4 du moteur commun ; conserver une protection d'un cycle existant par son état/registre, si nécessaire. |
| N03 | Déduplication et reprise | Retrouver une opération par ses références Git et son identité scellée | NON CONFORME | agent-relay.js:263 | priorInvocation extrait le commit depuis un titre répondant à « VNext PRE-4 … ». Un titre d'une nouvelle tranche ou un renommage du workflow rend la provenance inconnue et bloque. Dériver la référence à partir des données de run/commit/demande, en préservant les anciennes preuves et le refus d'une invocation ambiguë. |
| N04 | Sources fonctionnelles | Découpage précis commun à toutes les nouvelles préparations | NON CONFORME sur main ; PARTIELLEMENT CONFORME dans #358 | main lib/vnext-figma-launch.js:46–65 ; candidat #358 launch et launchAndProduce avec atomicDocumentUnits=false | main utilise une unité FULL_FILE de besoin pour tout le document. #358 possède le découpage précis, encore optionnel ; seul le script PRE-4 le demande. Activer le comportement dans l'entrée commune pour les nouveaux checkpoints et conserver une validation explicite des checkpoints historiques. Retirer l'activation particulière de PRE-4. |
| N05 | Validation de publication et CI Windows | Qualifier le changement courant sans consommer l'état d'une vieille campagne | NON CONFORME pour la généralisation de ce contrôle | lib/vnext-publication.js:8,12–22,68–75 ; kodjo-vnext-proof-stability.yml:64–72 | Le checkpoint et la demande VNEXT-12-QUALIF sont imposés ; la base de validation Windows peut provenir de v8_consolidation.parent_head. Ce code est appelé par la CI des nouvelles PR et par vnext-chain validate-publication. Séparer le contrôle du candidat courant de la fenêtre propre à une campagne ; prendre les références explicites du candidat/opération, sans retirer syntaxe, sécurité ni protections historiques. |
| N06 | Fin d'opération → retour Work | Toute opération asynchrone du parcours émet le signal commun après preuves vérifiées | PARTIELLEMENT CONFORME | workflow Work continuation:5 ; KODJO_VNEXT_WORK_TRANSPORT.json allowed_workflows ; signal-vnext-agent-continuation.js:20–28 ; agent-relay.js OPERATIONS | Un seul workflow producteur est enregistré. Les revues plan/scope/implémentation sont prévues, mais les fins de développement/queue, tests séparés, clôture et CI ne sont pas automatiquement branchées sur ce transport. Raccorder les familles d'exécuteurs avec leurs contrats d'archives et de résultats, pas créer une notification par tranche. Le nom PRE-4 du workflow est aussi un lien de configuration à migrer atomiquement si renommé. |
| N07 | Reprise après CI ou opération hors relais | Poursuite sans surveillance spécifique ajoutée pour chaque tranche | PARTIELLEMENT CONFORME | automatisation active « Poursuivre PRE-4 », id 6acebc5525bc8191a5530044d3b633fd ; prompt contenant #352, #358 et leurs checkpoints | Le rattrapage horaire est attaché à PRE-4. Il ne démontre pas un mécanisme générique pour les futures tranches. Faire porter la reprise par les opérations enregistrées et leurs états ; un éventuel surveillant de récupération doit lire ces données, pas être recréé individuellement. |
| N08 | Routage de destination Work | Binding Git et automatisation pointent vers la destination réellement utilisée | À CLARIFIER / NON VÉRIFIABLE pour l'effet sur la livraison | binding Git conversation_id=6ac7f420-2fd8-83eb-83ae-4c72a07603a5 ; automation Piloter VNext id 6aceac15818881918314f008b1742efc, conversation_id=6acf34ca-bfac-83ed-82bd-33adefbc2cbd | Le même automation_id est lié à deux conversation_id différents. L'écart de valeurs est constaté ; sa cause et son impact sur le réveil ne sont pas déduits. Vérifier la destination réellement gérée par Work et les accusés durables avant de corriger le binding. La présence d'une activation ou d'un last_run_time ne prouve pas la bonne reprise. |

### Reproduction ciblée de N01

Une demande synthétique scellée, avec les mêmes champs et le même dépôt, passe le contrôle de forme pour VNEXT-PRE-4 ; remplacer seulement slice_id par VNEXT-AUDIT-OTHER produit AGENT_REQUEST_SCOPE_REFUSED. Aucun objet Git, aucune revue ou autorisation n'est prétendu réel par cette reproduction ; elle ne vérifie que le verrou de forme du validateur.

### État des automatismes externes observés

| Automation | Activée | Destination | Dernier déclenchement observé | Limite de preuve |
|---|---|---|---|---|
| Piloter VNext — événement sur transport #356 | Oui | 6acf34ca-bfac-83ed-82bd-33adefbc2cbd | 14 octobre, 09 h 56 Paris | Incohérence de conversation avec le binding Git ; effet non établi. |
| Poursuivre PRE-4 — reprise horaire | Oui | 6acebf48-4798-83ed-8d7e-d053d832df9b | 14 octobre, 10 h 07 Paris | Spécifique à la tranche. next_run_time nul au contrôle ; cela ne permet pas de conclure à une désactivation ni à une poursuite effective. |

## Constantes historiques, restrictions intentionnelles et noms résiduels

Ces occurrences sont inventoriées mais ne doivent pas être supprimées indistinctement.

| ID | Famille | Évidences | Statut et traitement |
|---|---|---|---|
| H01 | Banc VNEXT-12-QUALIF / #269 | prepare-vnext12.js ; prepare-vnext12-revision.js ; execute-vnext12.js ; qualify-vnext-figma-real-path.js ; qualify-vnext-functional-reference.js ; certify-vnext-incidents.js ; lib/vnext-github-qualification.js ; workflow kodjo-vnext12-disposable.yml | Banc historique délibérément borné : campagne, branche, issue, sources et parfois runs précis. auto_continue y est une option de campagne, pas un réglage d'une nouvelle tranche produit. Garder les preuves ; ne pas utiliser ce banc comme moteur nominal. Le débordement réel de sa dépendance vers la CI commune est couvert par N05. |
| H02 | Ancien signal de campagne | signal-vnext-cycle-continuation.js:3–12 ; wake-orchestrator des workflows de qualification | Signal attaché à l'ancienne campagne et activé par auto_continue=true. Conserver comme historique ; ne pas le présenter comme retour générique. Le nouveau signal commun est N06. |
| H03 | Clôture locale de certification | lib/vnext-finalization.js:125–144, closeLocally exige VNEXT-12-QUALIF ; tests de finalisation | Fonction limitée à une certification locale. finalize et le CLI de finalisation produisent un résultat générique ; le CLI n'appelle pas closeLocally. Restriction réelle mais pas verrou du chemin de clôture GitHub produit actuel. Ne pas détourner cette fonction pour de nouvelles tranches ; généraliser seulement si une clôture locale produit est réellement prévue. |
| H04 | Clôture GitHub et protections d'héritage | lib/vnext-github-closure.js:8–31,45 ; KODJO_VNEXT_ACTIVATION.md ; workflow kodjo-vnext-closure.yml | Chemin produit générique présent, base main obligatoire pour GITHUB_SLICE_DELIVERY et routage vérifié. Restent les protections littérales #269/V2-PRE-1/V2-PRE-2, revision_limit=1 et les références par défaut de branche de certification. Ce ne sont pas des opt-in produit. Si refactorisés, dériver les exclusions du registre et les paramètres de certification du contexte ; ne pas supprimer les protections des anciens cycles. |
| H05 | Qualifications/corrections ponctuelles et noms | kodjo-vnext-targeted-resolution-review.yml limité à fix/vnext-minor-reserves-20261008 ; exemptions de branche protocol/vnext-proof-stability-20260930 dans pilot/historical/proof-stability ; pre4-claude-availability-diagnostic.yml ; cache _kodjo_vnext_pre4_reviews | Workflows ponctuels/historiques ou noms résiduels. Le cache PRE-4 n'est pas un filtre de tranche : la clé de stockage dérive de l'identité d'opération. Ne pas confondre un intitulé avec un verrou fonctionnel ; N03 est en revanche un titre effectivement interprété. Réconcilier ces chemins dans la documentation et éviter de les copier pour un nouveau parcours. |

## Variante Claude non intégrée (#344)

Les trois fichiers ajoutés de code ont été contrôlés à la tête 9947f522 : claude-pilot.js, lib/vnext-pilot-designation.js, lib/vnext-pilot-review-relay.js. La désignation du pilote est opt-in par tranche, via pilot-designation.json ; sans désignation le pilote reste ChatGPT. C'est un choix d'orchestrateur, pas l'activation d'un correctif. En revanche, la variante comporte EXCLUDED_ISSUES=[340] et une exclusion du nom PRE-3 ; ce périmètre particulier doit être réexaminé avant toute intégration. Aucun de ces fichiers n'est en service dans main, et leur présence dans une PR ouverte ne démontre aucune généralisation du parcours courant.

## Éléments communs déjà en place et paramètres normaux

| Axe | Statut statique | Évidence / limite |
|---|---|---|
| Protocole par défaut des nouvelles tranches | CONFORME au critère « VNEXT par défaut » | activation.json default_protocol=VNEXT, status=ACTIVATED ; slice-protocol-routing.js lit les blobs Git ; Cutover.routeSlice utilise le registre figé pour les anciennes tranches. Le passage par une identité/activation de tranche prépare ses données, pas une activation particulière d'un correctif. |
| Capture et autorité Figma/document | Générique | file_key, frames, states et documents proviennent des entrées ; aucune frame PRE-4 fixée dans le moteur vnext-figma-source/launch. Le découpage fonctionnel manque sur main : N04. |
| Exigences, impacts, plan, critères et preuves | Générique par contrats | SourceManifest, RequirementRegistry, ImpactGraph, PlanContract et UiAtomicityContract reçoivent l'identité et les données. Les mappings de modules métier/ED-xx des constructeurs PRE-4 sont des données de plan ; ils ne sont pas des activations du moteur. |
| Reprise de réponse et déduplication | Moteur commun présent, portée non généralisée | Cache/reçu/réponse réutilisés sans appel ; lock et refus d'invocation inconnue communs. Les accès restent limités par N01–N03. |
| Appropriation du plan par le propriétaire | Gate légitime conservé | reserve-gate, request-approval, deriveQueue et admission exigent l'approbation exacte. Ce n'est pas une intervention technique à supprimer. |
| Exécution et tests | Capacité générique avec compatibilité de queue | Handoff projette une queue vérifiée ; run-local-claude et run-queued-request.ps1 consomment les contrats VNEXT. Le CLI handoff matérialise localement la demande ; le pilote doit encore publier le transport. La fin de cette famille n'est pas inscrite au réveil commun : N06. |
| Revue d'implémentation et finalisation | Contrats génériques | Adaptateur de revue présent ; finalisation commune depuis sources et preuves exactes. Un succès de code/test ne prouve pas le fonctionnement réel d'une nouvelle tranche. |
| Clôture produit distante | Entrée générique présente | Request path paramétrable et demande scellée par identité ; N06 reste pour son retour Work. H04 distingue les paramètres/anciennes protections. |

Les paramètres repository, slice_id, issue_number, branche, HEAD, sources, Figma, périmètre d'écriture, acteurs autorisés, approbation exacte et destination de preuve doivent rester variables et vérifiés. Le projet peut être limité à son dépôt et à son runner configuré sans rendre un mécanisme spécifique à PRE-4. Une liste fermée d'opérations ou de producteurs n'est pas en elle-même une activation par tranche ; elle devient une lacune de parcours si une opération requise n'y est pas raccordée.

Les propriétés auto_retry=false des registres/proofs empêchent une répétition aveugle d'une invocation ; elles ne prouvent ni l'absence ni la présence d'une correction causale conduite par le pilote. Elles ne constituent pas un opt-in de tranche.

## Vérification transverse et seconde passe

La première passe a trouvé les gardes de slice_id, l'issue #340 et les points de signal. La seconde passe a couvert les titres de runs, chemins de cache, branches de CI, validateurs de publication, usages de closeLocally, constantes de certification, imports et appels depuis les entrées communes. Les recherches ont été répétées avec des motifs plus larges sur tous les scripts, y compris Python/PowerShell. La restriction PRE-4 est également explicitement conservée par le document normatif du relais ; son affirmation de « moteur commun » ne vaut donc pas universalité du déploiement.

Aucun test global ou audit Claude n'est nécessaire pour établir les restrictions de code décrites ici. La reproduction N01 est ciblée. Ce rapport conserve les contrôles d'intégrité, d'autorisation, de concurrence et d'identité comme exigences attendues. Il ne propose pas d'éliminer un contrôle au seul motif qu'il bloque.

Points non démontrés : bonne destination réelle du réveil N08 ; exécution end-to-end d'une tranche produit distincte de PRE-4 ; disponibilité future du scheduler ; lecture sémantique exhaustive du gros catalogue. Le dernier point est un défaut de capacité de revue déjà connu, pas une activation spécifique supplémentaire. Aucune couverture sémantique ou réception Work n'est fabriquée.

## Ordre de consolidation

1. Généraliser ensemble admission, dépendances et identité des reprises (N01–N03), avec tests positifs sur au moins deux tranches différentes et préservation des anciennes preuves.
2. Mettre le découpage précis par défaut dans le constructeur commun (N04), sans opt-in de tranche et sans réécrire les checkpoints historiques.
3. Décorréler la publication/CI de l'état de qualification ancien (N05).
4. Raccorder les familles d'opérations restantes au même signal, réconcilier le binding Work et absorber le surveillant particulier dans le traitement commun des états (N06–N08).
5. Préserver les bancs et preuves historiques ; marquer les noms résiduels et chemins de certification comme tels (H01–H05), sans nouvelle campagne globale déclenchée par cet inventaire.

Les tests de généralisation doivent passer par l'admission et le workflow réel des deux identités, pas seulement par le publisher recevant des objets synthétiques. Aucun nouveau développement PRE-4 n'est autorisé par cet inventaire.

## Annexe — inventaire physique complet du périmètre figé

Les blob OID permettent de retrouver chaque version exacte. Cette annexe inventorie des fichiers ; elle ne convertit pas une absence de motif ou une preuve historique en conformité opérationnelle.

| Chemin | Blob Git | Famille |
|---|---|---|
| `.github/AI_ORCHESTRATION.md` | `6c2c7877066873b0bfaf347a3a850c44e8c07e32` | Configuration / documentation / preuve |
| `.github/AI_ORCHESTRATION_CONTINUITY.md` | `9884c49c202eb73f74b7683bb6d9e06abd38ab8c` | Configuration / documentation / preuve |
| `.github/orchestration/2026-09-04_tour-section-canonical-anatomy.md` | `644da545801259b2d8f3544c2905caa57b26d0d5` | Configuration / documentation / preuve |
| `.github/orchestration/2026-09-05_issue-comment-pagination-invariant.md` | `3219336430960e2f8ffe77479539a4d2978594a5` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.10.md` | `05ba58c4176c8beeeda650c4577d30b927595365` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.11.md` | `1e5de345f1ee73ab2c38f5e04df00fb7090fb21b` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.12.md` | `3793cbf5c9137d3e1554b962a8dcae70503fe689` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.16.md` | `989ef416333cfe1da673b7ea519ae3681b9b6668` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.17.md` | `d6baf01c4d0ce52f494442fbef20c87611d11685` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.18.md` | `14b1203f2394edfab328c9513c2ed4766010a150` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.18_LEAN_LAUNCH.md` | `809a7cb3b81277e0e3d5347b6591cb49a208ad4b` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.19.md` | `5a1840cc7057b08fa0e2ce2193460eb09ae29630` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.20.md` | `a73633ff4c067152c324d3fb83847f9e13eb5c1e` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.21.md` | `7f1bd9f450a35ace985646b50c6482dba7b153d4` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.22.md` | `787cd44a6e18c743a464d1c71119ed8c6e2e6642` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.23.md` | `e82a91739e6a5bcebf6a2aae78ade3f4dce67df4` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.24.md` | `522ef0c5a5d2d4e59e35b3c7839c491d0d961236` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.25.md` | `0222224296ce4d0be447157584079da6531c7b0b` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.26.md` | `11d9ca2a274ed7a04da4496b60ccc36261be10a8` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.27.md` | `342f13b1f1b82412ca52608e3da32c7e923964ea` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.28.md` | `0d0d486d07c82b769c300e56bdfe38396190dfa0` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.29.md` | `9440e1e2cb28734d23d4348d2328b4a57ab57bb1` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.30.md` | `1cdd707b1f14f30bae735368ea7d64950fe1ba83` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.31.md` | `feea2b3643047aa13ca19b16c38b6dee57744bf0` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.32.md` | `bef87e57e66451e013ff0409281575277a8fbf00` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.33.md` | `d6d1ad9403973095072ea2b5004ced5978c29c02` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.34.md` | `b702e3989517d4a6e9db6c9784c905f8e1f59576` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.35.md` | `6bba6f991b4e2ace480aef482387a307b225e488` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.36.md` | `845897ee926486e301a7447555e11d43393eca7f` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.37.md` | `d2a0307f4c1192a1eaef1517869149d82f3f55f8` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.38.md` | `a7b81095b83cf4a1db869d9b5e0e27528b87a3b9` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.39.md` | `46ea8ef410984ffcf9ce1744726528e3577b6b77` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.40.md` | `34dfc648f3afae6b6bc40e4891a1c611be111cd9` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.41.md` | `190143402bfca6b366b67085d35d3066705628fe` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.42.md` | `01872927fb5d76d5de4337f26eabab5e444485c2` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.43.md` | `926081a62c70131f8774e868a810a764ef552050` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.44.md` | `79e72a78f1bda38095ffb8cfd63ac51dccbed8ad` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.45.md` | `a5538e3479e6246e757490940d2546a2e35e53df` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.46.md` | `bbe51570154f75f099c8ebf98e33fb4b9fdc62f2` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.51.md` | `015ce85b40f136e648efe7edb0350c998cd66045` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.8.md` | `3aff53042e5bed798ec8fb43874be7d3f7265fa6` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_0.6.9.md` | `de50ddb08c5710d8121d0a66e237a365f41e794c` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_HANDOFF_APPLICATION_DRIFT.md` | `249b4471ca936c30c3c86c34de28407d50f5cce1` | Configuration / documentation / preuve |
| `.github/orchestration/CHANGE_REPORT_HANDOFF_UI_FINGERPRINT.md` | `af3ecce1d1e8f748209bf54b5a7496d5c0b8690a` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_CLAUDE_SESSION_RESUME_TEST.md` | `ea748bef15e510997442f42526b6c6e25d9e33e0` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PLAN_IMPACT_CONTRACT_0.1.md` | `aa8f648bc790fd5fccc55e4543238c311b6aed03` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PREFLIGHT_ARCHITECTURE_MATRIX_0.6.42.json` | `2481731bcb078fde11498430978458125e317e99` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md` | `6500b567cad89f546fb44e919cb1c6f86aaa9a72` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_NEXT_EVOLUTION_R1_R3_R4_CONTINUITY.md` | `78e3884243d0420bacac15737d5035f901b8c867` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.11.yml` | `6f2b4037fd65cf7c14b8edf5e665005498f04ff1` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.12.yml` | `19d7fbfef76feb7046f0f9cfd74591155d731ce9` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_PREFLIGHT_ARCHITECTURE_0.6.42.md` | `51b66fa98c8b17049e3190383ddd4b1f24ebb4cc` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.11.md` | `8bb046834d19ebdf0fe510ea82165f349dd33847` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.12.md` | `865459592cf096a79ad672e75609e012a9cad815` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.16.md` | `ab28dbbae8f261ac5ed4452936092868c202795b` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.17.md` | `57548f8f731ab17a43256b7d3e652a20e3e9a25d` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.18.md` | `0337191d47601ce025af567132a94ea4691ab2f6` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.19.md` | `dfce582c448a6fb1b5e8efb4e50a64e62ceb4750` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.20.md` | `1a12d13c3fc579d00eeac653fdca5efe818b0557` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.21.md` | `634109eedbd6362d810180a5098d7c7305d08118` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.22.md` | `fce57ffcab48565c21b8dc339fa8a392b9cbcda0` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.23.md` | `fc20d0435bf1ed3856f573b166ea45affe0db073` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.24.md` | `e3dac3d50220fc112589d2ff84df3ee6189a1e57` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.25.md` | `131b75b20c68c57d94f8458a2d4071cc8dc804a0` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.26.md` | `37f26145b84cd143c0e9e4f4cfcce4f8b63af694` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.27.md` | `485a8bfa2ba73aae00c29876c07ba7f53ff45502` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.28.md` | `a55765d915f9aee19cdb28930b7a89763ff1f811` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md` | `2783339cb3d6c9a1432f05d56f3dc8c97d6a7dcc` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.30.md` | `520e3f9a93ec828e56ff9d414e6bbf836a07277a` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.31.md` | `24cefcc6a1cfa6c3f5a30f254c2177b9ed02fd99` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.32.md` | `42f18132063801ab7799cc073a80f5d58dbf2b25` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.33.md` | `d16cd7893aa9798da2882c5ed06eac1b69eeb616` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.34.md` | `6409fd086daf0d777bec3690bac7fd9bc28e268e` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.35.md` | `883910ac40adab2e6656ae6e7e009978753c5d63` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.36.md` | `53a9e0b7b21ebab87302e640777b62b12c98ccb7` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.37.md` | `d1ed950873638841be2dd84f4d8fae5a26666beb` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.38.md` | `84e3bc2874e44c39ae2cd37b521fe484f53c5a27` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.39.md` | `0a8b04f3c0cabc275e8516bbb43d51e358dca4fa` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.40.md` | `92cf46e542970dc5b707b0c686f1fcebe0476f93` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.41.md` | `c8db8a480f5907427a365f48ef135803759f42f6` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.42.md` | `1acd4bdc9aa0e8d67f97d2db158f546e05c0a098` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.43.md` | `524233d95dc7338b3a525f8be414c7498c7367ee` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.44.md` | `564a37ee3684ed9db85fc73a2e2507a531d2a257` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.45.md` | `30fb96c30b60a0a31c5c9407d9c7358bd47748b6` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.46.md` | `3980d425b4cede1ddad0f75e87d51eb122faa966` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.47.md` | `c71111047bbc6520361d70cf7f720744ef0020d3` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md` | `cdc985f3a85655129bddfcedbb54e0119de95fef` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_T02_CHANGE_REPORT_0.6.3.md` | `74c3aad1e3ba3d11cf2df5e12145a262ea19752d` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_V2_T02_TEST_MATRIX_0.6.8.md` | `62f9587fe558482c737f3034a5daac0de450db40` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md` | `39a534a22a6ccd3d55fc828277a3a5fee83e5332` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_SLICE_PROTOCOL_V1.md` | `10614f4b581635a80861b65f90bde26e3711c2a2` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_V14_LOCAL_E2E_01_SPEC.md` | `7f14d8063e3e3af7d5a0b09520e5ebe4829b7533` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_V14_LOCAL_E2E_02_SPEC.md` | `a3d6b3f2548e297b476dc2f5179a3a8bf6e2c63c` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_V14_S09_PROTOCOL.md` | `513ede99843bcdfad0da94453a609cb61d7bbc14` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_V2_LOCAL_REQUEST_EXAMPLE.json` | `15c8b785264a16030328e5d29a119d34ffa5e352` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md` | `ad9a0ac8d6c498f235501200b4f28e16c1bb67b1` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_ACTIVATION.md` | `1aac1b1785457d963ef97eb86d63f120951bb457` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md` | `d52ae16fc43de13725bde1c93f372fcc4a52c34b` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_ARCHITECTURE_AUDIT_MISSION.md` | `4c237daf8f7293326f6ce5addb74fd6e3997cd80` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_01.md` | `69ba58d95e75ceb0e0d97d799499c10fea5c0131` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_02.md` | `7b959a08273ee4ccb8290837dc0d7b53d0575e6a` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_03.md` | `8a57c765e31c8e29a7f347481beb49015c8e6874` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_04.md` | `522ee031ea2f9415e2935c32eb85c8133172f5ec` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_05.md` | `95c2847e4bfeb8c4c5b4ec1be57d7f8a0d4857b2` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_06.md` | `d0c32348e10cbdc65e6cd5fd21f0ad5e28a06372` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_07.md` | `380b64385c83a6b4815a1d3f2e4b9201b79078f0` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_08.md` | `d523c934e2debb2cac2d33c36d4cee8b652cb736` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_09.md` | `9264472b3a2f6467c29b504e4d26163a9cf1ceac` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_10.md` | `a25c06a176746a21c6668021e4d7a060e8ab62f4` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_11.md` | `61c7c0b73332f9750ffa752a84068b2d2bcd1287` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHANGE_REPORT_F01.md` | `398eb4aee13d6256985e9be32609692d2bd2d66a` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHATGPT_AGENT_RELAY.md` | `e3a24f61aa387690ef7feaa9651e4ca42c72d4ee` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_CHATGPT_PRE4_REVIEW_RELAY.md` | `e20df562f77dd7d5baefa52a362bf23dbe67287b` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json` | `000dde197d99c8f8184a1bb72767c5c97ff649c8` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.md` | `905392bc23e0a776e5a4bfd76f156d0126ac9715` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json` | `40b10088d7675da2af0d6c06680e2dd99756e14d` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_PRE1_COVERAGE.md` | `6c29f75057d22536839535f997f5e3b555f4c866` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json` | `92a67c08d36945a509a9041368ea6b916798d663` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_STABILIZATION_AUDIT_MISSION.md` | `b4a9f5c39e7e020a1d9624e77c1ca0d70e05523c` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_STABILIZATION_TRACE.md` | `22c65aaeeb199065cae81ae4d9f3729e97ee87ce` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_WORK_CONTINUATION.md` | `bb2aeee5ab1a3948f64791483009937fedc073f1` | Configuration / documentation / preuve |
| `.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json` | `d5f2c23a97a83520138f4302c0bcb654c2843d4c` | Configuration / documentation / preuve |
| `.github/orchestration/PACKAGE_MANIFEST.md` | `93eaccd95fe0875b67524a120629cdc29547f7ba` | Configuration / documentation / preuve |
| `.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md` | `83f2c0b8ac400789273fea9d4b5c5ca56b86ece1` | Configuration / documentation / preuve |
| `.github/orchestration/README.md` | `5840a5b22cd6a626968e6125634673cba2bebfa2` | Configuration / documentation / preuve |
| `.github/orchestration/T1_T9_CLOSURE_20260829.md` | `bc058680ffecd786b0c54e12dccef39606067797` | Configuration / documentation / preuve |
| `.github/orchestration/archive/KODJO_PROTOCOL_INCIDENT_REGISTER_3.3.0_CORRUPTED.md` | `018e3e068f964fb0a14d7b3c411a798d2f5e58f1` | Configuration / documentation / preuve |
| `.github/orchestration/archive/KODJO_V14_S09_PROTOCOL_LEGACY.md` | `2e708b42d13618d8f0f34276a4907576b36b4c3e` | Configuration / documentation / preuve |
| `.github/orchestration/audit-deferrals.json` | `ce27634f989c931f98ccf9900a795798839bace5` | Configuration / documentation / preuve |
| `.github/orchestration/comment-routes.json` | `a69f2282f709fb5a7e740a3f6e4770943b2ca8f5` | Configuration / documentation / preuve |
| `.github/orchestration/lean-request.schema.json` | `401733e62735c8798a7c4ab51de1e6c0233d7095` | Configuration / documentation / preuve |
| `.github/orchestration/normative-inputs.json` | `a37f10f9f22521ae130561a005c6de2b2806764e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2-consumed-registry.json` | `7c5a37c4f9cd0249405fa73b864d4b7b2237b39a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-48f4221f.json` | `d177dff9bbd308c731f0be60d5edbe6c60a9f85f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-7c6b9224.json` | `8bce51dbab33e92e8e617462d6dcca8ace15a0da` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-aa43d55a.json` | `85471e2a8355b8e9e459ec9b8f3e4fc47773521c` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-aeff8a1e.json` | `812021df938b62fb3818d0cd13182c0dbe033aa6` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-browser-5f2a8d31.json` | `ce0c3877a8395c30850c87f3211b3b3167e38ddb` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-initial-f1b72a65.json` | `5d003c6470d66aa9393968e6afc31546918f8edb` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34582316734-7810f882.json` | `bf1edeeec57187aebc4cd02b9ff8a72912e4ab08` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34583615121-4d6cf66c.json` | `f79695b6de16b72fb7f3c0c288f18e6840c0ce48` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34583615121-5dd23c3d.json` | `f74cd0b08fbc7a99233e81cfc34d2983945a1620` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34583615121-8b471b7a.json` | `c1e1173399b3e479a531b10d9520e2fcc9056d76` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34583615121-f96acc12.json` | `8d156e1651d6d23c2c531b2d82612f13f18c9aa7` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-34605322274-54c3743c.json` | `a4cb6f63816b55aaa9986740613453cf5da9df17` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-50c14550.json` | `5f3f73bf01b26a4cf1814955c69972ea3bfba3bf` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-5bed685a.json` | `4b6737caacc87e8510e29c1fa3b2a7ee95c90074` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-9c3e2e7b.json` | `acbce0379311e668ad09e6da4b6895f43f6d5a10` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-approved-30170264.json` | `88a6e43fc9129bbe962ea014a1c23ad5d27a20d3` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-approved-fe6b56d1.json` | `05dda35ad7a850586f6bee1b6f57f22adfc3b3fd` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-c4a473b8.json` | `6cbb6bc963973eab433e595fd41b1d5afa1db36f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-certified-c04682f9.json` | `b74f798fbd17d8fd92d9dfd1703647132ccd6d3f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-checks-40d7a5aa.json` | `78ac3bee4b91c5493057a7e154456d4cdb24c005` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-checks-6d7bf27c.json` | `fa9594456cecc66402c0b32edc81f167af2689d5` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-checks-ff036c52.json` | `b115980553ec1f1ee8b80a5adae3bbe3fe2beca6` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-delta-920f719c.json` | `9520229caee5f88b03acc3db922c252fe46986b6` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-delta2-920f719c.json` | `6af4c84774ef24b00761bd0fe5175e3b83189a61` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-final-39a5a6bf.json` | `2ddd48e8127c58d14a1e3a8efa48af6997466a52` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-final-39cee884.json` | `a95955c95915d2c364074433fe71054a0d78823e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-resume-final-d4c5cdad.json` | `a6ae7bfbbcb3d53768b603430083a98e47d3642c` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-retry1-81adf83f.json` | `ef042e7b3ba7caf38e0166c54add5ea938860e9e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-retry2-57a0916e.json` | `cb2307bd5b3355731e634ba86d10ce4c54aed90d` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-BILAT-01-retry3-1a3faf24.json` | `09a21795fcafbe7d8c6e524455e0c97fd147fcee` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-implement-45b6d826.json` | `9de79357874d5dd9eb1b1c8537d0250661c0065b` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-implement-68ad3a70.json` | `241c13deab9ba9a9816a9ef419fbe8caf0617a92` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-implement-6a912e4d.json` | `25d3f07f42df1dbc4c47f3dbf5b11e968bee7283` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-implement-e1d58602.json` | `992586434a69607dd9934f4c2177f19ef54de3a3` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-implement-ecb5b0d7.json` | `f8ac38d155f8f0acc952bb12a82289956ab023dc` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-checks-5f7a9c2e.json` | `68572bc09bad80fb478ced0009260480eeea9ed1` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-checks-bb55621f.json` | `d6a8aa2227c90510c37558f1aae1b7086d7c503d` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-checks-fba1fa77.json` | `04f87b6b562f03cf11866a3244f2ee50ff431724` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-create-trees-d235aa33.json` | `a947ca5729be2f0e4e9b516f681ca8b62579db3f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-final-2c6e8f14.json` | `1a9b6c82d26ac48d0f0c302962d6d04113c556e0` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-r001-r003-7bfe4f8d.json` | `1af7709adaf58d9aaa6855fd8ef5be556a63797a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-r001-r003-chain-8d2f9c4a.json` | `fd01d9f46ed55b7983de7ac683917d8d1cae869f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-r001-r003-materialized-c3a4d7e1.json` | `0a929cbfa3aa7d74729c765637e744ad7de1b2f0` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-review-81eeefe6.json` | `effc550aef355b70c66ba50d677e06c02fa3aa76` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-review-b176aa1c.json` | `ab268b3afd467e597d3216b3a335dcdef9511e20` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-resume-visual-residuals-57536537.json` | `d6b9f45e1bf8a6c80207aa006b3a945a956e1375` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-06cb9aa9.json` | `cf74b3e6f0db6470434b253e1116a8f2b8a843d9` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-3c6dd456.json` | `b9659ddc4deeecfb9ca68b91592dd7f2bf1b85e8` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-4b0b5305.json` | `f4f4fd7e0cfaa62dc616e5cd82cbe56c2f401b92` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-53f74d13.json` | `bbbe97d102bedb540980fea8b561000bee57d68c` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-6c1ab0ab.json` | `bb24023a539f56c8f526e911899fae46743d0921` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-6d9d2c5a.json` | `558e086485596cc9b26a3adc2889c7fac6354202` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-8c17cbb3.json` | `1b69c23630dc1a4af2a0202b109d07b023f80143` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-91cfc4d7.json` | `883d5057283ec13d5f4e21dc9e5aacad32db8c9b` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-9be4c95a.json` | `7f988af36c7476a77d0299280dc928350cfc0997` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-a58d7ed7.json` | `5e0afe69ea0643eb148bb6b7515f8b71861c147f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-b6315a0f.json` | `69ecf238591860e0d769aa2f31d1129699580a79` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-b6d89345.json` | `b955e49a13c2b17b9a65b21851ef30ab02817ab8` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-d0c49d8f.json` | `d72a54dfcc76a5fd77a84ae8259fb9914d7619db` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-CAT-01-visual-correction-eab4ef88.json` | `009bbb32c6d229da79d87cce12000f8c3725ee26` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-E2E-20260919-implement-a4ce681a.json` | `8a002639fc47abaef52fe08005f3dc1ff43f5f9e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-E2E-20260919-implement-c623eea3.json` | `d13cd3036022dd29f6e9cbb86cb53f84919aec45` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-E2E-20260919-implement-dff11b82.json` | `b658aa43ceb4655a7ad2438b012472920f3e1ff2` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-implement-e485eddb.json` | `95b72825550faf12d68cd19e1473fb87d793daf9` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-05b42581.json` | `efd921394a750d4ccd197b3f56ce90bd8ec6e9e7` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-22c101f4.json` | `1eed23ee94ada226d4b07b77a7abac29ea67adcb` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-25270239.json` | `8192836cf759f60386a911123fee08ea86235161` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-5420e1f2.json` | `c059468be409f4e031021341bfacf309f7f41f4a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-5493a643.json` | `deab97fceb4bf5a9ac669d58f8fab7b66362cb93` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-6494c58e.json` | `2ca2a6678da0b58292fcf1a1d79fe0d25919a46e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-69168cbc.json` | `839e7c087f4ba2ec404ba770ecff0e415fb4427f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-6fef7ce5.json` | `bd3223cb955ce214ce873018ee3eda4c39c0f1b3` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-749825b2.json` | `352c4601d1c4da4d2bf6a12f01f0633364c4d8e7` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-789e427a.json` | `0263a8f4dd7e8158ec5a5003dd1b1b63ea6c1716` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-93807899.json` | `f31de580e4a04c0a9e280639b08f713c0e682e42` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-b5b4e2bb.json` | `c7ffbe0f770d8e528152cc9d4a840540096afff7` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-certified-22f14150.json` | `837389e3545c734fe74a0de014bc0586b3144e02` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-certified-55bdf5fb.json` | `05290b51d2b5e246925bf951194bc3905e955198` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-certified-943faccc.json` | `1af5083499f937b0c5ad887c955f98919554e4c0` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-da206490.json` | `33acefa4050b0976e5ea99453471255f4e776fe1` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-dd445fa6.json` | `02ab5c6549ba38bebf3362aa8a12c04d09221773` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-ebe7f52e.json` | `2d7ae8000fba9f826109ee0c8d5194e79e2b8ef6` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-1-resume-fba50d9a.json` | `1bc4ec4bc43759880a3d202793fbcbf7e3053144` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-implement-09bf73c8.json` | `f02acba082aa0eec4e06d66396bcca285c1ee503` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-implement-70ca9c09.json` | `c1a798972a38fcba33d96b12584658ae65a90fe5` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-implement-96c18b2f.json` | `aa362ab6df6e2873b21998252c85291914ba0972` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-0ba501c7.json` | `dc40b1b58b855658512148ce26e2aadf5ae453ae` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-1c8db14d.json` | `856c41f9c2879b8484703cf47b276a61d65e9a50` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-2677a72f.json` | `87bcff3ac7569f2b882f6bc7cbbaa38884d1900a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-4c21cef8.json` | `6f7b731d327b46522f39036387e091cf18f80a3a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-80912693.json` | `233506662ca9b3d5de0e7224cb59b450187eedfa` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-819e43e3.json` | `69151b754b9612e900ab91eef1e7d58371440ab9` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-8fa39786.json` | `af68d7e35b2215fbb918ea015b350005e49c62ed` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-9bcb8d69.json` | `8d44da33af244c74447835d7d4355ee91c5038ac` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-b56dfcdf.json` | `2cfc9e49802322a384b19c31a7013661aec2bb19` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-d582cac7.json` | `b5e93ad1cd4f33c3714f394c6d9adde272fadb4a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PRE-2-resume-e36b5baf.json` | `244d5d388cbdb4ec383bbb1b5e8035c061182b65` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-0c83a46a.json` | `2c1c8f0f031e7461a87ad29a3db0af08ae30662f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-44a1326c.json` | `5ad53bc768acba4c026000808441794db7cacb68` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-62cc311f.json` | `5b9f13bd70b1564135b34ca3244ed4c4676cb10f` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-9a451a73.json` | `21fcfd56ef033cae74165b1c3060c7abbacffb80` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-ae8d0033.json` | `978031f6586b30b8805135bfe0127ab7082e86d7` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-b865d7ad.json` | `4fcffebc9bf2117b978dd05789943abc5d0c4b7e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c1-initial-da2507bb.json` | `e72ce5f5b11975f865622b4edd487da2fde0346e` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c2-initial-b8b1773e.json` | `4917667ed3bc5cc10b6ea4c434fd1f51ae9e4820` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c3-resume-132e9331.json` | `d31d41832d0c0e0804abb7eb443dab30548b5046` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c3-resume-e5be6cbf.json` | `843ca71121185af0c57446288e1f6a7f54820dc6` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c4-initial-44cab094.json` | `cae333a7dabc208d856fc0be65cdf7e6c96d01b9` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c4-initial-c406532a.json` | `33e1fde7a120c8733e8d8baa02e64dc766a3afa3` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c4-resume-c9c0f55c.json` | `44fb7a32379971a58d4ebf742a5d167186221d9b` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-c4-resume-debddad1.json` | `ea3197dafcc27bef8ca8b758f213336e3b76e64a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-d1-initial-890451e7.json` | `aefdce263ad8d9400a07987884b0c762b0ede26d` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-d2-initial-37e1d374.json` | `47f57bb97da5e12466dc2702ff72366f5a5b232a` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-d2-initial-3f1f85fb.json` | `8247b4397adfbaa8a0f4503f981aaaaadab4e6c2` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-d2-initial-e386b764.json` | `889940f6b48f443717d75dd633b61e3d9b172794` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-d3-initial-a4c0df58.json` | `307e7b53d7b784223fa1b14c61f3968fb39f11ea` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-r1-duplicate-a4c0df58.json` | `8d955a0b7f6feb625fe47f21bfffa1c29096c6f2` | Configuration / documentation / preuve |
| `.github/orchestration/queue/v2/V2-PROD-00-r2-no-reaction-b75a6e24.json` | `8dab3dd9586bf2981642a130b6da11cf3a93a80c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-audit-fiabilite-corrections-layout.md` | `8e24d45c90977aedf6fe00602345c33e3e4e19ba` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-diagnostic-controles-interactifs.md` | `9629257909a2566e6ac80d7f4efda0eb8af4501e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-device-rework01.md` | `9e8d96a7f9ba0bba8c629c5f4706f9e162b65b89` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-device-rework02.md` | `1cda41809e745b4c19c9d03877e8c37e52e98151` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-vide.md` | `026280c8888d2f3a0a44a99fbf7d0f3c1084d100` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-composition-rework01-native-wheel.md` | `7d92214f9ace7d25592d5fb68fa8f8ba603039b5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-composition.md` | `db58cc3d35756b3dac7c4d0fea0f3e7aa1c78dd6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-consolidated-rework02.md` | `cf1caba81a99277d6bd5db1e6c39c281b8774efe` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-rework01-failure-diagnostic.md` | `06466d3efb8d8b1d869576068903c654e67e4a1c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-rework03-cumulative.md` | `9d08f60eebf9a35b7c7daa2f742b049053c65821` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-rework04-design-aligned.md` | `20a5c1d5f331a826ad0245ab24f2d83d78a3c3d5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-phase02-rework05-composition-open-points.md` | `d0db4c5d5dd0a52f15b690c23d335b96c112c0fd` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_P0-plan-correction-layout-controls.md` | `e0795645c0bb25f52e90c65cc72ab3acd088d9ab` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_delivery-report-rule-consolidation.md` | `f15dd15eb25cb280ca00dff191e09b69128d0577` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_design-complements-composition-wheel.md` | `33eec0b0daa61afa11b5b295c0e943fc2477dbf3` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-03_local-worktree-recovery-sync.md` | `7ae8a3219a1e6c1037b2b101aa32cd5204dff518` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework06-wheel-restore-change-control.md` | `654c0c64b45240347fbe4b1ddb750138ae684cb5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework07a-structure-movable-icon.md` | `3041a511543a40ca715f6214fe5ec316f89b09bc` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework07b-canonical-controls-tour-container.md` | `b6ad3a5a07661fa08b8cae2fa4acc7395cc2f49c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework08-native-wheel-tour-summary.md` | `f96d37813df4d9cc633d44e33be380da7712ece9` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework09-exercise-screen-reconstruction.md` | `f0bbf9e0429c9536372be75680b11a094502a666` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework10-abandon-dialog.md` | `56ab86a9320bda8e948eabebec1f77dddf2ea008` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework11-activity-abandon-dialog.md` | `b20c26721b60fff8b914e427fd8c4e4b92a73492` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework12-activity-composition.md` | `d9fd105ef1f9c16c1b5ceb634a11deda731f1f11` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework12-completion-multi-activity.md` | `752c68dbc763fb78983360224d5b1a631d903e95` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_P0-phase02-rework13-name-typography-tour-scope.md` | `15e9543d48f9b461eb11b35e5c65716177441e46` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-abandon-dialog-canonicalization.md` | `223af000df2114ede7fb698f867d86a5bd8de0c2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-card-movable-icons-alignment.md` | `049b3d4183a5f03dbad994fc55147840b5164575` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-context-typography-spacing.md` | `0b595a91644d4c1af2685c1520687c9ba06a02b8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-form-context-summary-propagation.md` | `65d715b13be7b9d0af538b370dd5516dbd298a6c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-form-control-order.md` | `8be2253ead0ff5592f9ba9bc9f3f4e85094239f5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_activity-name-typography-tour-summary-scope.md` | `71fd67ca1d096fe8150e25818006d942804976dd` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_back-and-wheel-actions-canonicalization.md` | `155acf682867c89705f3e0a9293d9f9d980e3a6e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_canonical-ui-controls-traceability.md` | `94c0653501e53ce6f04bdd03f9a3bc74260e7690` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_figma-blockers-categories-headers.md` | `2e553f3bb4283954745c2dfd2436c027ad6b67df` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_icon-tour-canonical-source-alignment.md` | `4d261f2f02f7822cd9315cf86f18c41255787077` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_numeric-wheel-generalization.md` | `19a92c0ed483b6e0effb81f521db83eba556d08d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_repetition-pull-down-canonical-icon.md` | `1a0a1516f1f454512f9257a7a2a8d57d9cebbcd0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_tour-section-canonical-anatomy.md` | `644da545801259b2d8f3544c2905caa57b26d0d5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_ui-wheel-dialogs-session-name-documentation.md` | `13961a3981c499a785d7660fd44a9d261011ddc6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-04_worktree-locked-post-rework07a-merge-conflict.md` | `9884afbb95e6442078c1fc997160682fe862a000` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-05_P0-wheel-values-visibility-fix.md` | `2eface321eb360eaddf951140ddad8a9f4a164a7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-05_T01-S09-categories-enregistrement-seance.md` | `7b54e583c7424ccf836e14d5d699c631c60b080b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_T01-S09-correction-revision-tentative-3.md` | `a3f740936926aa04f1d26459be81267dc4171711` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_T01-S09-correction-revision-tentative-4.md` | `275f6e34016b4a38b41d41f1a33f108b3778227e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_T01-S09-visual-correction-3e-contre-recette.md` | `7295fea803c1cb9c3bed2ee5a185bf81f2fcb664` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_T01-S09-visual-correction-attempt2-test-repair.md` | `d15ad627c95b9bb1ec6e6a7c1b3d581093085729` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_T01-S10.md` | `0f21365e403519c0a4c15aced40815b4ecc55bba` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-06_contre-revue-documentation-kodjo.md` | `a9ccac4b4675f0f6140dab7da749c8cdb6d1ffdb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-07_rebase-sync-documentation-T02.md` | `e7250cab4e047105102c462029ba402033a4c800` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-08_T02-S01.md` | `c63cd32dc7724886d60f26b7b55a4e71e67c05fa` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-08_T02-correctif-post-test-utilisateur.md` | `8cb4fc26df651de8f45522c87ba6ef0d7a901d5b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-08_kodjo-v2-preservation-pilot-0.6.3.md` | `9d2b30732047ddec52a58744a5343537a2f6a0c8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-09_T02-S02-LOT1.md` | `842073a9f936814e7648fce4787d79aa50ae8cbe` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-09_T02-S02-LOT2-continuation-2.md` | `3fe32459772f22fe7dcbf1ea75cff5c1a7726339` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-09_T02-S02-LOT2-continuation.md` | `e2e0c471afe15dcb4ce12e2eb3ef4f7844c588af` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-10_T02-S02-LOT2-continuation-3.md` | `e8a7136209ac360a3c3f98369d250272137b9cf5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-11_CONTRE-AUDIT-PR65-KV2.md` | `a48775df5d75ecb8ef3a6cc59a7a8683a3b06c4c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-16_figma-evidence-refresh-chapitre-06.md` | `6fde1eb2eaeed74980dfddec8a195828b89345a8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-16_renommage-physique-copies-ecran.md` | `659c0a93a0dbee86daf557e9460388f3d3b0a416` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_ARCHITECTURE.md` | `c307293c4aadf58cc8276382a6c26502d4f96658` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_AUDIT_PACKAGE.md` | `76223ae10f02b352b89782c4486bd7681c3e6755` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_CLAUDE_PROMPT.md` | `804b3727c8ee63f4527b992c0a97bf0f66a0d9a4` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-18_V2_BOUNDED_E2E_ACCEPTANCE.md` | `d97ab94a201bd01cd3e3f3d43b9b3e866f960fc4` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-18_V2_BOUNDED_NEGATIVE_E2E_ACCEPTANCE.md` | `30ac7a5ecd78a9cbe91e2e24e4139b29a89ff465` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-19_Q_ENV_01_QUALIFICATION_GUARD.md` | `d93344df2c2959ffdb077f3185d9542224510c38` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-20_KPB-001-contract-generation.md` | `c9d73bf83abf1892991ff36a83ddea626a81d2c2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-20_KPB-002-bounded-planning-context.md` | `a8e845578c4d50160b88198a2c20d054d4f90464` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-20_targeted-delta-global-requalification.md` | `170186e1bf980b06dfa1ddbbc18b79d8b47f0b5c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-28_V2_INITIAL_REVISE_HOTFIX.md` | `b4b8c1e35cbcfcb61888d7ea8258fc29d5336b36` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_AUDIT_PUBLICATION_CONTRACT_FIX_PR250.md` | `75f02f20369d9d6bc10b1a28feca0f59c515f623` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_AUDIT_PUBLICATION_TEST_CRLF_FIX_PR250.md` | `d2e5cf1eb8899ca72eaeeb30220331057dbd05a0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_AUDIT_WRITER_DECLARATION_FIX_PR250.md` | `d0bcd84126b406f5e159454a717c6eb4699a298e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_COMMENT_WORKFLOW_FANOUT_FIX.md` | `75e96a1493c9a2610a21153d9330595ad5177d70` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_PR250_AUDIT_CONTRACT_CORRECTIONS.md` | `e4bff5492f4374bb8f40d4309d12e53b0f0ed818` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_AUDIT.md` | `223ce06d9925df321aa87cb31ad5856a981b9a18` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md` | `e3b3e453368657226cbc82c5b9c46cbbdedb61e3` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-29_PROTOCOL_EVOLUTION_CLAUDE_AUDIT_MISSION.md` | `1b178d101e183d233186674b1fa67a808aee4b13` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PR250_CAUSAL_RUNTIME_BOUNDARY_CORRECTIONS.md` | `07bf6708b9844200898666c4f676fda8ef2f27f5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PR250_CUMULATIVE_AUDIT_REGISTER.md` | `bacd443e5f59cc00873703b8c73da5b5997f30de` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PR250_FINAL_CONVERGENCE_LOT.md` | `35caafa292aa3ec2ae249c5b01cac066096023e6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PR250_RUNTIME_FREEZE_AUDIT_CORRECTIONS.md` | `3147f538347d2292a4a0ed8959ec4ae96d889134` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PR250_WINDOWS_CRLF_CORRECTION.md` | `0ce537aa7d83ef2d6a8b47eef43c70a2d70ee45d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_ELEVEN_FINDINGS_CLOSURE_REVIEW.md` | `e10b127a91da2d7dbf85b768193348dae607cf8d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_PLAN_CORRECTION_36734142447.md` | `2b304f6408b91baf798a4b43de4d313856ed60da` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_PLAN_CORRECTION_36763786560.md` | `34aa32418732ddee840e99caa418977b45d830d2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_PLAN_CORRECTION_DEV_36773441104.md` | `52575e964d1bd67f5427bcf1d94e60fd24a88057` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_PROOF_CONSTRUCTION_FIX.md` | `3d332bc929de59c8e79a240f5dd3b5fa88add63a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_REVIEW_STDIN_RECOVERY.md` | `8747cec840f87a66a6a0a354fcabcc0b9264a4ec` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_PRE1_TARGETED_REVIEW_LAUNCH.md` | `02a7fb09c70576fcc4164f7d2d20f5bd4b15b75f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_ARCHITECTURE_36719499021_1.md` | `744df7e0a96ed706593d4f8db24ae5d16ff38842` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_ARCHITECTURE_CLOSURE.md` | `2a74eaf8f68f857f52f222ca926229b1b9cd0584` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP1_LIVE_CHAIN.md` | `131fc8fae376825d853162101fe8fb0de0679fa9` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP1_LOCAL_CHECKS.json` | `22c0a83db05fa4987124ade7202fb22f46745fad` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP2_EVIDENCE.json` | `f020592a18773c3f1e59d3e79f89d2b1ddefb7a7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP2_QUALIFICATION.md` | `6bc7c3ed85c4ba34ed5467f5bab06a2f16ebb6c8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP2_QUALIFICATION_REQUEST.md` | `a64f084b451f5dba0b0036be4af1941e556ba5a2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP3_EQUIVALENCE.md` | `40658367dc75f18fe5a452d392fd177ba57c2fa6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-09-30_VNEXT_STEP3_START.md` | `98b503030ee97847bcb265831dfd4285dcf93c7b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-01_PRE1_PLAN_CORRECTION_DEV_36854959192.md` | `8c8a37f665ff4f1b6c199a4339171f581471452d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-01_PRE1_PLAN_CORRECTION_IMPLREVIEW_36913774921.md` | `951e1858dc3fe862163c73427faa8fc03b994ac9` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-01_VNEXT_REQUALIFICATION.md` | `da65cf388f592f4c8c58489e0a296051f35bb66f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-01_VNEXT_TRANSPORT_HARDENING.md` | `fc251996c65c0f3e2320e16fdef61062604d0996` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-01_VNEXT_TRANSPORT_HARDENING_EVIDENCE.json` | `359064994d8094b6f5b296c75b880746f5666741` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-02_V2_ORCHESTRATION_FIXES_FOR_VNEXT.md` | `80fe07c915ced3bbd696ac507d74b5f528faf163` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-02_VNEXT_DEVICE_FINALIZATION.md` | `0a69b58041d8cadeb94a53acf201fe917be1fc36` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-02_VNEXT_POST_CAMPAIGN_FAILURE_EVIDENCE.json` | `d5820c07059a8072aa8329f797382e4c7a739414` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-02_VNEXT_POST_CAMPAIGN_FIXES.md` | `62da22651dfff276950a41463eec4059b37fe44b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-02_VNEXT_POST_CAMPAIGN_QUALIFICATION_EVIDENCE.json` | `fdbc2ae516ac19335fedd5670774a0f776ede10d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-03_VNEXT_V8_CONSOLIDATED_CORRECTIONS.md` | `e3d798280d9866836e7a022ee94cd49ea356370c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-03_VNEXT_V8_FRESH_CYCLE.md` | `3033a2cdfb202136943ae0b73cd2c45e679cef62` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-03_VNEXT_V8_TRIGGER_SECURITY.md` | `709a1adad0229bfee8c79d755d0165732136d791` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_V2-PRE-2-RECETTE-REVISION.md` | `1808f4851eece67f5acdd8ac1b9ab577e8c4d6da` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_APPROVED_PLAN_TRANSMISSION_DIAGNOSTIC.md` | `4fdf43b91732fd4dc7d02920171c3f333bcacde6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_DELIVERY_PRESERVATION.md` | `ad3d92f78488b5925c0052564dc7a5ee59fa16a0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_FROZEN_CONSUMER_FIX.md` | `9f2419d9af27cc4fde0baa84ca27d4d8777e74ff` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_MARKERS_AND_RESPONSE_RECOVERY.md` | `1d651da195f06a96a120db3984a8dabe06ab8958` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_POST_ACCEPTANCE_DESIGN.md` | `1e1872475abf772e2fccbfeee6019c36236fa934` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_POST_ACCEPTANCE_REVISION_COVERAGE.md` | `2b0116518ac5b1a3d11b64155b59bf70715a2d3e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-04_VNEXT_REVIEW_TRANSPORT_AND_DIAGNOSTICS.md` | `146bade3c3b4574d86b28d5f8efd8844351c63ab` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md` | `ce6886e5400b4ad2382afda74d5834e60aad74ec` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_V2-PRE-2_FUNCTIONAL_ACCEPTANCE_FINALIZATION.md` | `1a55fa407d7425efc50f7643545f2d774853efc1` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_V2_FINALIZE_ACCESSIBILITY_DEFERRAL_FIX.md` | `5a2ff92b5d5c3802cac7656d9d7fa094fb2d6ecb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_V2_FINALIZE_CUMULATIVE_DELIVERED_FIX.md` | `8e7d1c2736c90a5fea966422206ff87d59737ea5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_FIGMA_SOURCE_IMPLEMENTATION.md` | `a9b62824684175ad9bfda72425bdb68c8f5a696a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_FIGMA_TASK1_LOCAL_INTEGRATION.md` | `4df34f642b5958fcb7adeebb18684fbce018d3f1` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_FIGMA_TASK2_INITIAL.md` | `24203c8d6e357a55bd48994358e5d8dd284678b0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_LOCAL_PERFORMANCE.md` | `87483501e24242569962e26e524248b5f40e2720` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_PROOF_LIFECYCLE_QUALIFICATION.md` | `56fc68f5c7b5b00e655d449cb6c4989f9d0d7eec` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-05_VNEXT_RECOVERY_AND_FIGMA_CONNECTION.md` | `37efce21ed468e72546e235bbe902f834757a79c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF.md` | `9cfaabe7cc222ebf0e3cfeed4cf25f852a69ab47` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md` | `aec05ef05d852c04631caf4caf91f55feef06743` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_AUDIT_TRANSVERSE_FINAL_DOCUMENTATION_KODJO.md` | `d55a3b35fa02c8c9e248e0ba794a2625cdf20247` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_AUDIT_TRANSVERSE_FINAL_PREUVES.json` | `bc8afddf7106d3aa843eecae90f4a695c9a7fcd2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CLARIFICATION_F14_BRIEF.md` | `4d2ca650fd545f7ef8eb7e1fd0360cd425ab05e5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CLOTURE_H03_PHRASE_PAUSE.md` | `95f64950694f883cf2e1604dbad618af5f4ba33e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CLOTURE_H10_COCHE_SELECTION.md` | `1e26fbb1e0a3afe9c5de98aa6b2c7f5abb198f89` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CLOTURE_H10_COCHE_SELECTION_PREUVES.json` | `675422bb92706eeeb702824c7a3eae42d728943e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_DOCUMENTAIRE.md` | `e61743b9abcc684c4f8eda00f5c3f6087edeb421` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE.md` | `3a63400d5b4becb803767455c892d0b57d15a161` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE_PREUVES.json` | `4ef6a80fffad809aea75f226ed9e135810e76657` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_TRANSVERSE_DOCUMENTAIRE.md` | `1aafd974a0ca3cf8bfb0def433bf5293c00ce990` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_TRANSVERSE_DOCUMENTAIRE_PREUVES.json` | `1bd5f5d82ec3a0915e4f84dd8416e5a329f3b934` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_REPORT_DECISIONS_H08_H09.md` | `2877dd953965009d4b38918be0a7d8675d0facbf` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_REPORT_DECISIONS_H08_H09_PREUVES.json` | `8239fa019b3b6ee524eb0ec2876c60f2c285193f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VERIFICATION_F09_REPERES.json` | `eed9b802919c866e13108f6575f706dad359a0f6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VERIFICATION_F09_REPERES.md` | `4a14cdc54334eecfca04545141c1023be40e4d29` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_ABSOLUTE_PATH_INSTRUCTIONS.md` | `616a261a8049b823efa4c51a748a9dfac8a6d428` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_CLAUDE_TWO_HOURS.md` | `0635fdbc8d49b70aeace2ae4959f20ddb4806fc2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_DETERMINISTIC_RESOURCE_INTEGRITY.md` | `f213cd73a96295e559361718b25eb8bfd929d426` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_DIAGNOSTIC_37535461703.md` | `56c949d5a52fb5f3d83796295411652a89e178ef` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_NO_BROWSER_REMOVAL.md` | `429112176ffee08643846809f62943e10ebb7172` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_NO_BROWSER_RESULT_DIAGNOSTIC.md` | `fa59595bd70556b00254c496578cbada29c12c01` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_PLAN_REVIEW_RESULT_37516102783.md` | `5585553753112d104246271c1c8841fdf132e667` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_REGRESSION_ORIGINS.md` | `c2e805bc9c56c236ca18a9bec3927c60389d7b71` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION.md` | `5ecc84d01f230b26063eeff3a1f8368c43398cf6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION_AUDIT_DISPOSITION.md` | `2a8c2e5d96bda854dbe5b519b79020288840d34c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION_INDEPENDENT_REVIEW.md` | `2b8b5628c789e4e23f12b688f2182b4b136e23d0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION_QUOTA_RESULT.md` | `5311d154a965a7d45db7fd10b9a66d008fb21b05` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_SYSTEMATIC_HISTORY.md` | `52f1e1d8fa51ce00d9e0d2324ca8499acd760891` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_COMPLETION_FIX.md` | `acffd0642b5ae5d3a5b0dea700e9711a32f2012a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_CONTRACT_CORRECTION.md` | `6828f89a83dc154175dc946af92791b3dd08a414` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_PROOF_FIX.md` | `7147d008accba8e230fb3346a82194f83e5d024d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_PROOF_RESULT.md` | `c263d69372c90a57f5ef1d6fc369a839cb5582d6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_REGRESSION_FIX.md` | `34cf72e3ff498b02f89efba3d1d34f996e1a497b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_REGRESSION_RESULT.md` | `0187a3349e35658cde4d06b21619e4d72c78e94c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_RESUME.md` | `881e875e88162cc3a0f99b2f2b51e2c131431936` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_REVIEW_CORRECTION.md` | `4481717575230c9d2f5aaf4a1fbdabe02810e68f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_REVIEW_DIAGNOSTIC.md` | `121a21d16bf19ca3240c84ca945fd0e09cb07d61` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_RUN_37396415216_RESULT.md` | `c7d16d22ce11f10e7455c6202a3b14a80c568984` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_TWO_HOURS_RELAUNCH.md` | `9b50924266d8701379dd466a413f6bfbd5cccce6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_TWO_HOURS_RESULT.md` | `74ceb6e08b63698fc8f4bbc8c7f8447a19ed2d85` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-06_VNEXT_TEST_SEQUENCE.md` | `84851b6a74ee22e15089fdaa4c0937f0c1eea916` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_ALIGNEMENT-CODE-DSF-FIGMA.md` | `c81df6e9b63a3f971f83872752b9242012d289de` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_ALIGNEMENT-VOILE-SEGMENTES-TITRES.md` | `967eaaa8c91b9314648d65e9bb2b55bc14e16b57` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_DOCUMENTATION_COMPLEMENTS_SEGMENTES_TITRES.md` | `ad3f97c7f4b28fce9b66285f77344a108c928977` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_DOCUMENTATION_EVOLUTIONS_V15.md` | `def0e887d5a51ec6f699a01fbf1972c13548c3bb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_DOCUMENTATION_VOILE_MODAL.md` | `0c976c72af08efee530ecf5148ee77c9e82f2580` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_FUSION_DOCUMENTATION_328.md` | `a8d33113921e557c7198ba61438a276ca7361489` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_FULL_CERTIFICATION_CYCLE.md` | `ffbfa5f52a9c6b69bed142c0e4e4a09066827418` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_GITHUB_CLOSURE.md` | `a6a46657e3345429abee040301c938c682707ec7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_REVISION_CAUSAL_EVIDENCE_FIX.md` | `0bd12e5028fc0f38a8bb46bc93131bd61e3d1619` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_REVISION_EXECUTION_LAUNCH.md` | `d6be4810bab7ecca9454c527bca706f13aa4af4a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_REVISION_LAUNCH.md` | `36f18aa6e3528ea134699b2dbe6e6aadb8e44580` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_REVISION_PLAN_SUCCESS_37546751570.md` | `8a4df08c334f74bc997943509ba6abe892a0884c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_REVISION_ROOT_FINDING_FIX.md` | `5a648650fce6f8bf0723dad684a0d9fb6d3711d8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-07_VNEXT_THREE_INCIDENTS.md` | `49b910f888d5cd076e21dc88386e07ce045437c5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-08_PLANIFICATION_ANALYSE_PROPAGATION.md` | `d460163d78926ab2113d1120a7f921deac563338` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-08_PRE3_SCOPE_PREPARATION.md` | `106ab1755de9927d9fd7d1b14aca4cc2fc2012ca` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-08_VNEXT_AUDIT_TARGETED_REPAIR.md` | `af2c1b3491010ae91e5d2afd77ace5e38b0c8806` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-08_VNEXT_AUDIT_TOLERANCE_CORRECTIONS.md` | `d91310d589a765fe93a2a4b62e882fd18261be95` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-08_VNEXT_INTEGRATION_ACTIVATION.md` | `a71fbbfc2f11e21a8f92b52ee28a986ca5480cbb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_PRE3-340_IMPLEMENTATION.md` | `2b560ba055e6f8b298c4fa9e5a95e32e9d338158` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_PRE3_CLARIFICATION_REENTRY_CLOSURE.json` | `a2b71fb02c3bd6665852967d8bf9fc2bebf1f8a5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_PRE3_REVIEW_SCOPE_CLOSURE.json` | `4a83d8df1991a61581bb09922cf81d1c5ba9b899` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_PRE3_REVIEW_SCOPE_SUPPLEMENT.md` | `b06c5e1dbed9e20f19f82f60e805b6165decee6f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_VNEXT_CHATGPT_GENERIC_RELAY.md` | `03f22d2b721dc5bd01e2a3989e459d1d52066cd7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_VNEXT_CHATGPT_PRE4_CONSOLIDATION.md` | `46d307b1f849db186e84c892ef433dd70ad56dcd` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_VNEXT_CHATGPT_PRE4_REVIEW_RELAY.md` | `53aece4e955cbf7b59dcfcdf6c1bec13ab8411f8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_VNEXT_VOLUME_CLOSURE.md` | `55b3bd242f8eef984562e6ccb8d1f3a90e12bb48` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-09_VNEXT_VOLUME_INTEGRATION.md` | `07267d1f70af8173d84ae89871dcb5dadbda4d5b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-10_PRE3-340_CORRECTION-REVUE1.md` | `b38d0249dede5cb5061e24820f87b2b506527c4e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-10_PRE3-340_DIAGNOSTIC-PUSH-NON-PUBLIE.md` | `83a2f7e8785cc2df87da7a655bc7cb26c07e40bf` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-10_PRE3-340_REVUE-IMPLEMENTATION-1.md` | `18671633cd3168b9e8aa57375f64eddcc0aee106` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_CONSOLIDATION-RECETTE1.md` | `ef14e9872101a4f5cf01f521c8767b3f7655bdb6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_CORRECTION-RECETTE1.md` | `41d28e9e4aecf2be17c7da053138b4c8bb405ccb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_CORRECTION-RECETTE2.md` | `a94e5f021c66b4eebccdf878b18211d0685eb30c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_CORRECTION-RECETTE3.md` | `6d905d3ceafaaf6b150944dd4b32e0bbe84809fe` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_DECISIONS-PROPRIETAIRE.md` | `cbf694a3b434026e364ac27084a3485fe647de40` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_EXT-R3-2-COMPOSITION.md` | `143a9865ffd1e3c6d0d222be56e0e6585eb135ad` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_EXT-R3-2-SEPARATEUR.md` | `b04b0d33b50e12fe016fd5c08391d11b7595d219` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_FINALISATION-RECETTE.md` | `af326c255fa67aa73029dff5c955c31cfab1a361` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_N01-CLAVIER.md` | `e714bc5fc45bd6173482fb0afb851c9db32e40ac` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_OTA-NON-APPLIQUEE.md` | `4985849f70d23c22e5b65764fde310e044a0840a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_RECETTE3-ECARTS-RESTANTS.md` | `f54b8035293501a9263ac82c180e42b19b6ec2a4` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_REVUE-CLOTURE.md` | `b6bb9a21268e7124de0a5d55d23181a87d153eb4` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-12_PRE3-340_T15-DEPOT-SERIE.md` | `8810772e075bfcb86412e8df911f0b39697af1a3` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE3-340_CLOTURE-FINALE.md` | `07be9ce5bf5206f26c3579168004c2fe6fe2c206` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE3-340_PUBLICATION-CLOTURE.md` | `bf8f95929aec1acd0abbae45d95cb4a7ae99a953` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE3-340_RECONCILIATION-MAIN.md` | `dbbe56b506a86b0816ee53bba5c9ff256796d0b0` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE4-352_RELAIS-CORRECTION.md` | `f9cd72725d1d041f081a820b63dfe81f0418c6af` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE4-352_REPRISE-ARCHIVES.md` | `22cfc8fbf387c2e2c20f7ebcb322c1ad7a04863e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_PRE4-352_REPRISE-TRANSPORT-LOGS.md` | `9d129e210deac0ebf5da1e6ad23ca36b1dde4b7b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-13_VNEXT_CI_PATH_EXCLUSIONS.md` | `9315297f63ed101f5bde2012e12f1d9080a4ac62` | Configuration / documentation / preuve |
| `.github/orchestration/reports/2026-10-14_VNEXT_WORK_CONTINUATION.md` | `baecd056bf7235dc18645e085175ee12f9cb6794` | Configuration / documentation / preuve |
| `.github/orchestration/reports/AUDIT_0.6.46_CORRECTION_PLAN.md` | `e39baa820e0b29be23f123ffaec01853ee59017e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/AUDIT_0.6.46_CORRECTION_RESULTS.md` | `e0934a5baca1101274b225a6d2bbdd567e62e389` | Configuration / documentation / preuve |
| `.github/orchestration/reports/KODJO_V2_ORDINARY_PATH_CERTIFICATION_REPORT_0.1.md` | `0fd36ef1ef68f351d5ee13bbe7335c089a4dfcfb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/T01_INTERACTIVE_CONTROLS_DIAGNOSTIC_20260903.md` | `742824b9c77d68e47eb6d097eaa02f7380995755` | Configuration / documentation / preuve |
| `.github/orchestration/reports/T01_S01_S08_CONFORMITY_AUDIT_20260902.md` | `66eacc7d85a98d34049ce0224d5f084d3241dc11` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/2026-10-09_VNEXT_VOLUME_CLOSURE.json` | `35388325096930bb6403a315fc85431fca8e0703` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/2026-10-09_VNEXT_VOLUME_MAIN.json` | `5f3d8c692645404d11e40430ea7441782640f27f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/2026-10-09_VNEXT_VOLUME_PINS.json` | `daffc981b8eeef66484db133b987e944cb9f678e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/2026-10-09_VNEXT_VOLUME_TESTS.json` | `1684dade34e25b83d34d9ed46b0b6dcf79bb5b5e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/2026-10-09_VNEXT_VOLUME_WINDOWS.json` | `4773c1a84c17e704fe49ebe966b07faa4d6dc013` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/corrected-qualification.json` | `7fe2623857427940787b3e554269df1145f6cbb6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/full-source-reference/delivery-preservation.json` | `f8a284ea0057e511a08daeeed479c5b898afa406` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/full-source-reference/execution.json` | `a9937cf3e7ac6565ce00b76baf9a0df11331c0a3` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/full-source-reference/functional-test.json` | `185c2cf04baf4b2115fabe0f96bcc09c05fa053a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/full-source-reference/reference-result.json` | `6078f6ea65192d3f48c2e438798c82e0e198b6bf` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/real-restart.json` | `24eabbba23a0de3d4e7e391b6128e9e161e23fb5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/stabilization-process.json` | `a6c22b799fe53419bc75b44d5955f30e9ea0477f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37501814430/stabilization-receipt.json` | `8e2cb22cf486a1b07225f1f0030c5b8d97b4cda5` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/corrected-functional-test.json` | `389f9919f92dd73bdde58432814dfee584026796` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/corrected-qualification.json` | `a525f07bf2eb53d334b142cb7754997d3522bb64` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/corrected-reference-result.json` | `fe853c6d8b904c1fa3f25a098ebf3c7ef61020b3` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/initial-review-process.json` | `d9b7d8026c2850a27376146fb104c88ecfae3349` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/initial-review-response.json` | `364f698fe7aa7dccdccee898998d420203d2ff22` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/plan-review.json` | `1bcb634cf3c279e0de8ef314fbe78d559a2427d8` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/run-observation.json` | `435e60fdf19f6df999eb162af5ccd36e98e9698c` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37516102783/status.json` | `2e2bb698992e06699ca07a356c1d520b23a65440` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/approved-plan.md` | `d6559756d0210e2ea3f8cee479b9d855e4586c20` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/delivered-screen.js` | `d8c7a5f999a548de2882ffc0ebffec05521c8c58` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/delivered-test.js` | `9c2fd13246535db82f4e3b18ac8e62a9acc3b491` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/delivery-preservation.json` | `9af8e1409f452ab8ef2c89f0bb2418ee9cd782b6` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/diagnostic.json` | `54528130ca637b4028d8e092e758db38382f5b6f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/functional-test-initial.json` | `d03da9ea4d266d649f12fed99409fd1994c11829` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/initial-review__execution.json` | `4ee490eff89063510216f6331d1a4232a5f12deb` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/initial-review__implementation-dossier.json` | `729b48d8d41c3bc59d4ac1777bad5a2d808cade2` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/initial-review__implementation-review-response.json` | `f02137c902c6bc5caf9122fbad4a48aa25a4c81e` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/qualification-admission.json` | `8585fa9a14b91cf42f4110925637016df68b0e4f` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37520798420/status.json` | `89fe07235bb079e687f4644dca780274b66ab98d` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37533961912/corrected-qualification.json` | `5fcd0982ff05dcf04c4373afddcccbc1ec613d52` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37535461703/plan-review-findings.json` | `0d076f5810fb2c774350dfb0325a8f01231ef9d9` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37535461703/plan-review__initial-review-response.json` | `f4c296eac3989bdd415317dcb05105f9e51001f1` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37535461703/qualification-admission.json` | `10995602e24770c2fb2dc8fceb767368a5f3a247` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/37535461703/status.json` | `7351d82aae3aced6f5a06e3c83315257c450d8c7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/37557921183/certification.json` | `9db48845f09c23c0769587c3ff300d986e07f7a7` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/37557921183/execution-provenance.json` | `d112af10c209418f6e95091c592c71460faf2f91` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/37559490452/certification.json` | `e4487e13a82218594930d5d80ab49c9d5d7b710b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/37559490452/execution-provenance.json` | `a260af8627e8b825b8ae6ee391963a3ab1010c8a` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/real-data-manifest.json` | `274215c46fee9b2ac575c7615d470f13d0f3aebe` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/real-data-replay.json` | `e2c00b8ba9e01e5a89d5a4f75a8ba36bf2abfa0b` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/source-attempts.json` | `4da81a424c78354569d65092352ea04ac6e3bed1` | Configuration / documentation / preuve |
| `.github/orchestration/reports/evidence/vnext-incidents-20261007/source-comments.json` | `afa3b6e7698b1aa41e4eea70404e35629b39c9dd` | Configuration / documentation / preuve |
| `.github/orchestration/requests/diagnostics/pre4-352-claude-availability-20261013.json` | `2b106c692080d9033117c30dece24c9388ce8f80` | Configuration / documentation / preuve |
| `.github/orchestration/requests/vnext-agent/dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d.json` | `53d585144ae9a1c2ee5f50c1391f46d1489fed63` | Configuration / documentation / preuve |
| `.github/orchestration/requests/vnext-agent/resume/5fc307dd0eec21a9175a3e401a9a68d60530db4fc27e773a6e2fbdbdc1b0c87b.json` | `d2dedff7038e4c659fa0f569521afa870aca7c2b` | Configuration / documentation / preuve |
| `.github/orchestration/requests/vnext-agent/resume/73c85e3b8ba68bf5951c0295a8ab5fbee1fe477da0019861a677b65fffa7ef92.json` | `b3d042172188776b977872bb34d8751ebff90231` | Configuration / documentation / preuve |
| `.github/orchestration/requests/vnext-agent/resume/83bdca7ba640b5724297c05574745037774dd6c824dd6f0261fbea8a4ff753e3.json` | `a313eb1249c874da744297d666208cd201165cdc` | Configuration / documentation / preuve |
| `.github/orchestration/requests/vnext-work/publish/38465662376.json` | `edbfb4ed45fed6e9d7a40518a48d1d97f4beba9f` | Configuration / documentation / preuve |
| `.github/orchestration/slice-bootstrap.schema.json` | `27a51c7f5917c4b225917a20cf260946f143ea81` | Configuration / documentation / preuve |
| `.github/orchestration/slice-manifest.schema.json` | `2a759c53e8dcf4aabb355705457e031ce5beaddc` | Configuration / documentation / preuve |
| `.github/orchestration/slices/T01-S10.yml` | `a3914d5a532697bbaf605040c6215f28f65ad348` | Configuration / documentation / preuve |
| `.github/orchestration/slices/T02-S01.yml` | `3cffdf65eb37dc7e64c85b7e374e676dc460ca58` | Configuration / documentation / preuve |
| `.github/orchestration/slices/T02-S02.yml` | `fa26ef98e8bd27ae4be81dc9ed162547718004c3` | Configuration / documentation / preuve |
| `.github/orchestration/slices/T03-S01.yml` | `872bd39b8e3cacf44291f8caa3bb7925d9d70129` | Configuration / documentation / preuve |
| `.github/orchestration/v2-activation-registry.json` | `edd5ffdc16daffa99a49fa8df717f7b03b625905` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/implementation-mission.md` | `5ee6b2826b2f3ef502d1891536ae55685a2dc1dc` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/independent-review.md` | `9702f222e3895c4562f7e48ac4bbc5f551135d93` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/planning-mission.md` | `6e418e0b9f4e81a4e7e06930ecf5035cff5a635a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/recovery-migration-34770454986.json` | `85bad3a98021bd3ee557286cfabbb5e9c57612c4` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/recovery-migration-34872653037.json` | `5e9357dcbac255d90366b5e2b93e6145a81f8861` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/recovery-migration-34948992572.json` | `95edaceae915f9f38c88b08249752691669659a3` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json` | `e96e51544d3a163a87d4d587acefe83fd903e8f5` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md` | `8f8f13c4f2bad4fd732cbea11258a859c55718dd` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/implementation-mission.md` | `d5325ad320207f50b4b875fcbae84b0a8f47d725` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/independent-review.md` | `efe3b49b6ba35511b8da1cf05dabaa287913a759` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/planning-mission.md` | `11e54c5bf7efe7367e825c042fd6b9303e16756b` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/recovery-migration-35333601872.json` | `988b89c56f837d031a9855f50e9209920db139c8` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json` | `5a7579d99384304af46925b8026c1721ca95a679` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-CAT-01/technical-plan.md` | `40f476b2c47047718cae31a694da55938c0bb62a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/implementation-mission.md` | `90ba360e7e2611fcc0869f93e2215f67f49b6039` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/independent-review.md` | `34cd650d1ed371d838b1a68fb47369ed29eb4528` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/planning-mission.md` | `08552fd665b83235552aea4d55dc96612723f498` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/qualification-spec.md` | `30e1d2409390cf2dab55820e34ce0327021bf5f2` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/slice-bootstrap.json` | `1e8063cf5f0fc63a251b0f7a2d1f963a49a351a9` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-E2E-20260919/technical-plan.md` | `00f72ef7346a07e35aa57269e97f034927f2a4d4` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36773441104/corrected-plan.md` | `c42de1f1b63260ea2cf573c4dd04584f6d5ebb37` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36773441104/corrected-scan.json` | `68a135901d710e890a5575a1e6c57bb842a42722` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36773441104/correction-checks.json` | `7dcf7fcd4b24621921cdcd9aea2e949d97e00c21` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36773441104/development-result.json` | `defd9d97a788742ab76e66d367645a1c0b9bd118` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36773441104/items-to-verify.json` | `937f7fbc44c9377011948398f48ac1f543236dd2` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36854959192/corrected-plan.md` | `6ee4a875ef930b6ff83389f2479fbee551ecae15` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36854959192/corrected-scan.json` | `68a135901d710e890a5575a1e6c57bb842a42722` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36854959192/correction-checks.json` | `1e6ff09f14dd778af6fb2d55aaf84604232ee409` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36854959192/development-result.json` | `ca2f7fbd07ed4bbca9b4c5f84caee86300e01fcc` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-dev-36854959192/items-to-verify.json` | `1a05d4069d79a37df3c9f8145370e4a0d3730d75` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-implreview-36913774921/corrected-plan.md` | `60a6bb366b7441b8e79189db585c8dec4463d08c` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-implreview-36913774921/corrected-scan.json` | `68a135901d710e890a5575a1e6c57bb842a42722` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-implreview-36913774921/correction-checks.json` | `107e0609f2d427dbbaed88b06192e2859a87fb0a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-implreview-36913774921/implementation-review-5938943370.json` | `9f62ecddb01c458e8814860556e64d9b46d0534b` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-implreview-36913774921/items-to-verify.json` | `273c4cd83344e1214df843bfb86fe0387848f2f3` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/corrected-plan.md` | `8ed0768ccfcf9ec157b2aa8d5cc177be5f97d426` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/corrected-scan.json` | `fefc04c5b34fb3cbd51ac68e061aed15192a62e1` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/correction-checks.json` | `a88c29b46bb54150a1f318cc8482cde977acb789` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/independent-findings.json` | `07f6579ad59f66015c8189f079bde0aaab7d01aa` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/independent-review.md` | `c76db04dc089ada56ee7bad58e91f2c25f08a287` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/source-replay-proof.json` | `9f4c53520465ffabc8d7d1ba5730019a917422fb` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/closure-bound.json` | `f1b28214c8955dbde2fe4ddd6cd66c7cd5c15683` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/corrected-plan.md` | `0c2b1beebb540166a76ba6821e8db55dc12cbdf3` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/corrected-scan.json` | `e568d09d4d0dcdba5455777083459767a549f4fa` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/correction-checks.json` | `7c643fa68a496e37dfeecd4541ed9be4f3f8bf1d` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/independent-findings.json` | `edbc9305ebc4832f7abb57ff7e9639bc0f099716` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/correction-review-36763786560/independent-review.md` | `9cd1b0674902da3fbe2802279ebc3e863b639a94` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/device-check-derogation.json` | `4bdb58347bddb76a9de3b197db82298802b74c59` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/implementation-mission.md` | `853202cba377f0ccaa5d9387627ffaf89e49513e` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/independent-review.md` | `2f597e2e7c79301ecc434cb525a9c3e9a3764a10` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/planning-mission.md` | `a2fd35865990c9325c5c7e3256a170df676a5586` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md` | `d3d93adaa450507b5cdee69f8138f294a5cb609f` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/recovery-migration-36773441104.json` | `a0b58f53e3166f67685f1f737781f65e2e639384` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/recovery-migration-36854959192.json` | `6f784e1392549304ca1a87d22f0b7d24d5de4093` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/recovery-migration-36909039881.json` | `98a2352d8981932e17a7d3fa14375ff9a360b70c` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json` | `a8c452d8d2dcb13d0621b4c543e60434838abe1e` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-1/technical-plan.md` | `46981c873063d9afe4d02dfe341f4d05d48b3c31` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/closure-review-37136337819/correction-register.md` | `5769a5cf02d3eb941a0df1927a6bcaa3d03324db` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/closure-review-37136337819/prior-findings.json` | `04f80fe5f3bc0c63ffbc20b725e1935512d00cfd` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/closure-review-37136337819/technical-plan.md` | `03aaccbb7068c2e02e9d57d613c768f073d85ecd` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/implementation-mission.md` | `1848aa693bab3e1e61423c0893936099f87c306e` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/independent-review.md` | `59f0fcb7fb6b98c67d69f79905ff39e3c29982e1` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/plan-publication/technical-plan.md` | `c374143708441ececb245748b214005fde7c873a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/planning-mission.md` | `38d85a74b64e140804d13b6b8b4eb181282fc831` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md` | `86b51f76e184ea24208975b7dfbf9d2733a67f67` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/correction-register-5980019179.md` | `7133bd86cb2977b16e618c6ef85644cfe4424b44` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/correction-register-change-37214282333.md` | `020f5933809d5a7b48238df1cf5cce8f2ff6d21e` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/prior-findings-5980019179.json` | `9d0d0ba895894586d535436dea83840206805581` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/prior-findings-change-37214282333.json` | `86b4d783853b314866d74775ec979b126adc4cbd` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/technical-plan.md` | `defeb3744687673d6767b664afd4a5794283982e` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json` | `929845d42ce53e7ffc4ade7fbffaf7aef27479b4` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PRE-2/technical-plan.md` | `014987f69b9738fbed839f9300733539b00505ca` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/campaign-runbook.md` | `83117f8e17353f93307ac80aaa6ab2c638cfe0d5` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-c1.md` | `8d4a854d53f186ca3eaefdd1c5a5648efc12880b` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-c2.md` | `d8bb7c6d27c37538aed66e2a0bd45bec7d5cbf48` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-c3.md` | `03d700dacf4eaf5d71bce202a45fe17bbfe8177a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-c4.md` | `cdf6a69ae7784891c568940fe7d2a84a2cb7f188` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-d1.md` | `01806d2785224d091e43df9fb06eeb08ea460450` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-d2.md` | `62a58e910f3070da8ab98d76d68e94540e7db4e2` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/implementation-mission-d3.md` | `79c454182ae5cc50ea2c93b9d961ba9bca5eca96` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/independent-review.md` | `ff2622891d04df5a1a23b6ab304331128c934d0b` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-PROD-00/slice-bootstrap.json` | `72f02f8fc1983ca4b89726c0b3897643aa588d56` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-QUALIF-00/implementation-mission.md` | `44baeddcdc5626c96b75f77523611d245216970a` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-QUALIF-00/slice-bootstrap.json` | `e47e37addd93c6737477644a363d2ed16c438bc9` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-QUALIF-01/implementation-mission.md` | `d6547f5f280b103211b693a2b058c788d245e546` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-QUALIF-01/recovery-migration-35453977077.json` | `5bcd14a2560e9892d84e494e6c62e429dd4fc4d6` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/V2-QUALIF-01/slice-bootstrap.json` | `2c8ed25da0dca2cfce85703ae3818a6815e8b09b` | Configuration / documentation / preuve |
| `.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json` | `4ae472e696f39691de415694caba0d2ae6174d94` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-audit-tolerance/qualification-request.json` | `6c0feb4b382d3dc8828f35b5496e221b52a5ffaa` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/activation.json` | `afe47aa732bdf6bd4cde169bb4f4d8d55817c580` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/cutover-plan.json` | `674fa73eb90fcad0280abce9026112302f39d78d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/legacy-registry-at-activation.json` | `edd5ffdc16daffa99a49fa8df717f7b03b625905` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/qualification-evidence.json` | `604122d6d8097ca0ac84edc8099eda1d735933cf` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/remote-write-attestation.json` | `827be16d41e4a7917eb6c3a7e112d37c60680618` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-cutover/user-authorization.json` | `6db3b7eaada3e66a8d957c200a06d807373c8da8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext-targeted-review/review-minors.js` | `62b2152968269b8eab30b699834e60e988adc807` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/campaign-state.json` | `94291e85226f09da144d2aa4d1fd6db0b5506300` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/37596957178/execution-provenance.json` | `effdbfaa40725a87482c5434f3ca2eded472a378` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/37597628150/execution-provenance.json` | `e6a78e1b4f0e0d223aab134b0981572c460d9277` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/37597628150/finalization.json` | `4a266529497ec6e96ac25a08c7e259c001cc6eb0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/37597628150/github-closure.json` | `d67acff680e1f7c799ea7e583f339b147add0ce3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/37597628150/recovery.json` | `8720aa2d44747f41ef76ef89e4149156835609da` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/approved-plan.md` | `d251be05996546eb080879039f3786578b3eed82` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/executed-request.json` | `e4637c56542138daf001b79d6bd7555d120242fb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/finalization-manifest.json` | `8e11abced977c34cae3f072dd88246c26ac19a0b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/functional-proof.json` | `e6686e92397a96725d52bc14cac1ad8cbb4c6496` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/implementation-review.json` | `877f00216ab7a059b000961309527a8ab7221055` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/previous-request.json` | `7959e367f842a0e4c431c5a7c2122c10cc9a6035` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/runtime-result.json` | `59853e0fcd6479488130bf617f63f0d4995bf83e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/source-review-comment.json` | `c212a145ffbeca292db233c00f3e96fa3df5de0a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/closure/test-contract-evidence.json` | `a98e3829d5d8f81efc8f660fb5cbaef21d317107` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/automation-disabled.json` | `2fe2f4807fe298733e75d9b84be3a1810c59bedc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/evidence.json` | `2d380e4828f7d7ca0552cab5c15af1c9c1a35d4b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/execution-provenance.json` | `dae139d1238bc44b733850756259b7d45aaad994` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/finalization.json` | `640f37f34e058ef308b11fc67d0f1be18aad6f5d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/github-closure.json` | `ac69a88601b3d7fd652ccd5e79d89b1b0fb932ab` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/issue-after-closure.json` | `15edd45c54d6e884803d48978262c2e5b02ab4b6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/jobs.json` | `3aa512775a93a3cbdcf240ca458b2ad3e19fa01f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/pr-after-closure.json` | `2e8aad8212166d020a83078eb25a1d27323c1087` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/recovery.json` | `82ed83ed8ace976bb0f9702183e3b254187a4493` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/run.json` | `c6e44974da6460b58b7e1e4ff789f7368dd87219` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/signal.json` | `cdf1980205cab8832642edfdc03972eadff4116f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/closure-37688962970/source-comments.json` | `a3b5a20b158f33669147585a4dcbf61757cf36b3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/continuation-signal.json` | `cdf1980205cab8832642edfdc03972eadff4116f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/cycle-state.json` | `886ad5626335867cd870751365ec5d42391cf890` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-certification-failure-37676699196/evidence.json` | `530cf619586a427bbdbaf4eb6bc51b1f59a417c0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-complete-37680862427/evidence.json` | `69b79d66b5df733a5c3cf83b0bf090ce0a14f2da` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-complete-37680862427/jobs.json` | `cc1e4c8d8fae8535ef26c9701f32e0fe470f83b7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-complete-37680862427/run.json` | `5b8b469a132481a24688ddd26687acb41a0f50a9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-connector-qualification-37674851193/evidence.json` | `0f9cbca3ef41e5a604a86b3e05817fffae8192a2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-connector-qualification-failure-37671322228/evidence.json` | `e2bff14f8c23797a5cce3349c674d96fecf24e4c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-connector-relay-failure-37672051960/evidence.json` | `7db30d28854779facc5a938600ec3e3fb45ba0e3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/historical-sequence-qualification-37679156484/evidence.json` | `97402f235826c685e05dd71758ccf548f0b128ea` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/incident-certification-37670103040/certification.json` | `ad409d811515aad964b8457d05457c2aeb428ae7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/incident-certification-37670103040/evidence.json` | `7ab669a875bd65e684220cb92f2df2ab5590b6d5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/incident-certification-37670103040/finalization.json` | `73a5ec84b53548cf83275edca4a69aceebf98f56` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/incident-certification-failure-37665950253/evidence.json` | `f4514bd91b26777026dd9aa14023703b617d314a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/incidents-retention-qualification-37667669032/evidence.json` | `28549c7cca36d55d04897f7174d61d39a8252b9c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-37611838767-failure/failure.json` | `f49194da09dde48a4cdfa6546e95aa918c15b5c8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-37614683711/observation.json` | `4b2d7caeb79b4ebe5c9625087022ef984cf670f3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-authorization-37609828137.json` | `47e343fca0fff531f82f3c94dcc3f1594ec978cd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-authorization-37612631759.json` | `24c17529e7b0e78017d4304a196117a377c6c8ea` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-owner-approval-evidence-37612631759.json` | `2529136fd8583e42fe2fcb9ae50c4f74ec595ee8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/initial-owner-approval-evidence.json` | `b82ac0145a46cd4c4090408996fc7d621a4f4509` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/manual-recovery-37641572717-2.json` | `76df4895f3787b8f2a57b0285183360c30c19a25` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/admission-finalization/finalization.json` | `640f37f34e058ef308b11fc67d0f1be18aad6f5d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/admission.json` | `5fe31b33de698c2d362e4d241cf43f7d74468b05` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/finalization-manifest.json` | `5f59651ff23f245a049958bcf8ff4a084e47fb67` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/issue-before-closure.json` | `66396a282d660043f2c70f935dbd3c560ea334dd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/pr-before-closure.json` | `c4b285dcd6a1f85f7afdb686f5c384cd0a141e43` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/new-delivery-329/source-review-comment.json` | `d93b2833d86b69389d8e48aee48db5043bc59cc7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/preparation-37599633548/evidence.json` | `b8ddf9d0bc770bec598dc962568d5bf31115f825` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/preparation-37599633548/status.json` | `60e220791f50c07feeba6c9299ddd540ead91696` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/preparation-37599633548/transport.json` | `f41a97819a703dca6b525e8457dcc0b7c9fbbf91` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/qualification-37609828137/github-observations.json` | `9a69feb1e2521f3c75aa3204e830e0ebfc9a7e25` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/qualification-37612631759/github-observations.json` | `2d67297378f4f86e78b4dc50aaa305c0a99e7f69` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/qualification-attempt2-37641572717.json` | `c49d307afbfcde9e3f2e81c56001a7d21912c4c8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/qualification-failure-37638510918/evidence.json` | `d341a2376ba8a005cfffe8e44701cd2c4e319bdb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/qualification-relay-failure-37641572717/evidence.json` | `cccd55ebe51981dae1b7df5125422e2c6535a959` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-37629963561/evidence.json` | `b46db6ac17ee41d3bdc93c7e028719dd62179f53` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-37660064830/evidence.json` | `fc9d7fae219bd158aa1eb56e4a32815c4f63f2a9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-correction-qualification-37632486111.json` | `c584e08f9fa283c7ed0618d6956d8f9687fe760d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/delivery-preservation.json` | `7827c6bc180680416a39f68673f84beb71402b86` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/evidence.json` | `da635fe1f60f5768b27a540c69fe8b7451f4e742` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/execution-provenance.json` | `a73406c766313515b9a8c4f2585e0c097261149e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/plan-review.json` | `88d02372fc56dd709268f734795a4ba17e20edeb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/plan-review/initial-review-response.json` | `dccb7b88b2f9f8810757d136cc0d1b6af8d4fcb9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/qualification-admission.json` | `b074f2d75f3fd6e77fb948f0e8806db84a3213fd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/real-test-failure-37634990777/status.json` | `bdae73a1a87a45920dc17e23e53549977c462313` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/revision-37625815436/evidence.json` | `6a273fc97bc1b66655b0fd42b6008c16d45aeff6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/revision-preparation-37618992223/status.json` | `99a4b5892303d8cf420415fe8b3aa532ea15a30a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/revision-qualification-37622823611/evidence.json` | `a7835eeed0e39d71775abb3506cbfd66e0a45998` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/transition-37609828137-1.json` | `2e31cf97dcc7f975be15b52273702a3a3b861ba0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/transition-37611838767-1.json` | `ab181c23cfb1f64c601ce300eaf242563e89eab6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/transition-37612631759-1.json` | `71e1309c5a68045634bacf9fa292d5ea8db56633` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/transition-historical-37674851193-1.json` | `e0225f81674cf065b2cff6a629123dc397dbaf31` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/full-cycle-20261007/transition-historical-sequence-37679156484-1.json` | `2cff353d392c0ee0874d14603ad26cff628df588` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/incidents/certification-cases.json` | `1e6c386cdb217f6b7751f9fcfd091521ff4fbdeb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial-execution-evidence.json` | `0a3f1414c706ac74187d8e0fb95556f93af0534a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/gate-reservation.json` | `a5952e2e509a116da3db992a311dea9bb6fcb730` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/implementation-mission.md` | `ff13e66bf54fece717eb27683798db493d0db900` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/independent-review.md` | `1d7fc43d0390c6bf88b26a50d0b223ddb0641f55` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/owner-approval-evidence.json` | `fb084d1ea9839f32745c7f1457ea2f36e10a869e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/prepared.json` | `9861664959e0cfd741466a5cc6c03b2506f190bd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/review-receipt.json` | `2462f55d7c6212673f4c7cabe187779c13fa9664` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/status.json` | `c60d85d44a306866da0ddf3fb02008667b2c2019` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/technical-plan.md` | `033398c6f092231e30988ebbd65a0713e214a2f8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/initial/transport.json` | `aeff1f201038170e097fffa628ca7e37b6f2d93b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/proof-lifecycle-20261005/evidence.json` | `ee54146cd3d7fff77b08862b0658bde6a88b67ab` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/initial/authorization-evidence.json` | `911c793c02c77bf5f4540f1d39ce885731120d99` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/initial/execution-evidence.json` | `7adb218568dbae2ba9a4aefb86cf53c12b7926b3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/initial/preparation-evidence.json` | `acba8e9029c10f4918ba5e3f80afeb2cf2714f10` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/initial/qualification-evidence.json` | `9cf9a99330d70b68929fcade5ffb360e0c9825ee` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/revision/authorization-evidence.json` | `7668bf44ca3be6f8d4be868d04756740ec22774b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/revision/execution-evidence.json` | `7b453c639897c8b2c11da4982abdc9c7f0925de3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/revision/preparation-evidence.json` | `00904028a3b71be62ccb1fda0eefff55bfa0e1b7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/revision/qualification-evidence.json` | `bd8ad50e3eaf9673187097d0d261b270c30a1aab` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/baseline-checks.json` | `8083720abbf450efa6b54f99f3d8d3b473f906c4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/consumed-request.json` | `9f8af350139e9f276536853ad64a512f4d745e44` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/consumption.json` | `561f2d71a2274e710ee7758c9525e3628c26b0eb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/execution-evidence.json` | `659178b78967d4f7bba30d877368f1c6dae2eef2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/functional-proof.json` | `e6686e92397a96725d52bc14cac1ad8cbb4c6496` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/negative-before-claude.json` | `926a5fedbf05b5c14ac12c6e2cba364de815d38f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/qualification-admission.json` | `3100c58f889ae9bb1bbed70c811296247d2b25c1` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/runtime-result.json` | `42e024ba3e76245e6a3b3f7dccb9beee3b6de407` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/status.json` | `b4ddd6004434a3c7b9bc97b89235c822919241f5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json` | `dab6614ff727c8d21992ca717ccf611ab1e48821` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md` | `fa98d1e70f1f571919756b51a7ab6dcb3a2b139a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision-attempt-36850188454/base-review-receipt.json` | `c031c5f7b149212af5b3bfa2048c83610dc2ff34` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision-attempt-36850188454/benchmark-declaration.json` | `89b8fa7a281f626fe0bc5b12858fe05c5ef3bf21` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision-attempt-36850188454/status.json` | `8bef4c796308322633512eacf2218aa12671b86c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/execution-authorization.json` | `1fc0299689f3728f36a0b3521084ad4f6d472cd8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/execution-evidence.json` | `a689182f61b6641bd87807215adf9f69b05b655a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/implementation-mission.md` | `f187e4a905f2adbd3c3ba28b208b3cd1568e2048` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/independent-review.md` | `1633f52362f4e61eeea3a42fca2a8607a14413ba` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/preparation-evidence.json` | `b0a1126440f9810f13c5be943d1d6360300e6ac7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/prepared.json` | `8cda5fe8555aa515d4077fbf9153a0cc8c56da8c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/technical-plan.md` | `4f79546a7afc8e8e2f7203c66b75a4d39dd22986` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/revision/transport.json` | `45ceaa98d05a5d7ec8972ffb8c6710508cce784b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/delivery-preservation-local-tests.json` | `dc6ae9157bdf7e762f74f88e7c784b7dcfd0c601` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/actions.json` | `fab1dc8ababbb0b2a80ab10d4f53b3412619c6c6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/build-snapshot.js` | `aae53286a7030157365914106515fcf1e43a2150` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/documentary-current.json` | `e5d5fa9e1c00095c90beebd8335b8ba6fc1600f5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/documentary-reconciliation.json` | `94d04a91d3c93dbc18a5b4ffbca591a31de94c79` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/fresh-frame.json` | `c468d9fa547f93a817d4ac1d6848c7153cb28373` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/frozen-source.json` | `d5d526cdd23bb29aa20977d8478dce1efca5143d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/implementation-evidence.json` | `4e75776c723fb39fc1bfc057f0da4e26401418be` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/integrity.json` | `d8d64525dafc9f8fbf4052d4f8ce02d0eae71ee2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/master-closure.json` | `2569f50530341082d28dc68302f2bba3b85cf881` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/master-details.json` | `b2f730467b29fc5c00d4666f950a04659b63c7c9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/observed-frame.json` | `09c8984c3232af0e71c27ad294e3ecca37e0593d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/recovery-qualification.json` | `166820c4a4eb409866ee12411997550a84e3351b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task1/local-checks.json` | `552aa8613755654584b91e35afba5756d6eccfa4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task1/precheck.json` | `6f0b079818b0db75599e46cda3e44f232c5fbdd9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/browser-fix-20261005/evidence.json` | `4c0d1236ac7a7b25d201ad89516fe2fb6a341037` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/controller-tree-validation.json` | `520597a7fe655fa794237250845651a909d11e82` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/decoded-review.json` | `e31b262cc7ac25e5c6a1181e9d13d62c6b6bd481` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/history-causal-excerpts.json` | `3fd7f369720cf8dcd2d4d9bb123a4544a41e02f0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/plan-review.json` | `39c6a15370f1326f72f257ebe05327bfa3e0cb38` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/precheck.json` | `2a9a2a8527e064197b732d3bf7e51787e043785c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/qualification-admission-final.json` | `a5633a6196c30213849eec62761ae3e964082fa0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/qualification-admission.json` | `3b44e979a84bf9cde30d34a1df0aa2a612d5d18f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/runtime-launch-37457022185.json` | `fcb0e49a19602aaa7d7800e27d5ba2cc4887af96` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/runtime-result-37457022185/plan-review.json` | `e613fcf33bc7350e167dff7fe8a2fdf518110165` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/runtime-result-37457022185/plan-review/initial-review-process.json` | `ba24789b2854ec01ad4396585577f8884c2a95a7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/runtime-result-37457022185/status.json` | `229a2a752f6a6f2db8b6aeb51c4bbe9b056df4b8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/clarification-fix-20261006/status.json` | `b912df48794e72fe9b5f66a6f3a52ed335dd87c7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/crlf-comparison-checks.json` | `2b0113d17554d9f1ad311a154003d6297b40d595` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/controller-tree-validation.json` | `d4e89cbf085eea9b810c72509cd73b383235bcb5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/native-tree-validation.json` | `3176a7485f89758f2feb4bc120889af94d35b408` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/publication-window.json` | `a8f6a19b49b15beb80d723becd3c46f5ba8a855d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/qualification-admission.json` | `8ff705d8c89e7a18965297f2c1676abcd6444005` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/qualification-jobs.json` | `67654df5518f9c3936244a5c3d1c34da4f6d6358` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/runtime-launch-37486926450.json` | `9d4974c21b1fcae3815791878a9ac9113189761e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/runtime-result-37471294088/plan-review.json` | `e70748cbba662934afa4cdaabb9c82e610e295c8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/runtime-result-37471294088/plan-review/initial-review-process.json` | `8558e08f11007e3c9ef00233f9ca929a0d741d13` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/evidence-basis-fix-20261006/runtime-result-37471294088/status.json` | `56b8a521414515a84ac56ac37784d067d1590f04` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/final-qualification.json` | `f40982212a858a268d15e4d34739e1ee21aaf13f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/historical-Linux.json` | `aab9be4ca2761680db32780b54376160aea7e01d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/historical-Windows.json` | `a4b172ad2e412d1f447b4522efb75b8cacde52df` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/delivery-preservation.json` | `c7fed7c730412f7401c48259d495207efe565bc1` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/plan-review/initial-review-process.json` | `84fc593b598fd44fbb5756cfb11ae76f24b312db` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/plan-review/initial-review-response.json` | `7cd9869dd01184c8a5a0dc86d48c7e6d1c17c7e5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/qualification-admission.json` | `81ce9bafa351914df878bfc5e42559e2765be829` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/status.json` | `5d9cb93e28c798c0a6338ffa9bd27e7d8e49a216` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-37325776512/summary.json` | `ea1f60b90ba9e97068d80110d81b6954ba435921` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/initial-shell-failure.json` | `81eb8726ebdab34cee45913ea49493a8d641f52d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/controller-tree-validation.json` | `754a6f6efbabc4b2132633cd62117b562c48e745` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/native-tree-validation.json` | `de4bb54fc97eb51d6f3068399dea762fe075a65f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/precheck.json` | `1d427bbbf0dc7288ca8bf3605f0a38bcb10179ce` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/qualification-admission.json` | `47f4b723ad5476958fc57e0048ace2c609f7c103` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/qualification-jobs.json` | `2d298ae80e6a62daec3ad66cc5678b15e1703214` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/runtime-launch-37460970429.json` | `61180cca0fe811c1369bdb49056464cfb87e2613` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/runtime-result-37460970429/plan-review.json` | `557ab89bd5f0f623a38d21839b2c0f438e8e0484` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/runtime-result-37460970429/plan-review/initial-review-process.json` | `e8644d45d32a7ea4d6e698d537266a18342098c5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/inline-contract-fix-20261006/runtime-result-37460970429/status.json` | `1bd45a2d13294b8cfcc3060b605a7751f0c08ba5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/benchmark.json` | `dd80dbb86e20be653d4c7433f46f72939acdc969` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/precheck.json` | `d33f421dd875a6302e4c80b6fde9a5d14bf8db35` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/profile-summary.json` | `c2eb0d06b0b1a730fdb56920f447a8be4b103fef` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/summary.json` | `21c496f8e54253a0047e192ab6db7ae2db26a536` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/targeted-local-measurement.json` | `3a905d4f113fffc199018e50451d2826aa7c70f6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-preflight-terminal.json` | `e17bdaf52cb8dc6ee549b07c48ef98d045c98357` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/controller-tree-validation.json` | `52f15669d61e54f76d6155cccd8625d9f06a7dda` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/precheck.json` | `6c7fef54d1075638b029251118f9cdf4dffcddd1` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/publication-window.json` | `2cc77feac5b09c2e91a4e1cd78d3f2cc9436789e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/qualification-admission.json` | `0d4345711aa15cddf72584690754d53e6870607b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/qualification-jobs.json` | `7e79167a685f2c33ef50773d610747681976c814` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-launch-37491799216.json` | `19f53eabd038c20cc1e84aad50b66f0e548c2813` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37486926450/plan-review.json` | `2868564049c98353d7cda9ebf216c6e163a89b12` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37486926450/plan-review/initial-review-process.json` | `6cd1146cf8e4d09ee72f3378d8ec02abf402e835` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37486926450/status.json` | `4c4b9ecddaf54b064ddbdf3d889e5c2c5e02d043` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37491799216/plan-review.json` | `507bdacf119f31211043a22a437b593f439206d0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37491799216/plan-review/initial-review-process.json` | `1fd90616aba2115d844df4d563e9773c229654dc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-browser-20261006/runtime-result-37491799216/status.json` | `f7625a48f7f8851fcf9e492ecfd6e7d20c143acc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/controller-tree-validation.json` | `d63f171d459daff418020ab593afc8eb393cf8cf` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/native-tree-validation.json` | `29472c1186899414ed6ad2276344f9997e04b6af` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/precheck.json` | `800772bcf50d57c7d23276134c4f14f6e737ceb7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/qualification-admission.json` | `3d841f7d961b55a295c840483a08e79870733795` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/qualification-jobs.json` | `fb0f538f38aa2677ad3037b274c6a8e6db799bfc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/no-html-gate-fix-20261006/runtime-launch-37467046654.json` | `94831d262a2d9b5d6870ef82193f714b4dd238b2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/packed-object-test-failure.json` | `13eb6ce9a7025090c365f23e4eeab4e39c263744` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/controller-admission.json` | `564caeddca14ba3ae16450c67f2153c5b83e6176` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/controller-publication-window.json` | `d595bbdc545e1612634d7f3f9efab8156d05a29b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/final-admission-window.json` | `13c108b79c8235f4301bc44e9e8a10ddc1a16caf` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/power-relaunch-37453662295.json` | `e74f648591f326b960f3e28ffcdeada4e0a108a9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/power-relaunch-publication-validation.json` | `810392bdd2377ab420eb502f668fc13c39121752` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/publication-window.json` | `8d5f1ddc6964f95b3292143a6b3883a48cc9c96e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/qualification-native-tree-validation.json` | `1732e05c6b23b6315608d08f0365124ab35ffcab` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/runtime-launch-37446216690.json` | `080f693477cf7730f67856512029d623397e13d4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/runtime-result-37446216690/recovered-diagnostic.json` | `9c48f36660bd677bf4409537f75892a65f56eccf` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/runtime-result-37446216690/recovered-started.json` | `0e16d9b36706ffb1e53d8a3fab7fa850cd8fc953` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/runtime-result-37446216690/terminal.json` | `40b700c106abf9ccf86809841779f0dadc1a22f2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/runtime-startup-failure.json` | `d3ebc2ee3d07633f70bb918a537f2614ff41e6d5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-completion-fix-20261006/tree-validation.json` | `892c41411201e54c3ff0ba81d9b6be39f608a071` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/local-evidence.json` | `4c87579e453ea9a77c0e50b8203530169c630808` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/precheck.json` | `ab5779ac6c758974003d0c706d3ca8d7fc52ac85` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/publication-window.json` | `0aa1a20be61061659b54e7695b8f46006d9e6094` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/qualification-admission.json` | `b6dab7372756d0893aa8d9679fb077d189b1f965` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/qualification-contracts.json` | `459d1d30edb0fb87816ca33f0f0a7e5b11a08ab9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/qualification-launch.json` | `4c297bd67a5ccde9c8d4f0e0008f05fc4b1fa4ed` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/qualification-snapshot.json` | `368259cd02d6d3dfeed15b96c9077161e1b61b56` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/runtime-launch.json` | `12afdf2107950592980c3707a22b7d97a2ad7160` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/runtime-publication-window.json` | `a52e869315b930828ef94b023e342271e99e3196` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/runtime-result-37396415216.json` | `e32ffe6f5c21345bd138f0b3bbb9d5c9c5906393` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/runtime-tree-validation.json` | `2bb5eb3b172099d9441cdc19c50099fa529fa764` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-contract-fix-20261006/tree-validation.json` | `4f041876c8c50ce138b062ca4406fd27e1ac5c52` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/precheck.json` | `0b55918abba841bd20d92f08328d55a82d2efe88` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/publication-window.json` | `1c79d730000749d3150f9dc6deae5aab586bf295` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/qualification-admission.json` | `13b2d09224b2d9d89ae23769f3d22a9fc33423c4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/qualification-snapshot.json` | `cb93031bb2742f3c3561adef9572917e3faf50c9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-launch.json` | `3e6af9ae7852bac635a611849cf6eb75b8d7840d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-publication-window.json` | `2f461a9915340431195b51c215d59d7f2cd77a04` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/delivered-screen.js` | `3aecfe2cdc7108abd5ae7bb9c9a20ff96208f525` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/delivered-test.js` | `5068f09bf98a1f928bf74374a685b411a5cda1b6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/delivery-preservation.json` | `dea18294dc64ca12e7ca5cea54fdcb1613579cad` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/plan-review.json` | `6d47854e8417dd47f89705f557fd98cb8315c634` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/process-summary.json` | `aeba75debce250c23cc4f2824ca941b5c99a88cf` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/qualification-admission.json` | `6025f242b4c698adfd688bc1c6ab0854dfce1eb2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/status.json` | `bd6351adaa63d93b0960ce0b844dbfb11d7fa05c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/verification.json` | `d11760a9cf1bee6b214724c2efc1767b815ab253` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-tree-validation.json` | `11268776e317de11861a4301e6e2dc41bf612dd3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/tree-validation.json` | `c8f596e551d2cf440ddc3c57cfc6a420b67cb84c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/previous-windows-outcomes.json` | `cf5300a3cb63f21be38dadd647e92a8725858f16` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/controller-tree-validation.json` | `ad269e2a4cc7d0c038f00a607fd8ead18bf66515` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/native-tree-validation.json` | `8090fad75539335bd89dfea15a50c7696480fbd9` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/precheck.json` | `3ad5f8c8876cdbc8b995e807446fa4d46041424c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/qualification-admission.json` | `c8de93a268668785fa3f9cd8ca20a387244d793c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/qualification-jobs.json` | `b1dc48cdb5487060cf787e39ec3617b733ce8c97` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/runtime-launch-37471294088.json` | `0087cf4165b1598629dbce6873c1c142ba89c12a` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/runtime-result-37467046654/plan-review.json` | `03796dfcd34f9d76f223b9d6a67314476054a08b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/runtime-result-37467046654/plan-review/initial-review-process.json` | `b0539ac818a6f3da79d48bcb2208d96b3f538c31` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/proof-routing-fix-20261006/runtime-result-37467046654/status.json` | `7638d3f458e0603704fbb4e2061b40c3e77e5a49` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/publication-block.json` | `50342c531d12ce8bf130ea512b283e831de5f246` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/qualification.json` | `1b7eb8c6272266dd147770ac2547f549038c39cd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/contracts-browser-verification.json` | `ee661d600e8a50f55c84f06932a38498d15f2227` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/history-attribution.json` | `c330bcf2518ecaf21bbd136b233c8dcb55a156f2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/precheck.json` | `3e649d1b0863c4667359f63812835a8210e6b625` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/publication-window.json` | `95d30a11b8b9064836ad5592745f6245c6a82eb5` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/qualification-admission.json` | `af76d7c32d571111c1cf5f6b92a93d3ad898eb25` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/qualification-launch.json` | `aa0805bf1d066cde04c0dfd3438cf9d0b008746f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/qualification-snapshot.json` | `aaca8923d03c50803df9c5b6e6da6c183a7d6b9c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-launch.json` | `cb5acd403191419061743c7d7cc988a708be9c83` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-publication-window.json` | `f0123d5f7313ea5588a64e12a96deaf9ef8c5f02` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/evidence-verification.json` | `95f3ce52b8cc4e3b5e7c2de3ac6b12e747c2f975` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/github-result-snapshot.json` | `27d2ef481499218bb05d000d4aa2798dd94fd56b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/plan-review.json` | `7828be1a2abc53ca3d06cb6f1417fc9a38ceba90` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/plan-review/initial-review-process.json` | `e40fb01dc9b521cdf19e1a81be7b2f691aeb4764` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/plan-review/initial-review-response.json` | `309ae058ae1feae31d5d45f8eac89944b30b34f3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/qualification-admission.json` | `b3453a91bb7041158e786cc39933eb5041d1dca4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-result-37428291785/status.json` | `b87d1471d63c09e63cb4f6682721c642e2d6c08d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/runtime-tree-validation.json` | `4cf05c105554088b5bf409ba0599ca06406900cc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/regression-fix-20261006/tree-validation.json` | `3200bef0147c83e09873748d2a405a69dd272080` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/resume-20261006/admission-repair.json` | `9ec7c9f6fa50a521e6c0f109b04cdc1805753360` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/resume-20261006/historical-artifacts.json` | `3ef5884d52936a24a2cd180acdcc9e70c903e379` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/resume-20261006/local-precheck.json` | `a44c1b16945db35188249ea12b05ef865b16c9de` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/resume-20261006/qualification-admission.json` | `e256e87d267528ccfabf70e62efafcb68a56dafb` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/resume-20261006/runtime-result.json` | `b93b9f3d15b7b638611a0ed503e99f61ddf9e348` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/review-fix-20261006/local-evidence.json` | `f0509b28d3775ca9a3aae2c1d90b706caf55a066` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/review-fix-20261006/precheck.json` | `599c81c404a1c48ce0fbdd9d46954954ab9bf49e` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/review-fix-20261006/qualification-admission.json` | `102748645c793565ee6c86170edf6f56d6fb9943` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/review-fix-20261006/runtime-launch.json` | `c7150d3e270ad28310476bf7a2032a88039062d1` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/review-fix-20261006/runtime-result.json` | `99e1f2532b79fb5e00dc80243e2021a545c984dc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/shell-correction-local-checks.json` | `e65576f98bc57ec0e9a11c698b3b1123e9745bb2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-20261006/local-evidence.json` | `7ebde860b488b4799dcb0e4f0c53243c8b647b38` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-20261006/publication-window.json` | `4de3b08923f70e9b1c699cea1559180a29dd0aa2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-20261006/tree-validation.json` | `121d92c193209c1d03ffe592054703b98d3c574f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/publication-window.json` | `3365d214b7131dfc82870cdb4aa6b4792ab95e9b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/qualification-launch.json` | `b1df614fe6f45d3572453c0f95ee53bba7f276fe` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/qualification-r2-admission.json` | `ec53f3dc7b2eb820e4c97f657442fe38993176e8` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/qualification-r2-contracts.json` | `62174b43acdfc06be830730dd53b64d2470cd6d2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/qualification-r2-launch.json` | `5b95e65d109577e3543466999e48ba923d657f08` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/qualification-r2-snapshot.json` | `a36ac894a8abc1e215f6d2d5beba140281a295a7` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/r2-publication-window.json` | `2f62999001517a6ea2231cf086ef50019c111b27` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/r2-tree-validation.json` | `838b6e9e5fc1970b7dd3aa64f710190f3f6070de` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-launch.json` | `69c4091d73f14b815dd641ba6beed09fa92d2027` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-publication-window.json` | `fb5c460e199fd265f59ee7bbae0b5e54879f8b66` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/delivery-preservation.json` | `da69f6b8733995d837d542d4812eacf9bb8c3eea` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/diagnostic-only-report-NOT-A-RECEIPT.json` | `efd94dc6315142f478f239d51ef3dd2c72e8f77f` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/github-terminal-snapshot.json` | `225f352593039b9af0852af246bb5edcc4f24436` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/initial-review-process.json` | `09a65f671ae69465a17f879545e81bd84d07c17c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/initial-review-response.json` | `4d92c696525f1ac0e9c31b4f57d1807831832ff0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/qualification-admission.json` | `119ccde3fcaada6167b277c1960759764b04edf0` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/review-decoded.json` | `58e745f8168ed479122cc041af2d2e735e365880` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-result-37402330192/status.json` | `507e462e9335212c48f20d38896c3d2298b2bcd6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/runtime-tree-validation.json` | `b74ead0787596d9f4f3a4aaac52313aa9863bc9d` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/stale-test-local-evidence.json` | `123f611dcfe9470fb6d8ab3662ae1cefa98cb12b` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/two-hours-relaunch-20261006/tree-validation.json` | `0d26aad9e25a2cb501eed751e02581ba61910d2c` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/windows-measurement-37360701899/evidence.json` | `9eb375934aa656b21494f3253fba821901eaebe1` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/variable-closure.json` | `efa7e7b3aeb8a7874b09257f13c577b89f0952ac` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/variables.json` | `51e1f3a898e7a3bfa8b84db780397dccdfcd82fa` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/frozen-consumer-fix-evidence.json` | `a3ad1509403d8d6c5b8a3e2acc0e2da7930fb3e2` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/consumption.json` | `269933f20c1a121daf44d30e4c8ee7d22d6a72d4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/evidence.json` | `63f58ba1124a4586fba00dfac074e7daddefaf50` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/functional-proof.json` | `e6686e92397a96725d52bc14cac1ad8cbb4c6496` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/negative-before-claude.json` | `8801a0dbb76ec33269c415361104c23150e84351` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/qualification-admission.json` | `09c27c42259364d78b97916c3cd53d1f0fa97579` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/runtime-result.json` | `d5a9ec739f84553a0c4f564393d0ce90f36c1ed4` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905/status.json` | `5a56ee4525792e22a854e1bf68c359c95c1c2b77` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-preparation-37133206182/evidence.json` | `fbf87391a4f8d6759ae3475586fdc81645d64c40` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/post-acceptance-local-tests.json` | `415935bb763f41fb8f768d086653ba1473f4f1c3` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/post-acceptance-plan-transmission-tests.json` | `a6c02b53682c0b93a6c89f5915bf292e2bf309fc` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-16b70bab/evidence.json` | `0a84060f62cc180dd15288e48837c7808444d7a6` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-16b70bab/owner-approval-evidence.json` | `a338d152c404242b3e19c8318085e0dc7658af65` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-ac405656/evidence.json` | `442f8c2a8c93c3267ae2501ca6d1d9f459e54735` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-failures-e26105b1.json` | `ef5b4b7d221f696efaead66700e1779b21c0b0de` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/revision-diagnostic-37158701286/evidence.json` | `8453b1478fd9c4fb74f2818efe76af376a8732cd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/revision-timeouts-37146178069/base-review-receipt.json` | `1a7e313b4a13c3311799faf0b9ef8ce849f65dfd` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/revision-timeouts-37146178069/evidence.json` | `5241d10082f18fd2c70975507e5b633474b9c700` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/sequence-20261006/publication-window.json` | `bfc05b1a15109a9fd8a77b27cf337f7a27409d22` | Configuration / documentation / preuve |
| `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/sequence-20261006/tree-validation.json` | `17602e8e16b7e4464c5400ee8d1e66eedd25868b` | Configuration / documentation / preuve |
| `.github/workflows/eas-ios-preview.yml` | `f189b6f99278c5f4dcbcbdece7f81ccee5a2a7fa` | Workflow |
| `.github/workflows/eas-ios-routine-dev-review.yml` | `790b8f4b3bf1f48c0d696f7d6cbc3bc223cc99ce` | Workflow |
| `.github/workflows/kodjo-base-evidence-recovery.yml` | `33d5af94a92382d3d6195f6444d4666e7f039359` | Workflow |
| `.github/workflows/kodjo-base-recovery-verifier.yml` | `eb48ff3f0b1461e5a5bf32245e77a2b052201c49` | Workflow |
| `.github/workflows/kodjo-claude-local-auth-diagnostic.yml` | `6b5cad51232981640a8bff35cf76f536970256d6` | Workflow |
| `.github/workflows/kodjo-claude-local-auth-smoke.yml` | `93c090910f74bea88c427403e9c0bb24691af54c` | Workflow |
| `.github/workflows/kodjo-claude-local-runner-preflight.yml` | `1d7695081e89f0522f2dbdbb81f80d2f62b2429a` | Workflow |
| `.github/workflows/kodjo-claude-local-session-resume-02.yml` | `a882a7f4a9d64a4541aa070ac49323a4079fe15a` | Workflow |
| `.github/workflows/kodjo-claude-local-session-resume-03.yml` | `c34b8fc69990203b79b6c35662f796f06d51d95e` | Workflow |
| `.github/workflows/kodjo-claude-local-session-resume-test.yml` | `4686f500911e22bdbb0443072d814b52f6805c0c` | Workflow |
| `.github/workflows/kodjo-claude-session-resume-test.yml` | `d336e1306ab5b419c8c6fab3c58faa3df3b60761` | Workflow |
| `.github/workflows/kodjo-durable-store-preflight.yml` | `f9fe2a662c83a7114abd97b13bf11746b8e9eddb` | Workflow |
| `.github/workflows/kodjo-e2e-chain-completion-v1-3.yml` | `41e4ce02dc21184d863b0351251688da520c9308` | Workflow |
| `.github/workflows/kodjo-e2e-claude-stub-v1-3.yml` | `76f4df9d3b4fcc43cdf2a678973def27a4fe695f` | Workflow |
| `.github/workflows/kodjo-e2e-orchestration-test-v1-3.yml` | `12517896342212f8d591acff318856e3627fcee0` | Workflow |
| `.github/workflows/kodjo-e2e-t1-t6-v1-3.yml` | `f6d1eb0c93a4d6d836158f22d967c0f4d43c9edd` | Workflow |
| `.github/workflows/kodjo-e2e-t4-openai-fullchain-v1-3.yml` | `8e0a1c14edf1303c71bcc6ad17769fd621b44041` | Workflow |
| `.github/workflows/kodjo-event-router-v1-3.yml` | `b9e47dfd099e58a4af16b39e44de841e9c19461d` | Workflow |
| `.github/workflows/kodjo-resume-forensic-recovery.yml` | `52ebeb7ec4a35101b7c4176abaa79a1f4033ed0c` | Workflow |
| `.github/workflows/kodjo-routine-dev-environment-sync.yml` | `985cbe873f31ff66a52961b325372393a1b8ead3` | Workflow |
| `.github/workflows/kodjo-routine-stable-environment-sync.yml` | `270a024b8aa606ff24e919a7dd960dc9bdd1f72e` | Workflow |
| `.github/workflows/kodjo-slice-finalize.yml` | `49c095cfc5b794c23c2f528b36353edd25d5392a` | Workflow |
| `.github/workflows/kodjo-slice-implementation-publication-recovery.yml` | `af9137eafc1dd2d1fbc086e88794e74625f217ac` | Workflow |
| `.github/workflows/kodjo-slice-implementation-review.yml` | `ec7545a3597d99f881fc2e706656bda87a874d95` | Workflow |
| `.github/workflows/kodjo-slice-implementation.yml` | `6dbf7782feee31454872f5f5ec1c6a1c47a07848` | Workflow |
| `.github/workflows/kodjo-slice-plan-review.yml` | `877de07d4530d7ea9407ab4792921a0731a79da6` | Workflow |
| `.github/workflows/kodjo-slice-plan.yml` | `8badd66a2ccefd318087b5a38d60d827f72dfc35` | Workflow |
| `.github/workflows/kodjo-slice-recover.yml` | `f401c45fa969913e22d8d798d0a028ef68154d0f` | Workflow |
| `.github/workflows/kodjo-t8-work-arbitration.yml` | `70db2979ebf4823186544a6056810ee1c22038f0` | Workflow |
| `.github/workflows/kodjo-v1-3-integrated-t1-t9.yml` | `5b0fb6b121c30e35e39459d348f463e6d052b651` | Workflow |
| `.github/workflows/kodjo-v14-local-e2e-recover.yml` | `0e5a3bef56fbd4afeecdac7ae324c20fc5e104ac` | Workflow |
| `.github/workflows/kodjo-v14-local-e2e.yml` | `4cebe21d2171266b2bcfd4bebde0767516184ca6` | Workflow |
| `.github/workflows/kodjo-v14-s09-dev.yml` | `5be302e41ac6e2cc5c20d915a4267a55123648ae` | Workflow |
| `.github/workflows/kodjo-v14-s09-finalize.yml` | `41e12569061ed1348de46d0027dddd575d295af3` | Workflow |
| `.github/workflows/kodjo-v14-s09-implementation-local.yml` | `66dba081ab141a2f94769a1742d29c81ee99b824` | Workflow |
| `.github/workflows/kodjo-v14-s09-plan-local.yml` | `de65655bb3b120f3944db11d90ac4e84deb5638d` | Workflow |
| `.github/workflows/kodjo-v14-s09-plan-review-independent.yml` | `db7fcc6ecb541e2aedc3702a0247cda600b1d1f9` | Workflow |
| `.github/workflows/kodjo-v14-s09-protocol-audit.yml` | `89b8e67d445f54c79977197fa0ccb509d5534895` | Workflow |
| `.github/workflows/kodjo-v14-s09-recover-worktree.yml` | `f50ca89ecb49877bc5c59d112996997185b92bcb` | Workflow |
| `.github/workflows/kodjo-v14-s09-review.yml` | `b66a82cabf4075e05f2c478a4bb4f8a523da786a` | Workflow |
| `.github/workflows/kodjo-v14-s09-validate-integration.yml` | `ffbbf2424c9845132c6fed9bf7d3f80291ed225e` | Workflow |
| `.github/workflows/kodjo-v2-bounded-plan-handoff-e2e.yml` | `3f7906a6556be1a8a891cb451be505460d5c81eb` | Workflow |
| `.github/workflows/kodjo-v2-comment-router.yml` | `43e060fab67ce5fa8f059474bf710270304544cf` | Workflow |
| `.github/workflows/kodjo-v2-disposable-qualification.yml` | `317232571de4d9a4cd5b34202e568545599453f0` | Workflow |
| `.github/workflows/kodjo-v2-implementation-artifact.yml` | `730e1e5b20eca161d219e21a7ce0a96f83a8e136` | Workflow |
| `.github/workflows/kodjo-v2-lean-queue.yml` | `adcc548173b96f4af1014698a8923527cef7491c` | Workflow |
| `.github/workflows/kodjo-v2-next-evolution-independent-audit.yml` | `4ec05fcf8bdce6fc6f9a7cb509a2a369ad6b6f5a` | Workflow |
| `.github/workflows/kodjo-v2-pilot-tests.yml` | `eb4133b75374c68abe92e9ed3b322ef72b0df63a` | Workflow |
| `.github/workflows/kodjo-v2-plan-handoff-materialize.yml` | `1aee11c68de26c1e8f28a6c71eb6d09cc5923bdb` | Workflow |
| `.github/workflows/kodjo-v2-plan-handoff-queue.yml` | `e7ba432546dcf3f74fc2227e837c159ede127e56` | Workflow |
| `.github/workflows/kodjo-v2-plan-review-republish.yml` | `86a466672cf737f9e43240f1af9f5a4b30cc0e5d` | Workflow |
| `.github/workflows/kodjo-v2-preservation-smoke.yml` | `ae0da46c10894512a5583adbd7d9054b118b8c84` | Workflow |
| `.github/workflows/kodjo-v2-review-existing-delivery-bridge.yml` | `d9bbe3e9096ab42a909d447260bf0c5334fb961b` | Workflow |
| `.github/workflows/kodjo-v2-review-launch-smoke.yml` | `d2112e259c53c097f7d05cc19ee309dab7c26c02` | Workflow |
| `.github/workflows/kodjo-v2-runner-inventory.yml` | `511437767a52701ca1b7ee4ea5131b4faee2a72c` | Workflow |
| `.github/workflows/kodjo-v2-slice-initial-plan-review.yml` | `4cc854e0f714e9ed0f87e7edcd78f0d24c4d69d0` | Workflow |
| `.github/workflows/kodjo-v2-slice-initial-plan.yml` | `108e43a8d76b68f2e90963429c9679b770094c9e` | Workflow |
| `.github/workflows/kodjo-v2-slice-minor-plan-clarification.yml` | `0950df3445aacab09932765f73accd8a050e2f3a` | Workflow |
| `.github/workflows/kodjo-v2-slice-plan-review.yml` | `91ea5a6a25ff2f7b4d559298241bbe9856e3aa1c` | Workflow |
| `.github/workflows/kodjo-v2-slice-plan.yml` | `e60b2d409179d3bf9b316d2100d3eb19939e524f` | Workflow |
| `.github/workflows/kodjo-v2-targeted-requalification.yml` | `0390e0c0db6eccaeb816abe08df98c8d908f7d10` | Workflow |
| `.github/workflows/kodjo-v2-targeted-runner-cleanup.yml` | `4ec7d88daf8b5e8027c3c2e11640d2d2b67b3a55` | Workflow |
| `.github/workflows/kodjo-v2-transition.yml` | `864065d17b27beefcbe05681e406523f4590df09` | Workflow |
| `.github/workflows/kodjo-vnext-audit-tolerance-qualification.yml` | `4e229303209bb30afc85e3f47c18b4ea1f862dfe` | Workflow |
| `.github/workflows/kodjo-vnext-chatgpt-plan-review.yml` | `19dfae2defdef73851c0350d53fb17100fbd5a7e` | Workflow |
| `.github/workflows/kodjo-vnext-closure.yml` | `cc69cd106eff257e412e4f9eaf7685e227fbf3cc` | Workflow |
| `.github/workflows/kodjo-vnext-historical-checks.yml` | `960a3fc2491ca8b72b9341ea96d90783e33149e6` | Workflow |
| `.github/workflows/kodjo-vnext-proof-stability.yml` | `9f0d02ce9d09749d5d0917293662dbeefff0095b` | Workflow |
| `.github/workflows/kodjo-vnext-targeted-resolution-review.yml` | `eb3367cf693b79c31b96df8c06c08c1022035f7f` | Workflow |
| `.github/workflows/kodjo-vnext-work-continuation.yml` | `611540380a9d6fd1347e8986efe776339b3830dd` | Workflow |
| `.github/workflows/kodjo-vnext12-disposable.yml` | `a546676b3faff3869fc30b251b8104238ebbe9d0` | Workflow |
| `.github/workflows/kodjo-work-transport-review-test.yml` | `7165bcb5002467f2703540408b89a0a889d4b963` | Workflow |
| `.github/workflows/pre4-claude-availability-diagnostic.yml` | `b673298e473ccfe7650241b39f5ae9da488ef673` | Workflow |
| `.github/workflows/t01-s09-implementation-v1-3-temporary.yml` | `1ecf002e174a099c3ef9a5c97c97b76c0d42260e` | Workflow |
| `.github/workflows/t01-s09-plan-revision-v1-3-temporary.yml` | `008fc75b6701ba34c34a37bb5cf6b1929b4735b6` | Workflow |
| `CLAUDE.md` | `61761a5df82d36788836c39d9e9f25dfa6464468` | Configuration / documentation / preuve |
| `scripts/kodjo/activate-kodjo-v2-slice.js` | `822a9e32b655a25f6fecedea805c5f53bb41fb5e` | Scripts |
| `scripts/kodjo/activate-kodjo-v2-slice.ps1` | `157dd426e2264b37cbb4846dc6782dcc7f88d7ab` | Scripts |
| `scripts/kodjo/adapters/no-remote-agent.js` | `3ee9d31cbc8e65702799a10462216dfe9e1d7178` | Scripts |
| `scripts/kodjo/agent-relay.js` | `9574f7d03f9ed87ca2fbbdee3dd45d8a44689490` | Scripts |
| `scripts/kodjo/apply-minor-plan-clarification.js` | `046691ad1523b8032d994f0f747627a66cc9811e` | Scripts |
| `scripts/kodjo/assemble-plan-impact.js` | `1f6d89a119b92355abd63f6c5c3c448919de950c` | Scripts |
| `scripts/kodjo/build-planning-context.js` | `70f855255052ab7b0d9bf5957fbc7e13c69429da` | Scripts |
| `scripts/kodjo/certify-persistent-runner-lock.js` | `d53fdfcb5913344bf5d7056da9ffa070c1642623` | Scripts |
| `scripts/kodjo/certify-prod-qualification-scope.js` | `aff0b2e7d38d52eeaf2f88ab9bea10ad35cc6505` | Scripts |
| `scripts/kodjo/certify-recovery-artifact.js` | `ca8e1be14eb91c0ef409a06aab51fac8c12eca00` | Scripts |
| `scripts/kodjo/certify-vnext-incidents.js` | `2541c68738e7b6161ec8f206414c27f26154f786` | Scripts |
| `scripts/kodjo/chatgpt-plan-review.js` | `b715ef27a4dd221f4018312573351842b387c7a4` | Scripts |
| `scripts/kodjo/check-artifact-budget.js` | `0894ef07849c8cf0fca24197164d58e838d219ca` | Scripts |
| `scripts/kodjo/check-qualification-availability.js` | `85a98397adf8e26efe867536996ea76c8b22515c` | Scripts |
| `scripts/kodjo/check-scope.js` | `fd83be919652129f7acac04334e980fb374b352e` | Scripts |
| `scripts/kodjo/classify-environment-update.js` | `10386d65ead8b08e135c6a06c90d3ebc2661b3be` | Scripts |
| `scripts/kodjo/classify-planning-failure.js` | `086872815a9a4deb60b337a740958bceea07ddd3` | Scripts |
| `scripts/kodjo/classify-protocol-impact.js` | `5b052b2acbfb60ee8f1587e2a20fe84c5778a4b6` | Scripts |
| `scripts/kodjo/cleanup-run-checkout.ps1` | `1b3669d1f332cde6f77525ad9da0556a9e24290d` | Scripts |
| `scripts/kodjo/close-v2-activation.js` | `954ac5d8f5aa204e4ce97fc8dc04f1fc9107c449` | Scripts |
| `scripts/kodjo/close-vnext-github-delivery.js` | `705e2f604cec7f158a5243b17d4067987e79299a` | Scripts |
| `scripts/kodjo/collect-implementation-report.js` | `40ed8261e87ce9b3ab838c1e6ca3241eb3e9c743` | Scripts |
| `scripts/kodjo/compare-qualification-checks.js` | `b519aa9580a9d65b3c7d0bdbe20f9046201c66f3` | Scripts |
| `scripts/kodjo/consume-disposable-request.js` | `1944d1f38c50806339a0037715c281f30a793c60` | Scripts |
| `scripts/kodjo/consume-queue-request.js` | `25e42f1b17b0c95483d375068f5fbce2f186e6b5` | Scripts |
| `scripts/kodjo/consume-vnext-figma.js` | `8f784cfcbc5f2268c7103b0bfea45fa971d5f58d` | Scripts |
| `scripts/kodjo/create-kodjo-v2-request.ps1` | `e64a3db467d6cde83343246c956458a1e619ae5b` | Scripts |
| `scripts/kodjo/decide-plan-review-retry.js` | `ba736fe962bd603edf9c9339206e128e22a675ca` | Scripts |
| `scripts/kodjo/detect-v2-closure-inconsistency.js` | `417c73a61649b609b34d82f81380729e251e99c0` | Scripts |
| `scripts/kodjo/execute-vnext12.js` | `67bdb6c242a2144bbe5dce1c53d759bd48823c64` | Scripts |
| `scripts/kodjo/exit-from-business-status.js` | `333c687f03701acd0d762402cdb59dd5cd0eaffb` | Scripts |
| `scripts/kodjo/finalize-implementation-delivery.js` | `e0f68debccd598dc55306d6a4c420c98f6696818` | Scripts |
| `scripts/kodjo/finalize-vnext-delivery.js` | `968da4e5f62117ba927e03de463aec52d251e106` | Scripts |
| `scripts/kodjo/fixtures/vnext12/core.js` | `342189177bf0fa1f9379b477babba1b4cb627da8` | Scripts |
| `scripts/kodjo/fixtures/vnext12/keep.js` | `45fc893ea3dd75dacf697aabf387f6f4164f8814` | Scripts |
| `scripts/kodjo/freeze-vnext-figma.js` | `716be1d07d890dc0dfe5939a10e83a76218c23ac` | Scripts |
| `scripts/kodjo/generate-approved-plan-lean-request.js` | `ccda49b6a5463ffdd3fb3daec892da6f0796da39` | Scripts |
| `scripts/kodjo/generate-bounded-correction-request.js` | `adbcaff9aa14c76081446180416276a331933cdc` | Scripts |
| `scripts/kodjo/generate-queue-schema.js` | `24d7a7d4b0a2b683bb0cf1696cf4b547c1305a20` | Scripts |
| `scripts/kodjo/generate-ui-plan-contract.js` | `4e2f1ed6c29510a6f3f1ee14cf952a454a35ed09` | Scripts |
| `scripts/kodjo/git-state-guard.js` | `b7a34bd018d4346e210dce7dc357e3aa55aad2bd` | Scripts |
| `scripts/kodjo/initialize-run-diagnostic.js` | `07adb8977bc3c6f185152d531ba1be958e573c34` | Scripts |
| `scripts/kodjo/inventory-closure-artifacts.js` | `4ca211b80bbb8c3f4779e85d2a304eaa2d5306ea` | Scripts |
| `scripts/kodjo/invoke-kodjo-v2.ps1` | `fc5df6e69f3162a53ceeddfde9bee6bb1fc9fe0c` | Scripts |
| `scripts/kodjo/kodjo-file-mutation.js` | `1b2555860b31c695473e5c16d61d4c67ace7b976` | Scripts |
| `scripts/kodjo/kodjo-git-read.js` | `738f1cf4f9bf5368680087929ddf991fd6aaa23b` | Scripts |
| `scripts/kodjo/lib/adapters.js` | `43f459740a029110e26ae9b182a264b0c958267f` | Scripts |
| `scripts/kodjo/lib/approval-handoff-contract.js` | `40472e6ea397f3e0f00ef10f98ecc1bbe86159f6` | Scripts |
| `scripts/kodjo/lib/artifact-policy.js` | `af1b506c541d315d8a77bed07a68dc2657991035` | Scripts |
| `scripts/kodjo/lib/audit-convergence-contract.js` | `b3f8f323073d380c555072a8fad1f1abdb9acac2` | Scripts |
| `scripts/kodjo/lib/boundary-proof.js` | `9b43b2bdad9f06f6491f0814ec15aa8b516e3912` | Scripts |
| `scripts/kodjo/lib/checks.js` | `c05390fe90651e76853d212d8ef492a0637f9355` | Scripts |
| `scripts/kodjo/lib/claude-local.js` | `3d4707853fb0de453f579c7e30be56cbd6d21b1b` | Scripts |
| `scripts/kodjo/lib/component-evidence.js` | `5891df4abe10e50df3351ba1b78e829c06b63dbf` | Scripts |
| `scripts/kodjo/lib/decision-record.js` | `08222017ae12b5c5b4565e7ea80d6dd4708b740c` | Scripts |
| `scripts/kodjo/lib/delivery.js` | `1ee541a8d2393664d4881c1480e75b1014cda858` | Scripts |
| `scripts/kodjo/lib/device-proof-policy.js` | `a9d79224dbcff82698eaa29777d886de66bf8d78` | Scripts |
| `scripts/kodjo/lib/error-policy.js` | `e7b415cd294c5cbb703c91b855df67db50841337` | Scripts |
| `scripts/kodjo/lib/execution-lock.js` | `28c55e69f55fd9d7643e47ce1070476de76cc7be` | Scripts |
| `scripts/kodjo/lib/git-runtime-integrity.js` | `beffc28f78c802a6cdcbdef5a8d1688120be5750` | Scripts |
| `scripts/kodjo/lib/git.js` | `25b92d1fab43d0093703e119c5b71f59f449bcd5` | Scripts |
| `scripts/kodjo/lib/hash.js` | `69a7355405ebfaec5d394935a2a9ced681452f84` | Scripts |
| `scripts/kodjo/lib/impact-graph.js` | `26f4bad25f7cd2f358601b32b34f05525fff91e1` | Scripts |
| `scripts/kodjo/lib/implementation-contract.js` | `37934e349cab3723490a46ec5678ccf7da4589cc` | Scripts |
| `scripts/kodjo/lib/implementation-report.js` | `bd8b368f66f03f91ec5d58bf42ed09486a802912` | Scripts |
| `scripts/kodjo/lib/initial-product-source-migrations.json` | `fe60b4311a48904adcf1e49b989d31cee45ebab1` | Scripts |
| `scripts/kodjo/lib/initial-restart.js` | `1d7e8f1adb090c17f63b69c40cd2f09728091a24` | Scripts |
| `scripts/kodjo/lib/json.js` | `69b53a68c3578ca06bf56689baa07aad3caeae16` | Scripts |
| `scripts/kodjo/lib/log.js` | `2a40b6af7b7bd17ba1efbbab3a3c10117f75f087` | Scripts |
| `scripts/kodjo/lib/machine-block.js` | `0bbcf14aee84472e337780b4a08fc19b753fd4d2` | Scripts |
| `scripts/kodjo/lib/plan-contract.js` | `dc2bd36da73f27497b6c45a70212eae7253d0b5d` | Scripts |
| `scripts/kodjo/lib/plan-impact.js` | `e4f65d030a4188e6e6858bf91732ac409815531c` | Scripts |
| `scripts/kodjo/lib/planning-envelope.js` | `c5289a05ed57d61fd8cbe2a9a40d77454f737ee7` | Scripts |
| `scripts/kodjo/lib/preflight-contract.js` | `854678af53a11e2351e22f266ec93b9f57333e9d` | Scripts |
| `scripts/kodjo/lib/preflight-freshness.js` | `0d089f67f23a0370dd73c7ccbf392e7a8f7356b2` | Scripts |
| `scripts/kodjo/lib/preflight-source.js` | `6e8f2bf9177426053f1248cff34a0faa2b5be9f6` | Scripts |
| `scripts/kodjo/lib/qualification-availability.js` | `0c96898f7908e2b96d08a30b46e064b8d72b2bc6` | Scripts |
| `scripts/kodjo/lib/queue-contract.js` | `7b984fb1c6b4f2158c99166b45dc06f259d0d78d` | Scripts |
| `scripts/kodjo/lib/queue-request.js` | `84fefa07b826c29909edc53359f76efae4246c70` | Scripts |
| `scripts/kodjo/lib/recovery-migration.js` | `401945264d264538f86471a4d1da257ae00e39bb` | Scripts |
| `scripts/kodjo/lib/requirement-contract.js` | `c59eb9ce0998d9a4d00594bd6dbeb1c3e64d925b` | Scripts |
| `scripts/kodjo/lib/requirement-registry.js` | `1de0580b33e2802b59ee4def028f4827ec41d419` | Scripts |
| `scripts/kodjo/lib/review-contract.js` | `d0cf2092b42b4fea81f8c899cadd8b1f4ed15854` | Scripts |
| `scripts/kodjo/lib/review-findings.js` | `25713ebe2f05bbca5d61bc734f2bbe9b0356c097` | Scripts |
| `scripts/kodjo/lib/revision-contract.js` | `87336a88e530c92f405f00d025f6a2973623a0f8` | Scripts |
| `scripts/kodjo/lib/scope-path.js` | `caebd7d9d483f27aba96281148fd4cfd5007c98f` | Scripts |
| `scripts/kodjo/lib/slice-identity.js` | `7d64c081a126ecde5266b2d2e411517a094193e2` | Scripts |
| `scripts/kodjo/lib/slice-protocol-routing.js` | `0cc79b954fcc66ed44a1517d095247f0f5d12ebe` | Scripts |
| `scripts/kodjo/lib/source-manifest.js` | `17e2ea02e0ec54dc03bf19ca42dc0e3283cc5b2a` | Scripts |
| `scripts/kodjo/lib/status.js` | `4873bdc653aa564bb2ca750a9383c9054a468c0d` | Scripts |
| `scripts/kodjo/lib/tar.js` | `2acd10f6c8bcd357dd758844f172118fdfe44134` | Scripts |
| `scripts/kodjo/lib/ui-atomicity-contract.js` | `0390928ba1e14c1874178bf4f34cbc3bbcb808ef` | Scripts |
| `scripts/kodjo/lib/ui-criteria-contract.js` | `6869088a7040a997fcf80cb5a11f37b2bdc57488` | Scripts |
| `scripts/kodjo/lib/ui-identities.js` | `90dadab1511fab9cbcca09ecee7c922b58c648b6` | Scripts |
| `scripts/kodjo/lib/vnext-agent-relay.js` | `ede8166b91e69e5502f24127ca293bc79055da26` | Scripts |
| `scripts/kodjo/lib/vnext-audit-register.js` | `e2ade74c7c4cbbbf869e7d04aa9d1371f301e412` | Scripts |
| `scripts/kodjo/lib/vnext-contract.js` | `3a8cc36f580a7da4622c24dbac3df81b3aa6fbbb` | Scripts |
| `scripts/kodjo/lib/vnext-cutover-contract.js` | `81e5feb77fb45bf2fa6b6249b933556c5a106247` | Scripts |
| `scripts/kodjo/lib/vnext-delivery-preservation.js` | `c33b532ad38380ef0a8d2ecbe8a773ea580e913c` | Scripts |
| `scripts/kodjo/lib/vnext-disposable-functional-contract.js` | `cdbc0fe6e90eeefd10dbeebf5f581f877be32023` | Scripts |
| `scripts/kodjo/lib/vnext-equivalence-reporter.js` | `8d58e95137753d345fd19050e6d7ec2397768db1` | Scripts |
| `scripts/kodjo/lib/vnext-error-policy.js` | `9d118c238f317fadb8f7058e7fc36c67a7a536b7` | Scripts |
| `scripts/kodjo/lib/vnext-execution-provenance.js` | `3d0df04e1410ed97a501c7865231bdefa23a0e0d` | Scripts |
| `scripts/kodjo/lib/vnext-figma-implementation-review.js` | `385c5926cb67d532424c7641c79116788aafc4d5` | Scripts |
| `scripts/kodjo/lib/vnext-figma-launch.js` | `5212d453c3a981ad0ffa61706a7b568d5177b574` | Scripts |
| `scripts/kodjo/lib/vnext-figma-recipe.js` | `80051c185a255e9d43b0890d01177681099d235b` | Scripts |
| `scripts/kodjo/lib/vnext-figma-source.js` | `885140efe7627cc7805df8a7a09ec4fd2b46e504` | Scripts |
| `scripts/kodjo/lib/vnext-file-bundle.js` | `fc19ef8570ce300579c0165cc28826b9e4763d07` | Scripts |
| `scripts/kodjo/lib/vnext-finalization.js` | `70f9de534cc6155448ded706c266cca206479c06` | Scripts |
| `scripts/kodjo/lib/vnext-git-batch.js` | `ec1d23fedaf37224ad60243f736ac04def087551` | Scripts |
| `scripts/kodjo/lib/vnext-github-approval.js` | `6e7a99ae3944da44a356d00e7d86885b8bd9997e` | Scripts |
| `scripts/kodjo/lib/vnext-github-closure.js` | `554f2e8a10c711376d01050d023dc9f56c61451b` | Scripts |
| `scripts/kodjo/lib/vnext-github-qualification.js` | `91ed61237ed5cd8c20e5b15f00b6e31a81934aa4` | Scripts |
| `scripts/kodjo/lib/vnext-historical-coverage.js` | `b560ba30ebaa55fe4a86ff99b6dd76cc35e89eee` | Scripts |
| `scripts/kodjo/lib/vnext-historical-equivalence.js` | `7c7fc1d3864aa1b534133573e6a8c56df033bad0` | Scripts |
| `scripts/kodjo/lib/vnext-legacy-queue-adapter.js` | `40af6cd2cc533175f53ec0e9e7ee3e49fb113b49` | Scripts |
| `scripts/kodjo/lib/vnext-live-chain.js` | `3a3379306b82e81ec67f388626aeecd930291708` | Scripts |
| `scripts/kodjo/lib/vnext-performance.js` | `4be7e5a1fe664d12fbf39364b8954b7f369ed796` | Scripts |
| `scripts/kodjo/lib/vnext-plan-bundles.js` | `a973b677d28d05ef443764347192884f35bf8104` | Scripts |
| `scripts/kodjo/lib/vnext-post-acceptance.js` | `b7b407ba468125a22a41d548fc9a96fa102f182c` | Scripts |
| `scripts/kodjo/lib/vnext-preserved-controls.js` | `fa270b5e90da9ae15e86a6b9fc17c495c363743a` | Scripts |
| `scripts/kodjo/lib/vnext-producer-packet.js` | `350ccf264068dce55ac0b677fdf30c5d8b4a8407` | Scripts |
| `scripts/kodjo/lib/vnext-proof-result.js` | `02aa579ba3590383c109d9192bed16f626e1b916` | Scripts |
| `scripts/kodjo/lib/vnext-publication.js` | `fdc63864b06d97489db274214590a11077dc2100` | Scripts |
| `scripts/kodjo/lib/vnext-queue-admission.js` | `33ddc14e9780d7e741845ba9a4d957676345087a` | Scripts |
| `scripts/kodjo/lib/vnext-remote-write-security.js` | `551363b3e11a07be2b6976f7943b64527ee03a11` | Scripts |
| `scripts/kodjo/lib/vnext-review-coverage.js` | `9d199e9893e8aee1170915871a1f8e770d5b23a1` | Scripts |
| `scripts/kodjo/lib/vnext-review-process.js` | `57aa24b8dfb3fbb82b625ba46d9653644ee94e60` | Scripts |
| `scripts/kodjo/lib/vnext-review-scope.js` | `1afa0cbcaf3094a1517fd3fcbf5e22756c6068cd` | Scripts |
| `scripts/kodjo/lib/vnext-runtime-plan.js` | `da684ba55638e418e9f365d081a7081ab20f3aa4` | Scripts |
| `scripts/kodjo/lib/vnext-runtime.js` | `5b488d5eff228438741f36355d5ad22defc20605` | Scripts |
| `scripts/kodjo/lib/vnext-test-evidence.js` | `892c048aa926366f818bb7b859723ebfa8575ebf` | Scripts |
| `scripts/kodjo/lib/yaml.js` | `ec4df0aad74ceab588e635178fa9bb4e635ea8ff` | Scripts |
| `scripts/kodjo/materialize-approved-plan-handoff.js` | `275d200a156610bf078b02f1ab465b6b1fe55b1f` | Scripts |
| `scripts/kodjo/materialize-boundary-file.js` | `e480d2f4d84b277e059eb0793caf46f9f6da900e` | Scripts |
| `scripts/kodjo/materialize-review-environment.js` | `2f06e4602126f8b6ae1471b3c69da577eeefe06c` | Scripts |
| `scripts/kodjo/measure-vnext-windows.js` | `d25d630de7c1529f5f6d9c49f543586dd22b9968` | Scripts |
| `scripts/kodjo/normalize-review-findings.js` | `2d1de6fcde8ced429e623c5227043ca96873c309` | Scripts |
| `scripts/kodjo/openai-plan-request.js` | `24450d4f4172683e3ef363bc8680f10f9e8aa243` | Scripts |
| `scripts/kodjo/openai-runtime/package-lock.json` | `7f99c2c12ba55f2badb2cfa49dc61df0fc06cb8b` | Scripts |
| `scripts/kodjo/openai-runtime/package.json` | `bbf0a8f74d925da657b0e715e9a3900de608f2eb` | Scripts |
| `scripts/kodjo/prepare-evidence-writer-smoke.js` | `434152ac49dadeadec7185e8fb892c77323e6c75` | Scripts |
| `scripts/kodjo/prepare-visual-recovery.js` | `0d3a6deed2422b4b7e679627dce9f98ab831b2c7` | Scripts |
| `scripts/kodjo/prepare-vnext12-revision.js` | `4c9ec0eb16c2d600ec844c7efb01d31c206df900` | Scripts |
| `scripts/kodjo/prepare-vnext12.js` | `484d3b388227b9445368b317363f4cb3f1f0877b` | Scripts |
| `scripts/kodjo/preserve-implementation.js` | `d073b266d91d3716b1c839954a94a0007cef1d7f` | Scripts |
| `scripts/kodjo/produce-vnext-test-evidence.js` | `efb44db8c899e61fbc6440a535679b361dbce878` | Scripts |
| `scripts/kodjo/project-queued-request.js` | `45613164edfc215d7a968e9238e5cffd0eaf6d80` | Scripts |
| `scripts/kodjo/publish-implementation-output.js` | `3164674137f52be5fe89e07bb3ec129a3856027b` | Scripts |
| `scripts/kodjo/publish-independent-protocol-audit.js` | `6080e345552aec31565a0e0551e436ac047f1551` | Scripts |
| `scripts/kodjo/publish-visual-checkpoint.js` | `fdbafa4768a9d29fe8ee9d64f785517668ab19b3` | Scripts |
| `scripts/kodjo/qualify-vnext-figma-real-path.js` | `962886744fad3551bc2d8d184847a73630df6bfb` | Scripts |
| `scripts/kodjo/qualify-vnext-functional-reference.js` | `f5c82be311164f8624b1dcd1b220a30882ee2670` | Scripts |
| `scripts/kodjo/qualify-vnext-historical-equivalence.js` | `c545c00fe1dccbec0434bdcc680816f4e10abcfc` | Scripts |
| `scripts/kodjo/qualify-vnext-stabilization-audit.js` | `3e6bdfe3e3a242920f5fc5cbb7b6d85336391590` | Scripts |
| `scripts/kodjo/reconcile-initial-plan-prose.js` | `a15a8267ce0ea91c32c66875fea925a992e04f11` | Scripts |
| `scripts/kodjo/record-infrastructure-metric.js` | `aa90aa29f1741a924491ba1787cba5f01b2f9b2f` | Scripts |
| `scripts/kodjo/record-unavailable-recovery.js` | `a00d91fd21474b27a1c69dd0c3f794a7027076f9` | Scripts |
| `scripts/kodjo/recover-published-plan.js` | `d1c3b6cbfa4f146c154add636c60d76c8fdb07e9` | Scripts |
| `scripts/kodjo/recover-published-pre1-plan.js` | `ef11ac32e4c4edaef6cbeac84ff3f11f4e62bd32` | Scripts |
| `scripts/kodjo/repair-review-nonui-coverage.js` | `2d07c98c874af4cbcd5b5611dd30ed63241a7812` | Scripts |
| `scripts/kodjo/republish-plan-review.js` | `d01ab647ecfb2e8d27ea65fbe4a1abbce1b372a2` | Scripts |
| `scripts/kodjo/resolve-checks-to-run.js` | `2a674bae12eb6c0d29f477f3d7b7e9b998b3d238` | Scripts |
| `scripts/kodjo/resolve-claude-binary.js` | `e282beb39c629b346362f054ce0b57833d090d60` | Scripts |
| `scripts/kodjo/resolve-implementation-review-policy.js` | `fbb7317ddaa1c12df1634d851b6d8212df7b1b5f` | Scripts |
| `scripts/kodjo/resolve-pre1-targeted-acceptance.js` | `e2269bf6e4f262ee0fa51fff563e949f4c7af10e` | Scripts |
| `scripts/kodjo/resolve-private-head.js` | `88fa1eb264ca8318d8d60539f88c279925cf2a45` | Scripts |
| `scripts/kodjo/resolve-recovery-source.js` | `38fc2f77164e37a7ba191f3436761c958eb9bee8` | Scripts |
| `scripts/kodjo/resolve-review-environment-sync.js` | `64c5c8375f809890a5cd5866a11fd25fab364119` | Scripts |
| `scripts/kodjo/resolve-review-run-environment-sync.js` | `dcb245504017335f24a6ee336a742ecc67f478f4` | Scripts |
| `scripts/kodjo/resolve-run-directory.js` | `79bbfb2661ae2c6fde91eb13656127eb62225076` | Scripts |
| `scripts/kodjo/resolve-slice-protocol.js` | `3d31cba750663013ddcc938d1b014d3cfca8d1d0` | Scripts |
| `scripts/kodjo/resolve-stable-environment-sync.js` | `9e0890dfa4089d038c3b0ff32549e5574692a27e` | Scripts |
| `scripts/kodjo/restore-source-artifact.js` | `d0fe60d9afe2cb56c847191011dff61557281fea` | Scripts |
| `scripts/kodjo/review-vnext-figma-implementation.js` | `58a74f979019c4214ce3cf2cd8d4bf21e3ea276b` | Scripts |
| `scripts/kodjo/run-check.js` | `8a1bba057693c07da2297d11bd70f8677bc02714` | Scripts |
| `scripts/kodjo/run-disposable-qualification.ps1` | `a0bcaa72caf070691f3c17dee7936fa65207ab75` | Scripts |
| `scripts/kodjo/run-disposable-resume-qualification.ps1` | `d2722d65c759671adfb46ad8c1c4ffb3e9806540` | Scripts |
| `scripts/kodjo/run-implementation-agent.js` | `825eb7c9f16f369b242756df84d34424e9318af7` | Scripts |
| `scripts/kodjo/run-local-claude.js` | `d7278c45a1e621eb0373e643541f87f80cf55cc1` | Scripts |
| `scripts/kodjo/run-plan-review-cli.js` | `a94815e56f575f22dadb5eeb78f1a5b20510f94f` | Scripts |
| `scripts/kodjo/run-queued-request.ps1` | `7a4206b312341b3105b63c1d94594b8f435f1e45` | Scripts |
| `scripts/kodjo/scan-plan-impact.js` | `f07389f93dc8c3b2743727fee4e78deda5a0fd26` | Scripts |
| `scripts/kodjo/scan-remote-write-capability.js` | `5704dc064aed72c588b74db1d41a9962aa39fa97` | Scripts |
| `scripts/kodjo/setup-kodjo-claude-auth.ps1` | `0d73b5584158f104af238dac14be24cb551bc2f2` | Scripts |
| `scripts/kodjo/signal-vnext-agent-continuation.js` | `2b1a8324cec62b15d972703aadb4de3ffbc757a8` | Scripts |
| `scripts/kodjo/signal-vnext-cycle-continuation.js` | `8f5ff5eaf8d43515ff93c89cb707154d6c9ca684` | Scripts |
| `scripts/kodjo/start-kodjo-slice.js` | `b2a3d5d1ddbf47be80ae6b8f5613db65cfc9fa94` | Scripts |
| `scripts/kodjo/start-kodjo-v2.ps1` | `2eb25c17ca9eabf1a99a07bcf6758ae8889783bd` | Scripts |
| `scripts/kodjo/targeted-requalification.js` | `e06b5b1837c2f1843fcd1416e687ab4971db2222` | Scripts |
| `scripts/kodjo/test-vnext.js` | `9146e0ea711f53c659be02c564ffd2515eaf7c22` | Scripts |
| `scripts/kodjo/validate-orchestration-paths.js` | `9bb9d0084e823210302dc8896681af361f8be087` | Scripts |
| `scripts/kodjo/validate-plan-module-paths.js` | `4b71dcb793458efaaed1c47b46e632cbf5288b8b` | Scripts |
| `scripts/kodjo/validate-slice-bootstrap.js` | `69297b9d2f7f897bf731837d7800e39d68d69d9f` | Scripts |
| `scripts/kodjo/validate-vnext-closure-request.js` | `fa3d8a26d1c3ea632fc2d83e28eb4f0d892b52e3` | Scripts |
| `scripts/kodjo/validate-vnext-publication.js` | `8004fa0bf29e1af22111c6eba1fbc313c6177de2` | Scripts |
| `scripts/kodjo/validate-workflow-syntax.py` | `3f28c53bb47d9903e0b40a0f23782f67c3f1b625` | Scripts |
| `scripts/kodjo/validate-workflows.js` | `1490d3a7790c1ac4b3e3f03093a784eddc0a1b8e` | Scripts |
| `scripts/kodjo/verify-artifact-retention.js` | `eb499d203b1f67ed7fffc1378bad3819919aa05f` | Scripts |
| `scripts/kodjo/verify-authorizations.js` | `2314c3503b14489bfbec76b033cbad158345f5bc` | Scripts |
| `scripts/kodjo/verify-bounded-plan-revision.js` | `e331096f379dfb5113373f6818f42d909c5a9c29` | Scripts |
| `scripts/kodjo/verify-claude-auth-status.js` | `568c18663dc1747fcfbc6c2e79aaa6eb1e194b59` | Scripts |
| `scripts/kodjo/verify-delivery.js` | `19da038b8cdd690ccf9ae0ed2d7609ad003edbce` | Scripts |
| `scripts/kodjo/verify-global-requalification-state.js` | `b8733b3cd604e662f109469865f151af16c18d95` | Scripts |
| `scripts/kodjo/verify-implementation-mission.js` | `3d1eb90f52e2477f244e6613fc9f7feddc12fd83` | Scripts |
| `scripts/kodjo/verify-implementation-plan-gate.js` | `a042dcb0c9bfe7e8b490a611a16c7489f87ac636` | Scripts |
| `scripts/kodjo/verify-independent-protocol-audit.js` | `1ba598a4cc58f6f82bd258aa8f3989951970b2ad` | Scripts |
| `scripts/kodjo/verify-initial-product-sources.js` | `794963eb2ccf8115dec3291d97028bbd8e5a26c0` | Scripts |
| `scripts/kodjo/verify-initial-restart.js` | `dbf3cd9a7571c5df63c83bd89e9fe7e0bf577e58` | Scripts |
| `scripts/kodjo/verify-plan-closure-review.js` | `516ecc12b8aaf4e56c32ac96e6cd587be5f25261` | Scripts |
| `scripts/kodjo/verify-plan-contract-consistency.js` | `243b424246371183cdf107411d038740079b0524` | Scripts |
| `scripts/kodjo/verify-plan-impact.js` | `b57edc79b35ff3d6c4403dea91a36f511f9bb69b` | Scripts |
| `scripts/kodjo/verify-plan-review-transition.js` | `b9334553360ac12c6da07d0a14029a1f3ac56e29` | Scripts |
| `scripts/kodjo/verify-pre1-closure-review.js` | `5efae8309519c567381b83efad4f16e3f91fa382` | Scripts |
| `scripts/kodjo/verify-preflight-attestation.js` | `90e40539ba3b6021ee24f26226786a1bbba84d5b` | Scripts |
| `scripts/kodjo/verify-preflight-live-target.js` | `ac7ccd7487d2273fa3ffc71b5cb7c7fd3c8d3291` | Scripts |
| `scripts/kodjo/verify-queue-admission.js` | `fdac26c2c67da702951003eddbf26bdd2bb9cd5e` | Scripts |
| `scripts/kodjo/verify-queue-preflight.js` | `46ef7422910666e7f9fd6835247ea3221e4b5498` | Scripts |
| `scripts/kodjo/verify-review-format-repair.js` | `636307b18a9902d0c18cc5f78a8a2614c3bf9631` | Scripts |
| `scripts/kodjo/verify-source-comment.js` | `26f12dc8171b5753bd55a1c18827167fa0db9044` | Scripts |
| `scripts/kodjo/verify-staged-scope.js` | `c5ae9558e04c24b32fcf80f3d00d61d8a6a6dd9e` | Scripts |
| `scripts/kodjo/verify-test-contract-results.js` | `63f12d994c3faaa2e7bd411491609c121c084ec7` | Scripts |
| `scripts/kodjo/verify-ui-implementation-review.js` | `d01c866e416a775ad92a2c2b71829a94ad69adf7` | Scripts |
| `scripts/kodjo/verify-ui-plan-criteria.js` | `40b6e0a5a435fea4baa26e9989c3ccfcfb590d8a` | Scripts |
| `scripts/kodjo/verify-v2-finalization.js` | `337be22cca3ae340dfbe3dc4b111eeca18f840d7` | Scripts |
| `scripts/kodjo/verify-visual-checkpoint.js` | `8eb4d36aa670defc149d4e0f0377cf2dadf39b44` | Scripts |
| `scripts/kodjo/verify-vnext-platform-coverage.js` | `441a64ce7b18f4a60281b551cfb45d11a447416b` | Scripts |
| `scripts/kodjo/vnext-chain.js` | `c82e5a492f0558d6ab0f7fb23616806781522753` | Scripts |
| `scripts/kodjo/wait-vnext-audit-qualification.js` | `7256d06037d533930905a691f92e5fa30dd11d7e` | Scripts |
| `scripts/kodjo/write-evidence-deposit.js` | `51dec12597712d8f8d77dc7bc8be457bce5cf6b4` | Scripts |
| `tests/kodjo/activation-planning-head.pilot.js` | `04d35d4a810d159a73796a6e7fced67bcbf35212` | Test |
| `tests/kodjo/adapter-guard.pilot.js` | `02ef5bbc2093487c731eec5e2d7f9a643e8d371e` | Test |
| `tests/kodjo/adapters/failing-publisher.js` | `14e312e9b9c6de04be0e8f891158697bbc3273a6` | Test |
| `tests/kodjo/adapters/mutating-agent.js` | `31d274c43431fe38cac65471726b3759c98ab07c` | Test |
| `tests/kodjo/adapters/recording-publisher.js` | `4863601a6b24566a8e7b5bb592675f17e0015518` | Test |
| `tests/kodjo/audit-consumption.pilot.js` | `732b54d5b5a8e2810faaec330edecafc0911bdd4` | Test |
| `tests/kodjo/audit-convergence.pilot.js` | `ed7de4c3185e68783ea747a2b743ebd48696026f` | Test |
| `tests/kodjo/audit-live-target.pilot.js` | `6b72ce56f276de90a14397fb14dfa7a99dc33c4d` | Test |
| `tests/kodjo/audit-prompt-transport.pilot.js` | `f359a9b26184b1e26404925dd898c4cbedf2d187` | Test |
| `tests/kodjo/audit-report-consumption.pilot.js` | `f934e66588829f7e1161ec2d223458d61f39bbe1` | Test |
| `tests/kodjo/audit-results-evidence.pilot.js` | `6926f9eaea6b198e366272a3f556575cb17bda39` | Test |
| `tests/kodjo/audit-v8-trigger-security.pilot.js` | `c49c866e1e77b1e5cfb108d6ca55016604b8182e` | Test |
| `tests/kodjo/audit-workflow-regressions.pilot.js` | `1dec02251452036c193c9c315b3271468adc7145` | Test |
| `tests/kodjo/causal-runtime-boundaries.pilot.js` | `2368aa3490c3b9eb9e136b13621e9f27a066eaf0` | Test |
| `tests/kodjo/claude-foreground-checks.pilot.js` | `f2e0732e33183cf6b2bab5f168694004d809a426` | Test |
| `tests/kodjo/claude-local.pilot.js` | `53f03c9242cfd007066294fa7584373939a983b4` | Test |
| `tests/kodjo/comment-router.pilot.js` | `7fcb929a5d6348b85bba7cb1330700546d62dc5b` | Test |
| `tests/kodjo/delta-scope.pilot.js` | `c80ebe45e9ff1cb9f947df9aa663c1479c2b69d6` | Test |
| `tests/kodjo/device-check-derogation.pilot.js` | `9b45418c345410f65155d4120f467b0f5bda7167` | Test |
| `tests/kodjo/disposable-consumption.pilot.js` | `efe424b638815d21e724ba22d4f3690592bf91fd` | Test |
| `tests/kodjo/environment-sync-sidecars.pilot.js` | `bc23578759d1ac17b879fbec4a96db95555aa9ca` | Test |
| `tests/kodjo/evidence-writer.pilot.js` | `64632fc6afc32d3286f8b5048e65c01eed967ce3` | Test |
| `tests/kodjo/exact-byte-staging.pilot.js` | `5766ded2bdad5dcebda7c180610d98588971300d` | Test |
| `tests/kodjo/existing-pr-authorized-plan.pilot.js` | `8b0ddf7078a8fba36191da2e36a89681bfde51e1` | Test |
| `tests/kodjo/existing-pr-delivery-observation.pilot.js` | `b8569b41c9159008b80af3a7b75982a1c76f37b6` | Test |
| `tests/kodjo/file-mutation-runner.pilot.js` | `dbd90b0f7b4d6e2cea21dfbb2970bed157a16553` | Test |
| `tests/kodjo/generic-closure-review.pilot.js` | `b63dcc3cad5faba3b92411f40c8737eaff94de13` | Test |
| `tests/kodjo/generic-plan-publication.pilot.js` | `6dc444f9170ca715a0a203ce752a0729d53d01f2` | Test |
| `tests/kodjo/generic-revision-publication.pilot.js` | `2faf49e5f5dec55f43e7b259e808b1b15c6b4ff1` | Test |
| `tests/kodjo/handoff-application-drift.pilot.js` | `4625c5c22212a07209823f61b824241ca42c0f83` | Test |
| `tests/kodjo/helpers/consumption-git-api.js` | `a65e913531dedd70eec54339bd6bb82d6ed8fced` | Test |
| `tests/kodjo/helpers/fakes.js` | `54ee2238a4f2bc8f91a841f8476ecd8283807596` | Test |
| `tests/kodjo/helpers/normalized-git-source.js` | `16ac0a76203fc3403d9584114f63340c1df46930` | Test |
| `tests/kodjo/helpers/pipeline.js` | `a0a0c6c257fb6ad4498755be00b403fd243b1f16` | Test |
| `tests/kodjo/helpers/preflight-checks.js` | `0faf1313b6107957aed7c0a2ebbe75275b9af61c` | Test |
| `tests/kodjo/helpers/review-attestation-fixture.js` | `ecdfb1d568f7f3c6d4e4a58643a71a563c6cbd4e` | Test |
| `tests/kodjo/helpers/sandbox.js` | `6e6d26701c88f28d73a5eed6d56635ec7dbd2769` | Test |
| `tests/kodjo/helpers/vnext-coverage-fixture.js` | `075ae1fb6b349be72813a1e1df48662c46766ee5` | Test |
| `tests/kodjo/helpers/vnext-figma-fixture.js` | `5e9ff56d54f3c3126b675f12fbaa04683f675fe9` | Test |
| `tests/kodjo/helpers/vnext-functional-reference.js` | `b965f5b1a33eb1051cdb18304300ab1679c888e2` | Test |
| `tests/kodjo/helpers/vnext-planning-fixture.js` | `01c1c2c84bbd844d1805e21ae963fe7da5b89121` | Test |
| `tests/kodjo/helpers/vnext-post-acceptance-fixture.js` | `d8986d042f43e76f98e11531d311200c1067bca8` | Test |
| `tests/kodjo/helpers/vnext-proof-lifecycle-fixture.js` | `0cd2a18851a8da6b7b4667194c333f3373bdd917` | Test |
| `tests/kodjo/helpers/vnext-test-evidence-fixture.js` | `6052cda13ccebf0dfe458a4deee63a5ea97f3903` | Test |
| `tests/kodjo/implementation-contract.pilot.js` | `89330ff02b53bba3fe07ef28b3ba98ae57ee4500` | Test |
| `tests/kodjo/implementation-plan-gate.pilot.js` | `524ead1934049c976e930a65eb6bfddba65dae1f` | Test |
| `tests/kodjo/implementation-review-criterion-derivation.pilot.js` | `da607b7c57e5fbe6271db24af6605ccf9ebee8a9` | Test |
| `tests/kodjo/incident-register.pilot.js` | `54cf18e1d6e07e5e5a93a2d4819b837ba473b576` | Test |
| `tests/kodjo/independent-audit-publication.pilot.js` | `c4265669999abcaca3c1b7ee4b5e89bd5ede516b` | Test |
| `tests/kodjo/independent-audit-regressions.pilot.js` | `ab5f5cc171cc80912882e6a216b15f465a219524` | Test |
| `tests/kodjo/initial-plan-scope-reconciliation.pilot.js` | `7ba849bf70b47cb13a0a03c920684b3e3c242c97` | Test |
| `tests/kodjo/initial-product-source-verification.pilot.js` | `24b306499b3ea245c631c42e722dd41a49ce627c` | Test |
| `tests/kodjo/initial-restart.pilot.js` | `6f96d0784a2f1fb14a6fb4aebcfb7c0eea023b3e` | Test |
| `tests/kodjo/lean-queue-boundary-file.pilot.js` | `2759b4a158723bb89439d99cb52ad60d3ff8ea59` | Test |
| `tests/kodjo/lifecycle-corrections.pilot.js` | `7e8d5ffdf681c897f56c5878feb0257a1b97cd37` | Test |
| `tests/kodjo/materialized-recovery.pilot.js` | `b4020c9e835bbb8e70b23dacdb826e81d1c1ea9b` | Test |
| `tests/kodjo/minor-plan-clarification.pilot.js` | `84fd1da48ef406c132bfc4b6bf34d3cfc6193b1c` | Test |
| `tests/kodjo/next-evolution-determinism.pilot.js` | `3004fbb548a605c5c4d69ce435460563b49191b5` | Test |
| `tests/kodjo/plan-consumption-lifecycle.pilot.js` | `fac794f8925510e312ccf9dba1c8c3bdbc0e0405` | Test |
| `tests/kodjo/plan-contract-consistency.pilot.js` | `8edc6937155bdfe0ed5da860db2e34e1cda34466` | Test |
| `tests/kodjo/plan-handoff-budget.pilot.js` | `6e29e296700f7ba9a096fbc2ddcd3c74979230ea` | Test |
| `tests/kodjo/plan-handoff-dispatch.pilot.js` | `f88ab6bf8680762a089a1398ac4a6f329e43cf91` | Test |
| `tests/kodjo/plan-impact-assembly.pilot.js` | `96c249b0c075f13cae3dbc00dbc8d876564bc5f9` | Test |
| `tests/kodjo/plan-impact.pilot.js` | `0e9fb9891819638bdf37dabff4042e1a2eecc10c` | Test |
| `tests/kodjo/plan-review-publication-retry.pilot.js` | `a543ba23582c389a0e80c550b970425b265352ae` | Test |
| `tests/kodjo/plan-review-republish.pilot.js` | `446373190f21490c6afa966f82e4afc01bd47526` | Test |
| `tests/kodjo/plan-review-stdin.pilot.js` | `b989ca710a7c337da6fae81c2fe701cb44fbb915` | Test |
| `tests/kodjo/plan-review-transition.pilot.js` | `8216e1fdd536a1493c40e1e69fa3c247f344a7c2` | Test |
| `tests/kodjo/planning-api-budget.pilot.js` | `35963725457ffb06500b8b4c3c3465977430df6c` | Test |
| `tests/kodjo/post-campaign-hardening.pilot.js` | `689ce52fc7273bc2f2b250897f16034ed4aac1ab` | Test |
| `tests/kodjo/pre1-handoff-initial.pilot.js` | `f979b2957d8b9feb6d704616557d5a2cf7af1a31` | Test |
| `tests/kodjo/pre1-implementation-review-plan.pilot.js` | `15a456438aa97a7a95271fd2e2f56a0a5674aebb` | Test |
| `tests/kodjo/pre1-review-launch.pilot.js` | `528f741d59da7a1ef1c1596a49f3f5f9bd976ef3` | Test |
| `tests/kodjo/pre1-targeted-acceptance.pilot.js` | `058d3bc7976b98c65bcdc37d7e7f51a258d261bb` | Test |
| `tests/kodjo/preflight-architecture.pilot.js` | `ba5bd314de3a0908a37228872f40de3e4021caa8` | Test |
| `tests/kodjo/preflight-lot-a.pilot.js` | `bb478cd3c90a0ec62b2ef041252cfd9f0aa61ab5` | Test |
| `tests/kodjo/preflight-lot-b.pilot.js` | `6e9426cb2e9b46ea54bd95fa3d429d023a87c1a2` | Test |
| `tests/kodjo/preflight-lot-c.pilot.js` | `4a5773fd33a9fbaa842ef44f772ed767f52e4be6` | Test |
| `tests/kodjo/private-ref.pilot.js` | `63b4286e7d0f13ad370e0b1916a296c0cd00da41` | Test |
| `tests/kodjo/protocol-0.6.17.pilot.js` | `fbfed2125d97255faa931caec26705f45b92e86f` | Test |
| `tests/kodjo/protocol-0.6.22.pilot.js` | `a8d2dd147c142e57e83a06dd21e1f17e14dacb21` | Test |
| `tests/kodjo/protocol-0.6.23.pilot.js` | `50097387a16ad343458b289bbdc094250bd87bba` | Test |
| `tests/kodjo/protocol-0.6.24.pilot.js` | `2a7035fd10c9be3876dc7e652ce1f33f4214599d` | Test |
| `tests/kodjo/protocol-runtime-freeze.pilot.js` | `77ca651b14e03b6a043514c6a3f34c8b4c0ad25b` | Test |
| `tests/kodjo/publication-security.pilot.js` | `b56e363745656654e0116281f27ddc135e85b23e` | Test |
| `tests/kodjo/qualification-availability.pilot.js` | `89befc0d2c0e3d5d47d671a88b62b4062ce83fbe` | Test |
| `tests/kodjo/qualification-check-comparison.pilot.js` | `53634601bbf0e1f7ad86b59c61064009487aae3b` | Test |
| `tests/kodjo/qualification/disposable-slice-bench.js` | `dbe5d77b3dd06eaf9618cece00f21b8d955b576c` | Test |
| `tests/kodjo/queue-admission.pilot.js` | `109e1d62e2b3f03dec733b2893ab49f98ac902da` | Test |
| `tests/kodjo/queue-contract.pilot.js` | `ef9b411d0d0a61062d30e8bd185f5fe07c081243` | Test |
| `tests/kodjo/queue-integration/build-windows-stubs.ps1` | `4c0e4bba7dd67c65d1fa4fbf5e5a4c5baddbb608` | Test |
| `tests/kodjo/queue-integration/fake-jest.js` | `18eed43a9a813948005a16d688cebbda2cc32693` | Test |
| `tests/kodjo/queue-integration/make-fixture.js` | `32df7dd75415e93d32cc13c39bee3cb66287ec1d` | Test |
| `tests/kodjo/queue-integration/make-preflight.js` | `1f8da6049450000822a34ece73b3615a59dd008e` | Test |
| `tests/kodjo/queue-integration/run-bench.sh` | `eb21fa19d80c390459e0c879dcf383dcc065c4b5` | Test |
| `tests/kodjo/queue-request.pilot.js` | `cebfd61163d50fc01c84203c7b7a678448c738b7` | Test |
| `tests/kodjo/queued-runtime-freeze.pilot.js` | `b40835dda4999aeb89c18ac513a0e46a556600fc` | Test |
| `tests/kodjo/recovery-migration-executables.pilot.js` | `be546005833141bee8edd85d1703605d5268b184` | Test |
| `tests/kodjo/recovery-migration.pilot.js` | `20c7ebacf4d4be4be10c2118b93f86e0e7ac5b3f` | Test |
| `tests/kodjo/review-assertion-derivation-order.pilot.js` | `a5027901d1eeff52aac770274345a93d5ba9952c` | Test |
| `tests/kodjo/review-format-repair.pilot.js` | `8e0823a47f9d00cb828518388ed6f2dd43d62282` | Test |
| `tests/kodjo/review-nonui-coverage-repair.pilot.js` | `eeb3e63c14383ded51557c5f87b297dd34ed03c4` | Test |
| `tests/kodjo/revision-closure-review.pilot.js` | `896587963eb84c7bc9876856f075118dd70ace50` | Test |
| `tests/kodjo/run-all.js` | `66f086bc96701c44186144eaff8393f725ec1125` | Test |
| `tests/kodjo/slice-identity.pilot.js` | `dfae7b36881ec5b91f96f5b330c4e0826f25a252` | Test |
| `tests/kodjo/t02-preservation.pilot.js` | `c531f885722622ab87dadcfdb72c6db7f4bc924c` | Test |
| `tests/kodjo/test-contract-jest-json.pilot.js` | `1fb016907422e598096c4c34e50118454b0ece48` | Test |
| `tests/kodjo/ui-e2e-finalization.pilot.js` | `726e17b560d02b4fc4b1c75446d85c0352a995f4` | Test |
| `tests/kodjo/ui-implementation-review.pilot.js` | `c7e80a550631f51fac88c9b9026bf7fa0e55d528` | Test |
| `tests/kodjo/ui-plan-criteria.pilot.js` | `5cc818d32907435578d5373c62e78fdc298c846a` | Test |
| `tests/kodjo/ui-plan-generation.pilot.js` | `e44ef18ba01e6a74f2eee6932f8d6d9acc776a0d` | Test |
| `tests/kodjo/unit.pilot.js` | `cb129474b95bae6248f84ec858f4aebe25fea79a` | Test |
| `tests/kodjo/v2-initial-planning-entry.pilot.js` | `888ecf3aeaabee125b1fcf598277cc5d841cc442` | Test |
| `tests/kodjo/v2-plan-handoff-bounded-e2e.js` | `4ed03293c94f4827772821087eee2a371106fdcc` | Test |
| `tests/kodjo/v2-plan-handoff-negative-e2e.js` | `6c429c3b42c0b2d9fbe3a278a6be55ca6dc3a953` | Test |
| `tests/kodjo/v2-planning-entry.pilot.js` | `91f2815e44e2df3591a2018e763f559731a971a8` | Test |
| `tests/kodjo/v2-review-existing-delivery-bridge.pilot.js` | `c30bfd192d4143311bdf65a9373efb95e025a032` | Test |
| `tests/kodjo/v2-revision-draft-prompt.pilot.js` | `12d585a5134a8c58046c6bfe98ef35d038f63db5` | Test |
| `tests/kodjo/v2-revision-draft-replay.pilot.js` | `8eee1df162ab207bcf600285f0ddf11bc422618b` | Test |
| `tests/kodjo/visual-correction.pilot.js` | `035364be7f45b4d32543ebc9ef7614130ad8bf36` | Test |
| `tests/kodjo/vnext-agent-relay.pilot.js` | `86e66c38f8e2a52f57b80ed97a2a59aa34fda923` | Test |
| `tests/kodjo/vnext-approval-handoff.pilot.js` | `32aa92e1b4e85975147eb0a4ff0226eb6e30d192` | Test |
| `tests/kodjo/vnext-architecture-closure.pilot.js` | `15fd6efdd4e349db959d95b98bf25a49461d7f65` | Test |
| `tests/kodjo/vnext-audit-convergence.pilot.js` | `e7d0f83f1d50f4f8b8eacda152f74f34795f5f83` | Test |
| `tests/kodjo/vnext-audit-tolerance.pilot.js` | `9403de08ac57632c08a89b241bf28c89fff5e89a` | Test |
| `tests/kodjo/vnext-auth-preflight.pilot.js` | `f359e807f0f47cba2b751032a91b7244740ec4cf` | Test |
| `tests/kodjo/vnext-campaign-sequence.pilot.js` | `79abcba07e6f9b564f8ef2553511741c8db95852` | Test |
| `tests/kodjo/vnext-candidate-source.pilot.js` | `3f09ead8bcbc8e211f055d1503895aa5a11ae8b1` | Test |
| `tests/kodjo/vnext-chatgpt-plan-review.pilot.js` | `fb00172afad8b85b8708a7cb96eac2763edb0383` | Test |
| `tests/kodjo/vnext-clarification-git.pilot.js` | `af50e3c4f615f3d1bc48fde73eb13bf5c6543fa7` | Test |
| `tests/kodjo/vnext-closure-provenance.pilot.js` | `ee9076ad1ef84cd261ce42ecd7b84d227e0b3750` | Test |
| `tests/kodjo/vnext-cutover-entrypoint.pilot.js` | `c6f8fe3cf803479ecfb7c48c7c6881b7668c4ad3` | Test |
| `tests/kodjo/vnext-cutover-preparation.pilot.js` | `7c38616015cc94a157a1b29100cf03382bf3dfa7` | Test |
| `tests/kodjo/vnext-cycle-continuation.pilot.js` | `5477f2fd18df3975d7897a6af7e23329dd131548` | Test |
| `tests/kodjo/vnext-delivery-preservation.pilot.js` | `f4dee3a2d1c146f08ddfae0c77aaf275363e6d9f` | Test |
| `tests/kodjo/vnext-e2e-migration.pilot.js` | `2e4d51002b2f9d713890ef367ae233274d4e8553` | Test |
| `tests/kodjo/vnext-figma-launch-review.pilot.js` | `cdf72976ed6fe09446532c3cfc336616bcc2b7c7` | Test |
| `tests/kodjo/vnext-figma-real-supervisor.pilot.js` | `f8b5709dd24bf8e13085914a36566843ab712aac` | Test |
| `tests/kodjo/vnext-figma-source-storage.pilot.js` | `95c73b361d4198f031c9f2f0fb3fe931ee158398` | Test |
| `tests/kodjo/vnext-figma-source.pilot.js` | `eff081292d43e433481a26270758941ff7f98180` | Test |
| `tests/kodjo/vnext-file-bundle.pilot.js` | `12c447f03017695530edcd3081cb02ea13284121` | Test |
| `tests/kodjo/vnext-finalization-incidents.pilot.js` | `f943bcf7df63ff2d1a9f91e5e15046cce016faf3` | Test |
| `tests/kodjo/vnext-foundations.pilot.js` | `155818810d065ad70d6e4b761bae59a9072387cb` | Test |
| `tests/kodjo/vnext-functional-coherence.pilot.js` | `807421a742dee0222a521d4b123f556e6caf3c72` | Test |
| `tests/kodjo/vnext-git-batch.pilot.js` | `49d7f7f6a3c8475d2971ca3a08b1e3a57ba46b8a` | Test |
| `tests/kodjo/vnext-github-closure.pilot.js` | `ae5d6e2c71603106bc51c699175fc7fe975766e7` | Test |
| `tests/kodjo/vnext-historical-coverage.pilot.js` | `3467535f2ba6d1988e318fe1e0040cbfbbae2a75` | Test |
| `tests/kodjo/vnext-historical-equivalence.pilot.js` | `ca7cc8bd3ded782e43b8f5e6a88b2bcb631650c4` | Test |
| `tests/kodjo/vnext-impact-graph.pilot.js` | `4c7f2e73d6e29121d4d134c21c45ab0439b86e02` | Test |
| `tests/kodjo/vnext-live-chain.pilot.js` | `b1f00244d0a9bc9677f7ab850eaf2d820f6c0ee7` | Test |
| `tests/kodjo/vnext-minor-reserves.pilot.js` | `b26b25bad1ddfa324036bcc72f30cfc836693e1f` | Test |
| `tests/kodjo/vnext-plan-contract.pilot.js` | `ab2316a4124320adfa2097dc36a3c6045fa9e87e` | Test |
| `tests/kodjo/vnext-post-acceptance.pilot.js` | `b796bc9d1a3ba8baf80ec128fbcab89b786ccce0` | Test |
| `tests/kodjo/vnext-post-delivery-revision.pilot.js` | `1423588e8ce0f4732e5bb1ce8629bc17c06a1ea5` | Test |
| `tests/kodjo/vnext-preserved-controls.pilot.js` | `85b897745275b37c08e6bc93fead4fff7ac116d5` | Test |
| `tests/kodjo/vnext-proof-lifecycle.pilot.js` | `049ef7feda2d42563e996bb9f68cabef6961a026` | Test |
| `tests/kodjo/vnext-proof-stability.pilot.js` | `1ed9e1dd77e20d957508fc625170db1b65bc157e` | Test |
| `tests/kodjo/vnext-queue-admission.pilot.js` | `f173f5667b450725a0e996aa0d7e8f59666f25a8` | Test |
| `tests/kodjo/vnext-remote-write-security.pilot.js` | `fe7ac4b95e633562ddc77a5743f7e355878a9355` | Test |
| `tests/kodjo/vnext-requirement-registry.pilot.js` | `181be1546d79c0f89440932f78a010d01378b530` | Test |
| `tests/kodjo/vnext-review-contract.pilot.js` | `b006ae09ac72c36fbb782e68e0add99ad7b6847a` | Test |
| `tests/kodjo/vnext-review-process.pilot.js` | `4cbd3af95ffcb3bbebb6bc6c84f77dc309319798` | Test |
| `tests/kodjo/vnext-review-scope.pilot.js` | `bede29a6d72b868d579112cd3f27c90005df68d9` | Test |
| `tests/kodjo/vnext-revision-contract.pilot.js` | `3cf4834ad7b8165ebcfe63fa7aa4a1734e1d17bd` | Test |
| `tests/kodjo/vnext-runtime-plan.pilot.js` | `bf3f5710a5de6411cb7ee76321bb9d7db4f1c803` | Test |
| `tests/kodjo/vnext-stream-canonical.pilot.js` | `2e1e387a0405d722b4e7ce856cad59ecb14de66e` | Test |
| `tests/kodjo/vnext-test-evidence.pilot.js` | `cea92028bacd80aaa0ac4ad0e72ab7dee693b4ec` | Test |
| `tests/kodjo/vnext-transport-security.pilot.js` | `da2d37975f3934686b657ed707a35bca725407e4` | Test |
| `tests/kodjo/vnext-ui-atomicity.pilot.js` | `b71da7b327d1125517f462f97c5b8e48f1b87007` | Test |
| `tests/kodjo/vnext-v8-consolidation.pilot.js` | `d76f2003abc3e444104c0120b70fc94f1bbbc35e` | Test |
| `tests/kodjo/vnext-volume-integration.pilot.js` | `11b6267271e3e17acd8e41198815ed338747ba57` | Test |
| `tests/kodjo/vnext-work-continuation.pilot.js` | `13d5c6e2127c353bb77ad8bb043c08ffae99e768` | Test |
| `tests/kodjo/vnext12-fresh-campaign.pilot.js` | `004d3221102b1bb65c91cf433e0428a5f5911671` | Test |
| `tests/kodjo/vnext12-revision-supervisor.pilot.js` | `fc3506144d507cbbad12300def0a3e3e549459b5` | Test |
| `tests/kodjo/vnext12-supervisor.pilot.js` | `313fd84baa91e866a5530f7caa2b690e13e48f5b` | Test |
| `tests/kodjo/windows-check-runner.pilot.js` | `8fd69f689c5af5abaa13539973181d917f34266a` | Test |

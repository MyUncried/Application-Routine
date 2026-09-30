# Étape 3 — revue individuelle et qualification des contrôles

Périmètre : 165 incidents, 138 tests historiques et 117 unités normatives,
soit 420 sujets. [Correspondances individuelles](../KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json).
Chaque sujet conserve sa source hachée, sa protection, les assertions nommées,
les mécanismes référencés et sa limite de démonstration. Les résultats historiques
ne sont pas réécrits.

402 assertions sont référencées. Le résolveur vérifie fichier, ligne, hash du
test, identité du candidat, plateforme et résultat structuré Node. Il refuse
stdout imitant un PASS, omission, substitution de protection, candidat périmé,
emplacement changé, doublon et résultat inconnu. SKIP/TODO ne valent pas PASS.
Les dépendances du fichier de test ne constituent pas une trace des branches
exécutées par chaque assertion. Certains contrôles restent statiques.

## Paramètres explicitement remplacés

T-057, INC-077 et INC-084 renvoient à INC-086/T-059 pour les anciennes limites
de tours. T-100 et INC-125 renvoient à INC-139/T-112 pour ONE_LEVEL_DIRECT_IMPORTS.
Les protections conservées et les limites de démonstration restent explicites.

## Deux lacunes découvertes et corrections contractuelles

| Clauses | Contrôle ajouté | Tests précis |
| --- | --- | --- |
| NORM-e90e0483826ca49f, NORM-f8258fa64fdea1d8, NORM-58a37601f46fb94b | execution_context obligatoire : LOCAL/CLOUD et writer_id, inclus dans fingerprint, ApprovalTarget, ExecutionRequest et message GitHub. Une bascule invalide l’ancienne approbation. Aucun écrivain par défaut. Le transport historique refuse CLOUD et les autres écrivains. | vnext-approval-handoff : VNext preserved writer ; vnext-queue-admission : contexte explicite et transport incompatible refusés. |
| NORM-e3404f3947781e03, NORM-c4f2d360bef1982b, NORM-8b7af59e2c72d9cd | Assessment natif sourcé par critère UI, branche/proof ciblés. Une substitution exige une exigence fonctionnelle validée et une approbation explicite par critère. Style/Jest ne sont pas des motifs permis. Sans preuve résolue : WAIT_FOR_PROOF ; sans autorisation : NATIVE_PRIMITIVE_EXCEPTION_REQUIRED. | vnext-preserved-controls : provenance, branche, source périmée et absence de résolveur ; vnext-approval-handoff : exception non autorisée et reçu rescellé refusés. |

ApprovalTarget, ApprovalRecord et ExecutionRequest passent à v2. Aucune ancienne
autorisation n’est adaptée silencieusement. Les décisions natives et leurs
reçus figurent dans le transport stable préparé avant approbation, sans hash
du commit contenant ces fichiers.

Un pointeur source/proof n’est pas une observation VERIFIED. Le résolveur natif
est absent par défaut. Pour une UI, la construction de cible exige un reçu
vérifié lié au hash de l’assessment, au SourceManifest et au HEAD applicatif.
Un reçu manquant, périmé ou déclaratif ne confère pas d’éligibilité. Les tests
injectent un résolveur de fixture ; aucun assessment natif réel n’est revendiqué.

## Qualification

Avant les nouveaux contrôles : candidat ff19153b14698dbe57eb9ca02821095d342d4daf,
[run 36744498287](https://github.com/MyUncried/Application-Routine/actions/runs/36744498287) :
184 PASS VNext par OS. Suite complète : Linux 885 PASS/0 FAIL/1 SKIP ; Windows
883 PASS/0 FAIL/3 SKIP. Les 398 assertions alors référencées ont un PASS sur
au moins une plateforme, sans convertir les SKIP en PASS.

Dernier delta publié et qualifié : candidat
`73e10a6cc202fb81c664b4754d1d21e7c82cdc15`,
[run 36753202976](https://github.com/MyUncried/Application-Routine/actions/runs/36753202976),
terminé SUCCESS le 30 septembre 2026 à 17:49:26 UTC. Les quatre nouvelles
assertions sont liées aux six clauses dans la matrice ; aucune lacune
contractuelle identifiée ne subsiste dans les 420 sujets de ce candidat.

| Preuve au candidat exact | Linux | Windows |
| --- | --- | --- |
| Contrats VNext | 188 PASS / 0 FAIL / 0 SKIP | 188 PASS / 0 FAIL / 0 SKIP |
| Suite historique structurée | 889 PASS / 0 FAIL / 1 SKIP | 887 PASS / 0 FAIL / 3 SKIP |
| Assertions mappées | 401 PASS / 1 SKIP | 401 PASS / 1 SKIP |
| Sujets | 416 CONTROLLED_ASSERTIONS_PASS / 4 EVIDENCE_INCOMPLETE | 409 CONTROLLED_ASSERTIONS_PASS / 11 EVIDENCE_INCOMPLETE |

Les journaux KODJO_EQ_IDENTITY, KODJO_EQ_CASE et KODJO_EQ_SUBJECT portent
le SHA exact : 402 résultats de cas et 420 résultats de sujets par OS.
Chacune des 402 assertions a un PASS sur au moins une plateforme ; les
SKIP restent SKIP sur leur plateforme. 390 assertions sont classées
EXECUTABLE_OR_FIXTURE et 12 STATIC_WORKFLOW_TEXT, sans revendication de
trace de branches exécutées ni de scénario opérationnel rejoué.

Le test « 0.6.22 — le nettoyage initialise des métriques saines si le fichier
est absent » (CASE-644e9ada78cd69a4) est explicitement PASS sous Windows,
job [110016769693](https://github.com/MyUncried/Application-Routine/actions/runs/36753202976/job/110016769693).
Il reste SKIP sous Linux. La syntaxe des 63 workflows, leurs invariants
exécutables et le contrôle whitespace sont SUCCESS. L’audit architecture
est SKIPPED sur cette synchronisation ; aucun nouvel audit n’est revendiqué.

## Vérification complémentaire et clôture

Le [run pilote V2 36753202989](https://github.com/MyUncried/Application-Routine/actions/runs/36753202989)
au même candidat est terminé FAILURE. Le job Linux protocol est SUCCESS.
Le job Windows protocol-windows-preflight est FAILURE uniquement à l’étape
« Download the real run 16 recovery package » : artefact historique
`kodjo-v2-recovery-34606534268-1` introuvable. Le journal ne permet pas de
distinguer absence initiale et expiration. La certification de cette
récupération reste NON VÉRIFIABLE ; elle n’est pas convertie en PASS.
Le job disposable-qualification suivant est SKIPPED.

Les étapes Windows de parsing PowerShell, suite pilote complète
(890 tests : 886 PASS / 0 FAIL / 4 SKIP), parcours de queue isolé sous
PowerShell 5.1 et préflight jetable sans Claude sont SUCCESS.
Les messages d’échec de témoins négatifs dans leurs journaux ne sont pas
des échecs de ces étapes. Les artefacts préflight 11115458708 et
certification historique 11116686412 sont publiés ; leur publication
n’atteste pas une certification historique réussie.

Statut : revue des correspondances et qualification contractuelle ciblée
effectuées ; clôture formelle de l’étape 3 EN RÉSERVE, compte tenu du run
pilote complémentaire en échec. Aucune dérogation au résultat global,
aucune suppression du contrôle historique et aucune relance ne sont
effectuées. Cette réserve est distincte des obligations opérationnelles
des étapes 4 et 5.

Cette mise à jour ne change que le rapport et le statut documentaire de
la matrice. Les preuves de tests restent attachées au candidat
`73e10a6cc202fb81c664b4754d1d21e7c82cdc15` ; le commit documentaire
ultérieur n’est pas présenté comme un nouveau candidat testé.

## Obligations des étapes 4 et 5

La revue et ses assertions contrôlées n’attestent pas une exécution VNext
opérationnelle. Restent à l’étape 4 : raccordement des producteurs/consommateurs,
identité observée de l’écrivain, authenticité et vérité des assessments natifs,
résolution des sources/proofs, données réelles GitHub/Claude/device et livraisons
applicatives. Le résolveur de production doit authentifier le producteur et
observer les faits ; il ne doit jamais renvoyer VERIFIED sur la seule présence
de références ou de drapeaux déclaratifs.

Chaque sujet conserve individual_equivalence_proven=false pour cette portée
opérationnelle. assertHistoricalReady refuse toujours l’activation sur la seule
réussite des fixtures. VNext-12 réel et audit FINAL restent conditionnés à leur
clôture. Aucune étape 4/5, activation, fusion, modification de PRE-1 ou bascule
n’est lancée ici.

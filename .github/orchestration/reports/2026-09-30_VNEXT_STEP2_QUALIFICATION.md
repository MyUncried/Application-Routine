# VNext — étape 2 terminée : qualification Linux et Windows

Candidat exact exécuté : `308ac67bdf07f58f9e9ef6d5d0411c1b3f099cad`.
Code et tests livrés à l’étape 1 : `93f5274de8f0a14d3b4777b585572afd9d0f5085`.

La comparaison des arbres Git confirme l’identité des 305 blobs de code, tests, workflows et politiques entre ces deux commits. Seule la demande documentaire de qualification a été ajoutée pour déclencher la CI, le lancement manuel n’étant pas disponible dans l’interface de ce workflow. La clôture publiée avec ce rapport ajoute uniquement les preuves et leur statut ; elle ne modifie aucun exécutable.

| Étape fixe | Statut |
| --- | --- |
| 1. Raccorder la chaîne réelle | TERMINÉE |
| 2. Qualifier le nouveau commit sur Linux et Windows | TERMINÉE dans le périmètre ci-dessous |
| 3. VNext-12 jetable INITIAL puis REVISION bornée jusqu’au résultat réel | NON DÉMARRÉE |
| 4. Audit FINAL indépendant de Claude sur le candidat exact et ses preuves | NON DÉMARRÉ |
| 5. Activation, bascule et clôture | NON DÉMARRÉE |

## Résultats au candidat exact

[Run VNext 36764321947](https://github.com/MyUncried/Application-Routine/actions/runs/36764321947) : **SUCCESS**.

| Contrôle | Linux | Windows |
| --- | --- | --- |
| Contrats VNext | 192 PASS / 0 FAIL / 0 SKIP | 192 PASS / 0 FAIL / 0 SKIP |
| Suite complète structurée | 893 PASS / 0 FAIL / 1 SKIP | 891 PASS / 0 FAIL / 3 SKIP |
| Assertions mappées | 401 PASS / 1 SKIP | 401 PASS / 1 SKIP |
| Sujets par système | 416 CONTROLLED_ASSERTIONS_PASS / 4 EVIDENCE_INCOMPLETE | 409 CONTROLLED_ASSERTIONS_PASS / 11 EVIDENCE_INCOMPLETE |
| Syntaxe des workflows et invariants exécutables | SUCCESS | SUCCESS |
| Contrôle whitespace du workflow | SUCCESS | SUCCESS |

Les journaux structurés portent le SHA exact, 402 identités de cas et 420 identités de sujets uniques par OS. **Chaque assertion mappée possède un PASS sur au moins une plateforme.** Les SKIP restent SKIP sur leur OS. Aucun doublon, cas manquant ou échec n’est présent ; aucune lacune identifiée n’est déclarée par les sujets du résolveur.

Le test `CASE-644e9ada78cd69a4`, « 0.6.22 — le nettoyage initialise des métriques saines si le fichier est absent », est **PASS sous Windows**, job [110054522936](https://github.com/MyUncried/Application-Routine/actions/runs/36764321947/job/110054522936). Sa source exacte lance `powershell.exe`, exige la suppression du checkout, des métriques de schéma correct, cleanup.status PASS et des mesures bornées, y compris avec un chemin supérieur à MAX_PATH. Il est SKIP sous Linux.

## Refus avant lancement de Claude

Les quatre assertions d’intégration de la chaîne réelle passent sur les deux systèmes :

- sources Git observées, réponse de revue structurée, approbation exacte et consommateur de queue réel composés ;
- approbation retirée, commentaire modifié après réaction, cible incorrecte et queue altérée refusés ;
- source altérée et absence de preuve native observée refusées, sans succès obtenu par un simple drapeau ;
- invocation directe du lanceur d’implémentation refusée pour absence de queue d’autorité, avant tout appel Claude.

Les réponses de revue Claude et de GitHub de ces tests sont des doublures explicitement injectées. Les constructeurs, objets Git, vérificateurs d’autorisation et le processus du lanceur direct sont réels. Ces tests qualifient les contrôles et leur raccordement ; ils ne rejouent pas VNext-12 opérationnel. L’audit architecture du run est SKIPPED et aucun audit FINAL n’est revendiqué.

## Vérification complémentaire sur le runner Windows persistant

[Run pilote V2 36764321940](https://github.com/MyUncried/Application-Routine/actions/runs/36764321940) : **FAILURE**, conservé sans requalification en réussite globale.

Le job Linux protocol est SUCCESS. Dans le job Windows 110055398502, les contrôles suivants sont SUCCESS : lookup privé authentifié et refus sans jeton, certification du verrou réel avant Claude, parsing de tous les scripts PowerShell, suite complète (894 tests : 890 PASS / 0 FAIL / 4 SKIP), parcours de queue isolé sous PowerShell 5.1 et préflight jetable sans Claude.

La version Windows PowerShell observée est `5.1.26100.9457`. Le manifeste téléchargé de l’artefact 11121816083 confirme `expected_head = observed_head = 308ac67bdf07f58f9e9ef6d5d0411c1b3f099cad`, `preflight_only = true`, `claude_invoked = false`, `verdict = PASS`, `cleanup_status = PASS`, sans branche distante, PR d’implémentation ou intégration dans main.

L’unique étape en échec est « Download the real run 16 recovery package » : `kodjo-v2-recovery-34606534268-1` introuvable. L’origine de cette absence n’est pas vérifiable ici. La récupération historique demeure NON CERTIFIÉE ; le reçu 11121596282 conserve FAIL avec HISTORICAL_RECOVERY_CERTIFICATION_FAILED. Le job disposable-qualification est SKIPPED : aucune exécution opérationnelle n’en est déduite.

Ce téléchargement intervient après les contrôles réussis et ne participe pas à la qualification VNext ci-dessus. Le workflow nomme la certification suivante « without gating the disposable slice » et lui donne continue-on-error, mais pas au téléchargement préalable ; cette incohérence préexistante n’est pas modifiée dans cette livraison.

## Preuves et clôture

[Preuves structurées conservées](2026-09-30_VNEXT_STEP2_EVIDENCE.json) : identité du candidat, identité des cas et sujets, résultats par OS, contrôles nommés de la chaîne réelle, étapes du pilote et champs observés des reçus. Les liens entre sujets/assertions et leurs limites restent dans la matrice du candidat exact. Les empreintes SHA-256 des trois ZIP téléchargés correspondent aux digests GitHub ; les empreintes des fichiers JSON examinés sont conservées.

Artefacts examinés : préflight 11121816083, certification du runner 11120202465, certification historique en échec 11121596282. Les résultats de qualification sont également associés aux jobs 110054523228 / 110054522490 ; les preuves structurées Linux et Windows aux jobs 110054522900 / 110054522936.

**L’étape 2 est terminée pour le code, les contrôles contractuels et leurs raccordements sur Linux/Windows.** La récupération historique manquante reste une limite distincte, consignée en échec ; elle ne vaut ni PASS ni scénario opérationnel rejoué. Le résolveur reste NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT, conformément aux étapes 3 et 4 encore non exécutées. Les deux runs de cette qualification sont terminés. Aucun changement, lancement ou publication PRE-1 n’a été effectué.

# VNext — identité du plan transmis pour la correction d'une PR existante

Observation du 4 octobre 2026. Source VNext publiée : `cbdae1633c86d924884e43e5a6b52e0321c47c93`, PR #269. Lot après recette encore local, non publié. Lecture seule de PRE-2/V2 : aucun changement, commentaire, relance ou intervention sur leur exécution.

## État des étapes autorisées

1. Diagnostic du candidat publié : terminé. Runs 37198661773 (pilotes) et 37198661774 (drivers) SUCCESS. Run 37198661771 incomplet : contrats Windows job 111425636031 CANCELLED à la limite de 15 minutes, tandis que contrats Linux et historique Linux/Windows réussissent. La limite des contrats est portée localement à 40 minutes. Aucun verdict Windows complet n'est inféré.
2. Conception de la révision après recette : écrite, complétée ici pour l'identité du plan transmis. Aucune décision métier rouverte.
3. Intégration : en cours, non publiée. Origine ACCEPTANCE_GAPS, baseline avant clôture, contrôles de périmètre/preuves et outcome borné implémentés localement. Ce n'est pas l'annonce d'un lot complet : raccordement final du superviseur, qualification par scénario, transmission du plan, métadonnées/politique et rapport consolidé restent à terminer.
4. Tests : partiels. Test composé après recette relancé le 4 octobre : 8 PASS, 0 FAIL, 0 SKIP. Git/CLI/builders locaux et services/modèle injectés, pas de vrai appel Claude, approbation propriétaire ou recette appareil. Transmission testée par des lectures filesystem et de vrais processus Git locaux ; les services propriétaire/reviewer sont injectés. Aucun appel Claude réel dans ces tests.
5. Publication et qualification finale Linux/Windows : non commencées pour ce lot. Aucun nouveau workflow de VNext lancé pendant cette vérification.

## Preuves externes PRE-2 et limites

- Run [37208114796](https://github.com/MyUncried/Application-Routine/actions/runs/37208114796), job 111453499059 : préflight PASS, invocation Claude puis zéro fichier modifié, checks PASS, échec du superviseur `KODJO_QUEUE_NO_DELIVERY` le 4 octobre à 14:21 UTC.
- Handoff [5980617069](https://github.com/MyUncried/Application-Routine/issues/288#issuecomment-5980617069) : nouveau plan `0d0e7ce617b9caefed27242d2bb8c4ee4bd53d54`, approuvé au commit `99e8d1345861710573c4a26c04a36d3dd74de292`, ancien plan supersédé `ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94`.
- Lecture exacte du fichier `.github/orchestration/v2-slices/V2-PRE-2/technical-plan.md` : PR #303 à `10ac761ef453f360110bf7b668b3998487b071b3` = ancien blob ; commit de handoff = nouveau blob. Ancien plan : 57 assertions uniques ; nouveau : 73. Les six criterion_id diffèrent entre ces versions.
- Artefact diagnostic réel 11304824137, téléchargé, SHA256 vérifié `936e38f9b97ed19cdbb32f8d5c76a7f96a7b0f738c0ce1cebdab3163372e8130`. Membres : claude-output.json, claude-stderr.txt, preflight.json, invocation.json, result.json. Session `90fc0da6-4e88-44f4-94ca-3e64d90b935d` ; request `70ca9c09-8a1c-4350-b872-30b206a5f0e9` ; application HEAD `10ac761e…`.
- La sortie Claude dit avoir lu 57 assertions dans technical-plan.md malgré l'en-tête de mission à 73. Son rapport reprend les criterion_id de l'ancien plan. Elle conclut qu'aucune correction n'est nécessaire ; result.json confirme `modified_files=[]` et `publishable_paths=[]`.

Établi : les deux copies diffèrent, le contrat traité par le modèle est l'ancien, et la publication échoue faute de delta. Limite : la trace détaillée des outils Read/Git n'est pas présente dans cet artefact ; le processus exact de sélection/lecture du fichier demeure non observé. Ce rapport ne remplace pas le diagnostic interne V2 et ne copie pas son correctif.

## Mécanismes VNext observés

| Cas | Mécanisme / référence | Preuve disponible | Couverture et lacune |
|---|---|---|---|
| Plan et mission approuvés | vnext-legacy-queue-adapter.js `verifyCompatibilityFilesAtApprovedCommit` ; vnext-queue-admission.js `verifyQueueAdmission` | Comparaison Git des trois fichiers, blob et SHA256, projection reconstruite et gate propriétaire exact ; tests vnext-live-chain.pilot.js | Implémenté pour l'admission ; ne fournit pas à lui seul le fichier que Claude lira ensuite |
| Mission sur une PR contenant l'ancien plan | run-local-claude.js lit `promptBuffer` avec `protocol_source_head` ; adapter `renderCompatibilityMission` demande ensuite « Lire le plan opposable » avec un chemin sans révision | Diagnostic Git local avec vraie projection produite par les builders ; mission correcte mais copie applicative ancienne au chemin demandé | PARTIEL : mission exacte, destination de lecture ambiguë ; correction nécessaire |
| Plan différent de celui autorisé | Adapter compare les octets Git à la projection ; reviewed_plan_blob_oid doit égaler plan_blob_oid | Tests de chaîne/admission existants | Couvert avant admission pour une substitution des artefacts approuvés ; pas pour un modèle relisant une autre copie après admission |
| Plan approuvé absent | Adapter refuse `VNEXT_QUEUE_APPROVED_FILE_UNAVAILABLE`, sans substitution par le fichier local | Code exécuté des vérifications Git ; tests existants d'artefacts indisponibles | Contrôle d'admission existant ; indisponibilité/relecture du dossier remis à Claude à tester dans le complément |
| Relectures ultérieures | Read/Glob/Grep autorisés, Git show autorisé via kodjo-git-read.js ; pas de liaison du plan aux lectures du modèle | claude-local.js ALLOWED_TOOLS ; kodjo-git-read.js ; mission rendue | ABSENT pour l'identité des relectures autorisantes ; un prompt seul ne suffit pas |
| Revue d'implémentation | Workflow kodjo-slice-implementation-review.yml : plan_blob issu de authorized_plan, `git cat-file -p`, puis /tmp/approved-plan.md avant checkout applicatif | Chemin statique du vrai consommateur | Même blob approuvé prévu ; exécution réelle complète après recette VNext encore non qualifiée |
| Reprise sans doublon et travail conservé | Locks, consommation de demande et recovery existants | Tests existants de ces mécanismes ; demandes réelles antérieures conservées, jamais rejouées | PARTIEL : combinaison spécifique « défaut de transmission corrigé » à ajouter ; aucune relance automatique dans ce diagnostic |

## Intégration proportionnée dans le plan en dix étapes

Aux étapes 3–4, compléter le transport runtime existant : plan complet issu de la projection admise, empreinte et disponibilité revérifiées avant toute modification, référence unique de lecture, aucun repli silencieux sur le checkout applicatif, même identité à la revue. Ne pas transformer un problème de lecture en modification applicative du plan ni en élargissement de périmètre. Les gardes sont désormais implémentées et testées localement ; leur qualification réelle avec Claude reste à acquérir.

Tester les quatre cas demandés : PR ancienne/nouveau plan fourni et utilisé, mismatch refusé avant modification, absence refusée sans fallback, reprise conservant le delta et refusant un double lancement. Utiliser les verrous/récupération/consommation existants, pas une seconde queue ou une nouvelle infrastructure.

Étape 5 : un candidat consolidé, suites Linux/Windows avec 40 minutes pour les contrats. Étape 6 : vrai parcours après recette sur PR existante, identité du plan remis et observations runtime, session Claude réelle. Étape 7 : reprise/réveils et signaux périmés/doublons, avec ce cas inclus. Étapes 8–10 inchangées : audit indépendant, dossier de promotion/rollback, promotion explicitement autorisée.

Criticité : défaut de fiabilité majeur du parcours après recette, susceptible d'omettre des corrections tout en produisant des checks verts. Dans l'incident observé, aucune modification n'a été publiée. Les gardes d'autorisation VNext existantes restent valides, mais ne prouvent pas l'identité du plan effectivement interprété. Le correctif de transmission et les quatre cas demandés sont intégrés localement. Le parcours réel ne doit pas être déclaré qualifié sur la seule base du succès INITIAL ou de ces fixtures.


## Correction intégrée au lot — 4 octobre 2026

Aucune modification de PRE-2 ni du comportement V2. Les raccordements dans les consommateurs partagés sont conditionnés par une admission VNext authentifiée. Aucun paquet, hook Claude, service ou nouvelle queue ajouté.

| Risque / cas | Mécanisme intégré | Référence précise | Test disponible / limite |
|---|---|---|---|
| PR ancienne, nouveau plan autorisé | Cible EXISTING_PR incluse dans execution_context et dans la cible d'approbation exacte ; observation de la PR ouverte, même dépôt, HEAD/ref exacts | vnext-preserved-controls.js validateExecutionContext ; approval-handoff-contract.js ; vnext-live-chain.js preparedArtifacts ; vnext-legacy-queue-adapter.js | vnext-runtime-plan.pilot.js : routage vers l'ancien application_head, nouveau protocol_head ; PR déplacée/fermée refusée |
| Mission absente de la PR ancienne | Mission lue à protocol_source_head et comparée aux octets de la projection admise ; aucune lecture de secours de la mission locale | claude-local.js normalizeRequest ; vnext-runtime-plan.js verify ; run-local-claude.js main | Test composé avec mission réellement absente du checkout applicatif |
| Plan différent / inaccessible | Vérification des trois fichiers Git approuvés, blob OID, SHA256, admission, review et mission avant toute récupération/modification applicative | vnext-runtime-plan.js verify ; run-local-claude.js avant restoreRecovery | Substitution plan/mission, admission divergente, objet approuvé supprimé : refus sans modification et sans retour au plan ancien |
| Relecture du chemin canonique | Vue temporaire du plan approuvé au chemin de lecture, snapshot et backup hors dépôt ; contrôle avant Claude et restauration avant calcul du delta/publish | vnext-runtime-plan.js install/assertView/restore ; run-local-claude.js | Lecture filesystem exacte ; ancienne copie restaurée, delta applicatif préservé ; plan hors write_scope |
| Relecture Git de l'ancien chemin ou blob connu | Lecteur Git existant lie show HEAD:path, HEAD:./path et le blob remplacé au plan approuvé ; autres historiques du chemin refusés/exclus ; journal des lectures Git réussies | kodjo-git-read.js bindPlanRead/main | Trois processus Git réels rendent les nouveaux octets et trois preuves de lecture au bon OID |
| Revue d'implémentation | authorized_plan.plan_blob_oid = independent_review.reviewed_plan_blob_oid ; workflow extrait ce blob avant checkout applicatif | vnext-legacy-queue-adapter.js ; kodjo-slice-implementation-review.yml | Identité testée dans la projection/admission ; revue Claude réelle complète encore NON_EXECUTEE sur ce candidat |
| Reprise / doublon | Journal de restauration lié à l'admission exacte ; récupération explicite sous verrou existant ; consommation Git atomique inchangée | vnext-runtime-plan.js recover ; execution-lock.js ; consume-queue-request.js | Travail src/core.js conservé ; seconde installation et verrou actif refusés ; même UUID consommé refusé à la seconde tentative |
| Altération de la vue | Octets altérés conservés hors dépôt, ancien fichier restauré puis publication refusée ; restauration impossible conserve le verrou | vnext-runtime-plan.js restore ; run-local-claude.js finally / IMPLEMENTATION_INTEGRITY_REFUSED | Vue altérée testée, preuve conservée et restauration vérifiée |

Tests ciblés et composés : 78 PASS, 0 FAIL, 0 SKIP dans runtime-plan-consolidated.log. Cette campagne locale compose les builders, la publication Git en fixture, la vraie admission avec services injectés, la normalisation de la demande et les lecteurs Git. Elle ne lance pas de vrai Claude et ne prouve pas une validation utilisateur réelle. Les modifications ultérieures de restauration et du raccordement du superviseur sont contrôlées par runtime-plan-last-changes.log ; résultat : 24 PASS, 0 FAIL. Suite complète : 1016 tests, 1011 PASS, 0 FAIL, 5 SKIP. Les compteurs et empreintes des journaux sont conservés dans v8-consolidation/post-acceptance-plan-transmission-tests.json.

Limites : un arrêt forcé qui empêche le finally exige une réconciliation explicite du journal sous le verrou ; aucune régénération de plan ni relance automatique. Le journal ne peut être restauré avec une autre identité admise. Le mécanisme fixe le chemin canonique et les lectures Git autorisantes de ce plan, sans interdire de consulter des documents historiques explicitement distincts comme références. Il ne constitue pas un bac à sable contre un agent malveillant ; une altération constatée interdit la publication. Les lectures natives Read ne produisent pas ici un transcript des outils Claude : le vrai cycle devra établir l'usage observé, en plus des empreintes de la vue fournie.

Publication/CI du candidat consolidé et vraie exécution après recette restent distinctes. Aucun succès INITIAL antérieur n'est réattribué à ce scénario ni à ce nouveau candidat. Les mécanismes de qualification par scénario et de réveil Work restent des travaux distincts du plan existant, pas des couvertures acquises par ces tests.

Le candidat est soumis aux trois workflows habituels en QUALIFY_ONLY, génération 43. Aucun run EXECUTE_INITIAL/EXECUTE_REVISION lancé par cette publication. La qualification du parcours réel après recette, le mécanisme opposable de qualification par scénario et les étapes 6–10 restent ouverts.

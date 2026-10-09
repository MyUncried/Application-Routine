# Consolidation VNEXT_CHATGPT_PRE4 — PR #346

Demande utilisateur du 9 octobre : les derniers correctifs parallèles sont validés, la revue du plan est en cours ; consolider puis fusionner les corrections ChatGPT PRE-4. Cette instruction autorise la fusion du protocole avant la clôture PRE-3, contrairement à la restriction préparatoire inscrite dans #346. L’exécution du relais reste refusée tant que #340 est ouverte ; aucune demande PRE-4 n’est créée.

Branche : protocol/vnext-chatgpt-pre4-relay-20261009. Départ #346 : 88a833684725d6a0d732143786f4fb0545b583da. Main intégré : 563d3020, contenant #347 (fusion 5ec810f2). Fusion locale sans conflit. Le correctif indépendant de portée ajoute scope_refinement au contrat causal et au handoff ; le relais conserve ces gates existants, sans réimplémentation ni assouplissement. Aucun fichier de #344 modifié, aucune intervention sur le plan en cours.

## Diagnostic avant correction

CI de 88a83368 : run 37937154482, job 113842043711, 1472 PASS, 1 FAIL, 2 SKIP. L’unique échec est F-003 dans causal-runtime-boundaries.pilot.js : ARTIFACT_POLICY_UNKNOWN:kodjo-vnext-chatgpt-plan-review.yml:vnext-chatgpt-review-123-123. Le nouveau workflow publie un artefact à 30 jours, mais sa famille de noms n’avait pas été ajoutée à artifact-policy.js. Attribution démontrée : omission introduite par 88a83368, détectée par la CI, absente des tests locaux du relais. Les contrôles VNext Linux et Windows du run 37937154507 étaient verts ; ses suites historiques complètes ont échoué, avec VNEXT_EQ_EXECUTION_INCOMPLETE en aval. Leurs résultats ne sont pas reclassés en succès.

Correctif minimal : déclaration exacte de vnext-chatgpt-review-<run>-<attempt>, preuve durable critique, conservation 30 jours ; aucune généralisation du fallback UNKNOWN et aucun changement des autres familles. Les mentions interdisant la fusion avant clôture PRE-3 sont remplacées conformément à la nouvelle autorisation ; les gates d’exécution restent inchangés.

## Contrôles locaux de l’arbre consolidé

- Relais ChatGPT + complément de portée main : 14 PASS (10 + 4).
- Suite causal-runtime-boundaries.pilot.js : 10 PASS ; verify-artifact-retention : 57 publications conformes.
- Syntaxe JS, validation des workflows, scanner d’écritures (245 chemins, NO_UNDECLARED_REMOTE_WRITE_CAPABILITY) et diff : PASS.

CI du nouveau commit à vérifier avant fusion ; aucune qualification ou revue IA manuelle ajoutée. Le premier usage réel PRE-4 et le réveil automatique de conversation restent non qualifiés. Aucun contrôle physique ni visuel pertinent pour ce changement.

Livraison : consolidation de #346 sur main, déclaration de politique, documentation d’autorisation et présent rapport versionné. Le commit publié et le commit de fusion sont référencés dans la PR et la réponse de livraison ; les résultats de CI sont lus sur le nouveau HEAD exact. La fusion ne déclenche pas le reviewer PRE-4 en l’absence de nouvelle demande. Les anciens mécanismes de PRE-3 ne sont pas modifiés par le delta de #346.

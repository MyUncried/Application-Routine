# VNext — étape 1 : chaîne réelle raccordée

Ce document utilise le plan fixé par l’utilisateur. L’ancienne « étape 3 » du rapport d’équivalence désignait la préparation des contrats ; elle ne désigne pas VNext-12 dans ce plan.

| Étape stable | Statut à la livraison de ce commit |
| --- | --- |
| 1. Producteurs → preuves → revue → approbation GitHub → runtime → admission de queue | TERMINÉE : raccordement implémenté et vérifié localement |
| 2. Qualification Linux et Windows du nouveau commit exact | À FAIRE |
| 3. VNext-12 jetable : INITIAL puis REVISION bornée jusqu’au résultat réel | À FAIRE |
| 4. Audit FINAL indépendant de Claude sur le candidat exact | À FAIRE |
| 5. Activation, bascule et clôture | À FAIRE |

Base publiée : `f14cadb75d41b8b9171dc9c1bb164c1bf342c068`, PR [#269](https://github.com/MyUncried/Application-Routine/pull/269). PRE-1 reste hors périmètre. Aucun workflow, lancement d’implémentation Claude, activation ou bascule n’est demandé par cette livraison.

## Raccordement

`scripts/kodjo/vnext-chain.js` appelle les constructeurs existants à partir des entrées de recette. Les observations lisent les octets des sources et candidats dans Git, ainsi que les commentaires GitHub courants. Les empreintes des fichiers et unités sont vérifiées. La revue reçoit la clôture CommonJS complète des producteurs à leur révision Git et les octets observés.

La commande de revue invoque réellement Claude Code en lecture seule, sans MCP ni hooks, sans jeton GitHub, avec sortie structurée. Elle conserve la session, la réponse brute, son empreinte et le rapport reconstruit. Une sortie absente, malformée, différente du rapport ou non APPROVE bloque la préparation. Toute modification du checkout observée durant la revue bloque aussi le parcours.

Le dossier préparé et les fichiers de compatibilité plan/revue/mission sont enregistrés avant l’approbation. La cible est construite sur le commit qui les contient. Le message GitHub affiche la cible exacte, LOCAL et l’identité du moteur CLAUDE, les évaluations des primitives natives et les exceptions fonctionnelles demandées. Une réaction positive du propriétaire du dépôt, postérieure à la dernière édition du commentaire, est requise. La décision d’exception est liée au même message explicite.

L’admission reconstruit les contrats, le registre cumulatif, le runtime HANDOFF_READY et la projection ; elle vérifie leur égalité avec les fichiers Git approuvés et la queue réelle. `verify-authorizations.js` applique ce contrôle aux demandes marquées VNext. `run-local-claude.js` le refait avant toute préparation et immédiatement avant l’appel d’implémentation à Claude. Un appel direct exige la queue originale et la projection exacte. Le superviseur PowerShell transmet sa copie de queue et garde le jeton de lecture en mémoire du superviseur Node ; Claude ne reçoit pas le jeton.

Les références aux primitives natives doivent citer des sources FUNCTIONAL, TECHNICAL ou DECISION réellement admises par SourceManifest. Une assertion déclarative VERIFIED n’accorde pas l’autorisation : il faut une observation de revue liée au hash de l’évaluation et à des octets Git exacts. Le schéma ne fournit pas de signature cryptographique de l’auteur d’une réponse Claude ; cette preuve reste une réception de processus conservée dans le dossier Git expressément approuvé.

## Utilisation

Toutes les commandes s’exécutent depuis la racine du dépôt. Il faut Git, Node, `gh` authentifié pour les observations GitHub et Claude Code compatible avec le lanceur local existant pour la revue.

1. `node scripts/kodjo/vnext-chain.js produce recette.json produit.json`
2. `node scripts/kodjo/vnext-chain.js review revue-config.json revue.json`
3. `node scripts/kodjo/vnext-chain.js prepare preparation-config.json chemin/prepared.json`
4. Enregistrer le dossier, le bootstrap et les fichiers plan/revue/mission dans Git. Publier ce commit selon la procédure habituelle.
5. `node scripts/kodjo/vnext-chain.js request-approval approbation-config.json cible.json`
6. Après l’approbation GitHub explicite : `node scripts/kodjo/vnext-chain.js handoff handoff-config.json queue.json`
7. `node scripts/kodjo/vnext-chain.js admit queue.json admission.json`

Ce sont les sous-commandes de l’étape 1, pas une renumérotation du plan global. `handoff` produit une queue locale admise ; il ne publie ni n’active la queue et ne lance pas Claude.

La recette contient les entrées des constructeurs : `sourceManifestInput`, `planningInput`, `requirementInput`, `classifications`, `requirementPlans`, éventuellement `createSlots`, `uiInput`, `revisionArtifacts`, ainsi que `executionContext`, `nativeAssessments` et `registerInput`. Le test `tests/kodjo/vnext-live-chain.pilot.js` donne un exemple exécutable complet sur dépôt Git jetable. Les fichiers de configuration suivants sont de simples objets JSON :

- Revue : `produced_file`.
- Préparation : `produced_file`, `review_receipt_file`, `transport` (chemins bootstrap/plan/revue/mission et identité de bootstrap selon le contrat de queue existant).
- Approbation : `bootstrap_file`. Le bootstrap Git contient `protocol: "VNEXT"` et `vnext_chain_file`, en plus de son identité et registre d’activation habituels.
- Handoff : `protocol_head` exact, `bootstrap_file`, `transport`, `gate_ref` retourné par l’approbation, éventuellement `request_id`.

Les unités de sources Git sont repérées par `FULL_FILE` ou `Lx-Ly`. Les commentaires emploient `github_issue_comment:propriétaire/dépôt#id` avec `updated_at` comme révision. FIGMA et OTHER sans adaptateur de capture vérifiable sont explicitement refusés avec WAIT_FOR_PROOF : ils ne sont pas artificiellement certifiés par un chemin. Les captures externes doivent être gelées et incorporées sous forme de source Git vérifiable avant admission.

## Validation et limites de la livraison

Les tests d’intégration emploient les vrais constructeurs, des commits Git temporaires et le consommateur réel d’autorisation. Les réponses Claude et GitHub y sont des doublures explicitement injectées ; ce n’est pas l’exécution opérationnelle VNext-12 de l’étape 3. Sont vérifiés le parcours autorisé, la révocation, l’édition postérieure du commentaire, la cible incorrecte, la queue altérée, les sources altérées, une preuve native absente et le refus du lanceur direct sans autorité de queue avant tout appel Claude.

Les empreintes gelées des trois lanceurs modifiés dans la politique d’écriture sont actualisées aux octets de cette livraison. Le contrôle d’inventaire demeure strict : toute autre dérive reste refusée. Aucune permission de workflow ni capacité de publication de code n’est ajoutée. `request-approval` publie seulement le message de demande d’approbation dans l’issue de la cible vérifiée.

La qualification croisée de `73e10a6cc202fb81c664b4754d1d21e7c82cdc15` reste une preuve de ce commit antérieur. Elle ne qualifie pas le nouveau code livré ici. Le nouveau commit est le candidat de l’étape 2.

La fixture de preuve native employait une autorité DOC absente du schéma réel. Elle utilise désormais FUNCTIONAL. Les deux empreintes d’assertions concernées sont recalées dans la matrice, sans retirer aucun des 420 sujets ni aucune des 402 assertions ; son statut courant exige une nouvelle qualification croisée.

Résultat final local : **239 tests PASS, 0 FAIL, 0 SKIP, 0 TODO**, pour `node --test tests/kodjo/vnext-*.pilot.js tests/kodjo/claude-local.pilot.js tests/kodjo/queued-runtime-freeze.pilot.js`. `git diff --check` passe. Le contrôle ciblé final compte 6 PASS. Le résumé et l’empreinte du journal sont dans `2026-09-30_VNEXT_STEP1_LOCAL_CHECKS.json` à côté de ce rapport.

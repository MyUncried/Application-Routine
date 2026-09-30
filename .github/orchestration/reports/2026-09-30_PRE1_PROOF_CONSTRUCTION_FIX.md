# PRE-1 : construction des obligations de preuve et conservation des réponses rejetées

Date : 30 septembre 2026. Base protocole : 5b4e811a779239e057faf7f70c763c80ad6327fe. Produit inchangé.

## Déclencheur et diagnostic

Le run PRE-1 36692529098, commande propriétaire 5907699165, s'est arrêté sur UI_PLAN_ASSERTION_PROOF_INVALID: RELATION exige VISUAL_COMPARE. Le contexte conserve baseline e216294506bed87dd80855937e3fabfbfa322b82, plan 5874870872 et revue 5878031654. La réponse finale rejetée n'était pas conservée ; il n'est pas possible de reconstruire son assertion exacte depuis l'ancien artefact.

Le producteur utilisait le schéma strict, mais la condition de preuve visuelle n'était pas construite. Le prompt sérialisait normalizeAssertions sans les fonctions qui définissent et vérifient ses obligations par property_type. Le consommateur les contrôlait ensuite et refusait le plan.

## Correctif borné

- Une fonction unique mandatoryAssertionProofs définit le minimum VISUAL_COMPARE déjà exigé par le contrat pour GEOMETRY, RELATION, STYLE, LAYERING et RESPONSIVE ; le validateur emploie cette même fonction.
- La génération construit ce seul minimum obligatoire dans l'assertion et son critère, puis le risque VISUAL et les identités canoniques. Aucune preuve exécutée ou conformité n'est inventée. Sources, résultats attendus, cibles, tests et choix sémantiques restent tels que produits.
- Les obligations supplémentaires existantes ne sont pas retirées. Les doublons, preuves non allouées, preuves inconnues et obligations INTERACTION/structurelles insuffisantes restent refusés. Aucune correction de ce type n'est silencieusement fabriquée.
- Le prompt inclut les deux fonctions de règle jusque-là omises.
- Le workflow INITIAL conserve draft-response.json, final-response.json, draft-structured.json et plan-draft.md via son upload always, y compris après un refus de decode. Aucun request.json, prompt ou credential n'est ajouté à l'archive.

## Vérification

36 tests ciblés : PASS, 0 FAIL. Les cinq types visuels passent par la génération puis le consommateur réel ; le même contenu non construit reste refusé directement par ce dernier. Identités recalculées après obligations, sources/résultats attendus intacts, absence de mutation de la réponse brute et construction idempotente vérifiées. Les refus supplémentaires restent testés. Un decode CLI réellement refusé laisse intact le fichier de réponse sélectionné par le workflow réel d'archivage.

Suite complète locale : 804 tests, 797 PASS, 0 FAIL, 7 SKIP, 17,157 s. 64 workflows acceptés par le parseur YAML indépendant ; validateur de workflows et diff --check PASS. Les skips Windows doivent être exécutés dans la qualification distante ; la copie locale n'est pas un checkout applicatif complet, la qualification applicative distante reste nécessaire.

## Publication et reprise

Lot distinct de #250/#252, qui restent clôturées. F-01 n'est pas modifié : son traitement relève de VNext. Le correctif ne change aucune autorisation d'écriture ou gate humain. Le protocole actuel déclenche qualification et audit sur une PR protocolaire ; un passage est attendu pour ce lot, pas une réouverture de l'audit de #250 et pas de boucle de relance automatique.

Après qualification exacte et approbation conforme aux gates existants, intégration puis reprise de PRE-1 sur la même baseline et paire causale, toujours bornée aux cinq findings et à leurs dépendances directement prouvées. Aucun statut de réussite PRE-1 ne sera annoncé avant son résultat réel.


# PRE-1 : construction des obligations de preuve et conservation des réponses rejetées

Date : 30 septembre 2026. Base protocole : 5b4e811a779239e057faf7f70c763c80ad6327fe. Produit inchangé.

## Déclencheur et diagnostic

Le run PRE-1 36692529098, commande propriétaire 5907699165, s'est arrêté sur UI_PLAN_ASSERTION_PROOF_INVALID: RELATION exige VISUAL_COMPARE. Le contexte conserve baseline e216294506bed87dd80855937e3fabfbfa322b82, plan 5874870872 et revue 5878031654. La réponse finale rejetée n'était pas conservée ; il n'est pas possible de reconstruire son assertion exacte depuis l'ancien artefact.

Le producteur utilisait le schéma strict, mais la condition de preuve visuelle n'était pas construite. Le prompt sérialisait normalizeAssertions sans les fonctions qui définissent et vérifient ses obligations par property_type. Le consommateur les contrôlait ensuite et refusait le plan.

## Correctif borné

- Une fonction unique mandatoryAssertionProofs définit le minimum VISUAL_COMPARE déjà exigé par le contrat pour GEOMETRY, RELATION, STYLE, LAYERING et RESPONSIVE ; le validateur emploie cette même fonction.
- La génération construit ce seul minimum obligatoire dans l'assertion et son critère, puis les identités canoniques. Le complément conserve risk_types tel que déclaré. Aucune preuve exécutée ou conformité n'est inventée. Sources, résultats attendus, cibles, tests et choix sémantiques restent tels que produits.
- Les obligations supplémentaires existantes ne sont pas retirées. Les doublons, preuves non allouées, preuves inconnues et obligations INTERACTION/structurelles insuffisantes restent refusés. Aucune correction de ce type n'est silencieusement fabriquée.
- Le prompt inclut les deux fonctions de règle jusque-là omises.
- Le workflow INITIAL conserve draft-response.json, final-response.json, draft-structured.json et plan-draft.md via son upload always, y compris après un refus de decode. Aucun request.json, prompt ou credential n'est ajouté à l'archive.

## Vérification

36 tests ciblés : PASS, 0 FAIL. Les cinq types visuels passent par la génération puis le consommateur réel ; le même contenu non construit reste refusé directement par ce dernier. Identités recalculées après obligations, sources/résultats attendus intacts, absence de mutation de la réponse brute et construction idempotente vérifiées. Les refus supplémentaires restent testés. Un decode CLI réellement refusé laisse intact le fichier de réponse sélectionné par le workflow réel d'archivage.

Suite complète locale : 804 tests, 797 PASS, 0 FAIL, 7 SKIP, 17,157 s. 64 workflows acceptés par le parseur YAML indépendant ; validateur de workflows et diff --check PASS. Les skips Windows doivent être exécutés dans la qualification distante ; la copie locale n'est pas un checkout applicatif complet, la qualification applicative distante reste nécessaire.

## Publication et reprise

Lot distinct de #250/#252, qui restent clôturées. F-01 n'est pas modifié : son traitement relève de VNext. Le correctif ne change aucune autorisation d'écriture ou gate humain. Le protocole actuel déclenche qualification et audit sur une PR protocolaire ; un passage est attendu pour ce lot, pas une réouverture de l'audit de #250 et pas de boucle de relance automatique.

Après qualification exacte et approbation conforme aux gates existants, intégration puis reprise de PRE-1 sur la même baseline et paire causale, toujours bornée aux cinq findings et à leurs dépendances directement prouvées. Aucun statut de réussite PRE-1 ne sera annoncé avant son résultat réel.

## Résultat distant et complément préparé après l'audit

PR #267, candidat audité 3a7039ef03190e15a3878178aaf65edbf4c319bf. Qualification 36705478225 : Linux 804 tests / 802 PASS / 0 FAIL / 2 SKIP ; Windows 804 / 800 PASS / 0 FAIL / 4 SKIP. Artefact 11093080048 : expected_head = observed_head = candidat exact ; 1256/1256 tests applicatifs PASS, TypeScript/lint PASS, cleanup PASS, aucune dérive. Cette qualification ne couvre pas le complément ci-dessous.

Audit 36705478288, session 9bea8eda-c548-42d2-96f6-2ae6708aefc0, commentaire 5910395413, rapport au commit 478b022f9e170d4df9f14fa468bc8bed4b8a19a5 : REVISE, 0 BLOCKING / 4 MAJOR / 3 MINOR. Le succès technique des jobs n'est pas un APPROVE.

| Constat de ce run | Sévérité publiée | Pertinence PRE-1 et traitement |
|---|---|---|
| F-01, fermeture du prompt | MAJOR | Directement pertinent : règles des frontières jusqu'ici omises. Complément : constantes et dépendances de normalisation sérialisées, dont normalizeBoundaryLocator, fonctions d'identité, hash et chemins ; modules natifs explicites. |
| F-02, FAIL versus NON_VERIFIABLE des composants | MAJOR | Défaut préexistant dans les portes de revue d'implémentation/clôture ; aucun défaut de planification PRE-1 démontré. Non modifié dans ce lot. Le complément ne prétend pas le fermer. |
| F-03, workflows legacy hors scanner d'écritures | MAJOR | Même réserve que le F-01 du précédent audit #250, explicitement conservée temporairement par le propriétaire pendant la correction VNext. Non modifiée, non réouverte ici. |
| F-04, déclencheurs CI et rétention legacy | MAJOR | Défaut préexistant concernant cinq autres workflows ; INITIAL et les fichiers du présent lot déclenchent bien la qualification. Non modifié dans ce lot, non déclaré fermé. |
| F-05, injection du risque VISUAL | MINOR | Pertinent : l'injection n'était pas normative. Retirée ; le champ déclaré doit rester identique. |
| F-06, métadonnées/documentation v2/v3 | MINOR | Préexistant ; aucune lecture de ce champ par les gates de production démontrée. Non modifié dans ce correctif ciblé. |
| F-07, test des seuls noms de helpers | MINOR | Pertinent et corrigé : exécution du code sérialisé dans une VM isolée, comparaison des résultats avec le consommateur sur cas valides/refusés/frontières/types visuels ; témoin négatif injectant une dépendance future absente. |

Le complément passe 37 tests ciblés, 37 PASS / 0 FAIL / 0 SKIP. Suite complète locale : 805 tests, 798 PASS / 0 FAIL / 7 SKIP ; diff --check PASS. Les fonctions du prompt restent du texte de mission : aucune exécution du code du modèle n'est ajoutée en production. Aucun résultat Windows ou audit indépendant du complément n'est revendiqué.

Le complément est conservé séparément sans déplacer le HEAD de #267 : ce déplacement déclencherait un deuxième audit automatique. Aucun second appel n'est lancé. #267 n'est pas fusionnée ; PRE-1 n'est pas relancé. La mission d'audit actuelle indique : « Le résultat REVISE est publiable et n'autorise aucune clôture de la PR. » Sa revue couvre 64 axes globaux, même pour ce correctif ciblé ; distinguer les réserves préexistantes n'annule pas ce gate. Un arbitrage explicite est nécessaire avant un nouveau cycle ou une modification du protocole de clôture ; le verdict publié n'est ni remplacé ni requalifié en APPROVE.

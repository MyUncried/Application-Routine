# PRE4-352 — Échec d'admission du relais intégré

## Mission et état
Reprise du dossier READY_FOR_INDEPENDENT_REVIEW, branche plan/pre4-vnext-20261013, plan exact 0ef1ec593343809a41b243850df12e1e91337d49. Préparation et certification non relancées. Plan, produit et protocole inchangés. Mission bloquée avant revue ; aucun verdict de Claude ni validation propriétaire.

## Demande et exécution uniques
Inventaire préalable : aucun fichier sous requests/vnext-agent sur main 96a191a975a5de03ed3194568cb991196908fc67, aucun run du workflow de relais. Création canonique agent-relay.js create réussie (exit 0), hash dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d ; opération plan-review, Issue352, chaîne540b058a1f20df22eaa500673473c45751cc1a44517e61a2eb72d5d310d31b03. Publication seule en ADD sur main : 7d832c4c0dbe01b7bc07b63fcc34dc7de29de3fb.

Run https://github.com/MyUncried/Application-Routine/actions/runs/38393888751, tentative1, job115284132944, runnerKODJO-LOCAL-RUNNER. Identité, sélection unique et deux checkouts réussis. À12:02:22.992Z : VNEXT_LIVE_PROCESS_FAILED: git:. À12:02:23.393Z : exit1. À12:02:25.042Z : No files were found ... No artifacts will be uploaded. API artifacts : [].

## Cause démontrée
scripts/kodjo/agent-relay.js main exige merge-base --is-ancestor request.source_head request_commit avant execute/diagnostic. Reproduction locale sur les objets publiés : git merge-base --is-ancestor 0ef1ec593343809a41b243850df12e1e91337d49 7d832c4c0dbe01b7bc07b63fcc34dc7de29de3fb retourne1. Le plan est sur une branche publiée distincte ; le commit de demande est enfant du seul main96a. Il n'en descend pas.

Le contrôle create a validé le dossier mais ne vérifie pas cette condition de placement future. Le pilote aurait dû la vérifier avant publication. Échec situé avant checkout du plan, avant adapter.preflight et avant invocation-intent/acquisition du verrou/modèle. Aucun appel Claude n'a été engagé par ce run. Aucun résultat à récupérer ni constats de plan à résoudre.

## Reprise actuelle bloquée
La même demande épingle le même commit immuable : la relancer reproduit l'échec d'ascendance, même après fusion ultérieure de documentation dans main. Republier la même chaîne sous un autre commit n'est pas une reprise autorisée : priorInvocation assimile aussi une tentative GitHub antérieure sans appel modèle à une invocation inconnue ; il refuse un nouvel appel sans cache/réponse. L'échec initial étant hors execute, aucun checkpoint ni preuve de non-invocation n'est archivé par le relais.

Ne pas modifier les empreintes pour éviter la déduplication, ne pas supprimer la demande, ne pas fabriquer de cache/intent/reçu, ne pas introduire un faux merge ne contenant pas le dossier, ne pas lancer Claude hors relais. Aucun second run ni demande ajouté.

## Historique et limite d'attribution
Dernier commit modifiant agent-relay.js : 50415ae346647f59eb0db8230b16a6ccefbfaa8f (relai commun). L'ascendance et la récupération bloquante existent dans le code effectivement intégré. Aucun run antérieur de ce workflow à la vérification préalable ; aucune dernière réussite comparable branche de plan distincte disponible. Introduction historique exacte de la contrainte non attribuée sans examen plus complet des versions antérieures. Tests locaux du relais utilisent des adaptateurs simulés ; vnext-agent-relay.pilot.js teste explicitement le refus de republication après tentative antérieure, sans distinguer l'échec pré-invocation. Ils ne prouvent pas le chemin réel branche de plan → demande main.

## Conditions de déblocage à traiter séparément du plan
Décider et implémenter une récupération strictement liée à cette demande et aux preuves de non-invocation, ainsi que l'admission d'une source publiée sur branche distincte (ou un parcours documentaire sur main explicite avant demande). Préserver les protections du runner, des objets Git exacts, de la demande unique, du contexte autorisé et du refus d'une invocation réellement ambiguë. Archiver également les échecs avant execute. Une correction ciblée du relais et ses tests de frontière sont nécessaires ; aucun besoin de refaire le paquet, réduire le périmètre, relancer la certification ou tester le produit sur iPhone.

## Livrable et limites
Ce rapport est l'unique ajout documentaire de l'incident sur la branche existante ; son commit est celui qui contient ce fichier, parent0ef1ec59. Les journaux GitHub restent la preuve distante primaire. Seule reproduction technique d'ascendance exécutée ici ; aucun test applicatif applicable, aucune conformité produit déclarée. Le plan demeure prêt mais non revu. Aucun contrôle appareil demandé. Suivi unique #352.

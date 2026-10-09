# VNext PRE-4 — relais de revue du pilote Claude

Mission : compléter la variante #344 pour réduire les transferts manuels (#345), sans intervenir sur PRE-3 ni activer PRE-4.

Base : branche `protocol/vnext-claude-pilot-variant-20261009`, commit `b4f724fae0eabf5e48a5b759a8bcf01f08d794b9`. Publication : commit contenant le présent rapport dans la PR #344 ; le hash exact est donné dans la synthèse GitHub et la réponse de livraison.

Réconciliation de branche : `main` `9c6ff9fa3fdae72cdc44e7dca49b753746394d2e` intégré sur la branche de variante, pas sur main. Les changements de #342 sont repris à l'identique. Le diff final contre ce main est limité aux sept fichiers de la variante et du relais ; aucun moteur, workflow ou fichier PRE-3 de main n'est modifié par la variante.

## Diagnostic historique et limites

Le contrat V2 prévoyait un utilisateur décisionnaire, pas transporteur. Le workflow V2 de revue de plan offre une entrée Actions vers le runner. VNext possède un processus de revue Claude réel. La variante #344 conserve une revue ChatGPT du plan et une revue ChatGPT finale, sans réveil automatique, avec un identifiant de commentaire à passer au pilote. Ce constat est vérifiable dans les cinq fichiers de #344 ; il ne démontre pas la cause initiale du lancement local PRE-3. Aucun run comparable de transfert automatique complet de la variante n'est disponible : attribution de la régression PRE-3 indéterminée.

À l'observation du commit de base : run VNext 37929760153 in_progress, pilote V2 37929760082 queued, audit 37929760113 skipped. Aucun workflow supplémentaire ni appel Claude n'a été lancé par cette mission. Les cinq échecs locaux environnementaux antérieurs ne sont pas reclassés et le diagnostic du 8 octobre non publié n'a pas été utilisé comme preuve.

## Modifications

- Adaptateur de lecture des commentaires GitHub, paginé, sans écriture ni invocation IA.
- Recherche automatique de la revue ChatGPT de la tranche et du dossier exact ; contrôles d'auteur/application conservés.
- Un refus ou une revue authentifiée invalide plus récente empêche la réutilisation d'un APPROVE antérieur ; modification d'un ancien commentaire prise en compte.
- L'identifiant explicite devient facultatif et ne peut contourner une revue plus récente.
- Commandes `plan-review-status` et `plan-review-request-body` : état d'attente explicite et demande liée à des octets committés dont le hash est vérifié.
- Lectures de dossiers via le lecteur borné de #342, y compris leurs parts au commit exact ; refus des parts corrompues sans appel du moteur.
- Documentation du passage de relais par GitHub et des limites restantes. Aucun changement du moteur, de la désignation ou des gates.

## Vérifications effectuées

- `node --test tests/kodjo/vnext-claude-pilot.pilot.js` : 14 PASS, 0 FAIL (Linux, tests déterministes avec Git local et API injectée ; aucun appel IA réel).
- `node scripts/kodjo/scan-remote-write-capability.js` : NO_UNDECLARED_REMOTE_WRITE_CAPABILITY, 246 fichiers analysés.
- Diff borné au pilote, à son nouveau helper, aux tests et à la documentation de la variante ; aucun fichier PRE-3, workflow ou fichier produit modifié.

## Ce qui reste à faire

- Qualification distante du nouvel arbre et premier usage réel à effectuer. Le support manifests/parts est testé avec un dossier réduit ; le dossier PRE-3 n'a pas été rejoué.
- Démontrer sur PRE-4 autorisé la publication de la demande, la revue réelle ChatGPT et sa récupération ; la finalisation reste inchangée et n'est pas couverte par ce test de relais de plan.
- Le réveil des interfaces reste manuel. Une infrastructure autorisée serait nécessaire pour le rendre automatique ; aucune capacité fictive, API payante ou automation n'est ajoutée.
- La désignation directe du pilote par Hermann reste une validation explicite ; le relais ne supprime pas cette règle.

Statut : amélioration ciblée du relais préparée et testée localement, automatisation de bout en bout NON QUALIFIÉE. Pas de fusion avant clôture de PRE-3 (#340), pas d'activation PRE-4. Aucun contrôle sur appareil réel applicable à cet ajout protocolaire.

Fichiers : `scripts/kodjo/claude-pilot.js`, `scripts/kodjo/lib/vnext-pilot-review-relay.js`, `tests/kodjo/vnext-claude-pilot.pilot.js`, `.github/orchestration/KODJO_VNEXT_CLAUDE_PILOT_VARIANT.md`, ce rapport.

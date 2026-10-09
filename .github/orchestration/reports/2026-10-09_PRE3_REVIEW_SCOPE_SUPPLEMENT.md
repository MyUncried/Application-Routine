# PRE-3 — complément indépendant de portée de révision

Opération existante #340. Correction ciblée après le refus réel
`VNEXT_REVISION_PATCH_TARGET_UNAUTHORIZED` pour une correction de typage
demandée par la revue initiale. Aucun audit général ou changement applicatif.

Le rapport initial et les DecisionRecords restent immuables. Le nouveau
complément est un reçu distinct, lié à son rapport, son contexte et son graphe
de cibles par empreintes. Le pilote propose des cibles précises existantes ;
le reviewer indépendant sélectionne celles réellement nécessaires, atteste
leur consultation et fournit une justification causale. Une proposition
n'autorise aucune modification. La machine ne déduit pas la portée du texte.

Le complément ajoute seulement des dépendances à l'AllowedChangeSet, sous
les finding_id originaux. Il ne modifie ni leur identité, ni leur verdict,
ni leur statut. Les ancres restent ANCHOR_ONLY et le contrôle de préservation
de toutes les autres cibles reste obligatoire. L'admission relit le reçu
depuis une révision Git appartenant à l'historique du product_head et exige
son empreinte dans l'enveloppe de révision.

Points d'entrée existants étendus :

```text
node --max-old-space-size=7168 scripts/kodjo/vnext-chain.js review-scope <config.json> <nouveau reçu.json>
node --max-old-space-size=7168 scripts/kodjo/vnext-chain.js recover-review-scope <même config.json> <nouveau reçu.json>
```

La config fournit produced_file, review_receipt_file, scope_request_file et
evidence_directory (chemins absolus). Les preuves doivent être hors checkout.
Un lancement déjà engagé est refusé ; recover consomme uniquement une réponse
durable réussie. Aucun retry automatique. Le processus reprend le superviseur
Claude existant, ses restrictions Read/Glob/Grep, ses fichiers de progression
et son budget de deux heures. Une erreur de structure conserve la réponse.

Ce complément est une étape de la même revue de plan, pas une revue de
conformité de l'application. La correction des artefacts, leur reconstruction,
leur contrôle de préservation, une nouvelle revue du plan corrigé et la
validation propriétaire restent nécessaires. Un reçu de portée ne peut pas
autoriser le développement.

Cas ciblés vérifiés localement par vnext-review-scope.pilot.js : ouverture
précise depuis une ancre sans ouverture globale, rapport inchangé, rejet
d'indices inconnus/non observés et de preuves falsifiées, admission depuis
Git malgré un checkout sale, refus d'une enveloppe non liée, transport
supervisé, récupération sans second appel, refus des doublons et archivage
des réponses invalides. Ces invocations simulées sont des tests techniques,
pas des preuves d'une revue Claude réelle.

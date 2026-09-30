# Diagnostic et correction du garde-fou de publication — PR #250

## Contexte et périmètre

Mission demandée : diagnostiquer l’échec de la qualification, expliquer sa cause, corriger et relancer.

Branche : protocol/next-evolution-r1-r3-r4-continuity-20260928. Commit de départ vérifié : 2d852636261a02a71e1c185a31f3828136c9c33d. Écrivain : ChatGPT via le connecteur GitHub, sans force. Aucun fichier applicatif, #252 ou PRE-1/#249 modifié.

## Cause exacte vérifiée

Run pilote 36628480209, job protocol / 109611506406 : échec du contrôle complet. Les deux tests en échec sont :

- publication-security.pilot.js : « exception shell — le scanner signale shell:true sauf l exception justifiee » ;
- t02-preservation.pilot.js : T02-PRES-008.

Ils appellent le même scanner et échouent sur le même constat :

CONTENTS_WRITE — .github/workflows/kodjo-v2-next-evolution-independent-audit.yml:213 — contents: write.

Le job documentaire publish-evidence introduit par le commit de départ n’était pas déclaré dans scan-remote-write-capability.js. Le scanner refuse par défaut les permissions d’écriture non déclarées et dispose déjà d’autorisations explicites pour les autres writers déterministes. La qualification échoue donc sur une omission d’intégration du nouveau writer, pas sur la production du rapport Claude ni sur sa publication.

L’audit 36628481828 a ensuite échoué uniquement au gate await_qualified_head ; les jobs independent-audit et publish-evidence ont été sautés. Aucun appel Claude ni publication du nouveau workflow n’a eu lieu.

## Correction minimale

- La permission documentaire porte une annotation fixe.
- Le scanner ne l’admet que pour le fichier exact, le pattern CONTENTS_WRITE, la ligne exacte, immédiatement dans permissions du seul job publish-evidence.
- Une permission au niveau du workflow, dans le job auditeur, dans un autre job, dans un autre workflow ou sans annotation reste refusée.
- Toutes les autres détections restent actives ; notamment une commande git push vers main ajoutée au publisher reste refusée.
- Aucun marqueur général de contournement, exemption de fichier complet ou assouplissement des tests existants n’est introduit.

## Vérifications et seconde passe

Les 8 tests dédiés de publication passent, dont un test de mutation qui exécute le scanner réel sur des fixtures : writer attendu admis ; six altérations non autorisées refusées (job renommé, ligne non déclarée, permission globale, permission de l’auditeur, push ajouté, autre workflow).

Les 3 tests existants ciblés du contrat d’audit passent. Le workflow modifié passe validate-workflows.js. Le scan du checkout partiel passe mais n’est pas présenté comme un scan exhaustif du dépôt. Le contrôle complet reste celui de la nouvelle qualification GitHub.

La seconde passe confirme que la reconnaissance est limitée au job exact et que la constante d’archive demeure evidence/kodjo-independent-audits. Les tests ayant détecté la régression ne sont ni supprimés ni modifiés.

La première version du nouveau test utilisant un sous-processus Node a rencontré EPERM dans le sandbox de vérification local. Le test appelle maintenant directement main() du scanner sur les mêmes fixtures, avec capture et restauration des flux/arguments, sans modifier sa logique.

## Fichiers livrés et suites

- scripts/kodjo/scan-remote-write-capability.js
- .github/workflows/kodjo-v2-next-evolution-independent-audit.yml
- tests/kodjo/independent-audit-publication.pilot.js
- ce rapport

Le commit final et les liens de la qualification et de l’audit nouvellement déclenchés sont communiqués dans #250 après relecture GitHub. Le rapport ne contient pas son propre hash de commit. État Git distant attendu : fast-forward atomique sur le seul HEAD de #250, sans reset/rebase/force-push.

La qualification se fait sur le nouveau HEAD ; les anciens runs ne sont pas relancés sur le commit obsolète. L’audit attend ce PASS avant toute invocation Claude. #250 demeure DRAFT ; aucune clôture ni qualification n’est présumée avant preuve.

Aucun test sur appareil réel n’est applicable à cette correction.

# VNEXT-STABILIZATION-QUOTA-20261006 — diagnostic et reprise bornée

## Mission, départ et périmètre

Demande utilisateur à 19:10 Paris : run terminé, diagnostiquer, expliquer,
corriger et relancer le test. Départ local dcc1d5bd4caf9aeab7983c0ad1867b22491b8447,
branche protocol/vnext-proof-stability-20260930, Git propre.
Candidat testé : cc35919d408759ee26c2e37033ba85374fad37f1.
Run : 37500062282, attempt 1, branche qualification/vnext-stabilization-audit-20261006.

## Résultat vérifié

| Étape | Résultat et preuve |
|---|---|
| Linux, job 112394484338 | SUCCESS ; log conservé : 339 PASS / 0 FAIL / 0 SKIP |
| Windows, job 112394484509 | SUCCESS ; validation native et contrôles réussis ; 339 PASS / 0 FAIL / 0 SKIP |
| Revue architecture, job 112397951412 | FAILURE ; processus Claude status=1, durée 2171 ms ; HTTP429 / terminal_reason=api_error |
| Consommation modèle | input_tokens=0, output_tokens=0, duration_api_ms=0, modelUsage vide |
| Historiques | SKIPPED conformément au périmètre de préparation ; aucun runtime applicatif |

Réponse exacte conservée : « You've hit your session limit · resets 7:10pm
(Europe/Paris) ». is_error=true malgré subtype=success. Aucun rapport de revue,
aucun finding sémantique et aucune conformité ne se déduisent de cette réponse.
Le log générique n'exposait pas la cause, car Claude l'a écrite dans stdout et
non stderr ; l'archive a bien conservé stdout et le résultat complet du processus.

Artefact récupéré : 11429224058, 113118 octets, SHA256 vérifié
6e8c14738195e1dbb2911f4ac96a34bdc189bacb703a795e91ebb2f34f67fb5a.
Archive de preuves conservée à côté de ce rapport dans
`evidence/37500062282/audit-37500062282.zip`.

## Cause, origine historique et nature

Cause démontrée : quota de session Claude épuisé, refus du fournisseur avant
toute exécution de la revue. Ce n'est pas un dépassement des deux heures, ni une
régression du scanner, du contrat fonctionnel, du navigateur ou de l'optimisation.
L'appel n'a duré que deux secondes et aucun token modèle n'a été consommé.

La nouvelle voie d'audit read-only a été introduite par
fb87a0e50b3088d9d90928531c36087d42fabccb / candidat cc35919d : elle expose cet
incident à cette étape, mais ne crée pas le quota externe. La source exacte de
la consommation ayant épuisé le quota n'est pas démontrée par cet artefact.

Dernier Claude comparable en matière d'accès au fournisseur : run 37491799216
sur f15aa64eef32549e2c37b2fa242a6541146fa460, processus status=0, réponse reçue
en 408768 ms, verdict de plan REVISE. Cela prouve qu'un appel était accepté
plus tôt, pas un succès de la nouvelle revue architecture. Les succès historiques
INITIAL 37115247745 / 08cb8b93 et REVISION 36881458781 / 3a931996 restent conservés
mais ne sont pas ce scénario. Aucun succès antérieur de cette nouvelle voie
d'audit de stabilisation n'est attesté.

## Correctif applicable et reprise

Aucun changement de code ni de contrat n'est justifié par cet incident. La
correction opérationnelle est d'attendre la remise à zéro annoncée, puis faire
UN nouvel appel normal avec le même candidat, les mêmes permissions et le même
périmètre. Heure UTC vérifiée avant relance : 17:11:23, soit 19:11:23 Paris,
donc après l'heure annoncée. Cette annonce ne garantit pas que le quota soit
effectivement disponible : seul le nouvel appel pourra le confirmer.

Ne pas changer compte, modèle, abonnement, credentials, limites ou mécanismes
de contrôle pour contourner le quota. Pas de boucle de retry automatique.

Le contrôleur de cette voie interdit les attempts GitHub >1. Relancer le job
sur le même run conduirait donc à un refus/skip connu. Une branche de demande
fresh dédiée au même SHA est utilisée, sans assouplir cette protection. La voie
existante rejoue les deux contrôles automatiques avant la revue ; leurs premiers
succès restent valables comme preuves observées, mais ne sont pas effacés ou
reclassés. Aucun historique ni parcours réel d'implémentation n'est déclenché.

## Vérifications, hypothèses et clôture

Récupération des jobs terminés, du log self-hosted, des résultats Node des deux
OS et du raw Claude ; hash ZIP contrôlé. Aucun test de code local supplémentaire
n'est applicable puisqu'aucun code n'est modifié. Les qualifications exactes
339/339 de ce run sont effectivement observées, pas transférées à un nouveau code.
Restent la revue Claude réellement exécutée et la confrontation de ses findings
avant toute relance réelle. Aucun contrôle visuel utilisateur ou appareil requis.

Fichiers modifiés : ce rapport et archive de preuves immutable. Le commit final
contenant ce rapport est communiqué dans la réponse ; état Git contrôlé après
commit. La branche PR269 et les branches de run terminées ne sont pas déplacées.
Identité et statut observé de la relance à ajouter après création.

## Relance observée

Branche `qualification/vnext-stabilization-audit-20261006-r2`, même SHA exact
cc35919d408759ee26c2e37033ba85374fad37f1, aucun commit de protocole supplémentaire.
Run 37501814430 : IN_PROGRESS, event=create, attempt=1. Les contrôles automatiques
précèdent la revue read-only. Un seul nouvel appel Claude est prévu si les deux
qualifications réussissent ; pas de retry interne et pas de runtime réel.
La disponibilité effective du quota et l'achèvement de la revue restent inconnus
à cette observation. Ce suivi local n'est pas publié sur la branche en cours.

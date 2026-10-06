# Tâche 2 — reprise réelle avec plafonds de deux heures

Mission VNEXT_TASK2_TWO_HOURS_RELAUNCH. Autorisation utilisateur du 6 octobre 2026 à 03:41 Paris : lancer la reprise annoncée. Départ local 425a50092f8fbb1b761c0fbde147fa7d41595f07 ; distant f317d534b8a5e190692d061d212628c100a8b168. Branche protocol/vnext-proof-stability-20260930, PR #269 draft.

Portée : tâche 2 jetable, qualification exigée par le contrôle d’admission actuel puis une nouvelle demande FIGMA_INITIAL unique. Aucune adaptation de la structure d’admission, tâche 3, clôture, activation, V2, PRE-2, PRE-3 ou modification applicative réelle. Plafonds Claude 7 200 000 ms et jobs 120 minutes, tels que demandés par l’utilisateur. La limite du job reste cumulative sur ses appels et contrôles.

Le dernier run 37396415216 a échoué par timeout à 600 077 ms sans réponse finale et sans implémentation. Son UUID 96c53d61-f780-41dc-afb7-3c1f992c910f est consommé ; preuves déjà conservées et publiées. Les 37 tests ciblés du changement de délai sont acquis (37 PASS, zéro FAIL/SKIP) et ne sont pas rejoués. Aucune réussite sémantique réelle déduite de ces tests.

Le seul changement exécutable de cette mission préparatoire est le nom de branche dédié dans les trois conditions create de qualification. Nouvelle branche qualification/vnext-task2-two-hours-20261006 ; elle sera créée une fois au SHA candidat exact. Les délais et le code Claude sont conservés. Report/checkpoint et preuves documentaires de la livraison précédente inclus dans la publication. Demande runtime inchangée jusqu’au succès des cinq jobs requis ; ensuite UUID neuf et même code exact.

Vérifications restantes : tree et fenêtre HEAD/checkpoint/runs ; qualification cinq jobs Linux/Windows ; nouvelle demande et démarrage réel sur runner prévu. Seconde passe avant publication et lancement. Aucun test appareil et aucune livraison applicative revendiqués. Les résultats seront ajoutés à ce rapport ; commit final et état Git fournis en conversation. Commit du rapport consultable par git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_TWO_HOURS_RELAUNCH.md.

## Qualification lancée

Candidat publié d1746b16bbe957861e369c66b72823579e2ed05e, arbre 0b273a0c3fb3e642b8878bc70da8344def9235ef identique au local. Tree VALIDATED, 420 sujets historiques, writer policy PASS_WITH_FROZEN_LEGACY, aucun bloc PowerShell changé. Fenêtre HEAD/checkpoint et pagination complète de 189 runs vérifiées. Qualification 37400585436 lancée une fois par création de branche dédiée. Aucune nouvelle demande runtime à ce point. Rapport, checkpoint et preuves de lancement conservés localement pendant cette qualification.

## Assertion historique périmée corrigée

Qualification 37400585436 : contrats Linux 318 PASS, mais historique Linux 11 FAIL sur 1 085 cas. Les 11 échecs proviennent exclusivement de la fixture tests/kodjo/vnext12-revision-supervisor.pilot.js, dont l’assertion attendait encore INITIAL 600 000 ms / REVISION 900 000 ms. Le changement demandé produit 7 200 000 ms. Omission dans la première vérification ciblée, pas anomalie sémantique du plan ou de l’implémentation. Assertion mise à jour à 7 200 000 ms, correspondance historique vérifiée sans changer ses IDs/protections/limites (ce fichier est exécuté dans la suite mais ne porte aucune correspondance nommée dans le registre). Archive de diagnostic Linux conservée. Aucun code Claude changé après le candidat d1746b16 ; seule l’assertion historique et la condition de nouvelle qualification changent. Nouvelle branche dédiée r2, candidat distinct à qualifier ; aucun rerun du candidat refusé.

Correction ciblée vérifiée : 16/16 PASS, zéro échec/SKIP, dont les 11 cas du superviseur de révision auparavant refusés. Journaux archivés. Relecture séparée : seule l’assertion de délai est modifiée ; les tests causaux, refus de faux APPROVE, scope et base préservée restent actifs.

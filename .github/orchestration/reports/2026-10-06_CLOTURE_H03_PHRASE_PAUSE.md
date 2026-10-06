# KODJO — clôture rédactionnelle H-03

Mission : `CLOTURE_H03_PHRASE_PAUSE`. Objectif : enregistrer le choix du propriétaire du 06/10/2026 : « on garde + » après discussion des variantes avec « puis », « et » et « suivie ». Branche `docs/cadence-dsf-2026-10-06`, départ `2e7d11c29195e9bb1921f76a1c888becd9bfa250`, PR #323 conservée en brouillon.

## Décision et périmètre

**Phrase intrinsèque retenue : « 3 séries de 30 s + 15 s de pause chacune ».** Dans Phrase v1, la clause des Séries uniformes multiples avec pause positive devient « + {durée} de pause chacune ». Les autres clauses (Série unique, pause nulle, cibles variables, cadence et côtés) restent conservées.

Le calcul intrinsèque inclut la pause terminale : `3 × (30 + 15) = 135 s`, soit 2 min 15 s. La phrase décrit l’Exercice seul, pas la transition d’une occurrence dans une Séance. Avec récupération positive R30, l’occurrence remplace la dernière Pause : `135 − 15 + 30 = 150 s`, soit 2 min 30 s ; aucune addition Pause15 + Récupération30 après la dernière Série. Avec R0, To=T. Récupération et Pause entre les côtés restent des concepts distincts.

Il s’agit d’une décision rédactionnelle, sans modification de calcul, transition, code ou Figma. La matrice reprend la nouvelle clause cible ; les sources Excel, Figma et rapports d’audit historiques ne sont pas réécrits.

## Contrôles, fichiers et livraison

Fichiers : Phrase v1, matrice Cadence, INDEX, README et présent rapport. Revue du diff, liens locaux et ancres actifs contrôlés. Cadence v1 et Paramètres v13 inchangés ; aucun test applicatif applicable ni contrôle appareil requis pour cette correction documentaire. Aucun workflow ou appel Claude lancé ; aucun run sur la branche au contrôle préalable. Les processus externes ne sont pas observables.

H-03 est clos. Les réserves H-08/H-09/H-10 et la couverture partielle de lecture restent celles du rapport de corrections fonctionnelles ; aucune clôture globale ni fusion main. Commit final : commit qui introduit ce rapport, SHA exact dans la PR et le bilan de livraison. Publication sur la branche existante avec vérification de tête attendue ; aucune synchronisation du PC.

# KODJO — Revue indépendante ciblée des réserves des lots 1 à 5

Date : 2026-10-16. Base de livraison examinée : `docs/openspec-revision`, `4668e215` → `e5e22cc49d845c7e85011a1e82f3086e3eab4644`.
Sources : archive `revue-lots2-5-e5e22cc4.zip`, `arbitrages.md`, `tasks.md`, `bilan-lot-1-2026-10-16.md`, diffs lots 2 à 5 ; comparaison GitHub des commits (six commits, fichiers modifiés confinés à `docs/` et au change OpenSpec).

## Avis

**PARTIELLEMENT CONFORME — livraisons conservables, clôture fonctionnelle non acquise.** La publication et le périmètre Git sont vérifiés ; les 139 contrôles du lot 1, les 163+155 restaurations du lot 3, les 42 remplacements du lot 5 et les deux anomalies de liens résiduelles sont des résultats rapportés par Claude, non tous rejoués indépendamment. Ne pas qualifier ces lots de « certifiés ».

## À corriger sans nouvel arbitrage produit (dans le périmètre documentaire autorisé)

1. Références `D-232` et `D-246` réintroduites par le lot 3b : contrôler chaque occurrence contre le statut, la portée et le texte de la décision remplaçante. Conserver une citation historique uniquement si son caractère historique est explicite ; sinon remplacer par le renvoi actif démontré ou classer À CLARIFIER. Ne pas supprimer une règle ni substituer une référence sur la seule chronologie.
2. Lot 1 A5 : isoler la mention « Bip v2 » de D-237/D-252 comme anomalie de prescription non arbitrée, sans modifier silencieusement le contenu des décisions.
3. Lot 4 : maintenir la distinction entre clarification de navigation (`INDEX.md`) et résolution effective de l'autorité du ch. 08 / ch. 13 et des DSF ; ne pas clore Q-A ou Q-B.
4. PR #371 : signaler au chantier propriétaire les incohérences X-06 (texte d'annulation Q18 raccourci) et X-07 (stepper incompatible avec Q8) ; ne pas modifier une PR concurrente depuis ce clone.
5. Conserver explicitement la traçabilité de D-334/D-335 et de l'amendement PRE-4 Q31 à portée encore non établie.

## Arbitrages encore requis

- **Q-A** : ordre de référence chapitre 08 vs contrat chapitre 13 si contradiction, en l'absence de décision explicite ; recommandation : aucune priorité automatique, arbitrage documenté au cas par cas.
- **Q-B** : statut des décisions D-339/D-341 face aux DSF ; recommandation de Claude : maintien du comportement de D-339 transposé aux popovers, D-341 remplacée, mais non validé.
- **Q-D** : inclusion MVP des Formats/départs rapides et de la Cadence à l'exécution ; décision de périmètre.
- **Q-F** : prédicat de `Partielle` pour une Séance (récupération écourtée ou non) ; recommandation de Claude A, non validée.
- **Q-H(b)** : séance contenant une cible d'exercice à renseigner (enregistrement/exécution) ; trois options.
- **Q-I** : Death by incomplet ; potentiellement différable conformément à D-365.
- **Q-J** : total sous l'intitulé Circuit (circuit seul ou séance complète) ; deux sources divergentes.
- **Q-K** : valeur historique hors bornes non modifiée et ligne Total pendant saisie incomplète ; deux décisions distinctes.
- **Q-L/Q-N** : portée générale des décisions PRE-4, notamment Q8, Q11–Q18, Q20, Q21, Q23, Q25, Q26 et Q31 ; arbitrage de portée, sans assimilation automatique au produit général.

**Q-O :** restauration des renvois D-nnn effacés mécaniquement. C'est essentiellement un choix de conservation de traçabilité documentaire. Recommandation : restaurer les renvois exacts lorsque la source Git démontre leur suppression mécanique, sans réactiver de prescriptions anciennes ; ne pas imposer à Hermann un arbitrage métier pour ces seules traces.

## Marche à suivre

1. Dans le change OpenSpec, consigner cet avis comme revue indépendante avec les preuves et les limites indiquées. Ne pas déclarer les lots 1–5 totalement clos.
2. Corriger seulement les anomalies purement documentaires démontrées et les références manifestement incorrectes, sur la branche dédiée, avec commit puis push ; vérifier le diff et les liens.
3. Regrouper les véritables questions produit par thème et demander les décisions de Hermann avant toute correction fonctionnelle correspondante. Conserver les autres travaux acquis.
4. Après ces corrections, relire les décisions historiques, les règles actives, les renvois et les documents transverses. Présenter un rapport de conformité par axe, avec preuves, et non une simple déclaration de réussite des scripts.
5. Ne pas lancer la restructuration (lot 6) avant stabilisation des règles et validation d'un plan détaillé, exhaustif et exécutable.

Aucun fichier du dépôt n'a été modifié dans cette revue. Le présent document est un rapport externe à transmettre à Claude, non une validation de modification Git.

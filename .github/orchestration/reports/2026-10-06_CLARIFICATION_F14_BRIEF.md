# F-14 — provenance du brief et référence code — 06/10/2026

Objectif : intégrer la réponse de Claude retransmise par le propriétaire, expliquer l’écart d’empreinte et désigner la référence documentaire du futur alignement du code. Branche `docs/cadence-dsf-2026-10-06`, départ `145b9ed4046e9235b9902e247194ea8116022e13`, PR [#323](https://github.com/MyUncried/Application-Routine/pull/323). Mission documentaire uniquement.

## Clarification reçue et conclusion

Claude explique que les deux copies libellées v2.1 sont deux états successifs. Après création du journal, il a remplacé l’annexe G inline (7 585 caractères) par un renvoi au journal (2 562 caractères), et adapté cinq renvois. Le brief reçu a été copié avant, celui utilisé pour son audit après cette substitution. Selon sa comparaison déclarée, la transformation reproduit exactement sa copie : aucune autre différence, D1–D10, §5.7 et annexes A–F/H inchangés. Il exclut BOM et fins de ligne Windows comme cause.

Ces éléments sont attribués à Claude : sa copie postérieure n’est pas accessible ici, la comparaison complète n’a donc pas été rejouée. La réserve F-14 est levée pour l’archivage et le choix de la référence ; l’identité entre les deux fichiers n’est pas revendiquée (ils sont volontairement différents).

Référence retenue : `docs/archives/cadence-2026-10-06/brief-alignement-code-v2.1-source.md`, SHA-256 `38e4487c1724560cc918da16215fee60bf09e7a2686c802bf6d81f4faa26d08f`. Le journal archivé prévaut sur l’annexe G en cas d’écart. Les spécifications fonctionnelles gardent l’autorité sur les règles métier ; aucun arbitrage n’est rouvert et aucun développement n’est lancé.

## Vérifications directes

- Empreinte du brief reçu vérifiée, source inchangée ; empreinte du journal vérifiée : `ea9022a79c54f5995aea50a9d03915c5cd71e728f48905f7e1699e7a869e1d59`.
- L’annexe G contient effectivement « 4 172 + 183 liaisons de styles de texte » et les approximations ≈ 2 100 / ≈ 3 000. Le journal §4 distingue 4 172 textes ; §9 décrit 183 remplissages et traits semi-transparents. Cette erreur historique ne doit pas être reprise comme mesure de styles.
- Sources originales conservées, audit original de Claude inchangé ; seules les qualifications actives sont complétées. Liens locaux du README et des rapports et diff contrôlés ; aucun test applicatif ni contrôle sur appareil applicable.
- Tête distante et PR concordantes avant écriture, PR ouverte en brouillon vers main ; aucun run accessible sur la branche. Les trois chemins de cette clarification restent hors filtres de qualification V2 examinés dans la mission précédente ; aucun dispatch, fermeture de PR ou fusion.

## Modifications et livraison

README des archives : provenance expliquée, version reçue désignée comme référence, priorité du journal sur G et correction du décompte documentées. Rapport de corrections : ajout d’un suivi ultérieur sans effacer le contrôle initial ; rappelle également F-09 déjà levé.

Fichiers concernés : `docs/archives/cadence-2026-10-06/README.md`, `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_DOCUMENTAIRE.md`, le présent rapport. Publication sur la branche existante sans force, avec contrôle de la tête attendue. Commit de livraison indiqué dans la PR et le bilan final, identifiable par `git log -1 -- .github/orchestration/reports/2026-10-06_CLARIFICATION_F14_BRIEF.md`.

Prochaine action F-14 : aucune pièce supplémentaire requise pour préparer le lot code avec ces références. Aucune fusion sur main, synchronisation PC, modification du code, de Figma ou des protocoles dans cette mission.

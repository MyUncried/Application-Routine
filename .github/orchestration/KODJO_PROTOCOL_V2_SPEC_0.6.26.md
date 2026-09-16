# KODJO Protocol V2 — addendum normatif 0.6.26

La présente version supersède 0.6.25 pour la finalisation d'une attestation de migration de reprise. Toutes les autres règles restent applicables.

## A. Ordre de finalisation

Une attestation de migration utilisée par une demande `RESUME_DELTA` est produite après l'intégration du plan et de la revue approuvés.

Son `certified_target_head` doit :

1. être égal ou postérieur au commit `approved_at_commit` du plan ;
2. porter exactement le blob du plan autorisé à son chemin déclaré ;
3. porter exactement le blob de la revue approuvée à son chemin déclaré.

Ces trois propriétés sont vérifiées avant Claude. Une attestation antérieure au plan, ou ancrée sur une autre version du plan ou de la revue, est refusée.

## B. Commit final d'attestation

L'attestation est ajoutée après son `certified_target_head`. Son propre chemin peut rester l'unique différence postérieure auto-référencée.

Le gate utilisateur est lié de préférence au blob immuable du plan. Il reste ainsi valable lorsque le commit final ajoute uniquement l'attestation, sans élargir l'autorisation fonctionnelle.

Toute autre différence après `certified_target_head` reste soumise au contrôle exact de `post_certification_protocol_files`. Aucun répertoire documentaire ou protocolaire général n'est autorisé.

## C. Invariants conservés

- provenance exacte du paquet, du run, de la baseline et de la session ;
- ascendance du HEAD du paquet vers l'ancre certifiée puis vers le HEAD de la demande ;
- classification séparée des exécutables, documents protocolaires et documents produit ;
- refus de tout changement applicatif intermédiaire déclaré compatible ;
- refus de tout chevauchement avec les fichiers restaurés par le paquet ;
- refus de toute différence postérieure non attestée.

## D. Qualification

Le scénario complet obligatoire est :

`paquet historique → évolutions intermédiaires → plan et revue approuvés → attestation finale → admission RESUME_DELTA sans Claude`.

Les cas négatifs minimaux sont : attestation antérieure à l'approbation, blob du plan différent, blob de la revue différent et modification non certifiée après l'attestation.

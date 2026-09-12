# V2-PROD-00 — préparation de campagne

Statut : `PREPARED_NOT_QUEUED`

- issue : `#79`
- baseline : `90a88a96d9dd6ccd80e2f0611d20c6285f02e0b2`
- plan : `.github/orchestration/KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md`
- revue : `.github/orchestration/v2-slices/V2-PROD-00/independent-review.md`
- périmètre de préflight : `tests/kodjo-prod-qualif/preflight.test.ts`

## Ordre

1. fusion séparée de la présente préparation après CI ;
2. commentaire de gate dans l'issue #79, lié au blob du plan ou au HEAD exact ;
3. 👍 réel de `MyUncried` ;
4. demande C1 seulement ;
5. vérification et nettoyage de la PR/branche C1 ;
6. demandes C2 puis C3 ;
7. décision humaine distincte avant C4 et la seconde vague.

## Décompte prévisionnel de la première vague

| Scénario | Runs | Invocations Claude | Branches/PR distantes |
|---|---:|---:|---:|
| C1 | 1 | 1 | 1/1 |
| C2 | 1 | 1 | 0/0 |
| C3 | 1 | 1 | 1/1 |
| C4 | 2, source puis reprise | 2 | au plus 1/1 après reprise |

Ce tableau décrit les exécutions prévues, pas encore réalisées. Aucun fichier de demande n'est inclus dans ce lot.

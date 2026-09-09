# Rapport de changement — KODJO V2 `0.6.9` → `0.6.10`

## Objet

Supprimer toute autorisation d'écriture du writer sur le dépôt applicatif, après constat que les rulesets et protections classiques ne sont pas appliqués au dépôt privé avec la formule GitHub courante.

## Modification retenue

- stockage canonique dans le dépôt privé fixe `MyUncried/Application-Routine-KODJO-Evidence` ;
- branche fixe conservée : `kodjo/protocol-evidence-v2` ;
- authentification par deploy key enregistrée uniquement sur le dépôt de preuves ;
- job writer en `contents: read` sur `MyUncried/Application-Routine` ;
- suppression de `github.token`, `GITHUB_TOKEN` et de l'URL d'écriture du dépôt applicatif ;
- validation du dépôt et de la branche dans chaque `EvidenceDepositRequest` ;
- refus explicite de `MyUncried/Application-Routine` comme destination de preuve.

## Preuve déjà acquise en 0.6.9

Le smoke initial a démontré sur GitHub Actions la création du reçu et du rapport seuls, sous le chemin canonique, ainsi que `EVIDENCE_WRITER_REMOTE_DEPOSIT=PASS`. Il a également révélé puis permis de corriger l'agrégation Git des fichiers non suivis ; la garde impose désormais `--untracked-files=all`.

## Qualification requise pour 0.6.10

Un nouveau smoke distant doit démontrer cumulativement :

1. lecture du code de contrôle depuis `Application-Routine` sans credentials persistés ;
2. usage de la deploy key dédiée ;
3. dépôt exclusivement dans `Application-Routine-KODJO-Evidence` ;
4. branche fixe `kodjo/protocol-evidence-v2` ;
5. contenu limité à `development-report.md` et `deposit-receipt.json` pour le smoke ;
6. `EVIDENCE_WRITER_REMOTE_DEPOSIT=PASS` ;
7. absence de tout nouveau commit applicatif distant.

Jusqu'à cette qualification, `EVIDENCE_WRITER_ABSENT` reste actif au sens « aucun writer qualifié disponible » et V2 n'est pas activable.

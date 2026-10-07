# KODJO VNext — Change Report VNext-01

## Objet

Fondations contractuelles de VNext, sans modification du runtime actif.

## Ajouts

- `scripts/kodjo/lib/vnext-contract.js`
  - canonicalisation JSON déterministe ;
  - SHA-256 canonique ;
  - IDs stables machine-generated ;
  - validation exacte des clés ;
  - contrôles SHA/Unicode/date ;
  - scellement et vérification des contrats.

- `scripts/kodjo/lib/source-manifest.js`
  - `kodjo.vnext.source-manifest.v1` ;
  - sources/unités adressables ;
  - fingerprints ;
  - dispositions fermées ;
  - Unicode exact.

- `scripts/kodjo/lib/planning-envelope.js`
  - `kodjo.vnext.planning-envelope.v1` ;
  - même contrat pour INITIAL et REVISION ;
  - causalité de révision obligatoire ;
  - fail-closed sur incohérence source/slice/HEAD.

- `scripts/kodjo/lib/decision-record.js`
  - `kodjo.vnext.decision-record.v1` ;
  - décision OPEN/RESOLVED ;
  - options et réponse causales ;
  - décision résolue convertible en source normative.

- `scripts/kodjo/lib/vnext-error-policy.js`
  - catégories PREVENTABLE / RESIDUAL / HUMAN_DECISION ;
  - aucune relance automatique d'un diagnostic inconnu.

- `tests/kodjo/vnext-foundations.pilot.js`
  - 11 contrôles isolés de schéma, hash, IDs, Unicode, fail-closed et causalité.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - règles normatives du socle VNext-01 ;
  - ONE_LEVEL_DIRECT_IMPORTS ;
  - ordre scope final → UI ;
  - DecisionRecord ;
  - approbation actionnable.

## Non-régression / périmètre

Ce lot :
- ne modifie aucun workflow de production ;
- ne modifie aucun fichier applicatif ;
- n'active aucun chemin VNext ;
- ne supprime aucun contrôle historique ;
- ne change aucune Lean Queue, review, recovery ou finalisation existante.

## Preuve avant PR

Test isolé local exécuté sur les fichiers du lot :

`node --test tests/kodjo/vnext-foundations.pilot.js`

Résultat : **11 PASS / 0 FAIL**.

Cette preuve locale ne remplace pas la qualification GitHub du HEAD de PR.

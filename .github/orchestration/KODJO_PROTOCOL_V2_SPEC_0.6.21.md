# KODJO Protocol V2 — spécification normative 0.6.21

Cette version complète et supersède `KODJO_PROTOCOL_V2_SPEC_0.6.20.md` pour la gouvernance du registre, l’unicité du contrôle de périmètre et la qualification jetable. Tous les invariants de migration 0.6.20 restent applicables.

## Registre canonique

Le registre canonique unique est `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md`. Toute version historique ou corrompue est conservée uniquement sous `.github/orchestration/archive/` et son nom indique explicitement qu’elle n’est pas canonique. Les validateurs Node et shell ciblent le même fichier.

## Admission canonique des chemins

La validation d’un chemin candidat et son admission dans une règle de périmètre sont fournies par une bibliothèque protocolaire unique. Tous les consommateurs utilisent cette bibliothèque ; aucune seconde interprétation locale n’est admise.

Un candidat est refusé avant comparaison s’il est vide, non textuel, absolu, préfixé par un lecteur Windows, contient un NUL, un antislash, un segment vide, `.` ou `..`. Le refus conserve le delta pour diagnostic.

## Tranche jetable V2-QUALIF-00

`V2-QUALIF-00` possède une identité et une activation propres, sans tranche précédente. Son unique périmètre d’écriture est `tests/fixtures/qualif/**`. Sa mission ne modifie aucun comportement applicatif.

Le constructeur local génère un `request_id` UUID unique pour chaque requête. Cette valeur est obligatoire et demeure identique dans la requête locale, l’invocation, le résultat, le paquet de reprise et les diagnostics.

La qualification réelle :

- s’exécute uniquement par `workflow_dispatch` sur le runner Windows persistant ;
- vérifie l’absence de run Lean Queue actif avant Claude ;
- utilise une origine Git locale nue et refuse une origine réseau ;
- invoque Claude une fois au maximum ;
- ne crée ni branche distante, ni PR, ni entrée Lean Queue ;
- conserve `result.json`, `invocation.json`, le contexte du run et le paquet de reprise comme artefact du run courant ;
- distingue succès technique, statut protocolaire, invocation, delta local, préservation, publication distante et intégration dans `main`.

Un timeout de workflow de 90 minutes borne l’infrastructure. Il ne réintroduit aucun plafond de tours Claude : `--max-turns` reste absent et la limite d’usage demeure celle du fournisseur et de l’abonnement.

## Frontière de certification

Les tests locaux et les adaptateurs simulés ne certifient pas une invocation externe. La qualification n’est PASS qu’après exécution sur Windows PowerShell 5.1 au HEAD exact, invocation Claude réellement observée, delta limité à la fixture et paquet de reprise durable du même run.

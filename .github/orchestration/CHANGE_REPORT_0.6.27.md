# KODJO V2 — Rapport de changement 0.6.27

## Incident traité

Le run `34943819818` a refusé la reprise avant Claude : le replay de la matrice du plan cherchait `src/features/sessions/SideModeControl.tsx` au HEAD protocolaire `0229f551a9c8931718bc7dcdc59e50cb3eb45d1c`. Ce fichier appartient au HEAD applicatif de la PR #131, `df38ade5e8737ed8f59a3a7472ebe9b168a85145`, qui est déjà inscrit dans le bootstrap, le plan et l'attestation.

## Correction

`verify-authorizations.js` utilise désormais la révision applicative attestée pour le replay et impose l'égalité :

`bootstrap.planning_application_head = plan.scan_revision = attestation.application_pr_head`.

`queue.source_head` demeure la référence protocolaire. La certification de migration, le contrôle d'ascendance, les blobs du plan et de la revue, le gate utilisateur, le périmètre et les refus des différences non certifiées sont conservés.

## Impact

- sécurité : contrôles renforcés par deux égalités exactes ; aucun contrôle retiré ;
- stabilité : changement localisé à l'admission et tests permanents du cycle réel ;
- performance : un parsing JSON déjà nécessaire et deux comparaisons de chaînes ; aucun scan, réseau, runner ou appel IA supplémentaire ;
- périmètre : protocole, tests, registre et preuves uniquement ; aucun fichier applicatif.

## Qualification requise

- tests ciblés de l'admission, de l'impact et de la migration ;
- suite protocolaire Linux ;
- prévol complet Windows, puisque l'admission réelle s'exécute sur Windows ;
- admission prospective exacte sans publication et sans Claude ;
- vérification finale fichier par fichier.

La demande `39cee884-6755-45d8-850b-a99a74d827ed` est consommée et ne doit jamais être rejouée.


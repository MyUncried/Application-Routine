# Change report — KODJO Protocol V2 0.6.36

Date : 2026-09-18

## Incident

Dans le run réel V2-CAT-01 `35327780498`, Claude a pu reprendre le recovery mais n'a pas pu exécuter ses contrôles : `kodjo-check-runner.js` retournait code 78 sans sortie pour Jest, TypeScript et lint.

## Cause

Le wrapper Windows lançait directement `npm.cmd` / `npx.cmd` avec `spawnSync(..., shell:false)`. Ces commandes batch doivent être exécutées via `cmd.exe`.

## Correction générique

- Windows : passage explicite par `ComSpec` / `cmd.exe` ;
- Linux : comportement inchangé ;
- test permanent interdisant le retour à l'appel direct de `.cmd` ;
- aucune modification applicative ;
- aucune modification du contrat Lean Request, du recovery, de RESUME_DELTA ou de la publication.

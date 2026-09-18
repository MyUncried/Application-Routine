# KODJO Protocol V2 — spécification 0.6.36

Date : 2026-09-18  
Base : 0.6.35  
Objet : rendre les contrôles Claude exécutables sur le runner Windows.

## Incident réel

Le run RESUME_DELTA V2-CAT-01 `35327780498` a repris correctement le paquet de recovery et la session Claude. Claude a corrigé les erreurs ciblées, mais ses trois appels au `kodjo-check-runner.js` ont terminé avec le code 78 sans sortie.

Le diagnostic montre que le runner généré appelait `npm.cmd` et `npx.cmd` via `spawnSync(..., { shell: false })`. Sur Windows, ces fichiers batch nécessitent `cmd.exe`.

Le superviseur a ensuite exécuté les checks hors de cette enveloppe et a obtenu les vrais résultats, confirmant que la défaillance est dans l'enveloppe de contrôle Claude et non dans l'admission Lean Queue ni dans le recovery.

## Correction

Sur Windows uniquement, le check-runner généré exécute les commandes statiques via `ComSpec` / `cmd.exe` avec `/d /s /c`.

Linux conserve l'exécution directe existante.

Le shell Node reste désactivé (`shell: false`) et l'identifiant du check reste borné à la table statique `jest/typescript/lint`.

## Acceptation

- test permanent de structure du check-runner Windows ;
- qualification Linux ;
- qualification Windows ;
- reprise V2-CAT-01 depuis le recovery intact du run 35327780498 seulement après qualification verte.

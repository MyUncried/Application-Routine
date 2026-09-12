# V2-PROD-00 — mission C3 reprise

Tu reprends avec `RESUME_DELTA` le delta C2 restauré depuis son artefact et dans la même session Claude.

1. Conserve le fichier restauré `tests/kodjo-prod-qualif/c2-red.test.ts`.
2. Modifie uniquement sa valeur attendue afin que le test compare `KODJO-V2-PROD-C2` à `KODJO-V2-PROD-C2` et devienne vert.
3. Ne modifie, ne renomme et ne supprime aucun autre fichier.
4. N'exécute aucune commande Git mutante et ne publie rien.
5. Arrête-toi lorsque les contrôles demandés sont verts.

Le périmètre d'écriture autorisé est exclusivement `tests/kodjo-prod-qualif/c2-red.test.ts`.

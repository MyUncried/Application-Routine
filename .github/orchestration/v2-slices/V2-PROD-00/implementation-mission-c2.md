# V2-PROD-00 — mission C2 contrôle rouge

Tu qualifies le refus de publication après un contrôle réellement rouge.

1. Crée exactement le fichier `tests/kodjo-prod-qualif/c2-red.test.ts`.
2. Ce fichier doit contenir un test Jest TypeScript collectable qui échoue volontairement en comparant `KODJO-V2-PROD-C2` à `EXPECTED-RED-CONTROL`.
3. N'importe aucun module depuis `src/**` ou `app/**`.
4. Ne modifie, ne renomme et ne supprime aucun autre fichier.
5. N'essaie pas de corriger l'échec attendu ; il constitue l'oracle C2.
6. N'exécute aucune commande Git mutante et ne publie rien.
7. Arrête-toi dès que le fichier est écrit.

Le périmètre d'écriture autorisé est exclusivement `tests/kodjo-prod-qualif/c2-red.test.ts`.

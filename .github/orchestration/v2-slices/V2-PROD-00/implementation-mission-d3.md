# V2-PROD-00 — mission D3 pathspec supérieur à dix fichiers

Tu qualifies l'indexation NUL sans troncature sur un périmètre jetable autonome.

1. Crée exactement douze fichiers, nommés `tests/kodjo-prod-qualif/d3-01.test.ts` à `tests/kodjo-prod-qualif/d3-12.test.ts`.
2. Chaque fichier doit contenir un unique test Jest TypeScript collectable et vert vérifiant que sa chaîne `KODJO-V2-PROD-D3-NN` est égale à elle-même, où `NN` correspond au numéro du fichier.
3. N'importe aucun module depuis `src/**` ou `app/**`.
4. Ne modifie, ne renomme et ne supprime aucun autre fichier.
5. N'exécute aucune commande Git mutante et ne publie rien.
6. Exécute les contrôles demandés et arrête-toi dès qu'ils sont verts.

Les douze chemins explicitement numérotés constituent l'intégralité du périmètre autorisé.

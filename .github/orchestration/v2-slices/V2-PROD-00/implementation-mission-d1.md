# V2-PROD-00 — mission D1 formes de delta

Tu qualifies les quatre formes de delta sur un périmètre jetable autonome.

1. Crée exactement `tests/kodjo-prod-qualif/d1-created.test.ts` avec un test Jest TypeScript collectable et vert vérifiant que `KODJO-V2-PROD-D1` est égal à lui-même.
2. Remplace le contenu de `tests/kodjo-prod-qualif/d1-modify.fixture.txt` par exactement `D1 modified` suivi d'un saut de ligne.
3. Supprime `tests/kodjo-prod-qualif/d1-delete.fixture.txt` avec l'exécuteur borné `delete` fourni dans le prompt.
4. Renomme `tests/kodjo-prod-qualif/d1-rename-source.fixture.txt` en `tests/kodjo-prod-qualif/d1-rename-target.fixture.txt` avec l'exécuteur borné `rename`, sans modifier ses octets.
5. N'importe aucun module depuis `src/**` ou `app/**`.
6. Ne modifie aucun autre fichier, n'exécute aucune commande Git mutante et ne publie rien.
7. Exécute les contrôles demandés et arrête-toi dès qu'ils sont verts.

Les cinq chemins cités ci-dessus, origine et destination comprises, constituent l'intégralité du périmètre autorisé.

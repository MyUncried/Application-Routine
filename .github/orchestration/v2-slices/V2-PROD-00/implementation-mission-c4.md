# V2-PROD-00 — mission C4 interruption après préservation

Tu qualifies le point d'arrêt contrôlé après production et préservation locale du delta, avant les contrôles.

1. Crée exactement le fichier `tests/kodjo-prod-qualif/c4-interruption.test.ts`.
2. Ce fichier doit contenir un test Jest TypeScript collectable et vert qui vérifie que la chaîne `KODJO-V2-PROD-C4` est égale à elle-même.
3. N'importe aucun module depuis `src/**` ou `app/**`.
4. Ne modifie, ne renomme et ne supprime aucun autre fichier.
5. N'exécute aucune commande Git mutante et ne publie rien.
6. Arrête-toi dès que le fichier est écrit. Le protocole effectuera ensuite l'arrêt contrôlé avant les contrôles.

Le périmètre d'écriture autorisé est exclusivement `tests/kodjo-prod-qualif/c4-interruption.test.ts`.

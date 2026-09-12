# V2-PROD-00 — mission D2 encodages et octets

Tu qualifies un nom non ASCII, un fichier CRLF et un fichier binaire sur un périmètre jetable autonome.

1. Crée exactement `tests/kodjo-prod-qualif/d2-épreuve.test.ts` avec un test Jest TypeScript collectable et vert vérifiant que `KODJO-V2-PROD-D2` est égal à lui-même.
2. Avec l'exécuteur borné `write-base64`, écris exactement `tests/kodjo-prod-qualif/d2-crlf.fixture.txt` depuis la charge `S09ESk8tVjItUFJPRC1EMg0KQ1JMRg0K`. Ne reconvertis pas les fins de ligne.
3. Avec le même exécuteur, écris exactement `tests/kodjo-prod-qualif/d2-binary.fixture.bin` depuis la charge `AAEC//4NCgB/gA==`.
4. N'importe aucun module depuis `src/**` ou `app/**`.
5. Ne modifie, ne renomme et ne supprime aucun autre fichier ; n'exécute aucune commande Git mutante et ne publie rien.
6. Exécute les contrôles demandés et arrête-toi dès qu'ils sont verts.

Les trois chemins cités ci-dessus constituent l'intégralité du périmètre autorisé. Les octets des deux charges base64 sont des oracles, pas du texte à réinterpréter.

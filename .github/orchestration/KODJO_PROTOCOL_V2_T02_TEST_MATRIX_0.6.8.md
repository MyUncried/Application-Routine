# KODJO V2 — matrice de tests T02 — 0.6.8

Statut : contrat de tests **implémenté et exécuté** (55 tests, dont les 18 scénarios ci-dessous). Les scénarios `009` à `012` proviennent du pilote ; les scénarios `013` à `017` proviennent de la revue indépendante du paquet `0.6.4` et de la contre-analyse qui l'a suivie.

## Invariants testés

- La livraison est produite avant tout contrôle susceptible d’échouer.
- Un échec de contrôle bloque la validation mais ne détruit pas le patch.
- Le patch binaire contient aussi les fichiers non suivis.
- Un échec de commentaire ne rend pas l’artefact inaccessible.
- `TARGETED_FIX` repart de l’artefact et produit un delta cumulatif sur le `source_head` initial.
- Aucun processus distant ne crée de commit, de branche fonctionnelle, de tag fonctionnel ou de push.
- Les répertoires techniques vivent hors de la copie de travail ; une implantation invalide est refusée, jamais silencieusement contournée.
- Le delta conservé ne contient que des modifications fonctionnelles.
- L'artefact Actions est une barrière de récupération et un transport ; le dépôt durable est demandé à un writer dédié, jamais effectué par le job d'implémentation.
- Un patch qui n'a pas été déposé durablement n'est jamais annoncé comme récupérable.
- Une reprise ciblée converge : elle ne peut pas laisser un contrôle requis indéfiniment `NOT_RUN`.

## Cas obligatoires

| ID | Injection | Assertions principales |
|---|---|---|
| `T02-PRES-001` | Jest échoue après modifications | artefact téléchargeable ; patch applicable ; `IMPLEMENTED_WITH_FAILED_CHECKS` ; compteurs passed/failed exacts ; run rouge après upload |
| `T02-PRES-002` | TypeScript échoue | mêmes garanties ; `failed_checks` contient uniquement les contrôles réellement échoués |
| `T02-PRES-003` | scope échoue | delta complet conservé ; intégration/revue bloquée ; aucun commit/push |
| `T02-PRES-004` | création d’un fichier non suivi | chemin dans `modified-files.json` et patch ; restauration bit-à-bit dans un clone au `source_head` |
| `T02-PRES-005` | API de commentaire indisponible | upload réussi ; `publication_status=FAILED` ; `REPUBLISH_EXISTING` sans appel IA |
| `T02-PRES-006` | reprise depuis artefact avec correction locale | hash source vérifié ; seuls contrôles échoués/impactés relancés ; artefact cumulatif applicable sur le HEAD initial |
| `T02-PRES-007` | préservation/validation du patch échoue | `IMPLEMENTATION_FAILED` ; aucun faux statut implémenté ; diagnostic explicite |
| `T02-PRES-008` | tentative distante de commit/push/ref write | refus avant effet ; credentials persistants absents ; aucune référence fonctionnelle créée |
| `T02-PRES-009` | ordre du dépôt et des contrôles | artefact téléversé avant les quatre contrôles, à l'exécution **et** dans le YAML livré ; paquet déposé sans statut ni résultat de contrôle |
| `T02-PRES-010` | perte du runner après le dépôt | workspace supprimé ; delta intégralement restauré depuis le seul artefact ; tous les hashes concordent |
| `T02-PRES-011` | URL, digest et hash du patch | trois valeurs distinctes et cohérentes ; aucune URL fabriquée en l'absence de dépôt |
| `T02-PRES-012` | reçu de publication séparé | `FAILED` et `SKIPPED` couverts ; reçu hors du paquet immuable |
| `T02-PRES-013` | dépôt initial **et** dépôt de secours en échec | `IMPLEMENTATION_FAILED` avec `RECOVERY_NOT_DURABLE` ; aucun contrôle exécuté ; commentaire sans coordonnée d'artefact et sans `recovery=TARGETED_FIX` ; sortie 3 |
| `T02-PRES-014` | dépôt initial en échec, dépôt de secours réussi | contrôles exécutés ; statut métier normal ; `fallback_used=true` ; patch effectivement applicable au `source_head` |
| `T02-PRES-015` | répertoire de livraison ou de téléchargement situé dans la copie de travail | refus `DELIVERY_LOCATION_INVALID` **avant** toute production ; aucun patch fabriqué ; `IMPLEMENTATION_FAILED` ; sortie 3 |
| `T02-PRES-017` | implantation nominale hors de la copie de travail | delta réduit à la seule modification fonctionnelle ; `scope` `PASS` ; `IMPLEMENTED_AND_VERIFIED` ; aucun répertoire de protocole créé à la restauration |
| `T02-PRES-018` | demande de dépôt sur la branche de preuves | branche fixe `kodjo/protocol-evidence-v2` non paramétrable ; append-only ; chemins canoniques uniques ; hashes exacts ; patch marqué transport et preuve ; aucun fichier applicatif ; `writer_status=PENDING` et `EVIDENCE_WRITER_ABSENT` ; `contents: read` à tous les niveaux du workflow |
| `T02-PRES-016` | reprise ciblée sans artefact de résultat source | l'ensemble des contrôles requis est relancé ; diagnostic `CARRIED_CHECKS_UNAVAILABLE` ; sélection bornée rétablie dès que les contrôles repris sont présents |

## Oracle minimal d’artefact

Chaque scénario avec modifications vérifie la présence et les hashes de `implementation.patch`, `modified-files.json`, `manifest.json`, `development-report.md` et des résultats de contrôles. Le test restaure le patch dans un clone vierge au `source_head`, exécute `git apply --check --binary`, applique le patch puis compare chaque fichier au hash déclaré.

## Résultats et limites

Les 55 tests de la suite passent en exécution locale, dont les 18 scénarios ci-dessus. Ces exécutions sont **locales** : elles reproduisent le job étape par étape, et la structure du workflow livré est vérifiée séparément. Restent `NON VÉRIFIABLE` : l'exécution du workflow d'implémentation sur GitHub Actions réel — notamment le comportement de `actions/upload-artifact` sur des chemins situés hors de la copie de travail —, le comportement d'un adaptateur d'implémentation réel, et l'exécution des commandes de contrôle du dépôt applicatif.


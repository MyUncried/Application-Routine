# KODJO V2 — matrice de tests T02 — 0.6.3

Statut : contrat de tests à implémenter dans le dépôt applicatif.

## Invariants testés

- La livraison est produite avant tout contrôle susceptible d’échouer.
- Un échec de contrôle bloque la validation mais ne détruit pas le patch.
- Le patch binaire contient aussi les fichiers non suivis.
- Un échec de commentaire ne rend pas l’artefact inaccessible.
- `TARGETED_FIX` repart de l’artefact et produit un delta cumulatif sur le `source_head` initial.
- Aucun processus distant ne crée de commit, de branche fonctionnelle, de tag fonctionnel ou de push.

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

## Oracle minimal d’artefact

Chaque scénario avec modifications vérifie la présence et les hashes de `implementation.patch`, `modified-files.json`, `manifest.json`, `development-report.md` et des résultats de contrôles. Le test restaure le patch dans un clone vierge au `source_head`, exécute `git apply --check --binary`, applique le patch puis compare chaque fichier au hash déclaré.

## Limite actuelle

Cette matrice ne constitue pas un résultat d’exécution. Les scripts et workflows réels du dépôt n’étaient pas présents dans l’espace fourni ; leurs résultats restent `NON VÉRIFIABLE` jusqu’à exécution dans le dépôt.


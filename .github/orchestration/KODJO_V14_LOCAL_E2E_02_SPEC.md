# KODJO V1.4 LOCAL E2E-02

## Objectif

Qualifier une chaîne E2E propre avec les corrections intégrées après E2E-01, sans recovery et sans dérogation.

## Périmètre gelé

- runner : `KODJO-LOCAL-RUNNER` ;
- moteur : `CLAUDE_LOCAL` uniquement ;
- mode : `LOCAL_WRITE` ;
- Claude Cloud : interdit ;
- fallback : `NONE` ;
- budget : 2 appels Claude maximum ;
- BASE : appel 1/2 ;
- RESUME : appel 2/2 sur la même session native ;
- écriture Claude : `--permission-mode acceptEdits` ;
- aucun commit/push par Claude ;
- publication contrôlée par GitHub Actions après vérification des chemins.

## Chemins autorisés pour Claude

- `.github/orchestration/e2e/KODJO_V14_LOCAL_E2E_02_SENTINEL.md`
- `.github/orchestration/reports/KODJO_V14_LOCAL_E2E_02_*.md`

Aucun autre chemin n'est autorisé.

## Preuves attendues

BASE doit :
1. passer tous les préflights ;
2. écrire la sentinelle et un rapport ;
3. publier `BASE.result.json` ;
4. conserver le `session_id` et le hash du marqueur.

RESUME doit :
1. charger `BASE.result.json` ;
2. retrouver exactement le transcript natif de BASE ;
3. reprendre la même session avec `--resume` ;
4. restituer le marqueur mémorisé sans le lire depuis un fichier ;
5. écrire la sentinelle et un nouveau rapport ;
6. publier `RESUME.result.json`.

## Critère de succès

Le test est `CONFORME` uniquement si BASE et RESUME terminent chacun en `success`, sans recovery, avec exactement 2 appels Claude, sans fallback, sans Claude Cloud et sans modification hors chemins autorisés.

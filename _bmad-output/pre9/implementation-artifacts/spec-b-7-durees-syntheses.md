# B.7 — Durées et synthèses (vérification ciblée)

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.7, cadrée par Hermann (main `fce276fd`) : « **vérification ciblée de l'existant, pas réécriture du calcul.** […] Modifier uniquement un écart démontré entre comportement actuel et règle validée ; si aucun écart n'est trouvé, clôturer sur les preuves existantes. » Branche `pre9-bmad/dev`. Aucune migration, aucun changement d'écran.

## Vérification point par point

| Résultat attendu (epics § B.7) | Existant | Preuve | Verdict |
|---|---|---|---|
| Durée par Circuit et par Cycle dans les en-têtes, total de Séance (≈/≥, D-443) | `formatLayoutDuration` (`compositionLayout.ts`) → `computeStructureDuration` (`structure.ts`) pour chaque en-tête et pour le total ; même autorité pour la liste (`sessionCatalogueProjection`) et la lecture (`SqliteSessionRepository`) | `structure.a1.test.ts`, `structure.a2.test.ts`, `CompositionScreen.b1b.test.tsx` | Conforme |
| Calculés sur le plan développé (D.1) | Contributions de `computeStructureDuration` alignées sur `planExpansion.ts` : Exercice direct × 1, Circuit groupé × tours, alterné par passages (`seriesCircuitContribution`), Cycle × k sur tous ses membres, récupération de l'occurrence | idem ; `planExpansion.d1.test.ts` | Conforme, **sauf Formats progressifs** (ci-dessous) |
| Durée et arrondi du Cycle selon les règles de la Séance (ARB-11) | En-tête de Cycle : `formatSessionDurationEstimate`, la fonction du total de Séance | `CompositionScreen.b1b.test.tsx` | Conforme |
| AMRAP contribue par sa durée configurée, initialement 12:00 | Durée lue sur les paramètres d'exécution de l'Exercice, Format ignoré ; récupération ajoutée | `structure.b7.test.ts` (rouge avant correction) | **Écart démontré — corrigé** |
| Death by : Exercice sans durée conventionnelle, « ≥ » (D-070) | Durée lue sur les paramètres d'exécution | idem | **Écart démontré — corrigé** |
| EMOM : « durée calculée N×E×W, sans double multiplication » (CE-FMT-02 §5, FMT-21) | Durée lue sur les séries de l'Exercice | `structure.b7.test.ts` | **Écart démontré — corrigé** (constaté en préparant C.3) |
| Cycle × k multiplie une fois la durée de ses éléments, formatés compris (ARB-25) | Multiplicité du Cycle appliquée une fois à chaque membre | `structure.a1.test.ts` ; `structure.b7.test.ts` (AMRAP en Cycle × 2) | Conforme |
| Récupérations | Récupération de l'occurrence (AD-35) dans `computeOccurrenceDuration` ; aucune pour un segment progressif (D.1 : « sans occurrence générée ») | tests existants ; `structure.b7.test.ts` | Conforme après correction |
| Aucune valeur Figma prise comme oracle | Tests fondés sur les règles | — | Conforme |

## Correction (seul écart démontré)

`src/domain/sessions/calculations.ts` :
- `ActivityDurationFacts.format` (le Format porté par l'Exercice, C.1).
- `progressiveFormatDuration` : AMRAP → durée exacte de son réglage `durationSeconds`, à défaut `AMRAP_INITIAL_DURATION_SECONDS` (720 s ; ch07 « Défauts validés » : « AMRAP durée 12:00 **réglable** ») ; Death by → borne minimale, aucune durée connue ; EMOM → N × W par Exercice (E Exercices : N × E × W) ; autres Formats → `null` (développés par leurs séries, inchangés).
- `computeActivityDurationResult` l'applique en premier ; `seriesCircuitContribution` compte un membre progressif une fois par tour du Circuit alterné (D.1 : « Un membre progressif […] produit un segment à chaque tour ») et un membre EMOM pour une fenêtre W par tour (son N s'adapte au compte du Circuit, D-16).

Aucune autre formule touchée ; toutes les durées (en-têtes, total, liste, lecture) passent par `computeActivityDurationResult`.

Portée actuelle : aucun écran ne pose encore de Format (C.2 à C.4) ; la correction vaut pour les Exercices formatés persistés (C.1) et pour les étapes suivantes.

## Synchronisation documentaire

Classe **A** : le code rejoint les règles écrites (epics § B.7, D.1, D-070, ch07 « Défauts validés », ARB-25). Aucune spécification modifiée. Note de l'epics « (application de D-070, à confirmer en revue) » pour Death by : appliquée telle qu'écrite au plan validé.

## Tests

`src/domain/sessions/__tests__/structure.b7.test.ts` : AMRAP (configuré, initial 12:00, Cycle × 2, Circuit groupé × 3), Death by (≥, Circuit alterné), EMOM (à la suite, Circuit alterné), non-régression (Exercice libre, Format fini, ancien modèle).

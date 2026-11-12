# features/execution

PRE-10 — Exécution d'une Séance (ch12 §12.9 à §12.12, §12.33 ; conception consolidée du moteur).

- `ExecutionService.ts` — façade applicative du moteur : file de commandes sérialisée, lecture d'horloge
  injectée, sauvegarde atomique checkpoint + résultats avant publication, réveil unique à la prochaine
  échéance logique (génération), signaux récents seulement, reprise après interruption du processus.
- `ExecutionScreen.tsx`, `ExecutionDialog.tsx` — écran plein écran et dialogues (CE-EXEC-SESSION-01).
- `ExecutionRecoveryGate.tsx` — dialogue Reprendre / Arrêter la séance après une interruption.
- Noyau pur (parcours, temps, transitions, projection, résultats) : `src/domain/execution/`.
- Persistance : `SqliteExecutionRepository` (`migration024`) ; signaux : `ExecutionSignalAdapter`.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { ExecutionDialog } from "./ExecutionDialog";
import type { RecoveryCandidate } from "./ExecutionService";
import { useOptionalExecution } from "./ExecutionServiceContext";
import { executionStrings as t } from "./executionStrings";

/**
 * PRE-10.2 — reprise après interruption technique (ch12 §12.33, ch09 « Cycle de vie d'une Exécution »,
 * conception §14.2) : une Exécution non clôturée est détectée au démarrage et au retour au premier plan ;
 * l'utilisateur choisit Reprendre la séance ou Arrêter la séance. Aucune clôture automatique ; tant que le
 * choix n'est pas fait, aucune nouvelle Exécution ne démarre (le service la refuse). Le dialogue ne se ferme
 * que par l'une des deux actions. Reprendre ouvre l'Exécution à l'étape interrompue, en pause, sans compter
 * l'absence (Q6, décision du 09/11/2026) ; Arrêter la clôt `Interrompue` et ouvre la fin
 * minimale.
 */
export function ExecutionRecoveryGate() {
  const execution = useOptionalExecution();
  const router = useRouter();
  const [candidate, setCandidate] = useState<RecoveryCandidate | null>(null);

  useEffect(() => {
    if (execution === null) return;
    const check = () => {
      // Une Exécution déjà ouverte dans ce processus n'est pas une interruption.
      if (execution.service.current() !== null) return;
      execution.service.findRecovery().then(setCandidate, () => undefined);
    };
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, [execution]);

  if (execution === null || candidate === null) return null;
  const choose = (action: "resume" | "stop") => {
    const executionId = candidate.executionId;
    setCandidate(null);
    const done = action === "resume" ? execution.service.resumeRecovered(executionId) : execution.service.stopRecovered(executionId);
    done.then(
      () => router.push("/execution"),
      () => undefined,
    );
  };
  return (
    <ExecutionDialog
      title={t.recoveryDialog.title}
      message={t.recoveryDialog.message(candidate.sessionName)}
      testID="execution-recovery-dialog"
      actions={[
        { label: t.recoveryDialog.resume, tone: "primary", testID: "execution-recovery-resume", onPress: () => choose("resume") },
        { label: t.recoveryDialog.stop, tone: "danger", testID: "execution-recovery-stop", onPress: () => choose("stop") },
      ]}
    />
  );
}

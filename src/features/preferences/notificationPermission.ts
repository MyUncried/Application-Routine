/**
 * Adaptateur lecteur d'état de permission Notifications (T7, CE-UI-07
 * L2545/L2565/L2573) : « aucune demande de permission ni module de
 * notifications en PRE-2 ; lecteur d'état de permission en adaptateur,
 * état « refusé » jamais affiché actif ».
 *
 * Aucun module `expo-notifications` n'est installé dans cette tranche
 * (hors périmètre) : cet adaptateur ne peut donc interroger aucune
 * permission système réelle — il résout toujours `"undetermined"`,
 * jamais `"denied"` ni `"granted"` (défense honnête : jamais fabriquer un
 * état système non observé). Une tranche future branchant un vrai module
 * de notifications remplacera uniquement le corps de cette fonction ; le
 * seul point d'appel (`ProfileScreen`) reste inchangé.
 */
export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  return "undetermined";
}

/** Un état « refusé » n'affiche jamais Notifications actif (T7) — toujours `false` tant qu'aucun module réel n'est branché (`"undetermined"` ci-dessus). */
export function isNotificationPermissionDenied(status: NotificationPermissionStatus): boolean {
  return status === "denied";
}

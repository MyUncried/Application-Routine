import { Keyboard } from "react-native";

/**
 * Journal de recette (N-01, appui long) : séquence horodatée des événements du
 * clavier iOS et du focus des champs des feuilles Catégorie, Zones et Étiquette.
 * Purement observateur — aucun effet sur le comportement. Conservé en mémoire
 * pour la session de l'app (perdu à la fermeture complète), lu par l'écran
 * `routine://diagnostic-updates`.
 */
export type KeyboardJournalEntry = { readonly at: number; readonly event: string };

const MAX_ENTRIES = 80;
const entries: KeyboardJournalEntry[] = [];
let isListening = false;

export function recordKeyboardJournal(event: string): void {
  entries.push({ at: Date.now(), event });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

export function readKeyboardJournal(): readonly KeyboardJournalEntry[] {
  return entries.slice();
}

/** Abonnement unique aux événements du clavier (appelé à l'ouverture d'une feuille). */
export function startKeyboardJournal(): void {
  if (isListening) return;
  isListening = true;
  for (const name of ["keyboardWillShow", "keyboardDidShow", "keyboardWillHide", "keyboardDidHide"] as const) {
    Keyboard.addListener(name, (event) => {
      const height = event?.endCoordinates?.height;
      recordKeyboardJournal(`clavier ${name}${height !== undefined ? ` h=${Math.round(height)}` : ""}`);
    });
  }
}

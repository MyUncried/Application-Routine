import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";

import { ExerciseSheet } from "@/features/sessions/ExerciseSheet";
import { dimensions } from "@/shared/ui/tokens";

/** Écart iOS entre la zone sûre haute et le haut d'une feuille à sa plus grande hauteur. */
const LARGE_SHEET_TOP_GAP = 10;

/**
 * Recette iPhone du 04/11/2026 — décision de Hermann : « […] appui court sur la photo d'une carte d'exercice
 * dans la composition de séance. Affichage de la fiche d'exercice avec photo, description phase et synthèse
 * des paramètres d'exécution. Pas de bouton d'action en bas, en lecture seule […]. Affichage au format de la
 * modale iOS, apparition et disparition par le bas. » : fiche de l'Exercice en consultation seule, en feuille
 * native iOS. Hauteur ajustée à son contenu, plafonnée sous le titre de l'écran ouvert dessous — même calcul
 * que la fiche d'un Mouvement (`movement-sheet`, recette n° 3 bis du 03/11/2026).
 */
export default function ExerciseSheetRoute() {
  const params = useLocalSearchParams<{ exerciseId?: string }>();
  const { height } = useWindowDimensions();
  const safeTop = initialWindowMetrics?.insets.top ?? 0;
  const largest = height - safeTop - LARGE_SHEET_TOP_GAP;
  const limit = height - safeTop - dimensions.header.contentHeight;
  const measures = useRef({ root: 0, frame: 0, content: 0 });
  const [needed, setNeeded] = useState<number | null>(null);
  const measure = (patch: Partial<{ root: number; frame: number; content: number }>) => {
    const next = { ...measures.current, ...patch };
    measures.current = next;
    if (next.root > 0 && next.frame > 0 && next.content > 0) setNeeded(Math.ceil(next.root - next.frame + next.content));
  };
  const fraction = Math.round((Math.min(needed ?? limit, limit) / largest) * 1000) / 1000;
  return (
    <View style={{ flex: 1 }} onLayout={(event) => measure({ root: event.nativeEvent.layout.height })}>
      <Stack.Screen options={{ sheetAllowedDetents: [fraction] }} />
      <ExerciseSheet
        exerciseId={typeof params.exerciseId === "string" ? params.exerciseId : null}
        onBodyMeasure={({ frame, content }) => measure({ frame, content })}
      />
    </View>
  );
}

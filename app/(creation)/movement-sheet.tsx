import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";

import { MovementSheet } from "@/features/activities/MovementScreen";
import { dimensions } from "@/shared/ui/tokens";

/** Écart iOS entre la zone sûre haute et le haut d'une feuille à sa plus grande hauteur. */
const LARGE_SHEET_TOP_GAP = 10;

/**
 * Recette iPhone n° 3 du 03/11/2026 (autres constats, Hermann : « Mouvement de l'écran du questionnaire ou du
 * récapitulatif : un appui court doit ouvrir la fiche du mouvement en modale, par le bas, lecture seule sans
 * possibilité de modification ») : fiche d'un Mouvement en consultation seule, présentée en modale.
 *
 * Recette n° 3 bis du 03/11/2026 (f3s-fiche, Hermann : « La modale doit remonter au maximum jusqu'à la limite du
 * titre de l'écran, et présenter tout le contenu de la fiche, sans espace blanc inutile en bas ») : feuille à la
 * hauteur de son contenu, plafonnée sous le titre de l'écran ouvert dessous ; au-delà, le corps défile.
 */
export default function MovementSheetRoute() {
  const params = useLocalSearchParams<{ movementId?: string }>();
  const { height } = useWindowDimensions();
  const safeTop = initialWindowMetrics?.insets.top ?? 0;
  // Hauteur de référence des fractions (feuille « grande ») et plafond : bas du titre de l'écran ouvert dessous.
  const largest = height - safeTop - LARGE_SHEET_TOP_GAP;
  const limit = height - safeTop - dimensions.header.contentHeight;
  // Hauteur utile = hauteur de la feuille − partie visible du corps + contenu du corps (mesures dans un ordre quelconque).
  const measures = useRef({ root: 0, frame: 0, content: 0 });
  const [needed, setNeeded] = useState<number | null>(null);
  const measure = (patch: Partial<{ root: number; frame: number; content: number }>) => {
    const next = { ...measures.current, ...patch };
    measures.current = next;
    if (next.root > 0 && next.frame > 0 && next.content > 0) setNeeded(Math.ceil(next.root - next.frame + next.content));
  };
  const fraction = Math.round((Math.min(needed ?? limit, limit) / largest) * 1000) / 1000;
  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => measure({ root: event.nativeEvent.layout.height })}
    >
      <Stack.Screen options={{ sheetAllowedDetents: [fraction] }} />
      <MovementSheet
        movementId={params.movementId ?? null}
        variantOf={null}
        variantPlacement="AFTER_ORIGIN"
        readOnly
        onBodyMeasure={({ frame, content }) => measure({ frame, content })}
      />
    </View>
  );
}

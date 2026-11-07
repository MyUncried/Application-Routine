import { Stack } from "expo-router";

import { FormatModelScreen, useFormatSheetDetent } from "@/features/sessions/FormatModelScreen";

/** Route du questionnaire d'un modèle de la fenêtre Formats (PRE-9 C.3, CE-FMT-02). */
export default function FormatQuestionnaireRoute() {
  const detent = useFormatSheetDetent();
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <FormatModelScreen stage="questionnaire" />
    </>
  );
}

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { REMINDER_MAX_MINUTES } from "@/domain/planning/Routine";
import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";
import { planningStrings } from "@/features/planning/planningStrings";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";

/**
 * « Rappel personnalisé » (Figma `1992:7187` ; RM-054a, D-243 : 24 h au plus) — roulette partagée à deux colonnes,
 * heures et minutes au pas de 5 min. La roulette compte en « secondes » : la valeur passée est le délai en minutes,
 * ce qui place les heures dans la première colonne et les minutes dans la seconde.
 */
const REMINDER_GRID: readonly number[] = Array.from({ length: REMINDER_MAX_MINUTES / 5 }, (_, index) => (index + 1) * 5);

export default function PlanningReminderRoute() {
  const router = useRouter();
  const [request] = useState(() => pendingPlanningSheet("reminder"));
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releasePlanningSheet();
  }, [request, router]);
  if (request === null) return null;
  const t = planningStrings.reminder;
  return (
    <View testID="planning-reminder-sheet">
      <DurationWheelPicker
        totalSeconds={request.minutes}
        valueGrid={REMINDER_GRID}
        title={t.customTitle}
        units={{ major: t.hours, minor: t.minutes, majorWidth: 56, minorWidth: 64 }}
        minutesAccessibilityLabel={t.hours}
        secondsAccessibilityLabel={t.minutes}
        cancelAccessibilityLabel={t.cancel}
        validateAccessibilityLabel={t.validate}
        onCancel={() => router.back()}
        onValidate={(minutes) => {
          request.onValidate(minutes);
          router.back();
        }}
      />
    </View>
  );
}

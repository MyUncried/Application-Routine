import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";
import { strings } from "@/shared/i18n";

/** Onglet « Calendrier ». */
export default function CalendarScreen() {
  return (
    <PlaceholderScreen
      title={strings.screens.calendar.title}
      description={strings.screens.calendar.placeholder}
    />
  );
}

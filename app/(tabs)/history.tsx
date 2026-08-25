import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";
import { strings } from "@/shared/i18n";

/** Onglet « Suivi ». */
export default function HistoryScreen() {
  return (
    <PlaceholderScreen
      title={strings.screens.history.title}
      description={strings.screens.history.placeholder}
    />
  );
}

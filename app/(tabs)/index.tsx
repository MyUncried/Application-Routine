import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";
import { strings } from "@/shared/i18n";

/** Onglet « Mes séances » — écran d’accueil par défaut du MVP. */
export default function SessionsScreen() {
  return (
    <PlaceholderScreen
      title={strings.screens.sessions.title}
      description={strings.screens.sessions.placeholder}
    />
  );
}

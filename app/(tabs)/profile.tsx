import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";
import { strings } from "@/shared/i18n";

/** Onglet « Profil » (préférences globales). */
export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      title={strings.screens.profile.title}
      description={strings.screens.profile.placeholder}
    />
  );
}

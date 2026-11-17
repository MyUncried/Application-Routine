import { ProfileEditScreen } from "@/features/preferences/ProfileEditScreen";

/**
 * Route « Modifier le profil » (V2-PRE-2, CE-UI-01), écran de l'onglet Profil : la barre de navigation KODJO reste
 * affichée, Profil actif (demande de Hermann du 14/11/2026 : « Ajoute la barre de navigation Kodjo à la page d'accueil
 * du Profil »). Adresse inchangée (`/profile-edit`). [Avant : écran de pile racine, sans barre — remplacé.]
 */
export default function ProfileEditRoute() {
  return <ProfileEditScreen />;
}

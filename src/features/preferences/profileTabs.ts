import { strings } from "@/shared/i18n";
import type { TabbedScreenPalette, TabbedScreenTabs } from "@/shared/ui/TabbedScreen";
import { colors } from "@/shared/ui/tokens";

/**
 * Onglets du Profil (CE-PRF-01, D-552 ; PROG-CAT-01, 21/11/2026) : Compte · Préférences · Confidentialité. Chaque onglet est un
 * écran de l'onglet Profil, rejoint par son adresse (un retour arrière d'onglet ramènerait au premier onglet).
 * [Avant : Profil · Préférences · Communauté (désactivée) — remplacé par D-552.]
 */
export type ProfileTab = "account" | "preferences" | "privacy";

export const PROFILE_TAB_LABELS: Readonly<Record<ProfileTab, string>> = strings.screens.profileEdit.profileTabs;

const ROUTES: Readonly<Record<ProfileTab, "/profile-edit" | "/profile" | "/profile-privacy">> = {
  account: "/profile-edit",
  preferences: "/profile",
  privacy: "/profile-privacy",
};

export function profileTabs(current: ProfileTab, router: { readonly navigate: (href: "/profile-edit" | "/profile" | "/profile-privacy") => void }): TabbedScreenTabs<ProfileTab> {
  return {
    options: (Object.keys(PROFILE_TAB_LABELS) as ProfileTab[]).map((value) => ({ value, label: PROFILE_TAB_LABELS[value] })),
    value: current,
    onChange: (tab) => {
      if (tab !== current) router.navigate(ROUTES[tab]);
    },
    testID: "profile-tabs",
  };
}

/**
 * CE-PRF-01 : « zone centrale de la couleur uniforme de l'onglet sélectionné (#EAEAFF), sans dégradé ni trait sous l'onglet »
 * (Figma « Profil — Préférences » `1992:684`, « Profil — Confidentialité » `12839:4036` : fond #EAEAFF, en-tête #F7F7FF).
 */
export const PROFILE_UNIFORM_PALETTE: TabbedScreenPalette = {
  context: colors.catalogueSessionsContext,
  background: colors.catalogueSessionsContext,
  header: colors.catalogueSessionsBackground,
};

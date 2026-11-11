import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Profile, Silhouette } from "@/domain/preferences/Profile";
import {
  deletePreviousProfilePhoto,
  pickAndCopyProfilePhoto,
  profilePhotoFileExists,
} from "@/features/preferences/profilePhoto";
import { Card, Divider, Section } from "@/features/catalogue/libraryUi";
import { ProfileLibrariesSection } from "@/features/catalogue/ProfileLibrariesSection";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CatalogueNavigation } from "@/features/sessions/CatalogueNavigation";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type ProfileTab = "profile" | "preferences" | "community";

/**
 * Figma 12119:25611 : fond d'écran `color/catalogue/seances/background` (#F7F7FF) et bande des onglets
 * `color/catalogue/seances/context` (#EAEAFF) → fond, sur 14 pt (opaque jusqu'à 80 %).
 */
const PROFILE_BACKGROUND = colors.catalogueSessionsBackground;
const PROFILE_TAB_CONTEXT = colors.catalogueSessionsContext;
const TAB_BAND_HEIGHT = 14;
const AVATAR_SIZE = 64;
const PHOTO_BADGE_SIZE = 30;
const SILHOUETTE_CIRCLE = 40;
/** Figma : tracé de la silhouette non choisie (#9499A8), cercle non choisi #CCD1E0. */
const SILHOUETTE_UNSELECTED = "#9499A8";

type IdentityDraft = {
  readonly displayName: string;
  readonly photoUri: string | null;
  readonly silhouette: Silhouette | null;
};

function toDraft(profile: Profile): IdentityDraft {
  return {
    displayName: profile.displayName ?? "",
    photoUri: profile.photoUri,
    silhouette: profile.silhouette,
  };
}

function draftsEqual(a: IdentityDraft, b: IdentityDraft): boolean {
  return a.displayName === b.displayName && a.photoUri === b.photoUri && a.silhouette === b.silhouette;
}

/**
 * Initiales du nom d'affichage (1 ou 2 lettres) — repli visuel sans photo
 * (CE-UI-01 L2033). Exportée pour être réutilisée par le bloc Identité du
 * Profil (`ProfileScreen.tsx`, R1) — même aide, aucune duplication.
 */
export function computeInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter((part) => part.length > 0);
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * Écran Modifier le profil (V2-PRE-2, plan §6.5, CE-UI-01 L1965-2051) : nom
 * d'affichage, photo locale facultative, silhouette facultative, dans un
 * brouillon enregistré par Enregistrer. La silhouette ne modifie que
 * l'icône des Zones corporelles (CE-UI-09 L2805) — aucune autre donnée.
 *
 * Alignement Figma `12119:25611` (demande de Hermann du 11/11/2026, partie au-dessus des Bibliothèques) :
 * en-tête à trois onglets (`CatalogueNavigation`, même forme d'onglet sélectionné que les Catalogues) —
 * « Profil » sélectionné, « Préférences » ramène à l'écran Profil (réglages et préférences, garde d'abandon
 * conservée), « Communauté » visible et désactivée (E01) ; carte « Profil » (avatar, « Modifier la photo »,
 * ligne « Nom », silhouettes). [Avant : titre « Modifier le profil » et Retour — remplacés.] « Pseudo » et la
 * pastille « Compte gratuit » de la maquette ne sont pas affichés : le Profil n'a ni pseudo ni type de compte.
 */
export function ProfileEditScreen() {
  const router = useRouter();
  const profileService = useProfileService();
  const t = strings.screens.profileEdit;
  const actionZone = usePrimaryActionZone();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<IdentityDraft | null>(null);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [nameError, setNameError] = useState<"REQUIRED" | "TOO_LONG" | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (loaded) => {
        if (cancelled) {
          return;
        }
        setProfile(loaded);
        const snapshot = toDraft(loaded);
        setInitialSnapshot(snapshot);
        setDraft(snapshot);
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Le Profil n'a pas pu être chargé.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  const shouldBlockExit = draft !== null && initialSnapshot !== null && !draftsEqual(draft, initialSnapshot);
  // CE-UI-01 L1981 : confirmer l'abandon restaure le brouillon aux valeurs
  // ENREGISTRÉES avant que la garde ne rejoue la navigation vers Profil —
  // jamais un no-op (la copie de travail doit refléter l'état persisté,
  // pas les éditions abandonnées, pour toute consommation ultérieure tant
  // que ce composant reste monté).
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlockExit, () => {
    if (initialSnapshot) {
      setDraft(initialSnapshot);
    }
  });

  // Un enregistrement réussi met à jour `initialSnapshot`/`draft` ensemble
  // (brouillon devenu "propre") AVANT de rejouer le retour — jamais
  // `router.back()` directement depuis `handleSave`, qui serait sinon
  // intercepté par sa PROPRE garde (`shouldBlockExit` encore vrai sur le
  // rendu courant). Même patron que `CompositionExerciseEditor`
  // (`ExerciseScreen.tsx`, `isFinishing`/`shouldBlockExit`).
  useEffect(() => {
    if (isExiting && !shouldBlockExit) {
      router.back();
    }
  }, [isExiting, shouldBlockExit, router]);

  function patchDraft(patch: Partial<IdentityDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function handlePickPhoto() {
    const result = await pickAndCopyProfilePhoto();
    if (result.status === "PICKED") {
      setPhotoError(false);
      patchDraft({ photoUri: result.uri });
    } else if (result.status === "ERROR") {
      setPhotoError(true);
    }
    // CANCELED : le brouillon n'est jamais modifié (D-258).
  }

  async function handleSave() {
    if (!draft || !profile || isSaving) {
      return;
    }
    setIsSaving(true);
    setSaveError(false);
    try {
      const result = await profileService.saveIdentity({
        displayName: draft.displayName,
        photoUri: draft.photoUri,
        silhouette: draft.silhouette,
      });
      if (!result.ok) {
        setNameError(result.code);
        setIsSaving(false);
        return;
      }
      // D3 : l'ancienne copie n'est supprimée qu'après un enregistrement réussi.
      if (profile.photoUri && profile.photoUri !== draft.photoUri) {
        deletePreviousProfilePhoto(profile.photoUri);
      }
      const savedSnapshot = toDraft(result.value);
      setProfile(result.value);
      setInitialSnapshot(savedSnapshot);
      setDraft(savedSnapshot);
      setIsExiting(true);
    } catch (error) {
      console.error("Le profil n'a pas pu être enregistré.", error);
      setSaveError(true);
      setIsSaving(false);
    }
  }

  const hasPhoto = draft !== null && profilePhotoFileExists(draft.photoUri);
  const photoAccessibilityLabel = hasPhoto ? t.photo.changeAccessibilityLabel : t.photo.addAccessibilityLabel;

  return (
    // Figma 12119:25611 (alignement du 11/11/2026) : fond d'écran #F7F7FF, en-tête à trois onglets
    // (Profil sélectionné) sur une bande #EAEAFF → #F7F7FF, à la place du titre et du Retour.
    <ScreenShell backgroundColor={PROFILE_BACKGROUND}>
      <FixedHeader
        title={t.title}
        content={
          <View style={styles.headerTabs}>
            <CatalogueNavigation<ProfileTab>
              options={[
                { value: "profile", label: t.tabs.profile },
                { value: "preferences", label: t.tabs.preferences },
                {
                  value: "community",
                  label: t.tabs.community,
                  disabled: true,
                  accessibilityLabel: t.tabs.communityUnavailableAccessibilityLabel,
                },
              ]}
              value="profile"
              // « Préférences » ramène à l'écran Profil, qui porte les réglages et préférences (même garde
              // d'abandon que le Retour qu'il remplace).
              onChange={(tab) => {
                if (tab === "preferences") router.back();
              }}
              selectedColor={PROFILE_TAB_CONTEXT}
              testID="profile-edit-tabs"
            />
          </View>
        }
      />
      <View style={styles.tabBand} pointerEvents="none" testID="profile-edit-tab-band" />

      {draft ? (
        // CE-UI-01 L2004 (R1/UI-96E7FD739BF0) : l'écran défile dans les Safe
        // Areas, clavier affiché ou masqué — même patron que `ActivityEditorForm`
        // (`ScrollView` + `keyboardShouldPersistTaps="handled"`).
        <ScrollView
          style={styles.body}
          // PRE-6 story 7.10 (D-444) : réserve de défilement = zone d'action fixe.
          contentContainerStyle={[styles.bodyContent, { paddingBottom: actionZone.scrollReserve }]}
          scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
          keyboardShouldPersistTaps="handled"
          testID="profile-edit-body"
        >
          {/* Figma 12119:25611 : intitulé « Profil » au-dessus d'une carte (même carte que les Bibliothèques) —
              avatar 64 et pastille appareil photo, « Modifier la photo » dessous ; à droite, la ligne « Nom » ;
              séparateur ; silhouettes centrées en bas. Pseudo et type de compte : sans donnée, non affichés. */}
          <Section label={t.sectionLabel} testID="profile-edit-identity">
            <Card style={styles.identityCard} testID="profile-edit-identity-card">
              <View style={styles.identityTop}>
                <View style={styles.photoColumn} testID="profile-edit-photo-column">
                  <View style={styles.avatarFrame}>
                    <View style={styles.avatar} testID="profile-edit-avatar">
                      {hasPhoto ? (
                        <Image
                          source={{ uri: draft.photoUri! }}
                          style={styles.avatarImage}
                          testID="profile-edit-avatar-image"
                        />
                      ) : (
                        <>
                          <View style={styles.avatarBackground}>
                            <KodjoIcon name="profile-avatar-initials" testID="profile-edit-avatar-background" />
                          </View>
                          <Text
                            style={styles.avatarInitials}
                            accessibilityLabel={t.photo.initialsAccessibilityLabel}
                            testID="profile-edit-avatar-initials"
                          >
                            {computeInitials(draft.displayName)}
                          </Text>
                        </>
                      )}
                    </View>
                    {/* Pastille bleue 30 de Figma (« Action — Modifier la photo ») : même action que le libellé
                        dessous, masquée de l'accessibilité pour ne pas annoncer deux fois le même bouton. */}
                    <Pressable
                      onPress={handlePickPhoto}
                      accessible={false}
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                      hitSlop={(minTouchTarget - PHOTO_BADGE_SIZE) / 2}
                      style={styles.photoBadge}
                      testID="profile-edit-photo-badge"
                    >
                      <KodjoIcon name="profile-photo-camera" />
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={handlePickPhoto}
                    accessibilityRole="button"
                    accessibilityLabel={photoAccessibilityLabel}
                    hitSlop={{ top: 8, bottom: 8 }}
                    style={styles.photoAction}
                    testID="profile-edit-photo-action"
                  >
                    <Text style={styles.photoActionLabel} numberOfLines={1}>
                      {t.photo.editLabel}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.fieldsColumn}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t.name.label}</Text>
                    <TextInput
                      value={draft.displayName}
                      onChangeText={(text) => {
                        setNameError(null);
                        patchDraft({ displayName: text });
                      }}
                      placeholder={t.name.placeholder}
                      placeholderTextColor={colors.textSecondary}
                      accessibilityLabel={t.name.label}
                      style={styles.nameInput}
                      testID="profile-edit-name-input"
                    />
                  </View>
                  {nameError ? (
                    <Text style={styles.errorText} testID="profile-edit-name-error">
                      {nameError === "REQUIRED" ? t.name.errorRequired : t.name.errorTooLong}
                    </Text>
                  ) : null}
                  {photoError ? (
                    <Text style={styles.errorText} testID="profile-edit-photo-error">
                      {t.photo.errorMessage}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.identityDivider}>
                <Divider />
              </View>

              <View style={styles.silhouetteRow} accessibilityRole="radiogroup" accessibilityLabel={t.silhouette.label}>
                {(["homme", "femme"] as const).map((silhouette) => {
                  const selected = silhouette === "femme" ? draft.silhouette === "femme" : draft.silhouette !== "femme";
                  return (
                    <Pressable
                      key={silhouette}
                      onPress={() => patchDraft({ silhouette })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={t.silhouette[silhouette]}
                      hitSlop={(minTouchTarget - SILHOUETTE_CIRCLE) / 2}
                      style={[styles.silhouetteCircle, selected ? styles.silhouetteCircleSelected : null]}
                      testID={`profile-edit-silhouette-${silhouette}`}
                    >
                      <KodjoIcon
                        name={`profile-silhouette-${silhouette}`}
                        tintColor={selected ? colors.primary : SILHOUETTE_UNSELECTED}
                        testID={`profile-edit-silhouette-${silhouette}-icon`}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Section>

          {/* A1 (A-4 du 11/11/2026, Figma 12119:25611) : Bibliothèques du premier lot. */}
          <ProfileLibrariesSection />
        </ScrollView>
      ) : null}

      {/* PRE-6 story 7.10 (D-444) : « Enregistrer » dans la zone d'action principale fixe (format
          `Terminer`, zone protégée, bouton centré, dégradé) ; le message d'échec au-dessus. */}
      {draft ? (
        <PrimaryActionZone
          onContentHeightChange={actionZone.onContentHeightChange}
          contentStyle={styles.actionContent}
          background={PROFILE_BACKGROUND}
          testID="profile-edit-action-zone"
        >
          {saveError ? (
            <Text style={styles.errorText} testID="profile-edit-save-error">
              {t.saveError}
            </Text>
          ) : null}
          <PrimaryActionButton
            label={t.saveAction}
            onPress={handleSave}
            disabled={isSaving}
            testID="profile-edit-save-action"
          />
        </PrimaryActionZone>
      ) : null}

      {isPendingExit ? (
        <DecisionDialog
          title={t.abandonModal.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.abandonModal.message}
          messageStyle={{ ...type.body, color: colors.textSecondary }}
          cancelLabel={t.abandonModal.continueEditing}
          cancelLabelStyle={{ ...type.button, color: colors.dialogTitleText }}
          confirmLabel={t.abandonModal.abandon}
          confirmLabelStyle={type.button}
          confirmBordered={false}
          onCancel={cancelExit}
          onConfirm={confirmExit}
          testIDPrefix="profile-edit-exit-confirm"
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  // Figma 12119:25611 — les onglets occupent toute la hauteur de l'en-tête et reposent sur son bord bas
  // (même patron que le Catalogue, `CatalogueScreen.headerNavigation`).
  headerTabs: {
    flex: 1,
    alignSelf: "stretch",
  },
  // « Bande — Onglets » (12119:25662) : 14 pt, #EAEAFF opaque jusqu'à 80 % puis fondu vers le fond ; elle
  // recouvre les 2 derniers points de l'en-tête, comme sur la maquette (y 92 → 106).
  tabBand: {
    height: TAB_BAND_HEIGHT,
    marginTop: -2,
    experimental_backgroundImage: `linear-gradient(to bottom, ${PROFILE_TAB_CONTEXT} 0%, ${PROFILE_TAB_CONTEXT} 80%, ${PROFILE_BACKGROUND} 100%)`,
  },
  bodyContent: {
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
    // Figma : intitulé « Profil » 9 pt sous la bande ; 16 pt entre la carte et la section suivante.
    paddingTop: 9,
    gap: spacing[16],
  },
  identityCard: {
    paddingTop: spacing[16],
    paddingBottom: spacing[12],
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  // Colonne de l'avatar : centrée sur x = 68 de la carte (avatar 36 → 100, libellé 15 → 121).
  photoColumn: {
    width: 108,
    marginLeft: -2,
    alignItems: "center",
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  // Figma : initiales Inter Semi Bold 22, blanches.
  avatarInitials: {
    ...type.metricPrimary,
    color: colors.background,
  },
  // Figma : pastille 30 bleue, à (40, 40) de l'avatar ; icône 16 centrée.
  photoBadge: {
    position: "absolute",
    left: 40,
    top: 40,
    width: PHOTO_BADGE_SIZE,
    height: PHOTO_BADGE_SIZE,
    borderRadius: PHOTO_BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAction: {
    marginTop: spacing[8],
  },
  // Figma : « Modifier la photo » Inter Medium 13, bleu.
  photoActionLabel: {
    ...type.body,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 16,
    color: colors.primary,
  },
  // Figma : colonne des champs à x = 152 de la carte.
  fieldsColumn: {
    flex: 1,
    marginLeft: 30,
    gap: spacing[4],
  },
  // Figma : ligne « Nom » de 31 pt (haut de la carte + 16 → séparateur), libellé Regular 13 sur 66 pt,
  // valeur Regular 14.
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 31,
  },
  fieldLabel: {
    ...type.body,
    fontSize: 13,
    lineHeight: 16,
    width: 66,
    color: colors.textPrimary,
  },
  nameInput: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 31,
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
  // Figma : séparateur à 14 pt sous le libellé « Modifier la photo », silhouettes 7 pt dessous.
  // [CE-UI-01 L2001 : cercles de 64, contour 2, écart 24 — remplacé par la maquette 12119:25611 : cercles
  // de 40 sur fond blanc, écart 15, choisie contour #0508E5 1,25, non choisie contour #CCD1E0 0,625.]
  identityDivider: {
    marginTop: 14,
  },
  silhouetteRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 7,
  },
  silhouetteCircle: {
    width: SILHOUETTE_CIRCLE,
    height: SILHOUETTE_CIRCLE,
    borderRadius: SILHOUETTE_CIRCLE / 2,
    borderWidth: 0.625,
    borderColor: colors.cardsBorder,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  silhouetteCircleSelected: {
    borderWidth: 1.25,
    borderColor: colors.primary,
  },
  // PRE-6 story 7.10 : contenu de la zone d'action (message d'échec au-dessus du bouton).
  actionContent: {
    gap: spacing[8],
  },
});

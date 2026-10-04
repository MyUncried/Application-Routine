import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Profile, Silhouette } from "@/domain/preferences/Profile";
import {
  deletePreviousProfilePhoto,
  pickAndCopyProfilePhoto,
  profilePhotoFileExists,
} from "@/features/preferences/profilePhoto";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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

/** Initiales du nom d'affichage (1 ou 2 lettres) — repli visuel sans photo (CE-UI-01 L2033). */
function computeInitials(displayName: string): string {
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
 */
export function ProfileEditScreen() {
  const router = useRouter();
  const profileService = useProfileService();
  const t = strings.screens.profileEdit;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<IdentityDraft | null>(null);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [nameError, setNameError] = useState<"REQUIRED" | "TOO_LONG" | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlockExit, () => {});

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
      router.back();
    } catch (error) {
      console.error("Le profil n'a pas pu être enregistré.", error);
      setSaveError(true);
      setIsSaving(false);
    }
  }

  const hasPhoto = draft !== null && profilePhotoFileExists(draft.photoUri);

  return (
    <ScreenShell>
      <FixedHeader
        title={t.title}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      {draft ? (
        <View style={styles.body} testID="profile-edit-body">
          <View style={styles.photoSection}>
            <View style={styles.avatar} testID="profile-edit-avatar">
              {hasPhoto ? (
                <Image
                  source={{ uri: draft.photoUri! }}
                  style={styles.avatarImage}
                  testID="profile-edit-avatar-image"
                />
              ) : (
                <Text
                  style={styles.avatarInitials}
                  accessibilityLabel={t.photo.initialsAccessibilityLabel}
                  testID="profile-edit-avatar-initials"
                >
                  {computeInitials(draft.displayName)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={handlePickPhoto}
              accessibilityRole="button"
              accessibilityLabel={hasPhoto ? t.photo.changeAccessibilityLabel : t.photo.addAccessibilityLabel}
              style={styles.photoAction}
              testID="profile-edit-photo-action"
            >
              <Text style={styles.photoActionLabel}>
                {hasPhoto ? t.photo.changeAccessibilityLabel : t.photo.addAccessibilityLabel}
              </Text>
            </Pressable>
            {photoError ? (
              <Text style={styles.errorText} testID="profile-edit-photo-error">
                {t.photo.errorMessage}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
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
            {nameError ? (
              <Text style={styles.errorText} testID="profile-edit-name-error">
                {nameError === "REQUIRED" ? t.name.errorRequired : t.name.errorTooLong}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.silhouette.label}</Text>
            <View style={styles.silhouetteRow}>
              <Pressable
                onPress={() => patchDraft({ silhouette: "homme" })}
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.silhouette !== "femme" }}
                accessibilityLabel={t.silhouette.homme}
                style={[
                  styles.silhouetteCircle,
                  draft.silhouette !== "femme" ? styles.silhouetteCircleSelected : null,
                ]}
                testID="profile-edit-silhouette-homme"
              >
                <KodjoIcon name="body-zone-homme" size={44} />
              </Pressable>
              <Pressable
                onPress={() => patchDraft({ silhouette: "femme" })}
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.silhouette === "femme" }}
                accessibilityLabel={t.silhouette.femme}
                style={[
                  styles.silhouetteCircle,
                  draft.silhouette === "femme" ? styles.silhouetteCircleSelected : null,
                ]}
                testID="profile-edit-silhouette-femme"
              >
                <KodjoIcon name="body-zone-femme" size={44} />
              </Pressable>
            </View>
          </View>

          {saveError ? (
            <Text style={styles.errorText} testID="profile-edit-save-error">
              {t.saveError}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            accessibilityLabel={t.saveAction}
            style={styles.saveAction}
            testID="profile-edit-save-action"
          >
            <Text style={styles.saveActionLabel}>{t.saveAction}</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[24],
  },
  photoSection: {
    alignItems: "center",
    gap: spacing[8],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarInitials: {
    ...type.activityTitle,
    color: colors.textSecondary,
  },
  photoAction: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  photoActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  fieldGroup: {
    gap: spacing[8],
  },
  fieldLabel: {
    ...type.label,
    color: colors.textPrimary,
  },
  nameInput: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing[12],
    height: 46,
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
  // CE-UI-01 L2001 : silhouettes dans deux cercles de 64, hauteur 44, écart
  // 24 ; choisie en bleu #0508E5 contour 2, non choisie en gris #9499A8
  // contour #CCD1E0.
  silhouetteRow: {
    flexDirection: "row",
    height: 44,
    gap: spacing[24],
  },
  silhouetteCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#CCD1E0",
    alignItems: "center",
    justifyContent: "center",
  },
  silhouetteCircleSelected: {
    borderColor: "#0508E5",
  },
  saveAction: {
    minHeight: minTouchTarget,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveActionLabel: {
    ...type.button,
    color: colors.background,
  },
});

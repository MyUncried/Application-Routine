import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Profile, Silhouette } from "@/domain/preferences/Profile";
import {
  deletePreviousProfilePhoto,
  pickAndCopyProfilePhoto,
  profilePhotoFileExists,
} from "@/features/preferences/profilePhoto";
import { ProfileLibrariesSection } from "@/features/catalogue/ProfileLibrariesSection";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type ProfileTab = "profile" | "preferences" | "community";

/**
 * Figma 12119:25611 : fond d'écran `color/catalogue/seances/background` (#F7F7FF) et bande des onglets
 * `color/catalogue/seances/context` (#EAEAFF) → fond, sur 14 pt (opaque jusqu'à 80 %).
 */
const PROFILE_BACKGROUND = colors.catalogueSessionsBackground;
const PROFILE_TAB_CONTEXT = colors.catalogueSessionsContext;
const AVATAR_SIZE = 64;
/**
 * Recette c2 du 11/11 (Hermann : « faire l'icône de la photo plus petit ») : pastille 22 et icône 12.
 * [Avant : Figma 12119:25611, pastille 30 et icône 16 — remplacé.]
 */
const PHOTO_BADGE_SIZE = 22;
const PHOTO_BADGE_ICON = 12;
/**
 * 13/11 (Hermann : « grandir le cercle pour qu'il fasse la même taille que celui de la photo ») : taille de la photo.
 * [Avant : 40 (Figma 12116:25028), puis 48 — remplacés.]
 */
const SILHOUETTE_CIRCLE = AVATAR_SIZE;
/**
 * 13/11 (Hermann : « agrandir la silhouette dans la pastille », puis « laisser de la marge entre la silhouette et les
 * bords ») : hauteur du rond moins 8 pt de chaque côté ; `contentFit="contain"` garde les proportions du tracé.
 * [Avant : 27,5 (Figma), puis 56 — remplacés.]
 */
const SILHOUETTE_ICON = SILHOUETTE_CIRCLE - 2 * spacing[8];

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
 * d'affichage, photo locale facultative, silhouette facultative. La silhouette ne modifie que
 * l'icône des Zones corporelles (CE-UI-09 L2805) — aucune autre donnée.
 *
 * Alignement Figma `12119:25611` (demande de Hermann du 11/11/2026, partie au-dessus des Bibliothèques) :
 * en-tête à trois onglets (`CatalogueNavigation`, même forme d'onglet sélectionné que les Catalogues) —
 * « Profil » sélectionné, « Préférences » ramène à l'écran Profil (réglages et préférences, garde d'abandon
 * conservée), « Communauté » visible et désactivée (E01) ; carte « Profil » (avatar, « Modifier la photo »,
 * ligne « Nom », silhouettes). [Avant : titre « Modifier le profil » et Retour — remplacés.] « Pseudo » et la
 * pastille « Compte gratuit » de la maquette ne sont pas affichés : le Profil n'a ni pseudo ni type de compte.
 *
 * Recette c1/c2 du 12/11/2026 (Hermann : « la zone de contexte doit avoir la taille standard » ; « Retirer le
 * titre de section Profil », « remonter la photo et le nom », « retirer "Nom" », « les deux silhouettes doivent
 * être dans la zone de contexte ») : zone de contexte de hauteur standard (`dimensions.contextBand.height`, comme
 * les Catalogues) portant les silhouettes ; dessous, photo et nom sans intitulé de section ni libellé.
 * [Avant : bande de 14 pt + fondu, intitulé « Profil », ligne « Nom », séparateur et silhouettes dans la carte —
 * remplacés.] Pseudo : en attente de décision (stockage du Profil, unicité).
 *
 * Demande de Hermann du 13/11/2026 (« Retirer le bouton enregistrer de l'écran d'accueil du profil », arbitrage
 * « Immédiate ») : photo et silhouette enregistrées dès le choix, nom à la fin de la saisie ; nom vide ou trop long :
 * message sous le champ, l'ancien nom reste enregistré. [Avant : brouillon enregistré par « Enregistrer » (zone
 * d'action fixe, D-444) et dialogue « Abandonner les modifications ? » en quittant (CE-UI-01 L1981) — remplacés.]
 */
export function ProfileEditScreen() {
  const router = useRouter();
  const profileService = useProfileService();
  const t = strings.screens.profileEdit;
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [nameError, setNameError] = useState<"REQUIRED" | "TOO_LONG" | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Enregistrement immédiat (13/11/2026) : chaque écriture part du dernier Profil ENREGISTRÉ (jamais d'un nom en cours
  // de saisie) et attend la précédente — une photo choisie pendant l'enregistrement du nom ne l'écrase jamais.
  const savedProfile = useRef<Profile | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (loaded) => {
        if (cancelled) {
          return;
        }
        savedProfile.current = loaded;
        setDraft(toDraft(loaded));
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

  // Recette du 15/11/2026 (pr-enregistrement, Hermann : « quitter et rouvrir après le message « Le nom est obligatoire. »
  // sous le champ : le nom n'est pas revenu, il est vide ») : l'écran reste monté dans l'onglet Profil (14/11) ; en le
  // quittant, une saisie refusée est abandonnée — au retour, le champ montre le nom enregistré, sans message.
  useFocusEffect(
    useCallback(
      () => () => {
        const saved = savedProfile.current;
        if (saved === null) return;
        setNameError(null);
        setDraft((current) => (current ? { ...current, displayName: saved.displayName ?? "" } : current));
      },
      [],
    ),
  );

  function patchDraft(patch: Partial<IdentityDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  /** Met en file une écriture ; `write` reçoit le Profil enregistré et rend le nouveau, ou `null` (rien d'écrit). */
  function enqueueSave(write: (saved: Profile) => Promise<Profile | null>): Promise<void> {
    const run = async () => {
      const saved = savedProfile.current;
      if (!saved) {
        return;
      }
      setSaveError(false);
      try {
        const next = await write(saved);
        if (!next) {
          return;
        }
        // D3 : l'ancienne copie de la photo n'est supprimée qu'après un enregistrement réussi.
        if (saved.photoUri && saved.photoUri !== next.photoUri) {
          deletePreviousProfilePhoto(saved.photoUri);
        }
        savedProfile.current = next;
      } catch (error) {
        console.error("Le profil n'a pas pu être enregistré.", error);
        setSaveError(true);
      }
    };
    saveQueue.current = saveQueue.current.then(run);
    return saveQueue.current;
  }

  /** Photo et silhouette : enregistrées dès le choix ; le nom enregistré reste tel quel. */
  function saveAppearance(patch: { readonly photoUri?: string | null; readonly silhouette?: Silhouette }) {
    return enqueueSave((saved) =>
      profileService.saveAppearance({
        photoUri: patch.photoUri !== undefined ? patch.photoUri : saved.photoUri,
        silhouette: patch.silhouette ?? saved.silhouette,
      }),
    );
  }

  /**
   * Nom : enregistré à la fin de la saisie. Vide ou trop long : message sous le champ, l'ancien nom reste
   * enregistré (le champ garde la saisie pour la corriger).
   */
  function saveName(displayName: string) {
    return enqueueSave(async (saved) => {
      if (displayName === (saved.displayName ?? "")) {
        setNameError(null);
        return null;
      }
      const result = await profileService.saveIdentity({
        displayName,
        photoUri: saved.photoUri,
        silhouette: saved.silhouette,
      });
      if (!result.ok) {
        setNameError(result.code);
        return null;
      }
      setNameError(null);
      return result.value;
    });
  }

  function selectSilhouette(silhouette: Silhouette) {
    patchDraft({ silhouette });
    void saveAppearance({ silhouette });
  }

  async function handlePickPhoto() {
    const result = await pickAndCopyProfilePhoto();
    if (result.status === "PICKED") {
      setPhotoError(false);
      patchDraft({ photoUri: result.uri });
      await saveAppearance({ photoUri: result.uri });
    } else if (result.status === "ERROR") {
      setPhotoError(true);
    }
    // CANCELED : rien n'est modifié (D-258).
  }

  const hasPhoto = draft !== null && profilePhotoFileExists(draft.photoUri);
  // Silhouette affichée : homme par défaut (CE-UI-01 L2029).
  const currentSilhouette: Silhouette = draft?.silhouette === "femme" ? "femme" : "homme";
  const photoAccessibilityLabel = hasPhoto ? t.photo.changeAccessibilityLabel : t.photo.addAccessibilityLabel;

  return (
    // Figma 12119:25611 (alignement du 11/11/2026) : fond d'écran #F7F7FF, en-tête à trois onglets
    // (Profil sélectionné) sur une bande #EAEAFF → #F7F7FF, à la place du titre et du Retour.
    <TabbedScreen
      title={t.title}
      palette={{ context: PROFILE_TAB_CONTEXT, background: PROFILE_BACKGROUND }}
      tabs={{
        options: [
          { value: "profile", label: t.tabs.profile },
          { value: "preferences", label: t.tabs.preferences },
          {
            value: "community",
            label: t.tabs.community,
            disabled: true,
            accessibilityLabel: t.tabs.communityUnavailableAccessibilityLabel,
          },
        ],
        value: "profile" as ProfileTab,
        // « Préférences » ramène à l'écran Profil, qui porte les réglages et préférences (13/11 : plus de garde
        // d'abandon, tout est déjà enregistré).
        onChange: (tab: ProfileTab) => {
          // 14/11 : écran de l'onglet Profil (barre de navigation) — on rejoint Préférences par son adresse, un
          // retour arrière d'onglet ramènerait au premier onglet. [Avant : router.back() — remplacé.]
          if (tab === "preferences") router.navigate("/profile");
        },
        testID: "profile-edit-tabs",
      }}
      // Haut d'écran partagé `TabbedScreen` (Hermann, 19/11/2026).
      /* Zone de contexte canonique des Catalogues (`ContextBand` : fondu par couches D-224, géométrie CE-CAT-CTX-01,
          hauteur standard), couleur de l'onglet sélectionné (recettes du 12/11 : « UTILISE LES COMPOSANTS STANDARDS »).
          Recette c2 du 13/11 (Hermann : « la photo et le nom ne sont pas dans la zone de contexte » ; « se référer à
          Figma, écran "P-Profil — Modifier le profil — Sections sans bibliothèque" », 12116:25015, « J'ai retiré
          "Compte gratuit" ») : sur une ligne, photo (pastille appareil photo), nom, puis à droite le rond de la
          silhouette choisie — un appui change de silhouette. Pseudo « @… » de la maquette non affiché : prévu après la
          fusion de PRE-10 (x-c2-pseudo).
          [Avant : silhouettes homme et femme côte à côte dans la zone, photo et nom dessous dans le corps — remplacé.] */
      context={{
        kind: "custom",
        content: (
          <>
            {draft ? (
              <View pointerEvents="box-none" style={styles.identityRow} testID="profile-edit-identity">
                <View style={styles.avatarFrame}>
                  <View style={styles.avatar} testID="profile-edit-avatar">
                    {hasPhoto ? (
                      <Image source={{ uri: draft.photoUri! }} style={styles.avatarImage} testID="profile-edit-avatar-image" />
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
                  {/* Pastille bleue (« Action — Modifier la photo ») : seule commande de la photo (recette c2 du 11/11,
                      « retirer le texte Modifier la photo » ; « faire l'icône de la photo plus petit » : 22 / 12). */}
                  <Pressable
                    onPress={handlePickPhoto}
                    accessibilityRole="button"
                    accessibilityLabel={photoAccessibilityLabel}
                    hitSlop={(minTouchTarget - PHOTO_BADGE_SIZE) / 2}
                    style={styles.photoBadge}
                    testID="profile-edit-photo-action"
                  >
                    <KodjoIcon name="profile-photo-camera" size={PHOTO_BADGE_ICON} />
                  </Pressable>
                </View>
    
                {/* Recette c2 du 12/11 : libellé « Nom » retiré ; le nom reste le nom accessible du champ. */}
                <TextInput
                  value={draft.displayName}
                  onChangeText={(text) => {
                    setNameError(null);
                    patchDraft({ displayName: text });
                  }}
                  onEndEditing={(event) => void saveName(event.nativeEvent.text)}
                  returnKeyType="done"
                  placeholder={t.name.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={t.name.label}
                  style={styles.nameInput}
                  testID="profile-edit-name-input"
                />
    
                {/* Figma 12116:25028 « Choix — Silhouette du profil (touchez pour changer) » : un seul rond, la silhouette
                    choisie (homme par défaut), contour et tracé bleus. */}
                <Pressable
                  onPress={() => selectSilhouette(currentSilhouette === "femme" ? "homme" : "femme")}
                  accessibilityRole="button"
                  accessibilityLabel={t.silhouette[currentSilhouette]}
                  accessibilityHint={t.silhouette.toggleHint}
                  hitSlop={(minTouchTarget - SILHOUETTE_CIRCLE) / 2}
                  style={styles.silhouetteCircle}
                  testID="profile-edit-silhouette"
                >
                  {/* 13/11 (Hermann : « fond de la silhouette en bleu », « la silhouette est toujours fond transparent ») :
                      silhouette PLEINE bleue des Zones corporelles (`body-zone-<silhouette>-plein`, même tracé, déjà au
                      Design System) — le tracé du Profil n'est qu'un contour, sans remplissage à teinter.
                      [Avant : `profile-silhouette-<silhouette>` (contour seul) — remplacé.] */}
                  <KodjoIcon
                    name={`body-zone-${currentSilhouette}-plein`}
                    size={SILHOUETTE_ICON}
                    testID={`profile-edit-silhouette-${currentSilhouette}-icon`}
                  />
                </Pressable>
              </View>
            ) : null}
          </>
        ),
      }}
    >

      {draft ? (
        // CE-UI-01 L2004 (R1/UI-96E7FD739BF0) : l'écran défile dans les Safe
        // Areas, clavier affiché ou masqué — même patron que `ActivityEditorForm`
        // (`ScrollView` + `keyboardShouldPersistTaps="handled"`).
        <ScrollView
          style={styles.body}
          // 13/11 : plus de zone d'action fixe ; marge basse = zone protégée + 24.
          contentContainerStyle={[styles.bodyContent, { paddingBottom: navigationBarTotalHeight() + spacing[16] }]}
          keyboardShouldPersistTaps="handled"
          testID="profile-edit-body"
        >
          {nameError || photoError || saveError ? (
            <View style={styles.messages} testID="profile-edit-messages">
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
              {saveError ? (
                <Text style={styles.errorText} testID="profile-edit-save-error">
                  {t.saveError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* A1 (A-4 du 11/11/2026, Figma 12119:25611) : Bibliothèques du premier lot. */}
          <ProfileLibrariesSection />
        </ScrollView>
      ) : null}

      {/* 13/11/2026 : « Enregistrer » et le dialogue d'abandon retirés — tout est enregistré immédiatement. */}
    </TabbedScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    // Recette c1 : le corps remonte sous la part fondue de la zone de contexte et défile derrière elle.
    marginTop: -CONTEXT_BAND_FADE_HEIGHT,
  },
  bodyContent: {
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
    // Recette du 12/11 (« il faut remonter la photo, le nom ») : même retrait que la liste des Catalogues
    // (8 sous la part fondue). [Avant : 9 + fondu, puis 8 de marge de carte — remplacé.]
    paddingTop: spacing[8] + CONTEXT_BAND_FADE_HEIGHT,
    gap: spacing[16],
  },
  // Recette c2 du 13/11 (Figma 12116:25015) : photo à 8 de la marge, nom 24 plus loin, rond de silhouette au bord
  // droit, tous centrés sur la photo.
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing[8],
  },
  messages: {
    gap: spacing[4],
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
  // Pastille bleue en bas à droite de l'avatar, débordant de 6 pt comme sur Figma ; icône centrée.
  photoBadge: {
    position: "absolute",
    left: AVATAR_SIZE + 6 - PHOTO_BADGE_SIZE,
    top: AVATAR_SIZE + 6 - PHOTO_BADGE_SIZE,
    width: PHOTO_BADGE_SIZE,
    height: PHOTO_BADGE_SIZE,
    borderRadius: PHOTO_BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma 12116:25038 : nom Inter Regular 14, à 24 de la photo.
  nameInput: {
    ...type.body,
    flex: 1,
    marginLeft: spacing[24],
    marginRight: spacing[16],
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 31,
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
  // Figma 12116:25028 : rond, contour #0508E5 de 1,25. Demandes de Hermann du 13/11 : fond transparent, taille de la
  // photo ; liseré bleu « remis » après un essai en blanc.
  // [12/11 : deux ronds côte à côte sur fond blanc, la non choisie en contour #CCD1E0 — remplacé le 13/11.]
  silhouetteCircle: {
    width: SILHOUETTE_CIRCLE,
    height: SILHOUETTE_CIRCLE,
    borderRadius: SILHOUETTE_CIRCLE / 2,
    borderWidth: 1.25,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});

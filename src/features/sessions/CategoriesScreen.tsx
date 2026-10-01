import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error" };

/**
 * Écran de confirmation finale de la Séance (CE-T01-11/CE-T01-12).
 *
 * V2-PRE-1 (plan §3.3, UI-8CB4E7976CBA) : la relation historique Catégorie
 * de Séance N:N (`draft.categoryDrafts`/`draft.selectedCategoryIds`) et la
 * couleur autonome associée sont RETIRÉES — ni lues, ni écrites. Aucune
 * fonctionnalité d'écran nouvelle n'est introduite en remplacement : cet
 * écran se limite désormais à la confirmation finale et à l'enregistrement
 * de la Séance (`SessionService` via `useSessionService()`), hérité
 * inchangé des sous-tranches précédentes. `Retour` (en-tête) revient à la
 * Composition sans rien réinitialiser — le brouillon partagé
 * (`SessionDraftProvider`) survit à cette navigation.
 */
export function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionService = useSessionService();
  const { draft, resetDraft } = useSessionDraft();

  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const isSavingRef = useRef(false);

  const t = strings.screens.categories;

  async function handleSave() {
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setSaveState({ status: "saving" });

    try {
      // T01-S10, plan §7.3 : `updateSession` sur l'identifiant source quand
      // le brouillon provient d'une Séance persistée (`sourceSessionId`) —
      // jamais `createSession` (aucune seconde Séance créée). Sinon, parcours
      // de création inchangé.
      const sourceSessionId = draft.sourceSessionId ?? null;
      const saved =
        sourceSessionId !== null
          ? (await sessionService.updateSession(sourceSessionId, draft)).status === "UPDATED"
          : (await sessionService.createSession(draft)).ok;
      if (!saved) {
        // Défense de dernier recours : le brouillon devrait déjà être valide
        // à ce stade (Composition n'autorise `Continuer` que pour un
        // brouillon valide). Tout échec (validation résiduelle, `NOT_FOUND`,
        // `ARCHIVED`, technique) est traité de façon identique : brouillon
        // conservé, écran affiché, action réactivée, nouvelle tentative
        // possible (D-107 / CE-T01-S10-09).
        isSavingRef.current = false;
        setSaveState({ status: "error" });
        return;
      }
      resetDraft();
      // V2-CAT-01 (UI-CAT-R-005/006) : la cible est déterministement
      // `Catalogue des séances` / segment `Séances`, indépendamment du
      // segment qui était actif avant l'ouverture du parcours de création —
      // `catalogueSegment` est un signal PONCTUEL, consommé une seule fois
      // par `CatalogueScreen` (`useFocusEffect`), jamais persisté.
      router.dismissTo({ pathname: "/", params: { catalogueSegment: "sessions" } });
    } catch (error) {
      console.error("La séance n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setSaveState({ status: "error" });
    }
  }

  const isSaving = saveState.status === "saving";

  return (
    <ScreenShell>
      <FixedHeader title={t.title} onBack={() => router.back()} backAccessibilityLabel={t.backAccessibilityLabel} />
      <HeaderSeparator />

      <ScrollView contentContainerStyle={styles.bodyContent} testID="categories-body" />

      <View
        testID="categories-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        {saveState.status === "error" ? (
          <Text style={styles.saveErrorText} testID="categories-save-error">
            {t.saveError}
          </Text>
        ) : null}
        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
          accessibilityLabel={t.saveAction}
          style={[styles.saveAction, isSaving ? styles.saveActionDisabled : null]}
        >
          <Text style={styles.saveActionLabel}>{t.saveAction}</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[16],
  },
  bottomAction: {
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
  saveAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  saveActionDisabled: {
    backgroundColor: colors.disabled,
  },
  saveActionLabel: {
    ...type.button,
    color: colors.background,
  },
});

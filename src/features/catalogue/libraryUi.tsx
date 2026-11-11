/**
 * A1 — Briques d'écran des parcours Bibliothèques (Figma page 510:101, écrans 12116:*, 12118:*, 12119:*).
 * Composants React Native standard et jetons existants (`colors`, `type`, `spacing`) ; en-tête et zone
 * d'action principale partagés avec le reste de l'application (`FixedHeader`, `PrimaryActionZone`).
 */
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type LibraryAction = { readonly label: string; readonly onPress: () => void; readonly disabled?: boolean; readonly testID: string };

/** Écran de pile : en-tête avec Retour, contenu défilant, actions en bas (secondaire puis principale). */
export function LibraryScreen({
  title,
  children,
  primary,
  secondary,
  testID,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly primary?: LibraryAction | null;
  readonly secondary?: readonly LibraryAction[];
  readonly testID: string;
}) {
  const router = useRouter();
  const actionZone = usePrimaryActionZone();
  const hasActions = Boolean(primary) || (secondary?.length ?? 0) > 0;
  return (
    <ScreenShell>
      <FixedHeader title={title} onBack={() => router.back()} backAccessibilityLabel="Retour" />
      <HeaderSeparator />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, hasActions ? { paddingBottom: actionZone.scrollReserve } : null]}
        testID={testID}
      >
        {children}
      </ScrollView>
      {hasActions ? (
        <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} contentStyle={styles.actions} testID={testID + "-actions"}>
          {(secondary ?? []).map((action) => (
            <Pressable
              key={action.testID}
              onPress={action.onPress}
              disabled={action.disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(action.disabled) }}
              style={[styles.secondary, action.disabled ? styles.disabled : null]}
              testID={action.testID}
            >
              <Text style={styles.secondaryLabel}>{action.label}</Text>
            </Pressable>
          ))}
          {primary ? (
            <PrimaryActionButton label={primary.label} onPress={primary.onPress} disabled={primary.disabled} testID={primary.testID} />
          ) : null}
        </PrimaryActionZone>
      ) : null}
    </ScreenShell>
  );
}

export function Paragraph({ children, tone = "primary", testID }: { readonly children: ReactNode; readonly tone?: "primary" | "secondary"; readonly testID?: string }) {
  return <Text style={[styles.paragraph, tone === "secondary" ? styles.secondaryText : null]} testID={testID}>{children}</Text>;
}

export function SectionTitle({ children }: { readonly children: ReactNode }) {
  return <Text style={styles.sectionTitle} accessibilityRole="header">{children}</Text>;
}

/** Groupe à fond clair, comme les groupes du Profil. */
export function Card({ children, testID }: { readonly children: ReactNode; readonly testID?: string }) {
  return <View style={styles.card} testID={testID}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export type PillTone = "neutral" | "action" | "positive" | "warning" | "danger";

export function Pill({ label, tone = "neutral", testID }: { readonly label: string; readonly tone?: PillTone; readonly testID?: string }) {
  return (
    <View style={[styles.pill, PILL_TONES[tone]]} testID={testID}>
      <Text style={[styles.pillLabel, tone === "action" ? styles.pillLabelAction : null]}>{label}</Text>
    </View>
  );
}

/** Ligne à chevron (titre, sous-titre, pastille éventuelle). */
export function Row({
  title,
  subtitle,
  pill,
  onPress,
  testID,
}: {
  readonly title: string;
  readonly subtitle?: string | null;
  readonly pill?: ReactNode;
  readonly onPress?: () => void;
  readonly testID: string;
}) {
  const content = (
    <>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {pill ?? null}
      {onPress ? <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no">›</Text> : null}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={subtitle ? title + ", " + subtitle : title} style={styles.row} testID={testID}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row} testID={testID}>{content}</View>
  );
}

/** Encart d'état (erreur, avertissement, succès). */
export function Notice({
  tone,
  title,
  children,
  testID,
}: {
  readonly tone: "danger" | "warning" | "positive";
  readonly title: string;
  readonly children?: ReactNode;
  readonly testID?: string;
}) {
  return (
    <View style={[styles.notice, NOTICE_TONES[tone]]} testID={testID} accessibilityRole="summary">
      <Text style={styles.noticeTitle}>{title}</Text>
      {children ? <Text style={styles.paragraph}>{children}</Text> : null}
    </View>
  );
}

export function Busy({ label, detail, testID }: { readonly label: string; readonly detail?: string; readonly testID?: string }) {
  return (
    <View style={styles.busy} testID={testID}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.sectionTitle}>{label}</Text>
      {detail ? <Text style={styles.secondaryText}>{detail}</Text> : null}
    </View>
  );
}

const PILL_TONES = StyleSheet.create({
  neutral: { backgroundColor: colors.surface },
  action: { backgroundColor: colors.primary },
  positive: { backgroundColor: "#E7F4EF" },
  warning: { backgroundColor: "#FFF1E5" },
  danger: { backgroundColor: "#FDECEA" },
});

const NOTICE_TONES = StyleSheet.create({
  danger: { borderColor: colors.danger, backgroundColor: "#FDECEA" },
  warning: { borderColor: colors.warning, backgroundColor: "#FFF1E5" },
  positive: { borderColor: colors.positive, backgroundColor: "#E7F4EF" },
});

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: layout.screenGutter, paddingTop: spacing[16], gap: spacing[16] },
  actions: { gap: spacing[8] },
  paragraph: { ...type.body, color: colors.textPrimary },
  secondaryText: { ...type.supporting, color: colors.textSecondary },
  sectionTitle: { ...type.sectionTitle, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[8], minHeight: minTouchTarget, paddingVertical: spacing[8] },
  rowText: { flex: 1, gap: spacing[2] },
  rowTitle: { ...type.label, color: colors.textPrimary },
  rowSubtitle: { ...type.supporting, color: colors.textSecondary },
  chevron: { ...type.sectionTitle, color: colors.textSecondary },
  pill: { borderRadius: 11, paddingHorizontal: spacing[10], paddingVertical: spacing[2] },
  pillLabel: { ...type.supporting, color: colors.textPrimary },
  pillLabelAction: { color: colors.background },
  notice: { borderWidth: 1, borderRadius: 12, padding: spacing[12], gap: spacing[4] },
  noticeTitle: { ...type.label, color: colors.textPrimary },
  busy: { alignItems: "center", gap: spacing[8], paddingVertical: spacing[24] },
  secondary: {
    minHeight: minTouchTarget,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  secondaryLabel: { ...type.button, color: colors.primary },
  disabled: { opacity: 0.4 },
});

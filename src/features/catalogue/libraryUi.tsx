/**
 * A1 — Briques d'écran des parcours Bibliothèques (Figma page 510:101, écrans 12116:*, 12118:*, 12119:*, 12098:115).
 *
 * Correction du 11/11/2026 (« mise en page Figma des écrans Bibliothèques ») : les briques reprennent la
 * MISE EN PAGE des maquettes, plus seulement leurs textes — fond d'écran #F7F7FF sous un en-tête blanc,
 * intitulés de section en petit texte gris AU-DESSUS des cartes, cartes à liseré blanc et ombre douce,
 * icônes de ligne et chevrons SVG exportés de Figma (`KodjoIcon`, aucun caractère typographique), pastilles
 * colorées, encarts teintés avec icône, états centrés (pastille ronde + titre + message), boutons
 * secondaires gris #F2F2F3. Comportement inchangé : seules la structure visuelle et les couleurs changent.
 *
 * Marges : `layout.screenGutter` (16, arbitrage A01 de Hermann du 27/10/2026) au lieu des 24 des maquettes.
 * En-tête : `FixedHeader` partagé (cercle Retour + titre à gauche, conforme à `DSF / Navigation / En-tête
 * fixe`, État=Retour), sans démarcation (les maquettes n'en ont pas : `demarcation=false`).
 */
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Couleurs relevées sur les maquettes Bibliothèques (sans jeton partagé équivalent). */
export const LIBRARY_COLORS = {
  /** Fond des écrans (sous l'en-tête blanc). */
  screen: "#F7F7FF",
  /** Textes d'appoint (sous-titres de ligne, notes) : #7A7A80. */
  muted: colors.movementCardDescription,
  secondaryButton: "#F2F2F3",
  positiveSurface: "#E5F7ED",
  positiveText: "#1A804D",
  dangerSurface: "#FCE8E8",
  dangerText: "#D11F1F",
  warningSurface: "#FFF5D6",
  warningText: "#8C5C00",
  /** #EAEAFF. */
  actionSurface: colors.contextBand,
  neutralSurface: "#EDF0F2",
  codeBorder: "#C7CCD6",
  skeleton: "#E0E3EB",
  /** #1A1A26 (ombre « KODJO / DSF / Effet observé / 01 », 8 %). */
  cardShadow: colors.movementCardShadow,
} as const;

export type LibraryAction = { readonly label: string; readonly onPress: () => void; readonly disabled?: boolean; readonly testID: string };

/**
 * Écran de pile : en-tête Retour, contenu défilant sur fond #F7F7FF, actions fixes en bas.
 * Boutons secondaires (gris) au-dessus du principal par défaut, ou en dessous (`secondaryBelow`,
 * Installation terminée 12118:25220) ; côte à côte avec `secondaryInRow` (Reporter / Refuser, 12118:25251).
 */
export function LibraryScreen({
  title,
  children,
  primary,
  secondary,
  secondaryBelow = false,
  secondaryInRow = false,
  headerTrailing,
  testID,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly primary?: LibraryAction | null;
  readonly secondary?: readonly LibraryAction[];
  readonly secondaryBelow?: boolean;
  readonly secondaryInRow?: boolean;
  readonly headerTrailing?: ReactNode;
  readonly testID: string;
}) {
  const router = useRouter();
  const actionZone = usePrimaryActionZone();
  const secondaries = secondary ?? [];
  const hasActions = Boolean(primary) || secondaries.length > 0;
  const secondaryButtons = secondaries.length > 0 ? (
    <View style={secondaryInRow ? styles.secondaryRow : styles.secondaryColumn}>
      {secondaries.map((action) => (
        <SecondaryButton key={action.testID} action={action} style={secondaryInRow ? styles.secondaryInRow : null} />
      ))}
    </View>
  ) : null;
  return (
    <ScreenShell>
      <FixedHeader title={title} onBack={() => router.back()} backAccessibilityLabel="Retour" trailing={headerTrailing} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, hasActions ? { paddingBottom: actionZone.scrollReserve } : null]}
        testID={testID}
      >
        {children}
      </ScrollView>
      {hasActions ? (
        <PrimaryActionZone
          onContentHeightChange={actionZone.onContentHeightChange}
          contentStyle={styles.actions}
          background={LIBRARY_COLORS.screen}
          testID={testID + "-actions"}
        >
          {secondaryBelow ? null : secondaryButtons}
          {primary ? (
            <PrimaryActionButton label={primary.label} onPress={primary.onPress} disabled={primary.disabled} testID={primary.testID} />
          ) : null}
          {secondaryBelow ? secondaryButtons : null}
        </PrimaryActionZone>
      ) : null}
    </ScreenShell>
  );
}

/** Bouton secondaire des maquettes : pilule grise #F2F2F3 de 48, libellé Inter Semi Bold 14 #141414. */
function SecondaryButton({ action, style }: { readonly action: LibraryAction; readonly style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={action.onPress}
      disabled={action.disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(action.disabled) }}
      style={[styles.secondary, action.disabled ? styles.disabled : null, style]}
      testID={action.testID}
    >
      <Text style={styles.secondaryLabel}>{action.label}</Text>
    </Pressable>
  );
}

export type ParagraphTone = "intro" | "note" | "body";

/**
 * Textes courants : `intro` (13 #595E66, phrase d'introduction sous l'en-tête), `note` (12 #7A7A80, note de
 * bas de bloc), `body` (14 #141414).
 */
export function Paragraph({ children, tone = "intro", align, testID }: { readonly children: ReactNode; readonly tone?: ParagraphTone; readonly align?: "center"; readonly testID?: string }) {
  return <Text style={[PARAGRAPH_TONES[tone], align === "center" ? styles.centerText : null]} testID={testID}>{children}</Text>;
}

/** Intitulé de section : Inter Regular 11 #595E66, au-dessus de sa carte. */
export function SectionLabel({ children }: { readonly children: ReactNode }) {
  return <Text style={LIBRARY_TEXT.caption} accessibilityRole="header">{children}</Text>;
}

/** Intitulé de section et son contenu (carte), resserrés comme sur les maquettes. */
export function Section({ label, children, testID }: { readonly label: string; readonly children: ReactNode; readonly testID?: string }) {
  return (
    <View style={styles.section} testID={testID}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </View>
  );
}

/** Carte des maquettes : fond #F9FAFC, liseré blanc, rayon 12, ombre douce ; marge intérieure 16. */
export function Card({ children, style, testID }: { readonly children: ReactNode; readonly style?: StyleProp<ViewStyle>; readonly testID?: string }) {
  return <View style={[styles.card, style]} testID={testID}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export type PillTone = "neutral" | "action" | "positive" | "warning";

/** Pastille : hauteur 21, rayon 12, Inter Semi Bold 12 (bleu « Installer », vert « Nouvelle », gris « Retirée »). */
export function Pill({ label, tone = "neutral", testID }: { readonly label: string; readonly tone?: PillTone; readonly testID?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: PILL_TONES[tone].surface }]} testID={testID}>
      <Text style={[styles.pillLabel, { color: PILL_TONES[tone].text }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export type RowTitleVariant = "medium" | "medium14" | "semibold" | "regular";

/**
 * Ligne de carte : icône éventuelle à gauche (colonne de 30), titre et sous-titre, pastille à droite (centrée
 * sur la ligne, ou sur la ligne du titre avec `pillOnTitle`), lien bleu éventuel, chevron SVG si la ligne
 * s'ouvre. Titre Inter Medium 15 (`medium` : Profil, disponibles, mouvements), Semi Bold 14 (`semibold` :
 * résumés, fiches révisées) ou Regular 14 (`regular` : liste des nouvelles fiches).
 */
export function Row({
  title,
  subtitle,
  detail,
  icon,
  pill,
  pillOnTitle = false,
  link,
  chevron,
  titleVariant = "medium",
  subtitleTone = "muted",
  spacious = false,
  onPress,
  accessibilityLabel,
  testID,
}: {
  readonly title: string;
  readonly subtitle?: string | null;
  /** Troisième ligne, plus petite (« Aussi dans … »). */
  readonly detail?: ReactNode;
  readonly icon?: KodjoIconName;
  readonly pill?: ReactNode;
  readonly pillOnTitle?: boolean;
  /** Lien textuel bleu à droite du sous-titre (« Voir le détail ») : remplace le chevron. */
  readonly link?: string;
  /** Chevron « Aller » : par défaut, affiché si la ligne s'ouvre et n'a pas de lien. */
  readonly chevron?: boolean;
  readonly titleVariant?: RowTitleVariant;
  /** Sous-titre #7A7A80 (`muted`, par défaut) ou #595E66 (`secondary`, fiches révisées 12118:25284). */
  readonly subtitleTone?: "muted" | "secondary";
  /** Ligne aérée de 64 (Bibliothèques disponibles 12118:25124) au lieu de 52 (Profil 12119:25611). */
  readonly spacious?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly testID: string;
}) {
  const showChevron = chevron ?? (onPress !== undefined && link === undefined);
  const content = (
    <>
      {icon ? (
        <View style={styles.rowIcon}>
          <KodjoIcon name={icon} />
        </View>
      ) : null}
      <View style={[styles.rowText, spacious ? styles.rowTextSpacious : null]}>
        <View style={styles.rowLine}>
          <Text style={[styles.flex, ROW_TITLES[titleVariant]]}>{title}</Text>
          {pillOnTitle ? (pill ?? null) : null}
        </View>
        {subtitle || link ? (
          <View style={styles.rowLine}>
            <Text style={[styles.flex, subtitleTone === "secondary" ? styles.rowSubtitleDark : styles.rowSubtitle]}>{subtitle ?? ""}</Text>
            {link ? <Text style={styles.link}>{link}</Text> : null}
          </View>
        ) : null}
        {detail ? <Text style={LIBRARY_TEXT.captionMuted}>{detail}</Text> : null}
      </View>
      {!pillOnTitle && pill ? <View style={styles.rowPill}>{pill}</View> : null}
      {showChevron ? (
        <View style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <KodjoIcon name="library-chevron-go" />
        </View>
      ) : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? title + ", " + subtitle : title)}
      style={[styles.row, spacious ? styles.rowSpacious : null]}
      testID={testID}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.row, spacious ? styles.rowSpacious : null]} testID={testID}>{content}</View>
  );
}

/** Ligne à puce colorée (puce 6) : conseils « PC introuvable » (bleue), problèmes d'un fichier refusé (rouge). */
export function BulletRow({ title, detail, tone = "action", testID }: { readonly title: string; readonly detail?: string | null; readonly tone?: "action" | "danger"; readonly testID?: string }) {
  return (
    <View style={styles.bulletRow} testID={testID}>
      <View style={[styles.bullet, { backgroundColor: tone === "danger" ? LIBRARY_COLORS.dangerText : colors.primary }]} />
      <View style={styles.rowText}>
        <Text style={detail ? styles.bulletTitleStrong : styles.bulletTitle}>{title}</Text>
        {detail ? <Text style={styles.rowSubtitle}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const NOTICE_ICONS = { danger: "library-error", warning: "library-warning" } as const;

/** Encart teinté (erreur rouge 12116:25232, avertissement jaune 12118:25200) : icône, titre coloré, texte 12. */
export function Notice({
  tone,
  title,
  children,
  large = false,
  testID,
}: {
  readonly tone: "danger" | "warning";
  readonly title: string;
  readonly children?: ReactNode;
  /** Titre en 15 (Fichier invalide 12119:25183) au lieu de 14. */
  readonly large?: boolean;
  readonly testID?: string;
}) {
  return (
    <View style={[styles.notice, { backgroundColor: NOTICE_TONES[tone].surface }]} testID={testID} accessibilityRole="summary">
      <View style={styles.noticeIcon}>
        <KodjoIcon name={NOTICE_ICONS[tone]} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.noticeTitle, large ? styles.noticeTitleLarge : null, { color: NOTICE_TONES[tone].text }]}>{title}</Text>
        {children ? <Text style={styles.noticeBody}>{children}</Text> : null}
      </View>
    </View>
  );
}

const HERO_TONES = {
  success: { surface: LIBRARY_COLORS.positiveSurface, icon: "library-success" },
  notFound: { surface: LIBRARY_COLORS.dangerSurface, icon: "library-wifi-off" },
  error: { surface: LIBRARY_COLORS.dangerSurface, icon: "library-error" },
  empty: { surface: LIBRARY_COLORS.neutralSurface, icon: "library-book-empty" },
} as const;

/**
 * État centré (Connecté 12116:25175, Installation terminée 12118:25220, Mise à jour appliquée 12118:25370,
 * PC introuvable 12116:25238, Liste vide 12119:25277) : pastille ronde de 72 et son icône, titre Semi Bold 17,
 * message 13 #595E66, centrés.
 */
export function StatusHero({
  tone,
  title,
  message,
  testID,
}: {
  readonly tone: keyof typeof HERO_TONES;
  readonly title: string;
  readonly message?: string | null;
  readonly testID?: string;
}) {
  return (
    <View style={styles.hero} testID={testID} accessible accessibilityRole="summary">
      <View style={[styles.heroCircle, { backgroundColor: HERO_TONES[tone].surface }]}>
        <KodjoIcon name={HERO_TONES[tone].icon} />
      </View>
      <Text style={styles.heroTitle}>{title}</Text>
      {message ? <Text style={styles.heroMessage}>{message}</Text> : null}
    </View>
  );
}

/** Chargement : indicateur natif (bleu KODJO), libellé et précision centrés. */
export function Busy({ label, detail, compact = false, testID }: { readonly label: string; readonly detail?: string; readonly compact?: boolean; readonly testID?: string }) {
  return (
    <View style={styles.busy} testID={testID}>
      <ActivityIndicator size="large" color={colors.primary} />
      <View style={styles.busyText}>
        <Text style={compact ? styles.busyLabelCompact : LIBRARY_TEXT.medium15}>{label}</Text>
        {detail ? <Text style={LIBRARY_TEXT.note}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/** Squelette de liste (Chargement en cours 12119:25204) : lignes grises, sans contenu ni lecture d'écran. */
export function SkeletonList({ rows = 4 }: { readonly rows?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Card>
        {Array.from({ length: rows }, (_, index) => (
          <View key={index}>
            {index > 0 ? <Divider /> : null}
            <View style={styles.skeletonRow}>
              <View style={[styles.skeleton, styles.skeletonIcon]} />
              <View style={styles.skeletonText}>
                <View style={[styles.skeleton, styles.skeletonTitle]} />
                <View style={[styles.skeleton, styles.skeletonSubtitle]} />
              </View>
              <View style={[styles.skeleton, styles.skeletonPill]} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Lien textuel bleu (Inter Semi Bold 12) : « Actualiser », « Voir les champs inchangés ». */
export function TextLink({ label, onPress, testID }: { readonly label: string; readonly onPress: () => void; readonly testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={spacing[16]} testID={testID}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const PILL_TONES: Readonly<Record<PillTone, { readonly surface: string; readonly text: string }>> = {
  neutral: { surface: LIBRARY_COLORS.neutralSurface, text: colors.textSecondary },
  action: { surface: LIBRARY_COLORS.actionSurface, text: colors.primary },
  positive: { surface: LIBRARY_COLORS.positiveSurface, text: LIBRARY_COLORS.positiveText },
  warning: { surface: LIBRARY_COLORS.warningSurface, text: LIBRARY_COLORS.warningText },
};

const NOTICE_TONES = {
  danger: { surface: LIBRARY_COLORS.dangerSurface, text: LIBRARY_COLORS.dangerText },
  warning: { surface: LIBRARY_COLORS.warningSurface, text: LIBRARY_COLORS.warningText },
} as const;

/** Styles de texte des maquettes, dérivés des jetons `type` (interligne « Auto » Figma, ×1,2102). */
export const LIBRARY_TEXT = StyleSheet.create({
  intro: { ...type.body, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  note: { ...type.supporting, color: LIBRARY_COLORS.muted },
  body: { ...type.body, color: colors.textPrimary },
  medium15: { ...type.label, fontSize: 15, lineHeight: 18, color: colors.textPrimary },
  semibold14: { ...type.button, color: colors.textPrimary },
  regular14: { ...type.body, color: colors.textPrimary },
  medium14: { ...type.label, color: colors.textPrimary },
  caption: { ...type.caption, color: colors.textSecondary },
  captionMuted: { ...type.caption, color: LIBRARY_COLORS.muted },
  title17: { ...type.cardTitle, fontSize: 17, lineHeight: 21, color: colors.textPrimary },
});

const PARAGRAPH_TONES: Readonly<Record<ParagraphTone, TextStyle>> = {
  intro: LIBRARY_TEXT.intro,
  note: LIBRARY_TEXT.note,
  body: LIBRARY_TEXT.body,
};

const ROW_TITLES: Readonly<Record<RowTitleVariant, TextStyle>> = {
  medium: LIBRARY_TEXT.medium15,
  medium14: LIBRARY_TEXT.medium14,
  semibold: LIBRARY_TEXT.semibold14,
  regular: LIBRARY_TEXT.regular14,
};

/** Carte des maquettes (réutilisée par le Profil). */
export const LIBRARY_CARD: ViewStyle = {
  backgroundColor: colors.surfaceSubtle,
  borderWidth: 1,
  borderColor: colors.background,
  borderRadius: 12,
  paddingHorizontal: spacing[16],
  shadowColor: LIBRARY_COLORS.cardShadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: LIBRARY_COLORS.screen },
  bodyContent: { paddingHorizontal: layout.screenGutter, paddingTop: spacing[16], gap: spacing[16] },
  flex: { flex: 1 },
  centerText: { textAlign: "center" },
  actions: { gap: spacing[16] },
  secondaryColumn: { gap: spacing[16] },
  secondaryRow: { flexDirection: "row", gap: spacing[12] },
  secondaryInRow: { flex: 1 },
  secondary: {
    minHeight: minTouchTarget,
    borderRadius: 24,
    backgroundColor: LIBRARY_COLORS.secondaryButton,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  secondaryLabel: { ...type.button, color: colors.textPrimary },
  disabled: { opacity: 0.4 },
  section: { gap: spacing[8] },
  card: LIBRARY_CARD,
  divider: { height: 1, backgroundColor: colors.divider },
  pill: { height: 21, borderRadius: 12, paddingHorizontal: spacing[10], justifyContent: "center", flexShrink: 0 },
  pillLabel: { ...type.cardDuration },
  row: { flexDirection: "row", alignItems: "center", minHeight: minTouchTarget, paddingVertical: 9 },
  rowSpacious: { paddingVertical: 13 },
  rowIcon: { width: 30, alignItems: "flex-start", justifyContent: "center" },
  rowText: { flex: 1, gap: spacing[2] },
  rowTextSpacious: { gap: spacing[4] },
  rowLine: { flexDirection: "row", alignItems: "center", gap: spacing[8] },
  rowPill: { marginLeft: spacing[8] },
  rowSubtitle: { ...type.supporting, color: LIBRARY_COLORS.muted },
  rowSubtitleDark: { ...type.supporting, color: colors.textSecondary },
  link: { ...type.cardDuration, color: colors.primary },
  chevron: { width: 16, alignItems: "flex-end", marginLeft: spacing[8], paddingRight: spacing[6] },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing[12], paddingVertical: spacing[10] },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletTitle: { ...type.body, fontSize: 13, lineHeight: 16, color: colors.textPrimary },
  bulletTitleStrong: { ...type.button, fontSize: 13, lineHeight: 16, color: colors.textPrimary },
  notice: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, padding: spacing[16], gap: spacing[12] },
  noticeIcon: { width: 18, paddingTop: 1 },
  noticeTitle: { ...type.button },
  noticeTitleLarge: { fontSize: 15, lineHeight: 18 },
  noticeBody: { ...type.supporting, color: colors.textPrimary },
  hero: { alignItems: "center", paddingTop: spacing[32], paddingHorizontal: spacing[32] },
  heroCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  heroTitle: { ...LIBRARY_TEXT.title17, textAlign: "center", marginTop: spacing[24] },
  heroMessage: { ...LIBRARY_TEXT.intro, textAlign: "center", marginTop: spacing[8] },
  busy: { alignItems: "center", gap: spacing[16], paddingVertical: spacing[16] },
  busyText: { alignItems: "center", gap: spacing[8] },
  busyLabelCompact: LIBRARY_TEXT.medium14,
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: spacing[12], minHeight: 63 },
  skeleton: { backgroundColor: LIBRARY_COLORS.skeleton },
  skeletonIcon: { width: 22, height: 18, borderRadius: 4 },
  skeletonText: { flex: 1, gap: spacing[8] },
  skeletonTitle: { width: 120, height: 12, borderRadius: 6 },
  skeletonSubtitle: { width: 170, maxWidth: "100%", height: 10, borderRadius: 5 },
  skeletonPill: { width: 72, height: 21, borderRadius: 11 },
});

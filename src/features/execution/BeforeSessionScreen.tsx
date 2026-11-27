import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { CloseCircleAction } from "@/shared/ui/HeaderCircleAction";
import { PrimaryActionButton } from "@/shared/ui/PrimaryActionZone";

import type { OutlineLine } from "./beforeSession";
import { EXEC_FONT } from "./executionFonts";
import { PainScale } from "./PainScale";

/**
 * D-577 / D-427 (décisions de Hermann du 27/11/2026) — écran « Avant la séance », posé au-dessus du premier écran d'exécution de
 * la séance (rendu en fond par `ExecutionScreen`, inchangé) : voile blanc 50 % puis voile vert `#1F9E7A` 35 % sur toute la hauteur,
 * bouton Retour au-dessus. Rendu : `docs/DSF-AVANT-SEANCE-2026-11-27.md` (version révisée du 27/11/2026) ; Figma `8921:35275`,
 * `13419:1329`, `12716:25405`. Remplace l'ancien écran de transition entre séances (D-534) et le bouton Démarrer de l'ancien écran.
 *
 * Correction du 27/11/2026 (prompt « Fin de séance », complément ; DSF révisé §§ 3 à 6) : **un seul cadre vert** (titre, pointillés,
 * liste qui seule défile, puis, avec l'option douleur, trait fin blanc 22 % et zone douleur) ; **Bouton primaire** du Design system
 * (354 × 48) hors du cadre, en bas d'écran ; case « Ne plus afficher cet écran » dans un **second cadre accroché** sous le cadre
 * principal (vert `#0D6950`), hors option douleur. [Deux cadres verts (liste ; douleur et bouton à relief 354 × 96), case entre les
 * deux cadres — remplacé.]
 *
 * Versions : `FULL` (liste, douleur si option, case si pas d'option) ; `PAIN_ONLY` (cadre avec la seule zone douleur, centré) ;
 * `NEXT` (séances suivantes : titre et liste, centré, sans douleur).
 *
 * [Hypothèse validée par Hermann le 27/11/2026 (« 2. Ok ») : un toucher ailleurs que sur le bouton ne fait rien.]
 * Police : Roboto Condensed (`EXEC_FONT`, police des écrans d'exécution ; décision technique du 27/11/2026 après la remarque de
 * Hermann). [Police du système, Roboto non embarquée (SCOPE_EXPANSION_REQUIRED) — remplacé.]
 */
export type BeforeSessionMode = "FULL" | "PAIN_ONLY" | "NEXT";

const t = strings.execution;

export const BEFORE_SESSION = {
  whiteVeil: "rgba(255, 255, 255, 0.5)",
  greenVeil: "rgba(31, 158, 122, 0.35)",
  card: "#148061",
  attached: "#0D6950",
  separator: "rgba(255, 255, 255, 0.22)",
} as const;

const DOT_COUNT = 30;

export function BeforeSessionScreen({
  mode,
  title,
  lines,
  painOption,
  startLabel,
  initialDismiss = false,
  onBack,
  onStart,
}: {
  readonly mode: BeforeSessionMode;
  /** Nom de la séance (réponse de Hermann du 27/11/2026, « 3. de la séance »). */
  readonly title: string;
  readonly lines: readonly OutlineLine[];
  /** Option douleur du Programme active (D-427) : échelle obligatoire, sans présélection. */
  readonly painOption: boolean;
  readonly startLabel: string;
  /** Réponse de Hermann du 27/11/2026 (point 4) : écran revenu après exclusion (composition changée) — case cochée par défaut. */
  readonly initialDismiss?: boolean;
  readonly onBack: () => void;
  /** Départ : douleur choisie (`null` sans option douleur) et case « Ne plus afficher cet écran ». */
  readonly onStart: (pain: number | null, dismiss: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const [pain, setPain] = useState<number | null>(null);
  const [dismiss, setDismiss] = useState(initialDismiss);
  const withPain = painOption && mode !== "NEXT";
  const withList = mode !== "PAIN_ONLY";
  const withDismiss = mode === "FULL" && !withPain;
  const ready = !withPain || pain !== null;
  // Figma : rond Retour de 38 à y = 51 (zone de 48 à y = 46) sur un iPhone de 62 pt de marge haute ; cadre 12 sous le rond.
  const backTop = Math.max(insets.top - 11, 8);
  const topLimit = backTop + 38 + 12;
  // Bouton primaire à sa position standard (DSF § 5 : y = 802 sur 874, soit 24 pt sous le bouton) ; 20 pt entre le cadre et le bouton.
  const buttonBottom = Math.max(insets.bottom - 10, 16);
  const bottomLimit = buttonBottom + 48 + 20;

  const card: ReactNode = (
    <View style={[styles.card, withDismiss ? styles.cardAttached : null]} testID="before-session-list-card">
      {withList ? (
        <>
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header" testID="before-session-title">
            {title}
          </Text>
          <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden testID="before-session-dots">
            {Array.from({ length: DOT_COUNT }, (_, index) => (
              <View key={index} style={styles.dot} />
            ))}
          </View>
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} bounces={false} testID="before-session-list">
            {lines.map((line) => (
              <View key={line.key} style={[styles.line, { marginLeft: line.depth * 18, marginTop: line.spaceBefore }]} testID={`before-session-line-${line.key}`}>
                {line.kind === "EXERCISE" ? <Text style={[styles.lineText, styles.bullet]}>•</Text> : null}
                <Text style={[styles.lineText, line.kind === "EXERCISE" ? styles.exercise : styles.group]}>{line.text}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}
      {withPain ? (
        <View style={styles.painZone} testID="before-session-start-card">
          {withList ? <View style={styles.separator} testID="before-session-pain-separator" /> : null}
          <Text style={styles.painLabel} testID="before-session-pain-label">
            {t.beforeSession.painLabel}
          </Text>
          <View style={styles.scaleArea}>
            <PainScale value={pain} onChange={setPain} label={t.beforeSession.painLabel} testID="before-session-pain-scale" />
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal testID="before-session">
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BEFORE_SESSION.whiteVeil }]} testID="before-session-white-veil" />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BEFORE_SESSION.greenVeil }]} testID="before-session-green-veil" />
      {/* Toucher ailleurs que sur le bouton : sans effet — la zone retient les touchers pour l'écran du fond. */}
      <View
        style={[StyleSheet.absoluteFill, styles.content, { paddingTop: topLimit, paddingBottom: bottomLimit }]}
        onStartShouldSetResponder={() => true}
        testID={`before-session-${mode}`}
      >
        <View style={mode === "FULL" ? styles.bottomZone : styles.centerZone}>
          <View style={styles.cardColumn}>
            {card}
            {withDismiss ? (
              <View style={styles.attached} testID="before-session-attached">
                <Pressable
                  onPress={() => setDismiss((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: dismiss }}
                  accessibilityLabel={t.beforeSession.dismiss}
                  hitSlop={8}
                  style={styles.dismissRow}
                  testID="before-session-dismiss"
                >
                  <View style={[styles.dismissBox, dismiss ? styles.dismissBoxChecked : null]} testID={`before-session-dismiss-${dismiss ? "checked" : "unchecked"}`}>
                    {dismiss ? <Text style={styles.dismissMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.dismissLabel}>{t.beforeSession.dismiss}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <PrimaryActionButton
        label={startLabel}
        disabled={!ready}
        onPress={() => {
          if (ready) onStart(withPain ? pain : null, withDismiss && dismiss);
        }}
        style={[styles.button, { bottom: buttonBottom }]}
        testID="execution-start"
        labelTestID="before-session-start-label"
        {...(ready ? {} : { accessibilityLabel: `${startLabel}. ${t.beforeSession.startDisabledHint}` })}
      />
      <CloseCircleAction icon="back" onPress={onBack} accessibilityLabel={t.back} style={[styles.back, { top: backTop }]} testID="execution-back" />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12 },
  back: { position: "absolute", left: 17 },
  bottomZone: { flex: 1, justifyContent: "flex-end" },
  centerZone: { flex: 1, justifyContent: "center" },
  cardColumn: { flexShrink: 1 },
  card: { backgroundColor: BEFORE_SESSION.card, borderRadius: 20, flexShrink: 1, paddingBottom: 20, zIndex: 1 },
  cardAttached: {},
  title: { fontSize: 26, lineHeight: 32, ...EXEC_FONT.bold, color: "#FFFFFF", textAlign: "center", paddingTop: 23, paddingHorizontal: 24 },
  dots: { flexDirection: "row", justifyContent: "space-between", marginTop: 23, marginHorizontal: 24 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255, 255, 255, 0.6)" },
  listScroll: { flexGrow: 0, flexShrink: 1 },
  listContent: { paddingTop: 10, paddingHorizontal: 24 },
  line: { flexDirection: "row" },
  lineText: { ...EXEC_FONT.regular, fontSize: 22, lineHeight: 28, color: "#FFFFFF" },
  bullet: { width: 18 },
  group: { ...EXEC_FONT.bold, flexShrink: 1 },
  exercise: { ...EXEC_FONT.regular, flexShrink: 1 },
  painZone: { paddingHorizontal: 12 },
  separator: { height: 1, marginHorizontal: 12, marginTop: 16, backgroundColor: BEFORE_SESSION.separator },
  painLabel: { fontSize: 22, lineHeight: 26, ...EXEC_FONT.bold, color: "#FFFFFF", marginTop: 17 },
  scaleArea: { marginTop: 29 },
  // Second cadre accroché (DSF § 6) : même largeur et mêmes coins, visible sur 52 pt sous le cadre principal (20 pt recouverts).
  attached: { backgroundColor: BEFORE_SESSION.attached, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginTop: -20, paddingTop: 20, height: 72, justifyContent: "center", paddingHorizontal: 24 },
  dismissRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  dismissBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  dismissBoxChecked: { backgroundColor: "#FFFFFF" },
  dismissMark: { fontSize: 12, lineHeight: 14, ...EXEC_FONT.bold, color: BEFORE_SESSION.attached },
  dismissLabel: { ...EXEC_FONT.regular, marginLeft: 10, fontSize: 16, color: "#FFFFFF" },
  button: { position: "absolute", left: 24, right: 24 },
});

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { CloseCircleAction } from "@/shared/ui/HeaderCircleAction";

import { painColor, painDigitColor, type OutlineLine } from "./beforeSession";

/**
 * D-577 / D-427 (décisions de Hermann du 27/11/2026) — écran « Avant la séance », posé au-dessus du premier écran d'exécution de
 * la séance (rendu en fond par `ExecutionScreen`, inchangé) : voile blanc 50 % puis voile vert `#1F9E7A` 35 % sur toute la hauteur,
 * bouton Retour au-dessus. Rendu : `docs/DSF-AVANT-SEANCE-2026-11-27.md` ; Figma `8921:35275` (première séance), `13419:1329`
 * (état sans choix), `12716:25405` (séances suivantes). Remplace l'ancien écran de transition entre séances (D-534, voile vert et
 * encadré vert plein) et le bouton Démarrer de l'ancien écran de départ.
 *
 * Versions :
 * - `FULL` : cadre de la liste (titre, pointillés, liste qui seule défile), puis cadre de départ (douleur obligatoire si l'option du
 *   Programme est active, D-427 ; sinon case « Ne plus afficher cet écran » entre les deux cadres) ;
 * - `PAIN_ONLY` : uniquement le cadre de la douleur et du départ, centré verticalement (affichage désactivé, option douleur active) ;
 * - `NEXT` : un seul cadre centré (titre, liste, bouton « …la 2ème séance »), sans douleur.
 *
 * [Hypothèse à signaler, non tranchée : un toucher ailleurs que sur le bouton ne fait rien.]
 * [Police : Roboto demandée par le DSF n'est pas embarquée (seul Roboto Condensed l'est) ; police du système en attendant —
 * SCOPE_EXPANSION_REQUIRED, voir le rapport.]
 */
export type BeforeSessionMode = "FULL" | "PAIN_ONLY" | "NEXT";

const t = strings.execution;

export const BEFORE_SESSION = {
  whiteVeil: "rgba(255, 255, 255, 0.5)",
  greenVeil: "rgba(31, 158, 122, 0.35)",
  card: "#148061",
  dismiss: "#0D5F47",
  buttonText: "#0508E5",
  buttonEdge: "#9EA8DB",
  disabledFill: "#CCD4D1",
  disabledText: "#99A3A1",
} as const;

const DOT_COUNT = 30;
const PAIN_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function BeforeSessionScreen({
  mode,
  title,
  lines,
  painOption,
  startLabel,
  onBack,
  onStart,
}: {
  readonly mode: BeforeSessionMode;
  /** Nom de la séance, ou du parcours. */
  readonly title: string;
  readonly lines: readonly OutlineLine[];
  /** Option douleur du Programme active (D-427) : échelle obligatoire, sans présélection. */
  readonly painOption: boolean;
  readonly startLabel: string;
  readonly onBack: () => void;
  /** Départ : douleur choisie (`null` sans option douleur) et case « Ne plus afficher cet écran ». */
  readonly onStart: (pain: number | null, dismiss: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const [pain, setPain] = useState<number | null>(null);
  const [dismiss, setDismiss] = useState(false);
  const withPain = painOption && mode !== "NEXT";
  const ready = !withPain || pain !== null;
  // Figma : rond Retour de 38 à y = 51 (zone de 48 à y = 46) sur un iPhone de 62 pt de marge haute ; cadre de la liste 12 sous le rond.
  const backTop = Math.max(insets.top - 11, 8);
  const topLimit = backTop + 38 + 12;

  const startButton = (
    <StartButton
      label={startLabel}
      enabled={ready}
      onPress={() => {
        if (ready) onStart(withPain ? pain : null, mode === "FULL" && !withPain && dismiss);
      }}
    />
  );

  const listCard = (withButton: boolean) => (
    <View style={styles.listCard} testID="before-session-list-card">
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
      {withButton ? <View style={styles.nextButton}>{startButton}</View> : null}
    </View>
  );

  const painCard = (
    <View style={styles.startCard} testID="before-session-start-card">
      {withPain ? (
        <>
          <Text style={styles.painLabel} testID="before-session-pain-label">
            {t.beforeSession.painLabel}
          </Text>
          <View style={styles.scaleArea}>
            <View style={styles.scale} accessibilityRole="radiogroup" accessibilityLabel={t.beforeSession.painLabel} testID="before-session-pain-scale">
              {PAIN_VALUES.map((value) => {
                const selected = pain === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setPain(value)}
                    accessibilityRole="radio"
                    accessibilityLabel={t.beforeSession.painValue(value)}
                    accessibilityState={{ selected, checked: selected }}
                    style={[styles.cell, { backgroundColor: painColor(value) }, selected ? styles.cellSelected : null]}
                    testID={`before-session-pain-${value}`}
                  >
                    <Text style={[styles.cellDigit, { color: painDigitColor(value) }, selected ? styles.cellDigitSelected : null]} allowFontScaling={false}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
      {startButton}
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal testID="before-session">
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BEFORE_SESSION.whiteVeil }]} testID="before-session-white-veil" />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BEFORE_SESSION.greenVeil }]} testID="before-session-green-veil" />
      {/* Toucher ailleurs que sur le bouton : sans effet (hypothèse à signaler) — la zone retient les touchers pour l'écran du fond. */}
      <View style={[StyleSheet.absoluteFill, styles.content, { paddingTop: topLimit }]} onStartShouldSetResponder={() => true} testID={`before-session-${mode}`}>
        {mode === "FULL" ? (
          <>
            <View style={styles.listZone}>{listCard(false)}</View>
            <View style={styles.dismissZone}>
              {withPain ? null : (
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
              )}
            </View>
            {painCard}
          </>
        ) : mode === "PAIN_ONLY" ? (
          <View style={styles.centerZone}>{painCard}</View>
        ) : (
          <View style={styles.centerZone}>{listCard(true)}</View>
        )}
      </View>
      <CloseCircleAction icon="back" onPress={onBack} accessibilityLabel={t.back} style={[styles.back, { top: backTop }]} testID="execution-back" />
    </View>
  );
}

/** Bouton de départ (DSF § 5) : relief porté par le bouton (dégradé léger, bord inférieur épais, filet blanc), sans ombre portée. */
function StartButton({ label, enabled, onPress }: { readonly label: string; readonly enabled: boolean; readonly onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      {...(enabled ? {} : { accessibilityHint: t.beforeSession.startDisabledHint })}
      style={[styles.button, enabled ? styles.buttonRaised : styles.buttonDisabled]}
      testID="execution-start"
    >
      <Text style={[styles.buttonText, enabled ? null : styles.buttonTextDisabled]} numberOfLines={3} testID="before-session-start-label">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingBottom: 16 },
  back: { position: "absolute", left: 17 },
  listZone: { flex: 1, justifyContent: "flex-end" },
  centerZone: { flex: 1, justifyContent: "center" },
  listCard: { backgroundColor: BEFORE_SESSION.card, borderRadius: 20, flexShrink: 1 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "700", color: "#FFFFFF", textAlign: "center", paddingTop: 23, paddingHorizontal: 24 },
  dots: { flexDirection: "row", justifyContent: "space-between", marginTop: 23, marginHorizontal: 24 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255, 255, 255, 0.6)" },
  listScroll: { flexGrow: 0, flexShrink: 1 },
  listContent: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: 24 },
  line: { flexDirection: "row" },
  lineText: { fontSize: 22, lineHeight: 28, color: "#FFFFFF" },
  bullet: { width: 18 },
  group: { fontWeight: "700", flexShrink: 1 },
  exercise: { fontWeight: "400", flexShrink: 1 },
  nextButton: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 },
  dismissZone: { height: 43, justifyContent: "center", paddingHorizontal: 12 },
  dismissRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  dismissBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: BEFORE_SESSION.dismiss, alignItems: "center", justifyContent: "center" },
  dismissBoxChecked: { backgroundColor: BEFORE_SESSION.dismiss },
  dismissMark: { fontSize: 12, lineHeight: 14, fontWeight: "700", color: "#FFFFFF" },
  dismissLabel: { marginLeft: 10, fontSize: 16, color: BEFORE_SESSION.dismiss },
  startCard: { backgroundColor: BEFORE_SESSION.card, borderRadius: 20, paddingHorizontal: 12, paddingTop: 16, paddingBottom: 22 },
  painLabel: { fontSize: 22, lineHeight: 26, fontWeight: "700", color: "#FFFFFF" },
  scaleArea: { height: 102, justifyContent: "center" },
  scale: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 44 },
  cell: { width: 30, height: 44, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  // Case choisie : 40 × 58 (+5 de chaque côté, +7 en haut et en bas), ombre portée noire 45 % (y = 4, flou 8), sans liseré.
  cellSelected: { width: 40, height: 58, marginHorizontal: -5, borderRadius: 8, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.45)", zIndex: 1 },
  cellDigit: { fontSize: 14, fontWeight: "700" },
  cellDigitSelected: { fontSize: 22 },
  button: { height: 96, borderRadius: 24, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  buttonRaised: {
    experimental_backgroundImage: "linear-gradient(to bottom, #FFFFFF 0%, #ECEEFA 100%)",
    boxShadow: `inset 0px -6px 0px ${BEFORE_SESSION.buttonEdge}, inset 0px 2px 0px #FFFFFF`,
  },
  buttonDisabled: { backgroundColor: BEFORE_SESSION.disabledFill },
  buttonText: { fontSize: 26, lineHeight: 32, fontWeight: "700", color: BEFORE_SESSION.buttonText, textAlign: "center" },
  buttonTextDisabled: { color: BEFORE_SESSION.disabledText },
});

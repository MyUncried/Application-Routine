import { useState } from "react";
import { Image } from "expo-image";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgendaStateIcon } from "@/features/planning/AgendaStatusIcon";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton } from "@/shared/ui/PrimaryActionZone";

import { END_STATE_STYLE, formatRealDuration, SESSION_FEELINGS, type CapturedValue, type EndState, type SessionFeeling } from "./endSession";
import { FeelingFace } from "./FeelingFace";
import { EXEC_FONT } from "./executionFonts";
import { PainScale } from "./PainScale";

/**
 * D-578 à D-581 / D-427 (décisions de Hermann du 27/11/2026) — écran de fin de séance (CE-UI-08), un seul écran à trois états :
 * terminée (vert), partielle (orange), arrêtée (rouge, statut `Interrompue`). Posé au-dessus de l'écran d'exécution (rendu en fond
 * par `ExecutionScreen`, inchangé) : voile blanc 50 % puis voile de l'état à 35 % ; pas de bouton Retour. Figma `1992:8718`,
 * `13441:48061`, `13441:48253` ; prompt `docs/PROMPT-CLAUDE-CODE-FIN-SEANCE-2026-11-27.md`.
 *
 * Un seul cadre (378, rayon 20, textes blancs) en trois zones séparées par un trait fin blanc à 22 % : statut (symbole de l'Agenda
 * de 44 pt à cheval sur le bord haut, titre, date et heure, durée réelle « 16’30’’ » et exercices terminés), « Valeurs saisies »
 * (répétitions dans un champ blanc modifiable, durées dans un cadre en pointillés non modifiable), feedback (ressenti à cinq visages,
 * douleur 0–10 si l'option du Programme est active, commentaire facultatif avec bouton d'appareil photo natif). « Enregistrer » est le
 * Bouton primaire du Design system, hors du cadre, en bas d'écran, désactivé sans ressenti (et sans douleur quand elle est demandée,
 * D-427). Nom de la séance et liste détaillée des exercices retirés (D-578).
 *
 * Décisions de Hermann du 27/11/2026 : valeurs saisies conformes à Figma, une ligne par exercice, valeurs additionnées (« 5. Oui ») ;
 * photo (point 4) : une seule photo par séance, aperçu après la prise, « Reprendre » et « Supprimer » tant que la séance n'est pas
 * enregistrée ; copie privée à l'enregistrement (`SessionPhotoStore`) ; ligne « Sera partagée avec … » sous la photo seulement si
 * une relation la partage (`sessionPhotoRecipients`, vide tant que le module de relation n'existe pas) ; aucun bouton de partage.
 * Polices : Roboto Condensed (`EXEC_FONT`).
 * [À CLARIFIER : écrans « Ressenti sélectionné » non redessinés (sélection : fond blanc plein et contour épais, interprétation) ;
 * série sans valeur capturée : case vide non modifiable (lecture prudente).]
 * Valeurs par série (Figma « Valeurs par série » `13461:27870`, décision de Hermann du 27/11/2026) : une colonne par série (S1, S2,
 * S3 visibles, défilement horizontal au-delà), champs 68 × 34, texte 14 ; la valeur corrigée d'une série remplace sa valeur d'origine,
 * enregistrée par Enregistrer ; quitter sans enregistrer ne change rien ; aucun total, aucun report d'écart.
 */
const t = strings.execution.endSession;
const WHITE_VEIL = "rgba(255, 255, 255, 0.5)";
const SEPARATOR = "rgba(255, 255, 255, 0.22)";
const COMMENT_MAX = 200;

export type EndSessionInput = {
  readonly feeling: SessionFeeling;
  readonly comment: string | null;
  readonly painAfter: number | null;
  /** Photo prise (adresse temporaire de l'appareil photo) ; `null` : aucune. */
  readonly photoUri: string | null;
  /**
   * Répétitions corrigées (décisions de Hermann du 27/11/2026) : nouvelle valeur **par série** (`<occurrence>#<série>`), seulement pour
   * les séries modifiées. Un champ vidé garde la valeur d'origine.
   */
  readonly repetitions: Readonly<Record<string, number>>;
};

export function EndSessionScreen({
  state,
  startedAt,
  now,
  durationMs,
  done,
  total,
  values,
  painOption,
  cameraAvailable,
  onTakePhoto,
  onDiscardPhoto = () => undefined,
  recipients = [],
  onSave,
}: {
  readonly state: EndState;
  readonly startedAt: Date;
  readonly now: Date;
  readonly durationMs: number;
  readonly done: number;
  readonly total: number;
  readonly values: readonly CapturedValue[];
  /** Option douleur du Programme active (D-427) : échelle obligatoire, sans valeur par défaut ; sinon la rubrique disparaît. */
  readonly painOption: boolean;
  /** Appareil photo natif disponible dans ce build (`SESSION_CAMERA_IN_BUILD`). */
  readonly cameraAvailable: boolean;
  readonly onTakePhoto: () => Promise<string | null>;
  /** Photo remplacée (« Reprendre ») ou retirée (« Supprimer ») avant l'enregistrement : le fichier pris est effacé. */
  readonly onDiscardPhoto?: (uri: string) => void;
  /** Destinataires du partage automatique de la photo (règle de relation) ; vide : ligne « Sera partagée avec … » masquée. */
  readonly recipients?: readonly string[];
  /** Enregistrement ; une erreur garde l'écran, le choix et le commentaire (CE-UI-08 § 17). */
  readonly onSave: (input: EndSessionInput) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const style = END_STATE_STYLE[state];
  const [feeling, setFeeling] = useState<SessionFeeling | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  // Brouillon des répétitions, par série ; rien n'est écrit avant Enregistrer (décision de Hermann du 27/11/2026).
  const [repetitions, setRepetitions] = useState<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(values.flatMap((value) => value.cells.flatMap((cell) => (cell.mode === "REPETITIONS" && cell.value !== null ? [[cell.seriesKey, String(cell.value)] as const] : [])))),
  );
  const columnCount = Math.max(0, ...values.map((value) => value.cells.length));
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const tooLong = comment.length > COMMENT_MAX;
  const ready = feeling !== null && (!painOption || pain !== null) && !tooLong && !saving;
  const buttonBottom = Math.max(insets.bottom - 10, 16);
  const sameDay = startedAt.toDateString() === now.toDateString();
  const day = sameDay ? t.today : startedAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const when = `${day} · ${t.time(startedAt.getHours(), startedAt.getMinutes())}`;

  // Une seule photo par séance : une nouvelle prise remplace la précédente, dont le fichier est effacé.
  const capture = () => {
    if (!cameraAvailable || saving) return;
    void onTakePhoto().then((uri) => {
      if (uri === null) return;
      setPhoto((previous) => {
        if (previous !== null && previous !== uri) onDiscardPhoto(previous);
        return uri;
      });
    });
  };
  const discardPhoto = () => {
    if (photo === null || saving) return;
    onDiscardPhoto(photo);
    setPhoto(null);
  };

  const editedRepetitions = (): Readonly<Record<string, number>> =>
    Object.fromEntries(
      values.flatMap((value) =>
        value.cells.flatMap((cell) => {
          const text = repetitions[cell.seriesKey] ?? "";
          if (cell.mode !== "REPETITIONS" || cell.value === null || text === "") return [];
          const next = Number(text);
          return Number.isInteger(next) && next !== cell.value ? [[cell.seriesKey, next] as const] : [];
        }),
      ),
    );

  const save = () => {
    if (!ready || feeling === null) return;
    setSaving(true);
    setFailed(false);
    onSave({ feeling, comment: comment.trim() === "" ? null : comment, painAfter: painOption ? pain : null, photoUri: photo, repetitions: editedRepetitions() }).then(
      () => setSaving(false),
      () => {
        setSaving(false);
        setFailed(true);
      },
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal testID={`end-session-${state}`}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: WHITE_VEIL }]} testID="end-session-white-veil" />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: style.veil }]} testID="end-session-veil" />
      <KeyboardAvoidingView style={StyleSheet.absoluteFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: buttonBottom + 48 + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          testID="end-session-scroll"
        >
          <View style={[styles.card, { backgroundColor: style.card }]} testID="end-session-card">
            <View style={styles.symbol} testID="end-session-symbol">
              <View style={styles.symbolScale}>
                <AgendaStateIcon kind={style.icon} accessibilityLabel={t.icon[state]} testID={`end-session-icon-${style.icon}`} />
              </View>
            </View>
            {/* Statut */}
            <Text style={styles.title} accessibilityRole="header" testID="end-session-title">
              {t.title[state]}
            </Text>
            <Text style={styles.when} testID="end-session-when">
              {when}
            </Text>
            <View style={styles.columns}>
              <View style={styles.column}>
                <Text style={styles.metric} testID="end-session-duration">
                  {formatRealDuration(durationMs)}
                </Text>
                <Text style={styles.metricLabel}>{t.duration.toLocaleUpperCase("fr-FR")}</Text>
              </View>
              <View style={styles.columnSeparator} />
              <View style={styles.column}>
                <Text style={styles.metric} testID="end-session-exercises">{`${done} / ${total}`}</Text>
                <Text style={styles.metricLabel}>{t.exercisesDone.toLocaleUpperCase("fr-FR")}</Text>
              </View>
            </View>
            <View style={styles.separator} />
            {/* Valeurs saisies */}
            {values.length > 0 ? (
              <>
                {/* Valeurs par série (Figma `13461:27870`) : noms à gauche ; colonnes S1, S2, S3… et leurs libellés dans un seul défilement
                    horizontal natif (trois colonnes visibles). */}
                <View style={styles.valuesGrid} testID="end-session-values">
                  <View style={styles.valuesNames}>
                    <View style={styles.valuesHeader}>
                      <Text style={[styles.heading, styles.valuesHeading]}>{t.values}</Text>
                    </View>
                    {values.map((value) => (
                      <View key={value.exerciseId} style={styles.valueRow} testID={`end-session-value-${value.exerciseId}`}>
                        <Text style={styles.valueName} numberOfLines={2} ellipsizeMode="tail">
                          {value.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <ScrollView horizontal style={styles.valuesScroll} showsHorizontalScrollIndicator={false} bounces={false} testID="end-session-values-scroll">
                    <View>
                      <View style={[styles.valuesHeader, styles.valuesColumns]}>
                        {Array.from({ length: columnCount }, (_, column) => (
                          <Text key={column} style={styles.columnLabel} testID={`end-session-column-${column + 1}`}>
                            {t.seriesColumn(column + 1)}
                          </Text>
                        ))}
                      </View>
                      {values.map((value) => (
                        <View key={value.exerciseId} style={[styles.valueRow, styles.valuesColumns]}>
                          {value.cells.map((cell, column) =>
                            cell.value === null ? (
                              <View key={cell.seriesKey} style={styles.valueCell} testID={`end-session-cell-empty-${cell.seriesKey}`} />
                            ) : cell.mode === "REPETITIONS" ? (
                              <TextInput
                                key={cell.seriesKey}
                                value={repetitions[cell.seriesKey] ?? ""}
                                onChangeText={(text) => setRepetitions((current) => ({ ...current, [cell.seriesKey]: text.replace(/[^0-9]/g, "") }))}
                                keyboardType="number-pad"
                                accessibilityLabel={t.repetitionsOf(value.name, column + 1)}
                                style={[styles.valueCell, styles.valueEditable, styles.valueInput]}
                                testID={`end-session-reps-${cell.seriesKey}`}
                              />
                            ) : (
                              <View
                                key={cell.seriesKey}
                                style={[styles.valueCell, styles.valueFixed]}
                                accessible
                                accessibilityLabel={t.durationOf(value.name, column + 1, formatRealDuration(cell.value))}
                                testID={`end-session-duration-${cell.seriesKey}`}
                              >
                                <Text style={styles.valueFixedText}>{formatRealDuration(cell.value)}</Text>
                              </View>
                            ),
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.separator} />
              </>
            ) : null}
            {/* Feedback */}
            <Text style={styles.heading}>{t.feelingQuestion}</Text>
            <View style={styles.faces} accessibilityRole="radiogroup" accessibilityLabel={t.feelingQuestion} testID="end-session-feelings">
              {SESSION_FEELINGS.map((level) => {
                const selected = feeling === level;
                return (
                  <Pressable
                    key={level}
                    onPress={() => setFeeling(level)}
                    accessibilityRole="radio"
                    accessibilityLabel={t.feelings[level]}
                    accessibilityState={{ selected, checked: selected }}
                    style={[styles.face, selected ? [styles.faceSelected, { borderColor: "#FFFFFF" }] : null]}
                    testID={`end-session-feeling-${level}`}
                  >
                    <FeelingFace feeling={level} color={selected ? style.card : "#1C1C1E"} />
                  </Pressable>
                );
              })}
            </View>
            {painOption ? (
              <>
                <Text style={styles.heading}>{t.painLabel}</Text>
                <PainScale value={pain} onChange={setPain} label={t.painLabel} outlined={state === "STOPPED"} testID="end-session-pain-scale" />
              </>
            ) : null}
            <Text style={styles.heading}>{t.commentsQuestion}</Text>
            <View style={styles.commentField}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={t.commentPlaceholder}
                placeholderTextColor="#7A7F7D"
                multiline
                accessibilityLabel={t.commentsQuestion}
                style={styles.commentInput}
                testID="end-session-comment"
              />
              <Pressable
                onPress={capture}
                disabled={!cameraAvailable}
                accessibilityRole="button"
                accessibilityLabel={t.photo}
                accessibilityState={{ disabled: !cameraAvailable }}
                {...(cameraAvailable ? {} : { accessibilityHint: t.photoUnavailable })}
                style={[styles.camera, { backgroundColor: style.card }, cameraAvailable ? null : styles.cameraUnavailable]}
                testID="end-session-camera"
              >
                <CameraGlyph />
              </Pressable>
            </View>
            {photo !== null ? (
              <View style={styles.photoBlock} testID="end-session-photo">
                <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" accessibilityLabel={t.photoTaken} testID="end-session-photo-preview" />
                <View style={styles.photoActions}>
                  <Pressable onPress={capture} accessibilityRole="button" accessibilityLabel={t.photoRetake} style={styles.photoAction} testID="end-session-photo-retake">
                    <Text style={styles.photoActionText}>{t.photoRetake}</Text>
                  </Pressable>
                  <Pressable onPress={discardPhoto} accessibilityRole="button" accessibilityLabel={t.photoDelete} style={styles.photoAction} testID="end-session-photo-delete">
                    <Text style={styles.photoActionText}>{t.photoDelete}</Text>
                  </Pressable>
                </View>
                {recipients.length > 0 ? (
                  <Text style={styles.note} testID="end-session-photo-recipients">
                    {t.photoSharedWith(recipients.join(", "))}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {tooLong ? (
              <Text style={styles.note} accessibilityLiveRegion="polite" testID="end-session-comment-too-long">
                {t.commentTooLong(comment.length)}
              </Text>
            ) : null}
            {failed ? (
              <Text style={styles.note} accessibilityLiveRegion="assertive" testID="end-session-save-error">
                {t.saveError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PrimaryActionButton
        label={t.save}
        disabled={!ready}
        onPress={save}
        style={[styles.button, { bottom: buttonBottom }]}
        testID="end-session-save"
        {...(ready ? {} : { accessibilityLabel: `${t.save}. ${t.saveDisabledHint}` })}
      />
    </View>
  );
}

function CameraGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Rect x={3} y={7} width={18} height={13} rx={3} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M8.5 7 L10 4.5 H14 L15.5 7" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Circle cx={12} cy={13.5} r={3.4} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 12, flexGrow: 1, justifyContent: "flex-end" },
  card: { borderRadius: 20, paddingHorizontal: 12, paddingTop: 34, paddingBottom: 16 },
  symbol: { position: "absolute", top: -22, alignSelf: "center", width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  symbolScale: { transform: [{ scale: 44 / 28 }] },
  title: { fontSize: 26, lineHeight: 32, ...EXEC_FONT.bold, color: "#FFFFFF", textAlign: "center" },
  when: { ...EXEC_FONT.regular, fontSize: 15, color: "rgba(255, 255, 255, 0.85)", textAlign: "center", marginTop: 2 },
  columns: { flexDirection: "row", marginTop: 18, alignItems: "stretch" },
  column: { flex: 1, alignItems: "center" },
  columnSeparator: { width: 1, backgroundColor: SEPARATOR },
  metric: { fontSize: 26, lineHeight: 32, ...EXEC_FONT.bold, color: "#FFFFFF", fontVariant: ["tabular-nums"] },
  metricLabel: { ...EXEC_FONT.regular, fontSize: 11, letterSpacing: 0.3, color: "rgba(255, 255, 255, 0.85)", marginTop: 2 },
  separator: { height: 1, backgroundColor: SEPARATOR, marginHorizontal: 12, marginVertical: 16 },
  heading: { fontSize: 18, lineHeight: 22, ...EXEC_FONT.bold, color: "#FFFFFF", marginTop: 8, marginBottom: 14 },
  valuesGrid: { flexDirection: "row" },
  valuesNames: { flex: 1, marginRight: 8 },
  valuesHeader: { height: 30, justifyContent: "center" },
  valuesHeading: { marginTop: 0, marginBottom: 0 },
  valuesScroll: { width: 3 * 68 + 2 * 6, flexGrow: 0 },
  valuesColumns: { flexDirection: "row", gap: 6, alignItems: "center" },
  columnLabel: { ...EXEC_FONT.regular, width: 68, fontSize: 13, color: "rgba(255, 255, 255, 0.85)", textAlign: "center" },
  valueCell: { width: 68, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valueRow: { height: 44, justifyContent: "center" },
  valueName: { ...EXEC_FONT.regular, fontSize: 16, lineHeight: 19, color: "#FFFFFF" },
  valueEditable: { backgroundColor: "#FFFFFF" },
  valueInput: { padding: 0, fontSize: 14, ...EXEC_FONT.bold, color: "#1C1C1E", textAlign: "center" },
  valueFixed: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255, 255, 255, 0.85)" },
  valueFixedText: { fontSize: 14, ...EXEC_FONT.bold, color: "#FFFFFF", fontVariant: ["tabular-nums"] },
  faces: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  face: { width: 62, height: 46, borderRadius: 12, backgroundColor: "rgba(255, 255, 255, 0.92)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "transparent" },
  faceSelected: { backgroundColor: "#FFFFFF", transform: [{ scale: 1.08 }], boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.35)" },
  commentField: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.94)", borderRadius: 12, minHeight: 56, paddingLeft: 14, paddingRight: 8 },
  commentInput: { ...EXEC_FONT.regular, flex: 1, fontSize: 16, color: "#1C1C1E", paddingVertical: 10 },
  camera: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  cameraUnavailable: { opacity: 0.45 },
  photoBlock: { marginTop: 12 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
  photoActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  photoAction: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  photoActionText: { ...EXEC_FONT.bold, fontSize: 16, color: "#FFFFFF" },
  note: { ...EXEC_FONT.regular, fontSize: 14, color: "#FFFFFF", marginTop: 8 },
  button: { position: "absolute", left: 24, right: 24 },
});

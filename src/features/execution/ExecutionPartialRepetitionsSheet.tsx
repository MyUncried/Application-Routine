import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MODAL_HEADER_ACTION_SIZE, ModalCancelAction, ModalValidateAction } from "@/shared/ui/ModalHeaderActions";
import { colors, spacing, type } from "@/shared/ui/tokens";

import { strings } from "@/shared/i18n";

import { formatClock } from "./executionStrings";

const t = strings.execution;
import { REPETITIONS_WHEEL_ITEM, RepetitionsWheel } from "./RepetitionsWheel";

/**
 * PRE-11, corrections 3 et 4 de Hermann du 14/11/2026 — modale « Répétitions partielles » du For time, ouverte par l'arrêt
 * (bouton rouge, en Pause), Figma « P-Modale — Répétitions partielles » (`8928:15098`) : croix, « Vos résultats », nom de
 * l'exercice et rangée de valeurs (0 par défaut, au plus la cible − 1), « Terminer l'exercice ».
 *
 * - Pendant une série en Répétitions : les répétitions faites de cette série, enregistrées avec la synthèse partielle.
 * - Entre deux séries (pause) ou en Durée : aucune série en cours, rien à saisir ; la modale confirme l'arrêt.
 * - La croix revient à la Pause, sans rien changer.
 *
 * Recette du 14/11/2026 (Hermann : « Écran initial : Le cadre gris doit être au milieu, avec 0 à l’intérieur, les chiffres suivent
 * à droite. Défilement des chiffres : le cadre gris ne bouge pas, il reste au milieu, seuls les chiffres défilent. Un retour
 * haptique à chaque passage de chiffre sur le cadre gris, le défilement doit marquer un léger arrêt sur le cadre. (Fonctionnement
 * d’une roulette) ») : rangée en roulette horizontale — cadre gris fixe au centre, défilement cranté d'un chiffre (`snapToInterval`),
 * retour haptique de sélection à chaque chiffre qui passe sous le cadre. Aucune roulette native horizontale n'existe sur iOS (la
 * roue SwiftUI est verticale) : la rangée existante est conservée et rendue cranée. [Cadre gris sur la valeur touchée — remplacé.]
 *
 * Écarts assumés au Figma : une seule rangée (l'exercice en cours ; le Figma en montre trois) — interprétation à confirmer ;
 * feuille dessinée dans l'écran, sans `Modal` natif (l'écran d'Exécution n'en garde qu'un, recette du 09/11/2026).
 *
 * Seconde recette du 17/11/2026 (Hermann : « augmenter la marge à gauche et à droite du bord à 16px » ; « le format du bouton
 * Annuler n'est pas conforme […] utilise le format de modale standard (boutons, titre, séparation...) » ; « En répétition : Le
 * titre : "Entrer votre résultat" » ; « En durée : Le titre : "Durée tenue" ; Une seule ligne avec le nom de l'exercice, et la
 * durée ») : en-tête de modale standard (`ModalHeader` : croix, titre centré, coche qui termine l'exercice — règle du 05/11/2026,
 * « toute modale qui crée ou modifie se valide par la coche de son en-tête ») et son séparateur. [Croix maison, titre « Vos
 * résultats », bouton « Terminer l'exercice » en bas, marges de 8 — remplacés.]
 */

/*
 * Troisième recette du 17/11/2026 (ftr3-modale-duree, Hermann : « Revoir les trois modales d'arrêt de For Time » ; « Titre : Arrêt du For
 * Time » ; « Deux boutons Annuler et Valider » (un seul, Valider, à l'issue du temps limite) ; « Nom de l'exercice (vérifier l'espace avec
 * la barre de séparation, elle doit être égale à l'espace entre le titre et la barre de séparation) » ; « Objectif : X répétitions » ou
 * « Objectif : 00:00 » ; « Résultat : demi-roulette horizontale (elle s'arrête à gauche sur le cadre gris, au milieu de l'écran, et à
 * droite sur les chiffres croissants) » ou « Durée de l'appui sur le bouton d'arrêt » ; « Pas de bouton d'action en bas » ; « Respecter
 * pour les trois modales un format et une disposition homogène ») : une seule feuille pour l'Arrêt en répétitions, l'Arrêt en durée et la
 * Durée maximum atteinte (`cancellable` faux, voir `ExecutionClosureSheet`). [Titres « Entrer votre résultat », « Durée tenue », « Vos
 * résultats » ; nom centré seul ; roulette centrée — remplacés.]
 */
export function ExecutionPartialRepetitionsSheet({
  exerciseName,
  targetText = null,
  inSeries,
  heldDurationMs,
  closeLabel = t.partialClose,
  cancellable = true,
  bottomInset,
  onConfirm,
  onCancel,
  testID = "execution-partial",
}: {
  readonly exerciseName: string | null;
  /** [Cible − 1 comme valeur la plus haute — remplacé le 15/11/2026, recette k5 : « Mettre la Valeur limite à 99 ».] */
  readonly targetRepetitions?: number | null;
  /** Ligne « Objectif » : « 12 répétitions », « 00:45 » ; `null` : ligne absente. */
  readonly targetText?: string | null;
  /** Série en Répétitions en cours : la demi-roulette des répétitions faites est proposée. */
  readonly inSeries: boolean;
  /** Exercice en durée : durée tenue à l'appui sur « Arrêt » (ou à la Durée maximum), enregistrée avec le résultat ; `null` sinon. */
  readonly heldDurationMs?: number | null;
  /** Libellé de la croix : retour à la Pause, ou à l'exercice quand l'Arrêt se fait sans Pause (For time). */
  readonly closeLabel?: string;
  /** Faux : Durée maximum atteinte, la feuille ne se ferme que par Valider (aucune croix). */
  readonly cancellable?: boolean;
  readonly bottomInset: number;
  readonly onConfirm: (partialRepetitions: number | null, partialDurationMs?: number | null) => void;
  readonly onCancel?: () => void;
  /** Préfixe des identifiants (feuille de l'Arrêt, ou Clôture de la Durée maximum). */
  readonly testID?: string;
}) {
  const [value, setValue] = useState(0);
  const held = heldDurationMs ?? null;
  const confirm = () => (held !== null ? onConfirm(null, held) : onConfirm(inSeries ? value : null));
  // Recette du 18/11/2026 (Hermann : « centrer horizontalement le chiffre de l'objectif et le chiffre dans le cadre gris » ; « objectif et
  // résultat de la même taille que le titre et le nom » ; « Répétition aussi de cette même taille » ; « décaler la valeur de l'objectif et
  // la roulette vers la gauche à un espace raisonnable de objectif et de Résultat ») : libellés et unité en 18 ; les valeurs sont centrées
  // sur l'axe du cadre gris, colonne posée à 24 des libellés. [Valeurs alignées à droite, roulette sur la moitié droite — remplacé.]
  const repetitionsTarget = targetText === null ? null : /^(\d+)\s+(.+)$/.exec(targetText);
  return (
    <View style={styles.layer} testID={testID}>
      <View style={styles.veil} />
      <View style={[styles.sheet, { marginBottom: Math.max(16, bottomInset) }]} accessibilityViewIsModal>
        <View style={styles.header} testID={`${testID}-header`}>
          {cancellable && onCancel !== undefined ? (
            <ModalCancelAction onPress={onCancel} accessibilityLabel={closeLabel} testID={`${testID}-cancel`} />
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
            {t.forTimeStopTitle}
          </Text>
          <ModalValidateAction onPress={confirm} enabled accessibilityLabel={t.validate} testID={`${testID}-validate`} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.name} numberOfLines={1} testID={`${testID}-name`}>
          {exerciseName ?? ""}
        </Text>
        {targetText !== null ? (
          <View style={styles.row} testID={`${testID}-target`}>
            <Text style={styles.label}>{t.stopObjective}</Text>
            <View style={styles.valueColumn}>
              {repetitionsTarget !== null ? (
                <>
                  <View style={styles.axisBox}>
                    <Text style={styles.rowValue}>{repetitionsTarget[1]}</Text>
                  </View>
                  <Text style={styles.unit}>{` ${repetitionsTarget[2]}`}</Text>
                </>
              ) : (
                <View style={styles.axisWide}>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {targetText}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}
        {held !== null ? (
          <View style={styles.row} accessible accessibilityLabel={`${t.stopResult} ${formatClock(held)}`} testID={`${testID}-held`}>
            <Text style={styles.label}>{t.stopResult}</Text>
            <View style={styles.valueColumn}>
              <View style={styles.axisWide}>
                <Text style={[styles.rowValue, styles.heldFrame]} numberOfLines={1} testID={`${testID}-held-value`}>
                  {formatClock(held)}
                </Text>
              </View>
            </View>
          </View>
        ) : inSeries ? (
          <View style={styles.row} testID={`${testID}-result`}>
            <Text style={styles.label}>{t.stopResult}</Text>
            {/* Demi-roulette : cadre gris dans la colonne des valeurs, chiffres croissants à sa droite. */}
            <View style={styles.wheelColumn}>
              <RepetitionsWheel onChange={setValue} anchor="start" testID={testID} />
            </View>
          </View>
        ) : (
          <Text style={styles.none} testID={`${testID}-none`}>
            {t.partialNoSeries}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Écart entre le titre et le séparateur : en-tête de 56 (\`ModalHeader\`), titre de 22 de haut. */
const TITLE_GAP = (56 - 22) / 2;
/** Taille des textes de la feuille : celle du titre (`type.modalTitle`). */
const TEXT_SIZE = 18;
const LABEL_WIDTH = 80;
const LABEL_GAP = 24;
/** Boîte d'une durée (« 02:00 ») centrée sur l'axe du cadre gris, plus large qu'un cran. */
const AXIS_WIDE = 120;

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 10 },
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  sheet: { marginHorizontal: 16, backgroundColor: "#FFFFFF", borderRadius: 40, paddingBottom: 24, overflow: "hidden" },
  // En-tête de modale standard (mêmes mesures que \`ModalHeader\`), croix absente à la Durée maximum.
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, paddingHorizontal: spacing[12] + 5 },
  headerSpacer: { width: MODAL_HEADER_ACTION_SIZE, height: MODAL_HEADER_ACTION_SIZE },
  title: { ...type.modalTitle, color: colors.textPrimary, flexShrink: 1, textAlign: "center" },
  // Séparateur sous l'en-tête, comme la feuille des Paramètres d'exécution.
  headerDivider: { height: 1, marginHorizontal: spacing[12], backgroundColor: colors.divider },
  // Nom de l'exercice, centré, à la même distance du séparateur que le titre.
  name: { marginTop: TITLE_GAP, marginHorizontal: 16, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: TEXT_SIZE, color: colors.textPrimary, textAlign: "center" },
  // Recette du 18/11/2026 (Hermann : « Réduire l'espace entre les lignes objectif et résultat, réduire la taille de la modale d'autant »).
  row: { marginTop: 4, paddingLeft: 24, flexDirection: "row", alignItems: "center", minHeight: 56 },
  label: { width: LABEL_WIDTH, fontFamily: "Inter_400Regular", fontSize: TEXT_SIZE, color: "#7A7A80" },
  valueColumn: { flex: 1, marginLeft: LABEL_GAP, flexDirection: "row", alignItems: "center" },
  // Valeur centrée sur l'axe du cadre gris (largeur d'un cran de la roulette).
  axisBox: { width: REPETITIONS_WHEEL_ITEM, alignItems: "center" },
  axisWide: { width: AXIS_WIDE, marginLeft: (REPETITIONS_WHEEL_ITEM - AXIS_WIDE) / 2, alignItems: "center" },
  rowValue: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 28, color: colors.textPrimary, fontVariant: ["tabular-nums"] },
  // Recette du 18/11/2026 (« Textes Objectif, Résultat et Répétitions restent en gris »).
  // Recette du 18/11/2026 (Hermann : « Encadrer le résultat en durée avec le cadre gris, centrer la valeur ») : cadre de la roulette.
  heldFrame: { minWidth: REPETITIONS_WHEEL_ITEM, height: REPETITIONS_WHEEL_ITEM, lineHeight: REPETITIONS_WHEEL_ITEM, paddingHorizontal: 10, borderRadius: 16, overflow: "hidden", backgroundColor: "#F0F0F7", textAlign: "center" },
  unit: { fontFamily: "Inter_400Regular", fontSize: TEXT_SIZE, color: "#7A7A80" },
  wheelColumn: { flex: 1, marginLeft: LABEL_GAP },
  none: { marginTop: 20, marginHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 15, color: "#7A7A80" },
});

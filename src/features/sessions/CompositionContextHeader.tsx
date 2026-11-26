import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { spokenDurations } from "@/domain/activities/durationFormat";
import type { Label } from "@/domain/labels/Label";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Cible tactile des actions de la bande de contexte (Figma `8328:28619`,
 * `8328:28620`, `8328:28633` : zones tactiles 44 × 44).
 */
const CONTEXT_TOUCH_TARGET = 44;

/** Puce Étiquette (Figma `8328:28613`) : hauteur 26, rayon 13, fond blanc à 35 %, icône 18. */
const LABEL_CHIP = {
  height: 26,
  radius: 13,
  background: "rgba(255, 255, 255, 0.35)",
  icon: 18,
  paddingLeft: spacing[8],
  paddingRight: spacing[10],
  gap: spacing[6],
} as const;

/** Libellé de la puce (Figma `8328:28617`) : Inter Regular 13, interligne Auto (D2). */
const LABEL_CHIP_TEXT = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 16 } as const;

/** Ligne « Durée + actions » (Figma `8328:28611`) : hauteur 32. */
const INFO_ROW_HEIGHT = 32;

/** Bouton « + » (Figma `8328:28630`) : cercle 34, croix 20 × 2,5, rayon des barres 1. */
const ADD_BUTTON = { size: 34, glyphLength: 20, glyphThickness: 2.5, glyphRadius: 1 } as const;

// [Bouton « Ajouter un arrêt » (cercle 34, PRE-6 story 4.1) — retiré de la zone de contexte le 24/11/2026 (UI-FAB-01, D-558).]

/**
 * PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : œil des Volumes du circuit dans les
 * commandes contextuelles. Figma (`8328:28611` Standard, `5271:5461` modification) ne le dessine pas
 * dans la zone de contexte : gabarit des commandes contextuelles de la Composition (ch13 CE-T03-08
 * L1480 et L1591 : cercle 34, dessin 20, écart 10, cibles 44 sans chevauchement), même cercle que le
 * « + » (fond blanc, contour 1 `primary`, rayon 17) ; icône `view-volumes` (`8165:13756`) dessinée à 20.
 * Placé en tête du groupe, avant « Ajouter un arrêt » et « + ».
 */
const VOLUMES_ICON_SIZE = 20;

/**
 * Revue 5.1b — cibles RÉELLES des trois commandes (œil, « Ajouter un arrêt », « + »), contenues dans
 * les limites de leurs parents (Fabric iOS écarte un toucher hors des limites d'un parent : revue
 * 5.3). Chaque commande est une boîte de 44 × 44, cercle de 34 centré ; les boîtes se touchent sans
 * écart (Figma `8328:28619` / `8328:28620` : zones de 44 à x 271 et 315), ce qui rend entre les cercles
 * l'écart de 10 (44 − 34). La dernière boîte dépasse de 5 le bord droit de la colonne (Figma : zone
 * jusqu'à x 359 pour une colonne qui finit à 354) et la rangée de 44 dépasse de 6 en haut et en bas la
 * bande de 32 : la rangée et l'en-tête s'agrandissent d'autant par des marges négatives compensées
 * (`marginVertical` / `marginRight` négatifs, marges internes égales) — la mise en page ne change pas,
 * les limites de chaque parent contiennent les cibles.
 */
const CONTEXT_COMMAND_INSET = (CONTEXT_TOUCH_TARGET - ADD_BUTTON.size) / 2;
const INFO_ROW_TOUCH_OVERFLOW = (CONTEXT_TOUCH_TARGET - INFO_ROW_HEIGHT) / 2;
/** Écart visuel bande d'informations → premier cercle, inchangé (8), moins la marge de la boîte. */
const INFO_ROW_GAP = spacing[8] - CONTEXT_COMMAND_INSET;

/** Exporté pour les tests de géométrie (dimensions réelles des boîtes et des parents). */
export const CONTEXT_COMMANDS_GEOMETRY = {
  touchTarget: CONTEXT_TOUCH_TARGET,
  circle: ADD_BUTTON.size,
  icon: VOLUMES_ICON_SIZE,
  commandInset: CONTEXT_COMMAND_INSET,
  infoRowHeight: INFO_ROW_HEIGHT,
  infoRowTouchOverflow: INFO_ROW_TOUCH_OVERFLOW,
} as const;

export type CompositionContextHeaderProps = {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onNameFocus: () => void;
  /**
   * PRE-9 B.9 (ch08 « Nom de séance — trois états », état 3) : dès le deuxième Exercice, le champ
   * vide montre l'invite grise « Entrer un nom de séance » ; l'obligation de nommer apparaît.
   */
  readonly namePrompt?: boolean;
  /** Recette du 17/11/2026 (nom de Séance unique) : message sous le nom quand une autre Séance le porte déjà. */
  readonly nameError?: string | null;
  /** Étiquette affectée (référentiel chargé), `null` sinon. */
  readonly sessionLabel: Label | null;
  /** Couleur DÉRIVÉE de l'Étiquette (V2-PRE-1), teinte de son icône (story 7.2, D-442). */
  readonly sessionColor: string;
  readonly onOpenLabelPicker: () => void;
  /** Durée de séance déjà formatée (`formatCompositionSessionDuration`). */
  readonly sessionDuration: string;
  // [UI-FAB-01 (D-558, 24/11/2026) : « + Ajouter une activité » (`onAdd`, `addActionRef`, `isCreateMenuOpen`) et « Ajouter un
  // arrêt » (`onAddStop`, `isPlacementActive`, `isAddStopDisabled`, `addStopFocusRequest`, `addStopAccessibilityHint`) quittent
  // la zone de contexte : bouton flottant « Créer » et menu Créer de la Composition.]
  // Complément du 5 novembre 2026 (Hermann, §3 et §6, CE-T03-08, CE-CIR-03 retiré) : bouton œil « Voir les volumes » et feuille « Volumes du circuit » retirés. [PRE-6 story 5.1b / 3.4 — remplacé.]
  readonly testID?: string;
};

/**
 * Bande de contexte de la Composition (PRE-6 story 2.1, AD-41, Figma
 * `8328:28608` « Titre de séance ») : nom de la séance ; dessous, sur une
 * ligne de 32, la puce Étiquette puis la durée de séance, et à droite les
 * boutons ronds « Voir les volumes du circuit » (PRE-6 story 5.1b, l'œil quitte l'en-tête du
 * Circuit), « Ajouter un arrêt » (PRE-6 story 4.1 : entrée du mode placement, état actif
 * rempli pendant le placement) et « + » qui ouvre l'arbre d'ajout (remplace le bouton texte
 * « + Ajouter un exercice »).
 *
 * Comportements repris tels quels de la Composition : saisie du nom
 * (`NAME_MAX_LENGTH`, placeholder `text-primary`, R4-01), ouverture de
 * `LabelPickerModal` (V2-PRE-2, CE-T03-16) ; avec Étiquette, icône `label-outline` teintée de
 * sa couleur + nom (R7a ; PRE-6 story 7.2, D-442, remplace la pastille ronde) ; sans Étiquette,
 * icône `label-outline` (r4).
 */
export function CompositionContextHeader({
  name,
  onChangeName,
  onNameFocus,
  namePrompt = false,
  nameError = null,
  sessionLabel,
  sessionColor,
  onOpenLabelPicker,
  sessionDuration,
  testID = "composition-context-header",
}: CompositionContextHeaderProps) {
  const composition = strings.screens.composition;
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.nameRow} testID="composition-name-color-field">
        <TextInput
          value={name}
          onChangeText={onChangeName}
          onFocus={onNameFocus}
          placeholder={namePrompt ? composition.namePrompt : composition.name}
          placeholderTextColor={namePrompt ? colors.textSecondary : colors.textPrimary}
          accessibilityLabel={composition.name}
          maxLength={NAME_MAX_LENGTH}
          style={styles.nameInput}
        />
      </View>
      {nameError !== null ? (
        <Text style={styles.nameError} accessibilityRole="alert" testID="composition-session-name-taken">
          {nameError}
        </Text>
      ) : null}
      <View style={styles.infoRow} testID="composition-info-row">
        <View style={styles.infoGroup} testID="composition-info-group">
          <Pressable
            onPress={onOpenLabelPicker}
            accessibilityRole="button"
            accessibilityLabel={composition.label.accessibilityLabel}
            hitSlop={{
              top: (CONTEXT_TOUCH_TARGET - LABEL_CHIP.height) / 2,
              bottom: (CONTEXT_TOUCH_TARGET - LABEL_CHIP.height) / 2,
              left: spacing[4],
              right: spacing[4],
            }}
            style={styles.labelChip}
            testID="composition-session-color-trigger"
          >
            {sessionLabel ? (
              <>
                {/* PRE-6 story 7.2 (D-442, remplace la pastille ronde) : icône d'étiquette (contour)
                    dans la couleur de l'Étiquette. */}
                <KodjoIcon
                  name="label-outline"
                  size={LABEL_CHIP.icon}
                  tintColor={sessionColor}
                  testID="composition-session-label-icon"
                />
                <Text style={[styles.labelChipText, styles.labelChipName]} numberOfLines={1} testID="composition-session-label-name">
                  {sessionLabel.name}
                </Text>
              </>
            ) : (
              <>
                <KodjoIcon
                  name="label-outline"
                  size={LABEL_CHIP.icon}
                  testID="composition-session-label-outline-icon"
                />
                <Text style={styles.labelChipText} numberOfLines={1}>
                  {composition.label.placeholder}
                </Text>
              </>
            )}
          </Pressable>
          <Text
            style={styles.sessionDuration}
            numberOfLines={1}
            accessibilityLabel={spokenDurations(`${composition.sessionDurationAccessibilityLabel} ${sessionDuration}`)}
            testID="composition-session-duration"
          >
            {sessionDuration}
          </Text>
        </View>
        {/* [Revue 5.1b : commandes « Ajouter un arrêt » et « + » (cibles de 44) — retirées le 24/11/2026 (UI-FAB-01, D-558).] */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma `8328:28608` : colonne, écart 10, posée à 20 du haut de la zone de
  // contexte (padding haut de `ContextBand` 12 + 8). Revue 5.1b : l'en-tête s'étend de 5 à droite et
  // de 6 en bas (marges négatives compensées) pour CONTENIR les cibles de 44 des commandes ; le nom
  // garde sa largeur (`nameRow.marginRight`).
  container: {
    gap: spacing[10],
    paddingTop: spacing[8],
    marginRight: -CONTEXT_COMMAND_INSET,
    paddingBottom: INFO_ROW_TOUCH_OVERFLOW,
    marginBottom: -INFO_ROW_TOUCH_OVERFLOW,
  },
  // Champ Nom transparent sur la bande colorée, sans contour (REWORK09, D-352).
  nameRow: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    marginRight: CONTEXT_COMMAND_INSET,
  },
  // Inter Semi Bold 20 (`type.screenTitle`), `text-primary`.
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // Recette du 17/11/2026 : nom de Séance déjà utilisé (pas de maquette ; couleur des erreurs de la Composition).
  nameError: {
    ...type.body,
    color: colors.danger,
  },
  // Bande « Durée + actions » de 32 (Figma `8328:28611`), revue 5.1b : boîte de 44 aux marges
  // verticales de −6, pour contenir les cibles de 44 ; l'encombrement reste 32.
  infoRow: {
    height: CONTEXT_TOUCH_TARGET,
    marginVertical: -INFO_ROW_TOUCH_OVERFLOW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: INFO_ROW_GAP,
  },
  // Revue 5.1b : écran étroit — le groupe peut céder jusqu'à 0 ; jamais sous les commandes.
  infoGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[10],
  },
  labelChip: {
    height: LABEL_CHIP.height,
    flexDirection: "row",
    alignItems: "center",
    gap: LABEL_CHIP.gap,
    paddingLeft: LABEL_CHIP.paddingLeft,
    paddingRight: LABEL_CHIP.paddingRight,
    borderRadius: LABEL_CHIP.radius,
    backgroundColor: LABEL_CHIP.background,
    flexShrink: 1,
  },
  labelChipText: {
    ...LABEL_CHIP_TEXT,
    color: colors.primary,
    flexShrink: 1,
  },
  // Nom de l’Étiquette affectée : couleur `text-primary`, comme avant PRE-6 (R7a).
  labelChipName: {
    color: colors.textPrimary,
  },
  // Figma `8328:28618` : Inter Regular 14, `text-tertiary`. Revue 5.1b : s'abrège (ellipse) sur un
  // écran étroit plutôt que de passer sous les commandes.
  // Recette iPhone du 26/11/2026 (après-midi, Hermann : « Zone de contexte : la durée totale est alignée à droite, en texte noir ») :
  // poussée au bord droit de la colonne (la rangée dépasse de `CONTEXT_COMMAND_INSET`), `text-primary`. [`text-tertiary`, à la suite
  // de la puce Étiquette — remplacé.]
  sessionDuration: {
    ...type.body,
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: "auto",
    marginRight: CONTEXT_COMMAND_INSET,
    textAlign: "right",
  },
});

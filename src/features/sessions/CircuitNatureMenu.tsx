import { Button as SwiftUIButton, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  accessibilityValue as swiftUIAccessibilityValue,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CIRCUIT_NATURES, type CircuitNature } from "@/domain/sessions/circuit";
import { AnchoredPanel, type AnchoredPanelPlacement } from "@/features/activities/AnchoredPanel";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Repli Android / web — valeurs d'intégration locales (`NON VÉRIFIABLE` : Figma ne dessine que
 * le rendu iOS, menu natif) : largeur fixe du panneau (un panneau absolu sans largeur se
 * mesurerait sur son hôte), cible 44 du déclencheur et de chaque option.
 */
const PANEL_WIDTH = 280;
const TOUCH_TARGET = 44;
const CHECK_SIZE = 24;

/** Écart entre le bas de l'en-tête du Circuit et le panneau (Android / web). */
export const CIRCUIT_NATURE_PANEL_GAP = spacing[4];

/** Nom accessible d'une option : libellé et sous-texte (CE-CIR-01), comme l'Enchaînement de la Feuille. */
export function circuitNatureOptionAccessibilityLabel(nature: CircuitNature): string {
  const option = strings.screens.composition.circuit.nature.options[nature];
  return `${option.title}, ${option.subtitle}`;
}

function natureAccessibilityValue(nature: CircuitNature): string {
  return strings.screens.composition.circuit.nature.options[nature].title;
}

export type CircuitNatureMenuProps = {
  /** Nature courante : option cochée, valeur annoncée. */
  readonly nature: CircuitNature;
  /** Rendu du déclencheur : la pastille d'unité (dessin seul, sans rôle accessible). */
  readonly trigger: ReactNode;
  /** Android / web : panneau ouvert (état `expanded` du déclencheur). */
  readonly isOpen: boolean;
  /** Android / web : demande d'ouverture (l'écran referme alors le compteur révélé). */
  readonly onOpen: () => void;
  /** Android / web : second toucher du déclencheur, fermeture sans choix. */
  readonly onClose: () => void;
  /** iOS : option choisie dans le menu natif (y compris la nature courante, que l'écran ignore). */
  readonly onSelect: (nature: CircuitNature) => void;
  /**
   * Demande de focus VoiceOver / TalkBack sur la pastille, incrémentée par l'écran seulement
   * quand l'utilisateur ferme le choix (ou le dialogue de perte) — jamais quand un dialogue
   * s'ouvre, que la sortie commence ou que l'écran perd le premier plan. 0 : aucune demande.
   */
  readonly focusRequest: number;
  readonly testID: string;
};

/**
 * Déclencheur du choix de nature du Circuit (PRE-6 story 3.2, CE-CIR-01, CIR-10, Figma
 * `8328:34805`) : la pastille d'unité seule. Deux options « Circuit de tours » / « Circuit de
 * séries », la nature courante cochée ; aucune troisième option.
 *
 * - iOS (primitives natives, AGENTS.md) : `Menu` SwiftUI d'`@expo/ui`, hébergé par `Host` et
 *   `RNHostView`, même mécanisme que l'Enchaînement de la Feuille (`SideOrderMenu` de
 *   `ExecutionParametersSheet.tsx`) : un `Button` SwiftUI par option, coche `checkmark` sur la
 *   courante. Le sous-texte est porté par le nom accessible de l'option (comme l'Enchaînement) :
 *   le `Button` d'`@expo/ui` n'expose pas de sous-titre avec une icône système. Un toucher
 *   extérieur ferme le menu sans rien choisir. Révélé, le compteur intègre la pastille à sa
 *   valeur : seule la pastille au repos est un déclencheur.
 * - Android et web : bouton « Nature du circuit » (cible 44) ; le panneau `CircuitNaturePanel`
 *   est hébergé par l'écran dans un parent qui le contient entièrement (sur Android, un toucher
 *   hors des limites du parent n'atteint pas ses enfants).
 */
export function CircuitNatureMenu(props: CircuitNatureMenuProps) {
  const focusRef = useRef<View>(null);
  const lastRequestRef = useRef(props.focusRequest);
  useEffect(() => {
    if (props.focusRequest === lastRequestRef.current) return;
    lastRequestRef.current = props.focusRequest;
    if (focusRef.current) AccessibilityInfo.sendAccessibilityEvent(focusRef.current, "focus");
  }, [props.focusRequest]);

  if (Platform.OS === "ios") {
    return <NativeNatureMenu {...props} focusRef={focusRef} />;
  }
  return <NatureTrigger {...props} focusRef={focusRef} />;
}

type WithFocusRef = CircuitNatureMenuProps & { readonly focusRef: RefObject<View | null> };

function NativeNatureMenu({ nature, trigger, onSelect, testID, focusRef }: WithFocusRef) {
  const t = strings.screens.composition.circuit.nature;
  return (
    // Cible du focus rendu : le conteneur du menu natif (VoiceOver se pose sur son élément).
    <View ref={focusRef} collapsable={false} testID={`${testID}-focus`}>
      <Host matchContents testID={testID}>
        <Menu
          label={
            <RNHostView matchContents>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {trigger}
              </View>
            </RNHostView>
          }
          modifiers={[swiftUIAccessibilityLabel(t.accessibilityLabel), swiftUIAccessibilityValue(natureAccessibilityValue(nature))]}
        >
          {CIRCUIT_NATURES.map((option) => (
            <SwiftUIButton
              key={option}
              label={t.options[option].title}
              systemImage={option === nature ? "checkmark" : undefined}
              modifiers={[swiftUIAccessibilityLabel(circuitNatureOptionAccessibilityLabel(option))]}
              onPress={() => onSelect(option)}
              testID={`${testID}-${option}`}
            />
          ))}
        </Menu>
      </Host>
    </View>
  );
}

function NatureTrigger({ nature, trigger, isOpen, onOpen, onClose, testID, focusRef }: WithFocusRef) {
  const t = strings.screens.composition.circuit.nature;
  return (
    <Pressable
      ref={focusRef}
      onPress={isOpen ? onClose : onOpen}
      accessibilityRole="button"
      accessibilityLabel={t.accessibilityLabel}
      accessibilityValue={{ text: natureAccessibilityValue(nature) }}
      accessibilityState={{ expanded: isOpen }}
      style={styles.trigger}
      testID={testID}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {trigger}
      </View>
    </Pressable>
  );
}

export type CircuitNaturePanelProps = {
  readonly nature: CircuitNature;
  /** Position dans le repère de l'hôte, qui doit contenir tout le panneau. */
  readonly placement: AnchoredPanelPlacement;
  /** Toucher extérieur ou échappement : fermeture sans choix, aucune mutation. */
  readonly onDismiss: () => void;
  readonly onSelect: (nature: CircuitNature) => void;
  readonly testID: string;
};

/**
 * Android et web : `AnchoredPanel` existant avec les deux options (libellé et sous-texte
 * affichés, coche `state-selected` sur la courante), aligné à droite sous la pastille.
 */
export function CircuitNaturePanel({ nature, placement, onDismiss, onSelect, testID }: CircuitNaturePanelProps) {
  const t = strings.screens.composition.circuit.nature;
  return (
    <AnchoredPanel placement={placement} onDismiss={onDismiss} style={styles.panel} testID={testID}>
      {CIRCUIT_NATURES.map((option) => {
        const selected = option === nature;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityLabel={circuitNatureOptionAccessibilityLabel(option)}
            accessibilityState={{ selected }}
            style={styles.option}
            testID={`${testID}-${option}`}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t.options[option].title}</Text>
              <Text style={styles.optionSubtitle}>{t.options[option].subtitle}</Text>
            </View>
            <View style={styles.check}>
              {selected ? (
                <KodjoIcon name="state-selected" size={CHECK_SIZE} tintColor={colors.primary} testID={`${testID}-${option}-check`} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </AnchoredPanel>
  );
}

const styles = StyleSheet.create({
  // Cible 44 sans changer le dessin : la ligne du compteur fait déjà 44 de haut.
  trigger: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.background,
    borderRadius: fixedRadii[12],
    paddingVertical: spacing[4],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
  },
  optionText: {
    flex: 1,
    gap: spacing[2],
  },
  optionTitle: {
    ...type.editableValue,
    color: colors.textPrimary,
  },
  optionSubtitle: {
    ...type.supporting,
    color: colors.textSecondary,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
  },
});

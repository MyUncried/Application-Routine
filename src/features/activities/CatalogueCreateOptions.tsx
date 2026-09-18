import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Hauteur du séparateur sous l'en-tête (`ScreenShell.tsx`, `HeaderSeparator`,
 * `styles.separator.height`) — reprise ici en constante, jamais dupliquée
 * en dur, pour composer `menuTop` (voir plus bas).
 */
const HEADER_SEPARATOR_HEIGHT = 1;

export type CatalogueCreateOptionsProps = {
  visible: boolean;
  onSelectNewActivity: () => void;
  onSelectNewSession: () => void;
  onCancel: () => void;
};

const APPEAR_DURATION_MS = 180;
const DISMISS_DURATION_MS = 120;

/**
 * Arbre `Créer` du Catalogue (V2-CAT-01, plan §4.1 ; revue indépendante
 * 5732014381, obligation 3) — ancré à `Créer`, affiche exactement `Une
 * nouvelle activité`, `Une séance`, `Un circuit`, `Annuler`, dans cet ordre.
 * `Un circuit` est désactivé. `Annuler` ferme sans écriture et restitue
 * exactement le contexte courant — aucun état n'est modifié par cette
 * fermeture, ni par un appui sur le voile.
 *
 * L'apparition est PROGRESSIVE ET RAPIDE (fondu + léger agrandissement,
 * `Animated`, jamais un affichage instantané) ; la disparition l'est
 * symétriquement, plus brève. Rendu comme un frère absolument positionné de
 * la rangée `Créer / Filtrer / Trier` (jamais un `Modal` plein écran) : la
 * rangée qui l'a ouvert reste visible sous le voile — désormais un scrim
 * COMPLET (couvre l'écran entier de cet écran, arrière-plan/navigation/
 * retour/listes non interactifs tant qu'il est visible), conformément au
 * plan (« conserve cette rangée sous le scrim »).
 */
export function CatalogueCreateOptions({
  visible,
  onSelectNewActivity,
  onSelectNewSession,
  onCancel,
}: CatalogueCreateOptionsProps) {
  const insets = useSafeAreaInsets();
  // VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 3) :
  // `menuTop` composait auparavant SEULEMENT `dimensions.contextBand.height`
  // — en omettant la hauteur réelle de l'en-tête fixe (`insets.top +
  // dimensions.header.contentHeight`) et de son séparateur, tous deux
  // frères PRÉCÉDENT ce composant dans `ScreenShell` (`CatalogueScreen.tsx`).
  // L'arbre se positionnait donc ~100 pt trop haut, chevauchant l'en-tête
  // au lieu d'apparaître sous la rangée `Créer` — d'où le bouton perçu comme
  // non fonctionnel (l'arbre s'ouvrait bien, mais invisible/confondu avec
  // l'en-tête). `menuTop` inclut désormais la hauteur RÉELLE cumulée des
  // trois éléments fixes qui précèdent toujours ce composant à l'écran.
  const menuTop =
    insets.top +
    dimensions.header.contentHeight +
    HEADER_SEPARATOR_HEIGHT +
    dimensions.contextBand.height +
    spacing[8];
  // `useState` (jamais `useRef(...).current`) : l'instance `Animated.Value`
  // reste stable entre rendus, mais n'est jamais lue via un ref pendant le
  // rendu (`react-hooks/refs`).
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  const [shouldRender, setShouldRender] = useState(visible);
  // Ajustement d'état PENDANT le rendu (patron officiellement recommandé
  // pour dériver un état d'un changement de prop, `react.dev/learn/
  // you-might-not-need-an-effect`) — jamais un `setState` synchrone dans un
  // effet (`react-hooks/set-state-in-effect`) : `shouldRender` doit devenir
  // vrai IMMÉDIATEMENT (avant même le premier rendu du fondu), pas après un
  // aller-retour d'effet.
  const [previousVisible, setPreviousVisible] = useState(visible);
  if (visible !== previousVisible) {
    setPreviousVisible(visible);
    if (visible) {
      setShouldRender(true);
    }
  }

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: APPEAR_DURATION_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: DISMISS_DURATION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [visible, progress]);

  if (!shouldRender) {
    return null;
  }

  const t = strings.screens.sessions.createTree;
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <>
      {/* Scrim COMPLET : couvre tout l'écran, arrière-plan/navigation/retour/listes non interactifs tant que l'arbre est visible. */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: progress }]}
      >
        <Pressable
          onPress={onCancel}
          accessible={false}
          testID="catalogue-create-tree-backdrop"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        style={[styles.menu, { top: menuTop, opacity: progress, transform: [{ scale }] }]}
        testID="catalogue-create-tree"
      >
        <CreateTreeOption
          label={t.newActivity}
          onPress={onSelectNewActivity}
          testID="catalogue-create-tree-new-activity"
        />
        <CreateTreeOption
          label={t.newSession}
          onPress={onSelectNewSession}
          testID="catalogue-create-tree-new-session"
        />
        <CreateTreeOption
          label={t.newCircuit}
          disabled
          accessibilityLabel={t.circuitUnavailableAccessibilityLabel}
          testID="catalogue-create-tree-new-circuit"
        />
        <CreateTreeOption label={t.cancel} onPress={onCancel} testID="catalogue-create-tree-cancel" />
      </Animated.View>
    </>
  );
}

function CreateTreeOption({
  label,
  onPress,
  disabled = false,
  accessibilityLabel = label,
  testID,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.option, disabled ? styles.optionDisabled : null]}
      testID={testID}
    >
      <Text style={[styles.optionLabel, disabled ? styles.optionLabelDisabled : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
  },
  menu: {
    // `top` est calculé dynamiquement (`menuTop`, ci-dessus) et transmis en
    // style inline — dépend d'`insets.top`, indisponible dans cette feuille
    // de styles statique.
    position: "absolute",
    left: spacing[24],
    right: spacing[24],
    backgroundColor: colors.background,
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  optionLabelDisabled: {
    color: colors.disabled,
  },
});

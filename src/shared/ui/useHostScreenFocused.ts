import { NavigationContext } from "expo-router/react-navigation";
import { useContext, useEffect, useState } from "react";

/**
 * Remarque e de Hermann du 26/11/2026 (« je suis sur une modale des paramètres d'exécution dans un format, une notification
 * apparaît, j'appuie dessus, la fenêtre d'exécution se présente, j'appuie sur retour, cela m'amène sur la modale des
 * paramètres. D'ici les boutons ne sont plus actifs ») : l'écran qui porte une `Modal` de React Native peut être recouvert par
 * un écran poussé d'ailleurs (rappel touché, RM-054b) pendant que la `Modal` est ouverte. Ce crochet dit si l'écran hôte est au
 * premier plan (événements `blur` / `focus` de la navigation) : la `Modal` est retirée pendant le recouvrement, puis présentée de
 * nouveau au retour, au lieu de rester affichée sans toucher actif. Hors navigateur (test isolé) : toujours vrai.
 */
export function useHostScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    if (navigation === undefined) return undefined;
    const offBlur = navigation.addListener("blur", () => setFocused(false));
    const offFocus = navigation.addListener("focus", () => setFocused(true));
    return () => {
      offBlur();
      offFocus();
    };
  }, [navigation]);
  return focused;
}

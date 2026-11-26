import { NavigationContext } from "expo-router/react-navigation";
import { useContext, useEffect, useState } from "react";

/**
 * Recette du 26/11/2026 (après-midi, Hermann : « appui sur retour > composition de séance, la modale est fermée, je ne peux pas
 * ouvrir les paramètres d'exécution ou faire d'autres actions, le bouton d'action en bas est bloqué aussi, seul le bouton annuler
 * en haut à gauche fonctionne ») : délai de secours avant de présenter de nouveau la `Modal` quand la navigation ne signale pas la
 * fin de la transition de retour (`transitionEnd`). Supérieur aux durées des transitions natives d'iOS (≈ 350 à 500 ms).
 */
export const HOST_SCREEN_SETTLE_FALLBACK_MS = 700;

type TransitionEndEvent = { readonly data?: { readonly closing?: boolean } } | undefined;
type ListenableNavigation = {
  readonly addListener: (event: string, handler: (event: TransitionEndEvent) => void) => () => void;
  readonly getParent?: () => ListenableNavigation | undefined;
};

/**
 * Remarque e de Hermann du 26/11/2026 (« je suis sur une modale des paramètres d'exécution dans un format, une notification
 * apparaît, j'appuie dessus, la fenêtre d'exécution se présente, j'appuie sur retour, cela m'amène sur la modale des
 * paramètres. D'ici les boutons ne sont plus actifs ») : l'écran qui porte une `Modal` de React Native peut être recouvert par
 * un écran ouvert d'ailleurs (rappel touché, RM-054b) pendant que la `Modal` est ouverte. Ce crochet dit si l'écran hôte est au
 * premier plan : la `Modal` est retirée pendant le recouvrement (`blur`), puis présentée de nouveau au retour. Hors navigateur
 * (test isolé) : toujours vrai.
 *
 * Recette du 26/11/2026 (après-midi) — [Avant : présentée de nouveau dès l'événement `focus` — remplacé.] `focus` est émis dès le
 * changement d'état de la navigation, AVANT la transition native de retour : la `Modal` remontée à cet instant demandait à iOS de
 * la présenter depuis un écran encore en transition (ou détaché de la fenêtre). iOS ignore une telle présentation ; la vue hôte de
 * la `Modal` (plein écran, transparente, posée dans l'écran hôte) restait alors montée sans feuille, au-dessus du contenu : plus
 * aucun toucher, hormis l'en-tête placé au-dessus (`zIndex`). La `Modal` revient donc à la fin de la transition (`transitionEnd`
 * non fermant, de l'écran hôte ou d'un navigateur parent — la Composition est imbriquée dans `(creation)`), au plus tard après
 * `HOST_SCREEN_SETTLE_FALLBACK_MS`.
 */
export function useHostScreenFocused(): boolean {
  const navigation = useContext(NavigationContext) as ListenableNavigation | undefined;
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    if (navigation === undefined) return undefined;
    let waiting = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const settle = () => {
      if (!waiting) return;
      waiting = false;
      clearTimer();
      setFocused(true);
    };
    const offs = [
      navigation.addListener("blur", () => {
        waiting = false;
        clearTimer();
        setFocused(false);
      }),
      navigation.addListener("focus", () => {
        waiting = true;
        clearTimer();
        timer = setTimeout(settle, HOST_SCREEN_SETTLE_FALLBACK_MS);
      }),
    ];
    for (let level: ListenableNavigation | undefined = navigation; level !== undefined; level = level.getParent?.()) {
      offs.push(
        level.addListener("transitionEnd", (event) => {
          if (event?.data?.closing !== true) settle();
        }),
      );
    }
    return () => {
      clearTimer();
      offs.forEach((off) => off());
    };
  }, [navigation]);
  return focused;
}

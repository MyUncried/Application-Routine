import { useFocusEffect } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { FloatingCreateButton, floatingBottomAboveNavigation, type FloatingCreateVariant } from "@/shared/ui/FloatingCreateButton";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";

/**
 * D-594 (Hermann, 24/11/2026 : le bouton peut aller « partout », barre de navigation comprise) — hôte du bouton flottant des
 * écrans à onglets. La barre de navigation est dessinée par-dessus les écrans (\`app/(tabs)/_layout.tsx\`) : un bouton rendu
 * dans l'écran passerait dessous. L'hôte le rend au niveau des onglets, après la barre ; l'écran affiché déclare seulement
 * son contenu, son libellé et son action. Sans hôte (écran hors onglets, tests), l'écran rend lui-même son bouton.
 */
export type FloatingCreateConfig = {
  readonly variant: FloatingCreateVariant;
  /** Nom VoiceOver propre à l'écran. */
  readonly label: string;
  readonly onPress: () => void;
};

type Registration = { readonly id: number; readonly config: FloatingCreateConfig };
type HostApi = { readonly show: (registration: Registration) => void; readonly hide: (id: number) => void };

const HostContext = createContext<HostApi | null>(null);

export function FloatingCreateHost({ children }: { readonly children: ReactNode }) {
  const [current, setCurrent] = useState<Registration | null>(null);
  const api = useMemo<HostApi>(
    () => ({
      show: (registration) => setCurrent(registration),
      hide: (id) => setCurrent((shown) => (shown?.id === id ? null : shown)),
    }),
    [],
  );
  return (
    <HostContext.Provider value={api}>
      {children}
      {current !== null ? (
        <FloatingCreateButton
          variant={current.config.variant}
          accessibilityLabel={current.config.label}
          onPress={current.config.onPress}
          bottom={floatingBottomAboveNavigation(navigationBarTotalHeight())}
        />
      ) : null}
    </HostContext.Provider>
  );
}

let nextId = 0;

/** Bouton d'un écran à onglets : confié à l'hôte quand il existe, sinon rendu sur place (même bas par défaut). */
export function FloatingCreateSlot({ config }: { readonly config: FloatingCreateConfig }) {
  const host = useContext(HostContext);
  if (host === null) {
    return (
      <FloatingCreateButton
        variant={config.variant}
        accessibilityLabel={config.label}
        onPress={config.onPress}
        bottom={floatingBottomAboveNavigation(navigationBarTotalHeight())}
      />
    );
  }
  return <HostedFloatingCreate host={host} config={config} />;
}

/** Montré tant que l'écran a le focus ; mis à jour quand le contenu ou le libellé changent, l'action la plus récente étant appelée. */
function HostedFloatingCreate({ host, config }: { readonly host: HostApi; readonly config: FloatingCreateConfig }) {
  const [id] = useState(() => (nextId += 1));
  const latest = useRef(config);
  useEffect(() => {
    latest.current = config;
  });
  const onPress = useCallback(() => latest.current.onPress(), []);
  const { variant, label } = config;
  useFocusEffect(
    useCallback(() => {
      host.show({ id, config: { variant, label, onPress } });
      return () => host.hide(id);
    }, [host, id, variant, label, onPress]),
  );
  useEffect(() => () => host.hide(id), [host, id]);
  return null;
}

import { requireNativeView, requireOptionalNativeModule } from "expo";
import type { ComponentType } from "react";
import { Platform, type ViewStyle } from "react-native";

import type { LocalDate } from "@/domain/planning/Routine";

/**
 * D-563 — vue native `UICalendarView` du module local `modules/kodjo-calendar` (Swift). Absente d'une version de l'application
 * construite avant ce module : `null`, l'appelant garde alors ses calendriers natifs précédents (`DatePicker`), sans calendrier
 * redessiné.
 */
type NativeProps = {
  readonly selectedDate: LocalDate | null;
  readonly periodStart: LocalDate | null;
  readonly periodEnd: LocalDate | null;
  readonly visibleDate: LocalDate | null;
  readonly tintColor: string;
  readonly onPressDate: (event: { readonly nativeEvent: { readonly date: string } }) => void;
  readonly style?: ViewStyle;
  readonly testID?: string;
};

function loadNativeCalendar(): ComponentType<NativeProps> | null {
  if (Platform.OS !== "ios") return null;
  try {
    if (requireOptionalNativeModule("KodjoCalendar") === null) {
      warnFallback("module natif KodjoCalendar absent de cette version de l'application");
      return null;
    }
    return requireNativeView<NativeProps>("KodjoCalendar");
  } catch (error) {
    warnFallback(String(error));
    return null;
  }
}

/**
 * Contre-recette du 23/11/2026 (c1, c2) : le repli sur les `DatePicker` (langue de l'application, sans second appui) ne se
 * distingue pas à l'œil d'un calendrier natif mal réglé. En développement sur iPhone, il est signalé dans le journal de Metro
 * (pas sous Jest, où le module natif manque toujours).
 */
function warnFallback(reason: string): void {
  if (__DEV__ && process.env.JEST_WORKER_ID === undefined) {
    console.warn(`[D-563] Calendrier de période : DatePicker de repli (${reason}).`);
  }
}

export const NativePeriodCalendar: ComponentType<NativeProps> | null = loadNativeCalendar();

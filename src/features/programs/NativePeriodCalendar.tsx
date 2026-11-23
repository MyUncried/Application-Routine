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
    if (requireOptionalNativeModule("KodjoCalendar") === null) return null;
    return requireNativeView<NativeProps>("KodjoCalendar");
  } catch {
    return null;
  }
}

export const NativePeriodCalendar: ComponentType<NativeProps> | null = loadNativeCalendar();

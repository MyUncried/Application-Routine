/**
 * Design tokens canoniques du MVP.
 *
 * Source : docs/Specifications-fonctionnelles/12 – Architecture technique,
 * « Design tokens canoniques ».
 */

export const colors = {
  primary: "#0508E5",
  selection: "#5F60EE",
  selectionSurface: "#E5F0FF",
  background: "#FFFFFF",
  surface: "#F5F7FA",
  surfaceSubtle: "#F9FAFC",
  textPrimary: "#141414",
  textSecondary: "#595E66",
  iconNeutral: "#5C636E",
  border: "#E0E3E8",
  divider: "#DBE0E8",
  disabled: "#BEC2CC",
  snackbar: "#292B33",
  positive: "#4F9F83",
  warning: "#FF8D28",
  danger: "#D92D20",
  dangerSurface: "#FFF1F0",
} as const;

const regular = { fontFamily: "Inter_400Regular", fontWeight: "400" } as const;
const medium = { fontFamily: "Inter_500Medium", fontWeight: "500" } as const;
const semiBold = { fontFamily: "Inter_600SemiBold", fontWeight: "600" } as const;

export const type = {
  timerPrimary: { ...semiBold, fontSize: 58, lineHeight: 64 },
  activityTitle: { ...semiBold, fontSize: 28, lineHeight: 34 },
  metricPrimary: { ...semiBold, fontSize: 22, lineHeight: 28 },
  screenTitle: { ...semiBold, fontSize: 20, lineHeight: 24 },
  modalTitle: { ...semiBold, fontSize: 18, lineHeight: 22 },
  sectionTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  cardTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  compactCardTitle: { ...semiBold, fontSize: 13, lineHeight: 18 },
  body: { ...regular, fontSize: 14, lineHeight: 20 },
  label: { ...medium, fontSize: 14, lineHeight: 18 },
  button: { ...semiBold, fontSize: 14, lineHeight: 18 },
  supporting: { ...regular, fontSize: 12, lineHeight: 16 },
  caption: { ...regular, fontSize: 11, lineHeight: 16 },
  navLabel: { ...regular, fontSize: 11, lineHeight: 16 },
} as const;

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
} as const;

export const fixedRadii = {
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
} as const;

export const borderWidths = {
  1: 1,
  2: 2,
} as const;

export const icon = {
  control: 14,
  compact: 16,
  section: 18,
  standard: 24,
  action: 28,
  navigation: 32,
  status: 32,
} as const;

export const dimensions = {
  primaryButton: { minHeight: 48, radius: 24, width: "100%" },
  compactSecondaryButton: { visualHeight: 32, radius: 16, minTouchTarget: 48 },
  header: { contentHeight: 48 },
  finalAction: { buttonHeight: 48 },
  mainNavigation: { visualHeight: 66, radius: 33 },
  activeDestination: { visualHeight: 56, radius: 28 },
  globalSearch: { visualDiameter: 58, radius: 29 },
  standardCard: { radius: 12 },
} as const;

export const minTouchTarget = 48;

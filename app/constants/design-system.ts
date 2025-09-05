export const Colors = {
  primary: "#538083",
  primaryLight: "#7ba5a8",
  primaryDark: "#2a7f62",
  secondary: "#c3acce",
  secondaryLight: "#d8c2e3",
  secondaryDark: "#a088b5",
  
  background: "#fdfefe",
  backgroundSubtle: "#f8fafb",
  backgroundTinted: "#f4f8f9",
  surface: "#ffffff",
  surfaceTinted: "#fcfdfe",
  
  text: "#2c3e50",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  
  accent1: "#e8f4f8",
  accent2: "#f0e8f4",
  accent3: "#fef7e0",
  accent4: "#f0f9ff",
  
  border: "rgba(139, 160, 164, 0.2)",
  borderLight: "rgba(139, 160, 164, 0.08)",
  borderAccent: "rgba(195, 172, 206, 0.3)",
  shadow: "#4a5568",

  buttonPrimary: "#538083",
  buttonSecondary: "#c3acce",
  buttonDisabled: "#e2e8f0",
  error: "#e53e3e",
  success: "#38a169",
  warning: "#d69e2e",

  overlay: "rgba(83, 128, 131, 0.15)",
} as const;

export const Typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 15,
    md: 16,
    lg: 17,
    xl: 20,
    "2xl": 22,
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  } as const,
  lineHeights: {
    tight: 1.25,
    normal: 1.4,
    relaxed: 1.5,
  },
  letterSpacing: {
    tight: -0.2,
    normal: 0,
    wide: 0.1,
    wider: 0.2,
    widest: 0.5,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 60,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryLarge: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const Components = {
  button: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: 32,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: Typography.letterSpacing.wider,
  },
  buttonSecondary: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 28,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
    backgroundColor: Colors.accent2,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  card: {
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    backgroundColor: Colors.surfaceTinted,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardAccent: {
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    backgroundColor: Colors.accent1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    fontSize: Typography.fontSizes.md,
    backgroundColor: Colors.surfaceTinted,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    lineHeight: 22,
  },
  formSection: {
    backgroundColor: Colors.surfaceTinted,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
} as const;

export const Layout = {
  screenPadding: Spacing["2xl"],
  headerHeight: 60,
  tabBarHeight: {
    ios: 84,
    default: 60,
  },
  bottomPadding: {
    form: 140,
    list: 120,
  },
} as const;

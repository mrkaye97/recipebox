export const Colors = {
  primary: "#538083",
  primaryDark: "#2a7f62",
  secondary: "#c3acce",
  background: "#ffffff",
  backgroundSubtle: "#fafafa",
  surface: "#ffffff",
  text: "#1a1a1a",
  textSecondary: "#6c757d",
  border: "rgba(195, 172, 206, 0.2)",
  borderLight: "rgba(0, 0, 0, 0.06)",
  shadow: "#000000",

  buttonPrimary: "#538083",
  buttonDisabled: "#c3acce",
  error: "#2a7f62",

  overlay: "rgba(137, 144, 159, 0.15)",
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
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSizes.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    lineHeight: 22,
  },
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
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

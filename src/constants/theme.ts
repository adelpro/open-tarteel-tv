export type AppThemeColors = {
  bg: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  border: string;
  focusBg: string;
};

export function getThemeColors(isDark: boolean): AppThemeColors {
  const bg = isDark ? "#121212" : "#FFFFFF";
  const textPrimary = isDark ? "#fff" : "#111";
  const textSecondary = isDark ? "#AAA" : "#555";
  const cardBg = isDark ? "#1E1E1E" : "#EFEFEF";
  const border = isDark ? "#333" : "#D0D0D0";
  const focusBg = isDark ? "#2E2E2E" : "#E0E0E0";
  return {
    bg,
    textPrimary,
    textSecondary,
    cardBg,
    border,
    focusBg,
  };
}

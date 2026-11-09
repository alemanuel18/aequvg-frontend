export type AppTheme = "public-green" | "admin-teal" | "unified";

// Development-only visual switch. Components consume semantic CSS tokens, so
// changing the theme does not alter routes, data or product behaviour.
export const APP_THEME: AppTheme = "unified";

export type Theme = "toolkit" | "covalues" | "mesh" | "default";

export function getThemeTextClass(theme: Theme): string {
  switch (theme) {
    case "default":
      return "text-fill-contrast";
    case "toolkit":
      return "text-accent-fill";
    case "covalues":
      return "text-cov-fill";
    case "mesh":
      return "text-fill-contrast";
    default:
      return "theme-default";
  }
}

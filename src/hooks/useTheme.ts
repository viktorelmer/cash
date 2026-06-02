import { useEffect } from "react";
import { useSettings } from "@/stores/useSettings";

export function useApplyTheme() {
  const theme = useSettings((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark =
        theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", isDark);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", isDark ? "#0a0a0a" : "#fafafa");
    };

    apply();

    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);
}

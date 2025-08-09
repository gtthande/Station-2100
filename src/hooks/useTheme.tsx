import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ThemeMode = "dark" | "light"; // light = VS Code Light Modern

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeAttr(mode: ThemeMode) {
  if (mode === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function getLocalTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" ? "light" : v === "dark" ? "dark" : null;
  } catch {
    return null;
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>("dark"); // default dark

  // Initial load: order userProfile.theme -> localStorage.theme -> default
  useEffect(() => {
    const localPref = getLocalTheme();
    // Apply local first to avoid FOUC while waiting on auth
    if (localPref) {
      setThemeState(localPref);
      applyThemeAttr(localPref);
    } else {
      applyThemeAttr("dark");
    }
  }, []);

  // Hydrate from server when user is available
  useEffect(() => {
    const serverPref = (user?.user_metadata as any)?.theme as ThemeMode | undefined;
    if (serverPref === "light" || serverPref === "dark") {
      setThemeState(serverPref);
      applyThemeAttr(serverPref);
      try { localStorage.setItem("theme", serverPref); } catch {}
    }
  }, [user]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const mode = e.newValue === "light" ? "light" : "dark";
        setThemeState(mode);
        applyThemeAttr(mode);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeAttr(mode);
    try { localStorage.setItem("theme", mode); } catch {}
    if (user) {
      // Persist to auth metadata (no DB schema change required)
      await supabase.auth.updateUser({ data: { theme: mode } });
    }
  };

  const toggleTheme = async () => {
    await setTheme(theme === "light" ? "dark" : "light");
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    toggleTheme,
    isLight: theme === "light",
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}

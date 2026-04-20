"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "./dictionaries/en.json";
import vi from "./dictionaries/vi.json";

type Dictionary = typeof vi;
type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, variables?: Record<string, string | number>) => string;
  dict: Dictionary;
}

const dictionaries = { en, vi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    let targetLang: Language = "vi";

    if (savedLang && (savedLang === "en" || savedLang === "vi")) {
      targetLang = savedLang;
    } else {
      targetLang = navigator.language.startsWith("en") ? "en" : "vi";
    }

    if (language !== targetLang) {
      setLanguage(targetLang);
    }
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (path: string, variables?: Record<string, string | number>) => {
    const keys = path.split(".");
    let result: unknown = dictionaries[language];

    for (const key of keys) {
      if (typeof result === "object" && result !== null && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }

    if (typeof result !== "string") return path;

    let translated = result;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        translated = translated.replace(`{${key}}`, value.toString());
      });
    }

    return translated;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t, dict: dictionaries[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

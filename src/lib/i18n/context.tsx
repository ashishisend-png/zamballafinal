/**
 * Language state for the whole site.
 *
 * SSR note: the server has no way to know the visitor's preference, so both
 * server and first client render use `DEFAULT_LANG`. The stored / browser
 * preference is applied in an effect, after hydration — reading localStorage in
 * a lazy initializer instead would render Portuguese over server-rendered
 * English and trip a hydration mismatch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, languages, type Dictionary, type Lang } from "./dictionary";

export const DEFAULT_LANG: Lang = "en";

const STORAGE_KEY = "zambhala-lang";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The active dictionary — `t.hero.title`, `t.booking.submit`, … */
  t: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (languages as readonly string[]).includes(value);
}

/** Stored choice wins; otherwise honour a Portuguese browser on first visit. */
function detectLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Private mode / blocked storage — fall through to the browser hint.
  }
  const preferred = window.navigator.languages ?? [window.navigator.language];
  for (const tag of preferred) {
    const base = tag?.split("-")[0]?.toLowerCase();
    if (isLang(base)) return base;
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const detected = detectLang();
    if (detected !== DEFAULT_LANG) setLangState(detected);
  }, []);

  // The document itself is outside React's tree here, so keep `<html lang>` and
  // the description in step — screen readers and crawlers read those, not state.
  useEffect(() => {
    const dict = dictionaries[lang];
    document.documentElement.lang = dict.htmlLang;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", dict.meta.description);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A visitor who can't persist the choice still gets it for this session.
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <LanguageProvider>");
  return value;
}

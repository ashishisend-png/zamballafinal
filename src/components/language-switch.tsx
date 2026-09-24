import { languageNames, languages, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Segmented EN | PT control. Buttons rather than a <select> so the inactive
 * language stays visible — the switch has to be legible to someone who cannot
 * read the language currently on screen.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.languageSwitch.label}
      className={cn(
        "glass-field flex items-center rounded-full p-0.5",
        className,
      )}
    >
      {languages.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            title={languageNames[code].full}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] tracking-[0.16em] uppercase transition-colors duration-[var(--motion-quick)]",
              active
                ? "bg-gold text-ink"
                : "text-cream-muted hover:text-gold",
            )}
          >
            <span aria-hidden="true">{languageNames[code].short}</span>
            <span className="sr-only">{languageNames[code].full}</span>
          </button>
        );
      })}
    </div>
  );
}

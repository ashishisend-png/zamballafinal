import { Menu } from "lucide-react";
import { useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "#essence", key: "essence" },
  { href: "#menu", key: "treatments" },
  { href: "#booking", key: "book" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="glass-header fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <a href="#top" className="flex items-center gap-3">
          <img
            src="/logo-mark.png"
            alt="Zambhala Thai Massage"
            className="size-14 rounded-full object-cover ring-1 ring-gold/45 sm:size-16"
          />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-lg tracking-[0.18em] text-gold">ZAMBHALA</span>
            <span className="text-[10px] tracking-[0.28em] text-cream-muted uppercase">
              {t.nav.wordmarkSub}
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-xs tracking-[0.18em] text-cream-muted uppercase transition-colors duration-[var(--motion-quick)] hover:bg-cream/5 hover:text-gold"
            >
              {t.nav[link.key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <a href="#booking">{t.nav.bookRitual}</a>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label={t.nav.openMenu}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <p className="font-display text-2xl text-gold">Zambhala</p>
              <nav className="mt-10 flex flex-col gap-5">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      className="font-display text-2xl text-cream hover:text-gold"
                    >
                      {t.nav[link.key]}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <SheetClose asChild>
                <Button asChild size="lg" className="mt-10 w-full">
                  <a href="#booking">{t.nav.bookRitual}</a>
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

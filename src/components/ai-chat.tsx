import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { answer } from "@/lib/chat/engine";
import { useI18n } from "@/lib/i18n";

type Message = { role: "user" | "bot"; text: string };

/** Small delay so the "thinking" dots read naturally — not a network call. */
const THINK_MS = 650;

export function AiChat() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openChat() {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: "bot", text: t.chat.greeting }]);
    }
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

  function send(text: string) {
    const q = text.trim();
    if (!q || waiting) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setDraft("");
    setWaiting(true);
    const reply = answer(q, lang);
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: reply ?? t.chat.unknown }]);
      setWaiting(false);
    }, THINK_MS);
  }

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting, open]);

  // Escape closes the chat like a dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const chips = [
    { label: t.chat.chipPrices, ask: () => send(t.chat.chipPrices) },
    { label: t.chat.chipTreatments, ask: () => send(t.chat.chipTreatments) },
    { label: t.chat.chipHours, ask: () => send(t.chat.chipHours) },
    { label: t.chat.chipBook, ask: () => send(t.chat.chipBook) },
  ];

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t.chat.label}
          data-ai-chat-panel
          className="glass chat-pop !fixed right-4 bottom-24 z-[60] flex max-h-[min(30rem,72vh)] w-[min(100vw_-_2rem,24rem)] flex-col overflow-hidden rounded-2xl ring-1 ring-gold/25"
        >
          <div className="flex items-center justify-between gap-3 border-b border-cream/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-gold-bright to-gold text-ink">
                <Sparkles className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-cream">{t.chat.name}</p>
                <p className="text-[11px] tracking-[0.14em] text-cream-muted uppercase">
                  {t.chat.label}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.chat.close}
              className="rounded-full p-1.5 text-cream-muted transition-colors hover:bg-cream/10 hover:text-gold"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p
                  key={i}
                  className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-linear-to-br from-gold-bright to-gold px-4 py-2.5 text-sm text-ink"
                >
                  {m.text}
                </p>
              ) : (
                <p
                  key={i}
                  className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-cream/10 bg-cream/8 px-4 py-2.5 text-sm whitespace-pre-line text-cream backdrop-blur-md"
                >
                  {m.text}
                </p>
              ),
            )}
            {waiting && (
              <div
                aria-label={t.chat.waitLabel}
                className="flex items-center gap-1 self-start rounded-2xl rounded-bl-sm border border-cream/10 bg-cream/8 px-4 py-3 backdrop-blur-md"
              >
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 px-4 pb-1">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.ask}
                className="glass-field rounded-full px-3 py-1.5 text-xs text-cream-muted transition-colors hover:border-gold/50 hover:text-gold"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="border-t border-cream/10 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.chat.placeholder}
                aria-label={t.chat.placeholder}
                className="glass-field h-10 w-full rounded-full px-4 text-sm text-cream placeholder:text-cream-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
              />
              <button
                type="submit"
                aria-label={t.chat.send}
                disabled={!draft.trim() || waiting}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold-bright to-gold text-ink transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        data-ai-chat-launcher
        onClick={open ? () => setOpen(false) : openChat}
        aria-label={open ? t.chat.close : t.chat.open}
        aria-expanded={open}
        className="chat-pop fixed right-4 bottom-4 z-[60] flex items-center gap-2.5 rounded-full bg-linear-to-br from-gold-bright to-gold py-2 pr-2.5 pl-2 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_rgba(201,164,92,0.35),0_24px_60px_rgba(0,0,0,0.45)] transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:scale-105 active:scale-95"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/15">
          <Sparkles className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col items-start text-left leading-tight">
          <span className="text-sm font-semibold tracking-[0.02em]">{t.chat.name}</span>
          <span className="text-[10px] font-medium tracking-[0.16em] uppercase opacity-75">
            {t.chat.label}
          </span>
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/15">
          {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        </span>
      </button>
    </>
  );
}
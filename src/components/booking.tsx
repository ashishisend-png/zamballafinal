import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/reveal";
import { to12h } from "@/lib/time";
import {
  loadBookings,
  saveBookings,
  timeSlots,
  treatments,
  type Booking,
  type Treatment,
  type TreatmentId,
} from "@/lib/spa";

type Props = {
  preset: { treatment: Treatment; duration: number } | null;
  onPresetConsumed: () => void;
};

export function Booking({ preset, onPresetConsumed }: Props) {
  const { t } = useI18n();
  const [treatmentId, setTreatmentId] = useState(treatments[0].id);
  const [duration, setDuration] = useState(treatments[0].durations[1] ?? 60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(timeSlots[2]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [confirm, setConfirm] = useState<Booking | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setBookings(loadBookings());
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!preset) return;
    setTreatmentId(preset.treatment.id);
    setDuration(preset.duration);
    onPresetConsumed();
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  }, [preset, onPresetConsumed]);

  const treatment = useMemo(
    () => treatments.find((x) => x.id === treatmentId) ?? treatments[0],
    [treatmentId],
  );

  const price = treatment.prices[duration] ?? treatment.prices[treatment.durations[0]];

  function onTreatmentChange(id: TreatmentId) {
    const next = treatments.find((x) => x.id === id);
    if (!next) return;
    setTreatmentId(id);
    if (!next.durations.includes(duration)) {
      setDuration(next.durations[0]);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !date) {
      setError(t.booking.missingFields);
      return;
    }
    const booking: Booking = {
      id: crypto.randomUUID(),
      treatmentId,
      duration,
      date,
      time,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [booking, ...bookings].slice(0, 12);
    setBookings(next);
    saveBookings(next);
    setConfirm(booking);
    setNotes("");
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <section id="booking" className="relative isolate overflow-hidden bg-forest/70 py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob blob-slower absolute top-16 right-[-8rem] size-[26rem] rounded-full bg-gold/12 blur-[120px]" />
        <div className="blob blob-slow absolute bottom-[-6rem] left-[-6rem] size-[26rem] rounded-full bg-moss/60 blur-[120px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="text-xs tracking-[0.28em] text-gold uppercase">{t.booking.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl text-cream sm:text-5xl">{t.booking.title}</h2>
          <p className="mt-4 max-w-prose text-cream-muted">{t.booking.body}</p>

          <form onSubmit={submit} className="glass mt-8 grid gap-4 rounded-xl p-5 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2">
              <Label htmlFor="treatment">{t.booking.treatment}</Label>
              <select
                id="treatment"
                value={treatmentId}
                onChange={(e) => onTreatmentChange(e.target.value as TreatmentId)}
                className="glass-field mt-2 flex h-11 w-full rounded-md px-3 text-sm text-cream outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/30"
              >
                {treatments.map((option) => (
                  <option key={option.id} value={option.id} className="bg-forest">
                    {t.treatments[option.id].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="duration">{t.booking.duration}</Label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="glass-field mt-2 flex h-11 w-full rounded-md px-3 text-sm text-cream outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/30"
              >
                {treatment.durations.map((d) => (
                  <option key={d} value={d} className="bg-forest">
                    {t.booking.durationOption(d, treatment.prices[d])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="date">{t.booking.date}</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="time">{t.booking.time}</Label>
              <select
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="glass-field mt-2 flex h-11 w-full rounded-md px-3 text-sm text-cream outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/30"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot} className="bg-forest">
                    {to12h(slot)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">{t.booking.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t.booking.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2"
                autoComplete="tel"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">{t.booking.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                autoComplete="email"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">{t.booking.notes}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                placeholder={t.booking.notesPlaceholder}
              />
            </div>
            {error ? <p className="sm:col-span-2 text-sm text-gold-bright">{error}</p> : null}
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="font-display text-3xl text-gold">{t.price(price)}</p>
              <Button type="submit" size="lg">
                {t.booking.submit}
              </Button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={140}>
          <aside className="glass h-full rounded-xl p-6">
          <h3 className="font-display text-2xl text-cream">{t.booking.heldTitle}</h3>
          <p className="mt-2 text-sm text-cream-muted">{t.booking.heldBody}</p>
          <ul className="mt-6 space-y-3">
            {bookings.length === 0 ? (
              <li className="rounded-lg border border-dashed border-cream/20 px-4 py-8 text-center text-sm text-cream-muted">
                {t.booking.heldEmpty}
              </li>
            ) : (
              bookings.map((b) => {
                const booked = treatments.find((x) => x.id === b.treatmentId);
                return (
                  <li key={b.id} className="glass-field rounded-lg px-4 py-3">
                    <p className="text-sm text-cream">
                      {booked ? t.treatments[booked.id].name : t.booking.fallbackTreatment}
                    </p>
                    <p className="mt-1 text-xs text-cream-muted">
                      {b.date} · {to12h(b.time)} · {t.booking.minutesShort(b.duration)} · {b.name}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
          </aside>
        </Reveal>
      </div>

      <Dialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <div className="flex size-10 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Check className="size-5" />
          </div>
          <DialogTitle className="mt-4">{t.booking.confirmTitle}</DialogTitle>
          <DialogDescription>
            {confirm
              ? t.booking.confirmBody(
                  t.treatments[confirm.treatmentId].name,
                  confirm.date,
                  to12h(confirm.time),
                )
              : null}
          </DialogDescription>
          <Button className="mt-6 w-full" onClick={() => setConfirm(null)}>
            {t.booking.close}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

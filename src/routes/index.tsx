import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AiChat } from "@/components/ai-chat";
import { Booking } from "@/components/booking";
import { Essence } from "@/components/essence";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Treatments } from "@/components/treatments";
import type { Treatment } from "@/lib/spa";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [preset, setPreset] = useState<{
    treatment: Treatment;
    duration: number;
  } | null>(null);

  const onBook = useCallback((treatment: Treatment, duration: number) => {
    setPreset({ treatment, duration });
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <Essence />
        <Treatments onBook={onBook} />
        <Booking preset={preset} onPresetConsumed={() => setPreset(null)} />
      </main>
      <SiteFooter />
      <AiChat />
    </>
  );
}

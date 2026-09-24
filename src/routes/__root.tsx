import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { LanguageProvider } from "@/lib/i18n";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Splash } from "@/components/splash";
import appCss from "../styles.css?url";

const APP_NAME = "Zambhala Thai Massage";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Zambhala Thai Massage — a sanctuary of authentic Thai healing. Traditional massage, hot oil, and recovery rituals.",
      },
      { name: "theme-color", content: "#07110c" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  // `lang` / description are the SSR defaults; LanguageProvider updates both
  // on the document once the visitor's language is known (see lib/i18n/context).
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="isolate min-h-dvh bg-ink font-sans text-cream">
        <div aria-hidden className="aurora" />
        <PreviewHostBridge />
        <Splash />
        <AuthProvider>
          <LanguageProvider>
            <Outlet />
          </LanguageProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

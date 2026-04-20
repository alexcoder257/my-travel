import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Roamboo — Travel with love",
    template: "%s · Roamboo",
  },
  description: "Plan trips, track spending, and relive memories — all in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roamboo",
  },
};

export const viewport: Viewport = {
  themeColor: "#365d2f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--surface-body)" }}
      >
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <main className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom))]">
                {children}
              </main>
              <Navbar />
              <Toaster />
              <ServiceWorkerRegister />
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

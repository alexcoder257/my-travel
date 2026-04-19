import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lịch trình - Singapore & Malaysia",
  description: "Theo dõi lịch trình, chi tiêu và địa điểm đã đến",
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
        <ToastProvider>
          <main className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <Navbar />
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}

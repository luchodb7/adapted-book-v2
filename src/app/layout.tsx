import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";
import { SkipLink } from "@/components/a11y/skip-link";
import { A11yToolbar } from "@/components/a11y/a11y-toolbar";
import { ServiceWorkerRegistration } from "@/components/common/service-worker-registration";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Adapted Books — Accessible Social Stories Made Easy",
    template: "%s · Adapted Books",
  },
  description:
    "Create, adapt, and share social stories and accessible learning materials with ARASAAC pictograms. Built for families, teachers, therapists, and schools.",
  applicationName: "Adapted Books",
  keywords: [
    "social stories",
    "ARASAAC",
    "pictograms",
    "AAC",
    "special education",
    "accessibility",
    "autism",
    "easy read",
  ],
  authors: [{ name: "Adapted Books" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Adapted Books",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Adapted Books",
    title: "Adapted Books",
    description: "Accessible social stories and educational materials.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SkipLink />
        <Providers>{children}</Providers>
        <A11yToolbar />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import SiteFooter from "@/components/SiteFooter";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = JetBrains_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "GradePoints - Track Your School Grades",
  description: "A simple app to track and manage your school grades",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GradePoints",
  },
};

/**
 * Applies the stored theme before first paint to avoid a flash.
 * "dark" is the default; "light" and "system" are opt-in via the theme switcher.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('gp-theme');var d=document.documentElement;if(t==='light'){d.setAttribute('data-theme','light');}else if(t==='system'){d.setAttribute('data-theme',window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}else{d.setAttribute('data-theme','dark');}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorkerRegistrar />
        <SiteFooter />
      </body>
    </html>
  );
}

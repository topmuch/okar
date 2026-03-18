import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/pwa-registration";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OKAR - L'histoire réelle de votre voiture",
    template: "%s | OKAR",
  },
  description: "Le passeport numérique de votre véhicule au Sénégal. Historique d'entretien infalsifiable accessible via QR Code.",
  keywords: ["QR", "véhicule", "voiture", "automobile", "passeport", "entretien", "garage", "Sénégal", "maintenance"],
  authors: [{ name: "OKAR Team" }],
  creator: "OKAR",
  publisher: "OKAR",
  metadataBase: new URL("https://okar.sn"),

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#f97316" },
    ],
  },

  // Open Graph
  openGraph: {
    title: "OKAR - L'histoire réelle de votre voiture",
    description: "Le passeport numérique de votre véhicule au Sénégal. Historique d'entretien infalsifiable accessible via QR Code.",
    url: "https://okar.sn",
    siteName: "OKAR",
    type: "website",
    locale: "fr_SN",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "OKAR Logo",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "OKAR - L'histoire réelle de votre voiture",
    description: "Le passeport numérique de votre véhicule au Sénégal.",
    images: ["/icons/icon-512x512.png"],
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "OKAR",
  appleWebApp: {
    capable: true,
    title: "OKAR",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px)" },
    ],
  },

  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Other
  robots: {
    index: true,
    follow: true,
  },

  // Alternates
  alternates: {
    canonical: "https://okar.sn",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme script - runs before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OKAR" />
        <meta name="application-name" content="OKAR" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

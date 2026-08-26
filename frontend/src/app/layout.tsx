import { Suspense } from "react";
import { Montserrat, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
import ScrollToTop from "@/components/ScrollToTop";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
});
const FloatingWhatsApp = dynamic(
  () => import("@/components/FloatingWhatsApp"),
  {
    loading: () => null,
  },
);
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import {
  fetchPublicSettingsResult,
  fetchWebsiteSettingsResult,
  fetchThemeResult,
  fetchPublicFooterSettingsResult,
} from "@/lib/api";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "./";
  const isStaging = false;

  return {
    title: "YouthCamping — Adventure Tours for Young India",
    description:
      "Book Himachal Pradesh, Ladakh, Kashmir, Kerala group tours. Best adventure trips for young adults from Gujarat.",
    metadataBase: new URL("https://youthcamping.in"),
    verification: {
      google: "Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA",
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isStaging
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: "YouthCamping — Adventure Tours for Young India",
      description: "Book group adventure tours across India.",
      url: canonicalUrl,
      siteName: "YouthCamping",
      images: [
        {
          url: "https://youthcamping.in/og-image.jpg",
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "YouthCamping — Adventure Tours for Young India",
      description: "Book group adventure tours across India.",
      images: ["https://youthcamping.in/og-image.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settingsResult, websiteSettingsResult, themeResult, footerResult] =
    await Promise.all([
      fetchPublicSettingsResult(),
      fetchWebsiteSettingsResult(),
      fetchThemeResult(),
      fetchPublicFooterSettingsResult(),
    ]);

  const settings = settingsResult.ok ? settingsResult.data : null;
  const websiteSettings = websiteSettingsResult.ok
    ? websiteSettingsResult.data
    : null;
  const theme = themeResult.ok ? themeResult.data : null;
  const footerConfig = footerResult.ok ? footerResult.data : null;

  const mergedSettings = {
    ...(settings || {}),
    ...(websiteSettings || {}),
    navbar: {
      ...settings?.navbar,
      links: websiteSettings?.navigation || settings?.navbar?.links,
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${playfair.variable} ${caveat.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full w-full flex flex-col font-montserrat relative"
      >
        <DynamicThemeProvider
          initialTheme={theme}
          initialSettings={
            settingsResult.ok || websiteSettingsResult.ok
              ? mergedSettings
              : null
          }
        >
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Navbar
            logoUrl={mergedSettings?.navbar?.logoUrl}
            navLinks={mergedSettings?.navbar?.links}
          />
          <main className="flex-grow w-full min-w-0">{children}</main>
          <Footer footerConfig={footerConfig} />
          <FloatingWhatsApp settings={mergedSettings} />
        </DynamicThemeProvider>
      </body>
    </html>
  );
}

import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import ScrollToTop from "@/components/ScrollToTop";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
});
const FloatingWhatsApp = dynamic(() => import("@/components/FloatingWhatsApp"), {
  loading: () => null,
});
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import { fetchPublicSettings, fetchTheme } from "@/lib/api";

const settleWithin = async <T,>(promise: Promise<T>, milliseconds: number): Promise<T | null> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), milliseconds);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "./";
  const isStaging = false;

  return {
    title: "YouthCamping — Adventure Tours for Young India",
    description: "Book Himachal Pradesh, Ladakh, Kashmir, Kerala group tours. Best adventure trips for young adults from Gujarat.",
    metadataBase: new URL("https://youthcamping.in"),
    verification: {
      google: "Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA",
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isStaging ? {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      }
    } : {
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
      images: [{ url: "https://youthcamping.in/og-image.jpg", width: 1200, height: 630 }],
      locale: "en_IN",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: "YouthCamping — Adventure Tours for Young India",
      description: "Book group adventure tours across India.",
      images: ["https://youthcamping.in/og-image.jpg"]
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  let theme = null;
  const siteConfigResults = await Promise.allSettled([
    settleWithin(fetchPublicSettings(), 1500),
    settleWithin(fetchTheme(), 1500),
  ]);
  if (siteConfigResults[0].status === 'fulfilled') settings = siteConfigResults[0].value;
  else console.error("Layout settings fetch error:", siteConfigResults[0].reason);
  if (siteConfigResults[1].status === 'fulfilled') theme = siteConfigResults[1].value;
  else console.error("Layout theme fetch error:", siteConfigResults[1].reason);

  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-montserrat relative">
        <DynamicThemeProvider initialTheme={theme} initialSettings={settings}>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Navbar 
            logoUrl={settings?.navbar?.logoUrl} 
            navLinks={settings?.navbar?.links} 
          />
          <main className="flex-grow pt-[var(--navbar-height)] md:pt-0">{children}</main>
          <Footer 
            logoUrl={settings?.navbar?.logoUrl || settings?.footer?.logoUrl} 
            address={settings?.footer?.address} 
            phone={settings?.footer?.phone} 
          />
          <FloatingWhatsApp settings={settings} />
        </DynamicThemeProvider>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";
import { SITE_URL } from "../constants/constants";

const SITE_NAME = "Bolorko";
const SITE_DESCRIPTION =
  "Bolorko (bolorko.mn) — Загварлаг хувцас болон бүх төрлийн бараа захиалгийн онлайн дэлгүүр. Монголдоо хямд үнэ, хурдан хүргэлттэй.";
const FACEBOOK_URL = "https://www.facebook.com/momsoonshop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bolorko — Онлайн дэлгүүр | bolorko.mn",
    template: "%s | Bolorko",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "bolorko",
    "bolorko.mn",
    "Bolorko дэлгүүр",
    "Bolorko онлайн дэлгүүр",
    "онлайн дэлгүүр",
    "хувцас захиалга",
    "Монгол онлайн шоппинг",
  ],
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  icons: {
    icon: "/imgs/icon.png",
    shortcut: "/imgs/icon.png",
    apple: "/imgs/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "/",
    siteName: SITE_NAME,
    title: "Bolorko — Онлайн дэлгүүр",
    description: SITE_DESCRIPTION,
    images: [{ url: "/imgs/icon.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: "Bolorko — Онлайн дэлгүүр",
    description: SITE_DESCRIPTION,
    images: ["/imgs/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

// CSP-ийн nonce (middleware.ts) хүсэлт бүрд шинээр үүсдэг тул хуудсууд
// static/pre-rendered биш, DYNAMIC-аар render хийгдэх ёстой — эс тэгвээс
// build үеийн nonce (HTML-д баригдсан) ба хүсэлтийн header дэх nonce
// хэзээ ч таарахгүй, Next.js-ийн өөрийн inline script-ууд ч блоклогдоно.
export const dynamic = "force-dynamic";

// Google-д брэндийн нэрээр (жишээ нь "bolorko") хайхад Bolorko-г шууд
// танигдах байгууллага/сайт хэлбэрээр харуулах JSON-LD бүтэцтэй өгөгдөл
async function StructuredData() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: "Bolorko.mn",
        url: SITE_URL,
        logo: `${SITE_URL}/imgs/icon.png`,
        sameAs: [FACEBOOK_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/shop?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`antialiased`} suppressHydrationWarning={true}>
        <StructuredData />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

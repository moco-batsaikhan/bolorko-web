import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";

export const metadata: Metadata = {
  title: "Bolorko бүх төрлийн бараа захиалга",
  description: "Bolorko — Загварлаг хувцас болон бүх төрлийн бараа захиалгийн онлайн дэлгүүр",
};

// CSP-ийн nonce (middleware.ts) хүсэлт бүрд шинээр үүсдэг тул хуудсууд
// static/pre-rendered биш, DYNAMIC-аар render хийгдэх ёстой — эс тэгвээс
// build үеийн nonce (HTML-д баригдсан) ба хүсэлтийн header дэх nonce
// хэзээ ч таарахгүй, Next.js-ийн өөрийн inline script-ууд ч блоклогдоно.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`antialiased`} suppressHydrationWarning={true}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

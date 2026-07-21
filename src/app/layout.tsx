import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";

export const metadata: Metadata = {
  title: "Bolorko — Хувцас, аяллын хэрэгслийн дэлгүүр",
  description: "Bolorko — Загварлаг хувцас болон аяллын хэрэгслийн онлайн дэлгүүр",
};

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

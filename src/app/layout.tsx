import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";

export const metadata: Metadata = {
  title: "Bolorko бүх төрлийн бараа захиалга",
  description: "Bolorko — Загварлаг хувцас болон бүх төрлийн бараа захиалгийн онлайн дэлгүүр",
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

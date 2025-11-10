import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";

export const metadata: Metadata = {
  title: "MEGA",
  description: "MEGA Rubik's Cube Club System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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

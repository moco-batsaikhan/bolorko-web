import type { Metadata } from "next";
import "./globals.css";

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
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}

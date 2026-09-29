import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SORIKO CLUB",
  description: "Pokémon TCG · Japan to Europe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

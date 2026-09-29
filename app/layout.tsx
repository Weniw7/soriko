import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soriko Club | Pokémon TCG, Japón y comunidad",
  description: "Soriko Club: Pokémon TCG japonés, español e inglés, producto sellado, accesorios y comunidad para coleccionistas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JATECH // Servicio Técnico, Impresiones 3D y Software a Medida",
  description:
    "Reparación rápida y confiable de computadoras y notebooks, fabricación e impresión 3D a medida con precios accesibles y diseño de landing pages y software para hacer crecer tu negocio.",
  keywords: [
    "Jatech",
    "Servicio Técnico",
    "Reparación de Notebooks",
    "Impresión 3D",
    "Venta Mayorista 3D",
    "Landing Pages",
    "Software a Medida",
  ],
  authors: [{ name: "Jatech Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050508",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth`}
    >
      <body className="bg-[#050508] text-slate-100 font-sans min-h-screen selection:bg-cyan-500/30 selection:text-white antialiased overflow-x-hidden relative">
        {children}
      </body>
    </html>
  );
}

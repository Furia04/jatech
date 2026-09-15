import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthListener } from "@/components/auth/auth-listener";
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
  metadataBase: new URL("https://jatech.com.ar"),
  title: {
    default: "JATECH - Soluciones Informáticas & Impresión 3D | San Juan",
    template: "%s | JATECH",
  },
  description:
    "Servicio técnico especializado en reparación de notebooks, computadoras, celulares e impresoras en San Juan. Impresión 3D a medida, desarrollo de software, landing pages y marketing digital.",
  keywords: [
    "JATECH",
    "Servicio Técnico San Juan",
    "Reparación de Notebooks San Juan",
    "Arreglo de Computadoras San Juan",
    "Reparación de Celulares San Juan",
    "Servicio Técnico de Impresoras",
    "Impresión 3D San Juan",
    "Piezas 3D por Mayor",
    "Landing Pages San Juan",
    "Software a Medida",
    "Marketing Digital San Juan",
    "Publicidad Google Ads San Juan",
  ],
  authors: [{ name: "Jatech Team", url: "https://instagram.com/jatech_sj" }],
  creator: "JATECH",
  publisher: "JATECH",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://jatech.com.ar",
    title: "JATECH - Soluciones Informáticas & Impresión 3D",
    description:
      "Servicio técnico de notebooks, celulares e impresoras, piezas 3D a medida, software y marketing digital en San Juan, Argentina.",
    siteName: "JATECH",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "JATECH - Soluciones Informáticas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JATECH - Soluciones Informáticas & Impresión 3D",
    description:
      "Servicio técnico confiable en San Juan. Notebooks, celulares, impresoras, 3D, software y marketing.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.png",
  },
  other: {
    "geo.region": "AR-J",
    "geo.placename": "San Juan, Argentina",
    "geo.position": "-31.5375;-68.5364",
    ICBM: "-31.5375, -68.5364",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050508",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "JATECH",
  "alternateName": "JATECH Soluciones Informáticas",
  "description":
    "Servicio técnico especializado de computadoras, notebooks, celulares e impresoras, piezas e impresión 3D a medida, software y marketing digital.",
  "url": "https://jatech.com.ar",
  "telephone": "+5492645045411",
  "email": "jatech.sj@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "San Juan",
    "addressRegion": "San Juan",
    "addressCountry": "AR",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -31.5375,
    "longitude": -68.5364,
  },
  "sameAs": [
    "https://instagram.com/jatech_sj",
    "https://wa.me/5492645045411",
  ],
  "priceRange": "$$",
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "San Juan, Argentina",
  },
  "founder": [
    {
      "@type": "Person",
      "name": "Ignacio Ortiz",
      "jobTitle": "Técnico en Informática & Reparaciones",
    },
    {
      "@type": "Person",
      "name": "Pablo Cortez",
      "jobTitle": "Diseñador 3D & Desarrollador de Software",
    },
    {
      "@type": "Person",
      "name": "Facundo Santana",
      "jobTitle": "Diseñador 3D & Desarrollador de Software",
    },
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Servicios de JATECH",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Reparación de Notebooks, PC, Celulares e Impresoras",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Modelado e Impresión 3D a Medida (Minorista y Mayorista)",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Diseño de Landing Pages y Desarrollo de Software",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Marketing Digital y Campañas de Publicidad en Meta & Google Ads",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Soporte Tecnológico para PyMEs e Instalación de Redes Wi-Fi",
        },
      },
    ],
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#050508] text-slate-100 font-sans min-h-screen selection:bg-cyan-500/30 selection:text-white antialiased overflow-x-hidden relative">
        <AuthListener />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

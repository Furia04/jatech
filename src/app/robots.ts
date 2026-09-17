import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jatech.com.ar";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/GestionTecnicos/dashboard",
        "/GestionTecnicos/orders",
        "/GestionTecnicos/customers",
        "/GestionTecnicos/inventory",
        "/GestionTecnicos/devices",
        "/GestionTecnicos/settings",
        "/GestionTecnicos/admin",
        "/dashboard",
        "/admin",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

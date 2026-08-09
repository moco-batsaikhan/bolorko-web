import { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/admin-dashboard",
        "/cart",
        "/checkout",
        "/checkout/",
        "/profile",
        "/orders",
        "/settings",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

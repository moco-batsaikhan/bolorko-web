import { MetadataRoute } from "next";
import { apiService } from "@/services/apiService";
import { SITE_URL } from "@/constants/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/info`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  const products = await apiService.getProducts({ type: "PRODUCT" }).catch(() => []);

  const productRoutes: MetadataRoute.Sitemap = products
    .filter(product => product.status === "ACTIVE")
    .map(product => ({
      url: `${SITE_URL}/shop/${product.id}`,
      lastModified: new Date(product.updatedAt ?? product.createdAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...productRoutes];
}

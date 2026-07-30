import type { MetadataRoute } from "next";
import { listPublishedContent } from "@/lib/content/public-queries";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const content = await listPublishedContent();
  const staticPaths = ["/", "/about", "/ideas", "/projects", "/search"];

  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.6,
    })),
    ...content.map((item) => ({
      url: new URL(item.path, siteUrl).toString(),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: item.kind === "post" ? 0.8 : 0.7,
    })),
  ];
}

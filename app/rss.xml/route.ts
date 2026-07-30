import { listPublishedPosts } from "@/lib/content/public-queries";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await listPublishedPosts();
  const items = posts
    .map(
      (post) => `<item>
<title>${escapeXml(post.title)}</title>
<link>${escapeXml(new URL(post.path, siteUrl).toString())}</link>
<guid>${escapeXml(new URL(post.path, siteUrl).toString())}</guid>
<description>${escapeXml(post.description ?? "")}</description>
<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
</item>`,
    )
    .join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml(SITE_NAME)}</title>
<link>${escapeXml(siteUrl.toString())}</link>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

export const SITE_NAME = "Hard_Working";
export const SITE_TITLE = "Hard_Working — 개발 공부 기록";
export const SITE_DESCRIPTION =
  "학습·포트폴리오·생각·가치관을 한 곳에 쌓는 개인 블로그.";
export const POSTS_PER_PAGE = 12;
export const FEATURED_POST_COUNT = 3;

export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const value = configuredUrl ?? (vercelUrl ? `https://${vercelUrl}` : null);

  return new URL(value ?? "http://localhost:3000");
}

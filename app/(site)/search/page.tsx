import type { Metadata } from "next";
import { SearchPageClient } from "@/components/site/search-page-client";
import { listSearchIndex } from "@/lib/content/public-queries";

type SearchPageProps = Readonly<{
  searchParams: Promise<{ q?: string | string[] }>;
}>;

export const metadata: Metadata = {
  title: "검색",
  description: "Hard_Working 콘텐츠 검색.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const initialQuery = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const items = await listSearchIndex();

  return <SearchPageClient initialQuery={initialQuery} items={items} />;
}

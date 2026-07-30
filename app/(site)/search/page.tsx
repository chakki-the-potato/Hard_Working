import type { Metadata } from "next";
import { ContentRow } from "@/components/site/content-row";
import { listPublishedContent } from "@/lib/content/public-queries";

type SearchPageProps = Readonly<{
  searchParams: Promise<{ q?: string | string[] }>;
}>;

export const metadata: Metadata = {
  title: "검색",
  description: "Hard_Working 콘텐츠 검색.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const normalizedQuery = query.toLocaleLowerCase("ko-KR");
  const results =
    normalizedQuery === ""
      ? []
      : (await listPublishedContent()).filter((item) => {
          const searchable = [
            item.title,
            item.description,
            item.summary,
            item.bodyMarkdown,
            ...item.tags.map((tag) => tag.name),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("ko-KR");

          return searchable.includes(normalizedQuery);
        });

  return (
    <main>
      <section className="list-hero">
        <span className="mono-label">// SEARCH</span>
        <h1>
          <span>#</span> Search
        </h1>
        <form action="/search" className="search-form">
          <label htmlFor="search-query">글, 아이디어, 프로젝트 검색</label>
          <div>
            <input
              defaultValue={query}
              id="search-query"
              name="q"
              placeholder="검색어를 입력하세요."
              type="search"
            />
            <button type="submit">검색</button>
          </div>
        </form>
      </section>

      <section className="content-list">
        {query ? (
          <p className="search-summary">
            “{query}” 검색 결과 {results.length}개.
          </p>
        ) : (
          <p className="search-summary">검색어를 입력하세요.</p>
        )}
        {results.map((item) => (
          <ContentRow item={item} key={item.id} />
        ))}
      </section>
    </main>
  );
}

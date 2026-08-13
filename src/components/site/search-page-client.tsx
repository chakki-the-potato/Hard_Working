"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchIndexItem } from "@/lib/content/public-types";

type SearchPageClientProps = Readonly<{
  initialQuery: string;
  items: readonly SearchIndexItem[];
}>;

function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function SearchPageClient({
  initialQuery,
  items,
}: SearchPageClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "description", weight: 0.2 },
          { name: "tags", weight: 0.25 },
          { name: "categoryLabel", weight: 0.15 },
        ],
        threshold: 0.35,
      }),
    [items],
  );
  const normalizedQuery = query.trim();
  const results = normalizedQuery
    ? fuse.search(normalizedQuery).map((result) => result.item)
    : [];

  return (
    <>
      <section className="qt-search-hero">
        <span className="qt-mono qt-search-mono">// SEARCH</span>
        <h1 className="qt-search-title">
          글 찾기<span className="qt-search-dot">.</span>
        </h1>
        <p className="qt-search-desc">
          제목, 설명, 태그로 검색합니다. 단축키{" "}
          <span className="qt-key">⌘K</span> 또는{" "}
          <span className="qt-key">Ctrl+K</span>로 어디서든 빠른 팔레트를
          열 수 있어요.
        </p>
      </section>
      <main className="qt-search-main">
        <div className="qt-search-input-wrap">
          <svg
            aria-hidden="true"
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            autoComplete="off"
            autoFocus
            id="search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색어를 입력하세요…"
            type="search"
            value={query}
          />
        </div>
        <div className="qt-search-results" id="search-results">
          {results.map((item) => (
            <Link
              className="qt-search-row"
              href={item.path}
              key={item.path}
            >
              <span>
                <span className="qt-search-row-title">{item.title}</span>
                <span className="qt-search-row-meta">
                  {item.categoryLabel ? (
                    <span className="qt-search-cat">
                      [{item.categoryLabel.toUpperCase()}]
                    </span>
                  ) : null}
                  {item.tags[0] ? ` ${item.tags[0]}` : ""}
                </span>
              </span>
              <time className="qt-search-row-date" dateTime={item.pubDate}>
                {formatDate(item.pubDate)}
              </time>
            </Link>
          ))}
        </div>
        <div
          className="qt-search-state"
          hidden={normalizedQuery === "" || results.length > 0}
          id="search-empty"
        >
          <span className="qt-mono qt-search-state-mark">// NO_RESULTS</span>
          <p>검색 결과가 없습니다.</p>
        </div>
        <div
          className="qt-search-state"
          hidden={normalizedQuery !== ""}
          id="search-hint"
        >
          <span className="qt-mono qt-search-state-mark">// READY</span>
          <p>제목, 설명, 태그로 검색할 수 있습니다.</p>
        </div>
      </main>
    </>
  );
}

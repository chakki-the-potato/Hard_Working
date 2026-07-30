"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SearchIndexItem } from "@/lib/content/public-types";

const SEARCH_RESULT_LIMIT = 8;
const SEARCH_ATTEMPTS = 3;
const SEARCH_RETRY_DELAY_MS = 200;

type IndexedSearchItem = SearchIndexItem & Readonly<{ number: number }>;

function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

async function loadSearchItems(): Promise<readonly SearchIndexItem[]> {
  let lastStatus = 0;
  let lastMessage = "empty response";

  for (let attempt = 1; attempt <= SEARCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("/api/search.json");

      if (response.ok) {
        return (await response.json()) as readonly SearchIndexItem[];
      }

      lastStatus = response.status;
      lastMessage = response.statusText;
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : "network error";
    }

    if (attempt < SEARCH_ATTEMPTS) {
      console.warn(
        JSON.stringify({
          event: "search_index_retry",
          attempt,
          status: lastStatus,
          message: lastMessage,
        }),
      );
      await new Promise((resolve) => {
        window.setTimeout(resolve, SEARCH_RETRY_DELAY_MS * 2 ** (attempt - 1));
      });
    }
  }

  throw new Error(
    `검색 인덱스를 불러오지 못했습니다. status=${lastStatus}, cause=${lastMessage}. /api/search.json 응답을 확인하세요.`,
  );
}

export function SearchPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  const activeIndexRef = useRef(0);
  const resultsRef = useRef<readonly IndexedSearchItem[]>([]);
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly IndexedSearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);

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
  const results = useMemo(() => {
    const normalizedQuery = query.trim();
    const matches = normalizedQuery
      ? fuse.search(normalizedQuery).map((result) => result.item)
      : items;

    return matches.slice(0, SEARCH_RESULT_LIMIT);
  }, [fuse, items, query]);

  const closePalette = useCallback(() => {
    setOpen(false);
    openRef.current = false;
  }, []);
  const openPalette = useCallback(async () => {
    setOpen(true);
    openRef.current = true;
    setQuery("");
    setActiveIndex(0);
    setLoadError(false);

    if (loadedRef.current || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    try {
      const loadedItems = await loadSearchItems();
      setItems(
        loadedItems.map((item, index) => ({
          ...item,
          number: loadedItems.length - index,
        })),
      );
      loadedRef.current = true;
    } catch (error) {
      setLoadError(true);
      console.error(
        JSON.stringify({
          event: "search_index_load_failed",
          message: error instanceof Error ? error.message : "unknown error",
        }),
      );
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    resultsRef.current = results;
    if (activeIndex >= results.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, results]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.classList.add("qt-cmdk-open");
    inputRef.current?.focus();

    return () => {
      document.body.classList.remove("qt-cmdk-open");
    };
  }, [open]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-cmdk-trigger]")
      ) {
        event.preventDefault();
        void openPalette();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (openRef.current) {
          closePalette();
        } else {
          void openPalette();
        }
        return;
      }
      if (!openRef.current) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }
      const availableResults = resultsRef.current;
      if (availableResults.length === 0) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          (activeIndexRef.current + offset + availableResults.length) %
          availableResults.length;
        setActiveIndex(nextIndex);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const selected = availableResults[activeIndexRef.current];
        if (selected) {
          closePalette();
          router.push(`/posts/${selected.id}`);
        }
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("qt-cmdk-open");
    };
  }, [closePalette, openPalette, router]);

  return (
    <div className="qt-cmdk" hidden={!open} id="qt-cmdk">
      <button
        aria-label="검색 팔레트 닫기"
        className="qt-cmdk-backdrop"
        data-cmdk-backdrop
        onClick={closePalette}
        type="button"
      />
      <div
        aria-label="검색 팔레트"
        aria-modal="true"
        className="qt-cmdk-modal"
        role="dialog"
      >
        <div className="qt-cmdk-header">
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            autoComplete="off"
            id="qt-cmdk-input"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="글 제목, 태그, 설명 검색…"
            ref={inputRef}
            type="search"
            value={query}
          />
          <span className="qt-cmdk-key">ESC</span>
        </div>
        <div className="qt-cmdk-results" id="qt-cmdk-results">
          {loadError ? (
            <div className="qt-cmdk-empty">
              <span className="qt-cmdk-empty-mark">// LOAD_ERROR</span>
              검색 데이터를 불러오지 못했어요.
            </div>
          ) : results.length > 0 ? (
            results.map((item, index) => (
              <Link
                className={`qt-cmdk-item${index === activeIndex ? " is-active" : ""}`}
                href={`/posts/${item.id}`}
                key={item.id}
                onClick={closePalette}
              >
                <span className="qt-cmdk-num">
                  №{String(item.number).padStart(3, "0")}
                </span>
                <span>
                  <span className="qt-cmdk-title">{item.title}</span>
                  <span className="qt-cmdk-meta">
                    {item.categoryLabel ? (
                      <span className="qt-cmdk-cat">
                        [{item.categoryLabel.toUpperCase()}]
                      </span>
                    ) : null}
                    {item.tags[0] ? ` ${item.tags[0]}` : ""}
                  </span>
                </span>
                <time className="qt-cmdk-date" dateTime={item.pubDate}>
                  {formatDate(item.pubDate)}
                </time>
              </Link>
            ))
          ) : (
            <div className="qt-cmdk-empty">
              <span className="qt-cmdk-empty-mark">// NO_RESULTS</span>
              {query ? `"${query}"에 대한 결과가 없어요.` : "인덱스를 불러오는 중…"}
            </div>
          )}
        </div>
        <div className="qt-cmdk-footer">
          <span id="qt-cmdk-count">{results.length} RESULTS</span>
          <span>↑↓ NAVIGATE · ↵ OPEN</span>
        </div>
      </div>
    </div>
  );
}

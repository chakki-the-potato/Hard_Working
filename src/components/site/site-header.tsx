"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";

const NAVIGATION = [
  { href: "/posts/category/programming", label: "Programming" },
  { href: "/posts/category/design", label: "Design" },
  { href: "/posts/category/thinking", label: "Thinking" },
  { href: "/posts/category/works", label: "Works" },
  { href: "/ideas", label: "Ideas" },
] as const;

export function SiteHeader() {
  const pathname = usePathname() ?? "";

  return (
    <header className="qt-header">
      <div className="qt-header-inner">
        <div className="qt-header-left">
          <Link aria-label={SITE_TITLE} className="qt-logo" href="/">
            <Image
              alt=""
              className="qt-logo-img"
              height={22}
              src="/favicon.png"
              width={22}
            />
            <span className="qt-logo-name">{SITE_NAME}</span>
          </Link>
          <span className="qt-logo-version">v.02 / 2026</span>
        </div>

        <div className="qt-header-right">
          <nav aria-label="카테고리" className="qt-nav">
            {NAVIGATION.map((item) => {
              const active =
                item.href === "/ideas"
                  ? pathname.startsWith("/ideas")
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={`qt-nav-link${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <span aria-hidden="true" className="qt-divider" />

          <button
            aria-label="글 검색"
            className="qt-search"
            data-cmdk-trigger
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="13"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="13"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="qt-search-label">글 검색…</span>
            <span className="qt-key">⌘K</span>
          </button>

          <Link aria-label="검색" className="qt-search-mobile" href="/search">
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
          </Link>

          <Link
            className={`qt-about${pathname.startsWith("/about") ? " is-active" : ""}`}
            href="/about"
          >
            소개
          </Link>

          <Link className="qt-subscribe" href="/admin/login">
            관리자
          </Link>
        </div>
      </div>
    </header>
  );
}

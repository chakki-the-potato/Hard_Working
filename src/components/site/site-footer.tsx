import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Image alt="" height={40} src="/favicon.png" width={40} />
          <div>
            <strong>{SITE_NAME}</strong>
            <p>매일 한 편씩, 천천히 쌓아 올리는 개발 노트.</p>
          </div>
        </div>
        <nav aria-label="푸터 메뉴" className="site-footer-nav">
          <Link href="/projects">Projects</Link>
          <Link href="/ideas">Ideas</Link>
          <Link href="/about">About</Link>
          <Link href="/rss.xml">RSS</Link>
        </nav>
        <div className="site-footer-meta">
          <span>© {new Date().getFullYear()} HARD_WORKING.</span>
          <span>BUILT WITH NEXT.JS ─ CONTENT ON SUPABASE</span>
        </div>
      </div>
    </footer>
  );
}

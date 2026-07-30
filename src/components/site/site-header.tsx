import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const NAVIGATION = [
  { href: "/posts/category/programming", label: "Programming" },
  { href: "/posts/category/design", label: "Design" },
  { href: "/posts/category/thinking", label: "Thinking" },
  { href: "/posts/category/works", label: "Works" },
  { href: "/ideas", label: "Ideas" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link aria-label={SITE_NAME} className="site-logo" href="/">
          <Image alt="" height={24} src="/favicon.png" width={24} />
          <span>{SITE_NAME}</span>
        </Link>
        <nav aria-label="주요 메뉴" className="site-nav">
          {NAVIGATION.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header-tools">
          <Link href="/search">검색</Link>
          <Link href="/about">소개</Link>
          <Link className="site-subscribe" href="/rss.xml">
            구독
          </Link>
        </div>
      </div>
    </header>
  );
}

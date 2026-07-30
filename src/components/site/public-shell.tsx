import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SearchPalette } from "@/components/site/search-palette";

type PublicShellProps = Readonly<{
  children: ReactNode;
}>;

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="qt-public-shell">
      <SiteHeader />
      <div className="qt-page">{children}</div>
      <SiteFooter />
      <SearchPalette />
    </div>
  );
}

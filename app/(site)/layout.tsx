import type { ReactNode } from "react";
import { PublicShell } from "@/components/site/public-shell";
import "./site.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/responsive.css";
import "./styles/home.css";
import "./styles/list.css";
import "./styles/article.css";
import "./styles/search.css";
import "./styles/effects.css";
import "./styles/writer.css";

type SiteLayoutProps = Readonly<{
  children: ReactNode;
  writer: ReactNode;
}>;

export default function SiteLayout({ children, writer }: SiteLayoutProps) {
  return (
    <PublicShell>
      {children}
      {writer}
    </PublicShell>
  );
}

import type { ReactNode } from "react";
import "@/components/hypotheses/hypothesis-admin.css";

type HypothesesLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function HypothesesLayout({
  children,
}: HypothesesLayoutProps) {
  return children;
}

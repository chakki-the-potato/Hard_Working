import type { ReactNode } from "react";
import "@/components/editor/editor.css";

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}

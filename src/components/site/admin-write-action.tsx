"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAdminStatus } from "@/components/site/admin-status-provider";
import { getAdminLoginPath } from "@/lib/auth/return-path";

export function AdminWriteAction() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { isAdmin, isResolved } = useAdminStatus();
  const query = searchParams?.toString() ?? "";
  const currentPath = query ? `${pathname}?${query}` : pathname;

  if (!isResolved) {
    return <span aria-hidden="true" className="qt-subscribe" />;
  }

  return (
    <Link
      aria-label={isAdmin ? "콘텐츠 작성" : "관리자 로그인"}
      className="qt-subscribe"
      data-admin-action={isAdmin ? "write" : "login"}
      href={isAdmin ? "/write" : getAdminLoginPath(currentPath)}
    >
      {isAdmin ? "작성" : "관리자"}
    </Link>
  );
}

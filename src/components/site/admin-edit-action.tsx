"use client";

import Link from "next/link";
import { useAdminStatus } from "@/components/site/admin-status-provider";

type AdminEditActionProps = Readonly<{
  itemId: string;
}>;

export function AdminEditAction({ itemId }: AdminEditActionProps) {
  const { isAdmin } = useAdminStatus();

  if (!isAdmin) {
    return null;
  }

  return (
    <Link
      aria-label="콘텐츠 수정"
      className="qt-post-history-link"
      href={`/write/${itemId}`}
    >
      수정
    </Link>
  );
}

import type { Metadata } from "next";
import { HypothesisDraftShelf } from "@/components/hypotheses/hypothesis-draft-shelf";
import { PublicHypothesesList } from "@/components/hypotheses/public-hypotheses-list";
import { getOptionalAdminSession } from "@/lib/auth/optional-admin";
import { listAdminHypotheses } from "@/lib/hypotheses/admin-queries";
import { listPublicHypotheses } from "@/lib/hypotheses/public-queries";
import type { PublicHypothesisStatus } from "@/lib/hypotheses/public-types";
import { HYPOTHESIS_FILTER_STATUSES } from "@/lib/hypotheses/status-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hypotheses",
  description: "가설을 세우고 검증한 활동, 증거, 판단을 공개한 기록입니다.",
  alternates: { canonical: "/hypotheses" },
};

type HypothesesPageProps = Readonly<{
  searchParams: Promise<{
    status?: string;
  }>;
}>;

function parseStatus(value: string | undefined): PublicHypothesisStatus | null {
  return HYPOTHESIS_FILTER_STATUSES.find((status) => status === value) ?? null;
}

export default async function HypothesesPage({
  searchParams,
}: HypothesesPageProps) {
  const [{ status }, hypotheses, adminSession] = await Promise.all([
    searchParams,
    listPublicHypotheses(),
    getOptionalAdminSession(),
  ]);
  const drafts = adminSession
    ? (await listAdminHypotheses(adminSession.supabase)).filter(
        (hypothesis) => hypothesis.visibility === "private",
      )
    : [];

  return (
    <PublicHypothesesList
      activeStatus={parseStatus(status)}
      adminShelf={
        drafts.length > 0 ? <HypothesisDraftShelf drafts={drafts} /> : null
      }
      canAuthor={Boolean(adminSession)}
      hypotheses={hypotheses}
    />
  );
}

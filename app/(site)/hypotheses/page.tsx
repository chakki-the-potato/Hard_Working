import type { Metadata } from "next";
import { PublicHypothesesList } from "@/components/hypotheses/public-hypotheses-list";
import { listPublicHypotheses } from "@/lib/hypotheses/public-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hypotheses",
  description: "가설을 세우고 검증한 활동, 증거, 판단을 공개한 기록입니다.",
  alternates: { canonical: "/hypotheses" },
};

export default async function HypothesesPage() {
  const hypotheses = await listPublicHypotheses();

  return <PublicHypothesesList hypotheses={hypotheses} />;
}

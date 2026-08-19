import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHypothesisDetail } from "@/components/hypotheses/public-hypothesis-detail";
import { getOptionalAdminSession } from "@/lib/auth/optional-admin";
import { getPublicHypothesisBySlug } from "@/lib/hypotheses/public-queries";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

type HypothesisPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: HypothesisPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hypothesis = await getPublicHypothesisBySlug(slug);

  return hypothesis
    ? {
        title: hypothesis.statement,
        description: hypothesis.publicSummary,
        alternates: { canonical: `/hypotheses/${hypothesis.slug}` },
      }
    : {};
}

export default async function HypothesisPage({ params }: HypothesisPageProps) {
  const { slug } = await params;
  const [hypothesis, adminSession] = await Promise.all([
    getPublicHypothesisBySlug(slug),
    getOptionalAdminSession(),
  ]);

  if (!hypothesis) {
    notFound();
  }

  return (
    <PublicHypothesisDetail
      editHref={adminSession ? getHypothesisWriterPath(hypothesis.id) : null}
      hypothesis={hypothesis}
    />
  );
}

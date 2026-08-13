import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHypothesisDetail } from "@/components/hypotheses/public-hypothesis-detail";
import { getPublicHypothesisBySlug } from "@/lib/hypotheses/public-queries";

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
  const hypothesis = await getPublicHypothesisBySlug(slug);

  if (!hypothesis) {
    notFound();
  }

  return <PublicHypothesisDetail hypothesis={hypothesis} />;
}

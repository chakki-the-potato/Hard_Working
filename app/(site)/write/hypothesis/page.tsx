import type { Metadata } from "next";
import { HypothesisWriter } from "@/components/hypotheses/hypothesis-writer";

export const metadata: Metadata = {
  title: "가설 작성",
  robots: {
    index: false,
    follow: false,
  },
};

type NewHypothesisWriterPageProps = Readonly<{
  searchParams: Promise<{
    parent?: string;
    relation?: string;
    result?: string;
  }>;
}>;

export default async function NewHypothesisWriterPage({
  searchParams,
}: NewHypothesisWriterPageProps) {
  const { parent, relation, result } = await searchParams;
  return (
    <HypothesisWriter
      mode="page"
      parentHypothesisId={parent}
      parentRelation={relation}
      result={result}
    />
  );
}

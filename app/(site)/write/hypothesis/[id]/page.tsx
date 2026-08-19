import type { Metadata } from "next";
import { HypothesisWriter } from "@/components/hypotheses/hypothesis-writer";

export const metadata: Metadata = {
  title: "가설 수정",
  robots: {
    index: false,
    follow: false,
  },
};

type EditHypothesisWriterPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function EditHypothesisWriterPage({
  params,
  searchParams,
}: EditHypothesisWriterPageProps) {
  const [{ id }, { result }] = await Promise.all([params, searchParams]);
  return <HypothesisWriter hypothesisId={id} mode="page" result={result} />;
}

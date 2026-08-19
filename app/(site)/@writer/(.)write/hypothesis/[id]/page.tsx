import { HypothesisWriter } from "@/components/hypotheses/hypothesis-writer";

type InterceptedEditHypothesisWriterPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function InterceptedEditHypothesisWriterPage({
  params,
  searchParams,
}: InterceptedEditHypothesisWriterPageProps) {
  const [{ id }, { result }] = await Promise.all([params, searchParams]);
  return <HypothesisWriter hypothesisId={id} mode="modal" result={result} />;
}

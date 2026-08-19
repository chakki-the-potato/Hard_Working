import { HypothesisWriter } from "@/components/hypotheses/hypothesis-writer";

type InterceptedNewHypothesisWriterPageProps = Readonly<{
  searchParams: Promise<{
    parent?: string;
    relation?: string;
    result?: string;
  }>;
}>;

export default async function InterceptedNewHypothesisWriterPage({
  searchParams,
}: InterceptedNewHypothesisWriterPageProps) {
  const { parent, relation, result } = await searchParams;
  return (
    <HypothesisWriter
      mode="modal"
      parentHypothesisId={parent}
      parentRelation={relation}
      result={result}
    />
  );
}

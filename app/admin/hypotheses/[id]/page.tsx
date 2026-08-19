import { redirect } from "next/navigation";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

type LegacyHypothesisDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function LegacyHypothesisDetailPage({
  params,
}: LegacyHypothesisDetailPageProps) {
  const { id } = await params;
  redirect(getHypothesisWriterPath(id));
}

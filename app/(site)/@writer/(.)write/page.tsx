import { ContentWriter } from "@/components/writer/content-writer";
import type { ContentKind } from "@/lib/content/content-editor-types";

type InterceptedNewWriterPageProps = Readonly<{
  searchParams: Promise<{
    kind?: string;
    result?: string;
  }>;
}>;

function parseKind(value: string | undefined): ContentKind | undefined {
  return value === "post" || value === "idea" || value === "project"
    ? value
    : undefined;
}

export default async function InterceptedNewWriterPage({
  searchParams,
}: InterceptedNewWriterPageProps) {
  const { kind, result } = await searchParams;
  return (
    <ContentWriter initialKind={parseKind(kind)} mode="modal" result={result} />
  );
}

import { ContentWriter } from "@/components/writer/content-writer";

type InterceptedEditWriterPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function InterceptedEditWriterPage({
  params,
  searchParams,
}: InterceptedEditWriterPageProps) {
  const [{ id }, { result }] = await Promise.all([params, searchParams]);
  return <ContentWriter itemId={id} mode="modal" result={result} />;
}

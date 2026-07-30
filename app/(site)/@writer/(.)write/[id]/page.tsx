import { PostWriter } from "@/components/writer/post-writer";

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
  return <PostWriter itemId={id} mode="modal" result={result} />;
}

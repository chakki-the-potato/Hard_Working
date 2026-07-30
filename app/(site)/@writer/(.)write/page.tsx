import { PostWriter } from "@/components/writer/post-writer";

type InterceptedNewWriterPageProps = Readonly<{
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function InterceptedNewWriterPage({
  searchParams,
}: InterceptedNewWriterPageProps) {
  const { result } = await searchParams;
  return <PostWriter mode="modal" result={result} />;
}

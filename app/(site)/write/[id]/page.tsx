import type { Metadata } from "next";
import { PostWriter } from "@/components/writer/post-writer";

export const metadata: Metadata = {
  title: "글 수정",
  robots: {
    index: false,
    follow: false,
  },
};

type EditWriterPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function EditWriterPage({
  params,
  searchParams,
}: EditWriterPageProps) {
  const [{ id }, { result }] = await Promise.all([params, searchParams]);
  return <PostWriter itemId={id} mode="page" result={result} />;
}

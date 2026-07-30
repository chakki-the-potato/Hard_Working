import type { Metadata } from "next";
import { PostWriter } from "@/components/writer/post-writer";

export const metadata: Metadata = {
  title: "글 작성",
  robots: {
    index: false,
    follow: false,
  },
};

type NewWriterPageProps = Readonly<{
  searchParams: Promise<{
    result?: string;
  }>;
}>;

export default async function NewWriterPage({
  searchParams,
}: NewWriterPageProps) {
  const { result } = await searchParams;
  return <PostWriter mode="page" result={result} />;
}

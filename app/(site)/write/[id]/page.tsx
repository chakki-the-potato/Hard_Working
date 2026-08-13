import type { Metadata } from "next";
import { ContentWriter } from "@/components/writer/content-writer";

export const metadata: Metadata = {
  title: "콘텐츠 수정",
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
  return <ContentWriter itemId={id} mode="page" result={result} />;
}

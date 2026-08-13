import type { Metadata } from "next";
import { ContentWriter } from "@/components/writer/content-writer";
import type { ContentKind } from "@/lib/content/content-editor-types";

export const metadata: Metadata = {
  title: "콘텐츠 작성",
  robots: {
    index: false,
    follow: false,
  },
};

type NewWriterPageProps = Readonly<{
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

export default async function NewWriterPage({
  searchParams,
}: NewWriterPageProps) {
  const { kind, result } = await searchParams;
  return (
    <ContentWriter initialKind={parseKind(kind)} mode="page" result={result} />
  );
}

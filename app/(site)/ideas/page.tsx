import type { Metadata } from "next";
import { IdeasListView } from "@/components/site/ideas-list-view";
import { listPublishedIdeas } from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Ideas",
  description: "러프하게 떠오른 아이디어들.",
};

export default async function IdeasPage() {
  const ideas = await listPublishedIdeas();

  return <IdeasListView ideas={ideas} />;
}

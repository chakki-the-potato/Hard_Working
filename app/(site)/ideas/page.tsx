import type { Metadata } from "next";
import { ContentList } from "@/components/site/content-list";
import { listPublishedIdeas } from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Ideas",
  description: "러프하게 떠오른 아이디어들.",
};

export default async function IdeasPage() {
  const ideas = await listPublishedIdeas();

  return (
    <ContentList
      description="아직 다듬지 않은 생각과 실험을 모아둡니다."
      items={ideas}
      kicker="// IDEAS / SCRATCHPAD"
      title="Idea"
    />
  );
}

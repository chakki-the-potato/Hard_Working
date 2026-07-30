import type { Metadata } from "next";
import { WorksIdeasView } from "@/components/site/works-ideas-view";
import {
  listPublishedIdeas,
  listWorksIdeaGroups,
} from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Works — Ideas",
  description: "프로젝트별 작업 아이디어.",
};

export default async function WorksIdeasPage() {
  const [groups, ideas] = await Promise.all([
    listWorksIdeaGroups(),
    listPublishedIdeas(),
  ]);

  return <WorksIdeasView groups={groups} ideas={ideas} />;
}

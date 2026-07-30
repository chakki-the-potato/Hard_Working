import type { Metadata } from "next";
import { ProjectsListView } from "@/components/site/projects-list-view";
import {
  listPublishedPosts,
  listPublishedProjects,
} from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Projects",
  description: "직접 만든 프로젝트와 연결된 기록.",
};

export default async function ProjectsPage() {
  const [projects, posts] = await Promise.all([
    listPublishedProjects(),
    listPublishedPosts(),
  ]);

  return <ProjectsListView posts={posts} projects={projects} />;
}

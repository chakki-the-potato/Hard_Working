import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import {
  getPublishedContentByPath,
  getContentNeighbors,
  listPublishedPosts,
  listPublicRedirects,
} from "@/lib/content/public-queries";

type PostPageProps = Readonly<{
  params: Promise<{ path: string[] }>;
}>;

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { path } = await params;
  const post = await getPublishedContentByPath(`/posts/${path.join("/")}`);

  return post
    ? {
        title: post.title,
        description: post.description ?? post.title,
        alternates: { canonical: post.path },
        openGraph: {
          type: "article",
          title: post.title,
          description: post.description ?? post.title,
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
          tags: post.tags.map((tag) => tag.name),
        },
      }
    : {};
}

export default async function PostPage({ params }: PostPageProps) {
  const { path } = await params;
  const requestPath = `/posts/${path.join("/")}`;
  const post = await getPublishedContentByPath(requestPath);

  if (!post || post.kind !== "post") {
    const redirect = (await listPublicRedirects()).find(
      (item) => item.sourcePath === requestPath,
    );

    if (redirect) {
      permanentRedirect(redirect.targetPath);
    }

    notFound();
  }

  const related = (await listPublishedPosts())
    .filter(
      (item) =>
        item.id !== post.id &&
        item.category?.slug === post.category?.slug,
    )
    .slice(0, 3);
  const neighbors = await getContentNeighbors(post);

  return <ArticleView item={post} neighbors={neighbors} related={related} />;
}

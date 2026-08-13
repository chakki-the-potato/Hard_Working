import { redirect } from "next/navigation";

type LegacyEditPostPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function LegacyEditPostPage({
  params,
}: LegacyEditPostPageProps) {
  const { id } = await params;
  redirect(`/write/${id}`);
}

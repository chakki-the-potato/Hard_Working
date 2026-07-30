import { listSearchIndex } from "@/lib/content/public-queries";

export async function GET(): Promise<Response> {
  return Response.json(await listSearchIndex());
}

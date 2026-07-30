import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/admin";
import { getAdminLoginPath } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AdminSession = Readonly<{
  supabase: ServerSupabaseClient;
  user: User;
}>;

export async function requireAdminSession(
  returnTo = "/admin",
): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getAdminLoginPath(returnTo));
  }

  if (!hasAdminRole(user)) {
    redirect(getAdminLoginPath(returnTo, "unauthorized"));
  }

  return { supabase, user };
}

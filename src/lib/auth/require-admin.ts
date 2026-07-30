import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AdminSession = Readonly<{
  supabase: ServerSupabaseClient;
  user: User;
}>;

export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!hasAdminRole(user)) {
    redirect("/admin/login?error=unauthorized");
  }

  return { supabase, user };
}

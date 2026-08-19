import type { User } from "@supabase/supabase-js";
import { hasAdminRole } from "@/lib/auth/admin";
import type { ServerSupabaseClient } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

type OptionalAdminSession = Readonly<{
  supabase: ServerSupabaseClient;
  user: User;
}>;

export async function getOptionalAdminSession(): Promise<OptionalAdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    console.warn("Supabase optional admin lookup failed", {
      operation: "get optional admin session",
      code: error.code,
      status: error.status,
      message: error.message,
    });

    return null;
  }

  return user && hasAdminRole(user) ? { supabase, user } : null;
}

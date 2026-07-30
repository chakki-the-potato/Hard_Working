import type { User } from "@supabase/supabase-js";

export function hasAdminRole(user: User): boolean {
  return user.app_metadata.role === "admin";
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error: unknown) {
          console.warn("Supabase session cookies were not persisted", {
            operation: "set supabase session cookies",
            reason: "a server component render cannot modify cookies",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    },
  });
}

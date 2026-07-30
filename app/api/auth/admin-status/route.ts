import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    console.warn("Supabase admin status lookup failed", {
      operation: "get public admin status",
      code: error.code,
      status: error.status,
      message: error.message,
    });

    return NextResponse.json(
      {
        error: "admin_status_unavailable",
      },
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: 503,
      },
    );
  }

  return NextResponse.json(
    {
      isAdmin: Boolean(user && hasAdminRole(user)),
    },
    {
      headers: PRIVATE_NO_STORE_HEADERS,
    },
  );
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LocalAdminFixture = Readonly<{
  email: string;
  password: string;
  suffix: string;
  userId: string;
}>;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for local content authoring E2E tests.`);
  }

  return value;
}

function getLocalSupabaseUrl(): string {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const hostname = new URL(url).hostname;

  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`Local authoring E2E refuses non-local Supabase URL: ${url}`);
  }

  return url;
}

function createLocalServiceClient(): SupabaseClient {
  const serviceRoleKey = getRequiredEnv("E2E_SUPABASE_SERVICE_ROLE_KEY");

  return createClient(getLocalSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createLocalPublicClient(): SupabaseClient {
  return createClient(
    getLocalSupabaseUrl(),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function createLocalAdmin(): Promise<LocalAdminFixture> {
  const client = createLocalServiceClient();
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const email = `e2e-${suffix}@example.com`;
  const password = `Local-${suffix}-Admin-2026`;
  const { data, error } = await client.auth.admin.createUser({
    app_metadata: { role: "admin" },
    email,
    email_confirm: true,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create local E2E admin: ${error?.message ?? "missing user"}`);
  }

  return { email, password, suffix, userId: data.user.id };
}

export async function cleanupLocalAdmin(
  fixture: LocalAdminFixture,
): Promise<void> {
  const client = createLocalPublicClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email: fixture.email,
    password: fixture.password,
  });

  if (signInError) {
    throw new Error(`Failed to authenticate local E2E cleanup: ${signInError.message}`);
  }

  const { data: items, error: selectError } = await client
    .from("content_items")
    .select("id")
    .like("slug", `%${fixture.suffix}%`);

  if (selectError) {
    throw new Error(`Failed to find local E2E content: ${selectError.message}`);
  }

  const itemIds = (items ?? []).map((item) => item.id);

  if (itemIds.length > 0) {
    const { error: deleteContentError } = await client
      .from("content_items")
      .delete()
      .in("id", itemIds);

    if (deleteContentError) {
      throw new Error(`Failed to delete local E2E content: ${deleteContentError.message}`);
    }
  }

  await client.auth.signOut();

  const { error: deleteUserError } = await createLocalServiceClient().auth.admin.deleteUser(
    fixture.userId,
  );

  if (deleteUserError) {
    throw new Error(`Failed to delete local E2E admin: ${deleteUserError.message}`);
  }
}

import type { PostgrestError } from "@supabase/supabase-js";

const MAX_QUERY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type QueryResult<T> = Readonly<{
  data: T | null;
  error: PostgrestError | null;
}>;

async function wait(delayMs: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function runAdminQueryWithRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const { data, error } = await operation();

    if (!error && data !== null) {
      return data;
    }

    lastError = error;

    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn("Supabase content query failed; retrying", {
        operation: operationName,
        attempt,
        code: error?.code ?? "missing_data",
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `Supabase content query failed: ${operationName}`,
    lastError ? { cause: lastError } : undefined,
  );
}

import type { PostgrestError } from "@supabase/supabase-js";
import { cache } from "react";
import type { PublicHypothesis } from "@/lib/hypotheses/public-types";
import { createPublicClient } from "@/lib/supabase/public";

const MAX_QUERY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type QueryResult<T> = Readonly<{
  data: T | null;
  error: PostgrestError | null;
}>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function withReadRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const result = await operation();

    if (!result.error && result.data !== null) {
      return result.data;
    }

    lastError = result.error;

    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn(JSON.stringify({
        event: "public_hypothesis_query_retry",
        operation: operationName,
        attempt,
        code: lastError?.code ?? null,
        message: lastError?.message ?? "empty response",
      }));
      await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `공개 가설 조회에 실패했습니다. operation=${operationName}, code=${lastError?.code ?? "unknown"}, cause=${lastError?.message ?? "empty response"}. Supabase 공개 RPC와 권한을 확인하세요.`,
    { cause: lastError ?? undefined },
  );
}

async function withNullableReadRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T | null> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const result = await operation();

    if (!result.error) {
      return result.data;
    }

    lastError = result.error;

    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn(JSON.stringify({
        event: "public_hypothesis_query_retry",
        operation: operationName,
        attempt,
        code: lastError.code,
        message: lastError.message,
      }));
      await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `공개 가설 조회에 실패했습니다. operation=${operationName}, code=${lastError?.code ?? "unknown"}, cause=${lastError?.message ?? "unknown"}. Supabase 공개 RPC와 권한을 확인하세요.`,
    { cause: lastError ?? undefined },
  );
}

export const listPublicHypotheses = cache(
  async (): Promise<readonly PublicHypothesis[]> => {
    const supabase = createPublicClient();
    const rows = await withReadRetry(
      () => supabase.rpc("list_public_hypotheses"),
      "list public hypotheses",
    );

    return (rows ?? []) as PublicHypothesis[];
  },
);

export const getPublicHypothesisBySlug = cache(
  async (slug: string): Promise<PublicHypothesis | null> => {
    const supabase = createPublicClient();
    const row = await withNullableReadRetry(
      () => supabase.rpc("get_public_hypothesis_by_slug", { p_slug: slug }),
      "get public hypothesis by slug",
    );

    return row as PublicHypothesis | null;
  },
);

export const listPublicHypothesesByProject = cache(
  async (projectItemId: string): Promise<readonly PublicHypothesis[]> => {
    const supabase = createPublicClient();
    const rows = await withReadRetry(
      () => supabase.rpc("list_public_hypotheses_by_project", {
        p_project_item_id: projectItemId,
      }),
      "list public hypotheses by project",
    );

    return (rows ?? []) as PublicHypothesis[];
  },
);

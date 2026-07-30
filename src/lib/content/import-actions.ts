"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { buildContentImportSnapshot } from "@/lib/content/content-snapshot";
import type {
  ContentImportActionState,
  ContentImportResult,
} from "@/lib/content/migration-types";

const MAX_IMPORT_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 250;

type ImportRpcRow = Readonly<{
  created_items: number;
  updated_items: number;
  created_versions: number;
  updated_versions: number;
  assigned_tags: number;
  upserted_redirects: number;
}>;

type ImportRpcResult = Readonly<{
  data: ImportRpcRow[] | null;
  error: PostgrestError | null;
}>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function executeImport(
  dryRun: boolean,
): Promise<ContentImportResult> {
  const { supabase } = await requireAdminSession();
  const snapshot = await buildContentImportSnapshot();
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_IMPORT_ATTEMPTS; attempt += 1) {
    const result = (await supabase
      .rpc("import_content_snapshot", {
        p_items: snapshot.items,
        p_redirects: snapshot.redirects,
        p_dry_run: dryRun,
      })
      .returns<ImportRpcRow[]>()) as ImportRpcResult;

    if (!result.error && result.data?.[0]) {
      const row = result.data[0];
      return {
        createdItems: row.created_items,
        updatedItems: row.updated_items,
        createdVersions: row.created_versions,
        updatedVersions: row.updated_versions,
        assignedTags: row.assigned_tags,
        upsertedRedirects: row.upserted_redirects,
      };
    }

    lastError = result.error;

    if (attempt < MAX_IMPORT_ATTEMPTS) {
      console.warn(
        JSON.stringify({
          event: "content_import_retry",
          dryRun,
          attempt,
          code: lastError?.code ?? null,
          message: lastError?.message ?? "empty response",
        }),
      );
      await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `콘텐츠 가져오기에 실패했습니다. mode=${dryRun ? "dry-run" : "apply"}, code=${lastError?.code ?? "unknown"}, cause=${lastError?.message ?? "empty response"}. Supabase 마이그레이션 적용 여부와 관리자 권한을 확인하세요.`,
    { cause: lastError ?? undefined },
  );
}

export async function runContentImportAction(
  _previousState: ContentImportActionState,
  formData: FormData,
): Promise<ContentImportActionState> {
  const mode = formData.get("mode");

  if (mode !== "dry-run" && mode !== "apply") {
    return {
      status: "error",
      mode: null,
      message: "가져오기 실행 모드가 올바르지 않습니다.",
      result: null,
    };
  }

  try {
    const result = await executeImport(mode === "dry-run");

    if (mode === "apply") {
      revalidatePath("/");
      revalidatePath("/admin");
    }

    return {
      status: "success",
      mode,
      message:
        mode === "dry-run"
          ? "dry-run을 완료했으며 데이터베이스 변경은 롤백됐습니다."
          : "콘텐츠 가져오기를 완료했습니다.",
      result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    console.error(
      JSON.stringify({
        event: "content_import_failed",
        mode,
        message,
      }),
    );

    return {
      status: "error",
      mode,
      message,
      result: null,
    };
  }
}

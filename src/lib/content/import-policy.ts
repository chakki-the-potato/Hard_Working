export const CONTENT_IMPORT_PRODUCTION_LOCK_MESSAGE =
  "Production에서는 실제 콘텐츠 가져오기가 잠겨 있습니다. Dry-run만 실행할 수 있습니다.";

type ContentImportMode = "dry-run" | "apply";

type ContentImportPolicyResult<T> =
  | Readonly<{ status: "blocked" }>
  | Readonly<{ status: "executed"; value: T }>;

export function getContentImportControls(
  vercelEnvironment: string | undefined,
): Readonly<{ allowDryRun: true; allowApply: boolean }> {
  return {
    allowDryRun: true,
    allowApply: vercelEnvironment !== "production",
  };
}

export async function runContentImportWithPolicy<T>(
  mode: ContentImportMode,
  vercelEnvironment: string | undefined,
  execute: () => Promise<T>,
): Promise<ContentImportPolicyResult<T>> {
  if (
    mode === "apply" &&
    !getContentImportControls(vercelEnvironment).allowApply
  ) {
    return { status: "blocked" };
  }

  return { status: "executed", value: await execute() };
}

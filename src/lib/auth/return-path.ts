const DEFAULT_RETURN_PATH = "/";

export function getSafeReturnPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = DEFAULT_RETURN_PATH,
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function getAdminLoginPath(
  returnTo: string,
  error?: "invalid_credentials" | "unauthorized",
): string {
  const params = new URLSearchParams({ next: getSafeReturnPath(returnTo) });

  if (error) {
    params.set("error", error);
  }

  return `/admin/login?${params.toString()}`;
}

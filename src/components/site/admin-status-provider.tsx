"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const MAX_STATUS_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type AdminStatusResponse = Readonly<{
  isAdmin: boolean;
}>;

type AdminStatusContextValue = Readonly<{
  isAdmin: boolean;
  isResolved: boolean;
}>;

type AdminStatusProviderProps = Readonly<{
  children: ReactNode;
}>;

const AdminStatusContext = createContext<AdminStatusContextValue>({
  isAdmin: false,
  isResolved: false,
});

function isAdminStatusResponse(value: unknown): value is AdminStatusResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as Readonly<Record<string, unknown>>).isAdmin === "boolean"
  );
}

async function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, delayMs);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

async function fetchAdminStatus(
  signal: AbortSignal,
): Promise<AdminStatusResponse> {
  let lastStatus: number | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_STATUS_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("/api/auth/admin-status", {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      lastStatus = response.status;

      if (response.ok) {
        const body: unknown = await response.json();

        if (isAdminStatusResponse(body)) {
          return body;
        }
      }
    } catch (error: unknown) {
      if (signal.aborted) {
        throw error;
      }

      lastError = error;
    }

    if (attempt < MAX_STATUS_ATTEMPTS) {
      console.warn("Admin status request failed; retrying", {
        operation: "load public admin status",
        attempt,
        statusCode: lastStatus,
        message:
          lastError instanceof Error ? lastError.message : "Invalid response",
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1), signal);
    }
  }

  throw new Error(
    `Admin status request failed after ${MAX_STATUS_ATTEMPTS} attempts. status=${lastStatus ?? "unknown"}`,
    lastError ? { cause: lastError } : undefined,
  );
}

export function AdminStatusProvider({ children }: AdminStatusProviderProps) {
  const [value, setValue] = useState<AdminStatusContextValue>({
    isAdmin: false,
    isResolved: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchAdminStatus(controller.signal)
      .then((status) => {
        setValue({ isAdmin: status.isAdmin, isResolved: true });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Admin status request failed", {
            operation: "load public admin status",
            message: error instanceof Error ? error.message : "Unknown error",
          });
          setValue({ isAdmin: false, isResolved: true });
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <AdminStatusContext.Provider value={value}>
      {children}
    </AdminStatusContext.Provider>
  );
}

export function useAdminStatus(): AdminStatusContextValue {
  return useContext(AdminStatusContext);
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MAX_STATUS_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type AdminStatusResponse = Readonly<{
  isAdmin: boolean;
}>;

function isAdminStatusResponse(value: unknown): value is AdminStatusResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as Readonly<Record<string, unknown>>).isAdmin === "boolean"
  );
}

async function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    function handleAbort(): void {
      window.clearTimeout(timeoutId);
      reject(signal.reason);
    }

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    signal.addEventListener("abort", handleAbort, { once: true });
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
        operation: "load public admin action",
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

export function AdminWriteAction() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchAdminStatus(controller.signal)
      .then((status) => {
        setIsAdmin(status.isAdmin);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Admin status request failed", {
            operation: "load public admin action",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <Link
      aria-label={isAdmin ? "글 작성" : "관리자 로그인"}
      className="qt-subscribe"
      data-admin-action={isAdmin ? "write" : "login"}
      href={isAdmin ? "/write" : "/admin/login?next=%2F"}
    >
      {isAdmin ? "작성" : "관리자"}
    </Link>
  );
}

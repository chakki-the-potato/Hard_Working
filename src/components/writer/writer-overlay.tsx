"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const WRITER_PATH_PREFIX = "/write";

export type WriterOverlayMode = "modal" | "page";

type WriterOverlayProps = Readonly<{
  children: ReactNode;
  closePath?: string;
  description: string;
  mode: WriterOverlayMode;
  title: string;
}>;

export function WriterOverlay({
  children,
  closePath,
  description,
  mode,
  title,
}: WriterOverlayProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isWriterRoute = pathname.startsWith(WRITER_PATH_PREFIX);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeWriter = useCallback((): void => {
    if (closePath) {
      router.push(closePath);
      return;
    }

    if (mode === "modal") {
      router.back();
      return;
    }

    router.replace("/");
  }, [closePath, mode, router]);

  useEffect(() => {
    if (!isWriterRoute) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeWriter();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWriter, isWriterRoute]);

  if (!isWriterRoute) {
    return null;
  }

  return (
    <div
      aria-labelledby="writer-title"
      aria-modal="true"
      className="writer-overlay"
      role="dialog"
    >
      <section className="writer-container">
        <header className="writer-header">
          <div className="writer-heading">
            <p className="admin-kicker">Writer</p>
            <h1 className="writer-title" id="writer-title">
              {title}
            </h1>
            <p className="writer-description">{description}</p>
          </div>
          <button
            aria-label="작성 화면 닫기"
            className="writer-close"
            onClick={closeWriter}
            ref={closeButtonRef}
            type="button"
          >
            닫기
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type WriterOverlayMode = "modal" | "page";

type WriterOverlayProps = Readonly<{
  children: ReactNode;
  description: string;
  mode: WriterOverlayMode;
  title: string;
}>;

export function WriterOverlay({
  children,
  description,
  mode,
  title,
}: WriterOverlayProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeWriter = useCallback((): void => {
    if (mode === "modal") {
      router.back();
      return;
    }

    router.replace("/");
  }, [mode, router]);

  useEffect(() => {
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
  }, [closeWriter]);

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

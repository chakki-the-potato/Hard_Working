import type { Metadata } from "next";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import { signInWithPassword } from "./actions";

export const metadata: Metadata = {
  title: "관리자 로그인",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}>;

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: "이메일 또는 비밀번호를 확인해 주세요.",
  unauthorized: "관리자 권한이 있는 계정만 접근할 수 있습니다.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const returnTo = getSafeReturnPath(next);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Admin access</p>
        <h1>관리자 로그인.</h1>
        <p className="description">
          Supabase에 등록한 관리자 계정으로 로그인합니다.
        </p>

        {errorMessage ? (
          <p className="notice" data-tone="error">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInWithPassword} className="form">
          <input name="returnTo" type="hidden" value={returnTo} />
          <label className="field" htmlFor="email">
            <span className="field-label">이메일</span>
            <input
              autoComplete="email"
              className="field-input"
              id="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label className="field" htmlFor="password">
            <span className="field-label">비밀번호</span>
            <input
              autoComplete="current-password"
              className="field-input"
              id="password"
              maxLength={1024}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="button" type="submit">
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}

import type { CSSProperties } from "react";

type AmbientLine = Readonly<{
  prompt?: "$" | ">" | "//";
  text: string;
  position: CSSProperties;
  duration: string;
  delay: string;
}>;

type AmbientStyle = CSSProperties &
  Readonly<{
    "--ad": string;
    "--adelay": string;
  }>;

const LINES: readonly AmbientLine[] = [
  { prompt: "$", text: "git pull origin main", position: { top: "8%", left: "6%" }, duration: "17s", delay: "-1s" },
  { prompt: ">", text: "23 articles indexed", position: { top: "14%", right: "8%" }, duration: "19s", delay: "-7s" },
  { prompt: "$", text: "npm run build", position: { top: "32%", left: "14%" }, duration: "18s", delay: "-12s" },
  { prompt: ">", text: "ready · port 4321", position: { top: "28%", right: "4%" }, duration: "20s", delay: "-3s" },
  { prompt: ">", text: "compiled in 1.74s", position: { top: "52%", left: "4%" }, duration: "16s", delay: "-9s" },
  { prompt: "//", text: "TODO: refactor", position: { top: "44%", right: "12%" }, duration: "21s", delay: "-15s" },
  { prompt: ">", text: "writing thoughts", position: { top: "68%", left: "10%" }, duration: "18s", delay: "-5s" },
  { prompt: "$", text: "git status", position: { top: "72%", right: "6%" }, duration: "17s", delay: "-11s" },
  { text: "const n = 23;", position: { top: "24%", left: "46%" }, duration: "22s", delay: "-2s" },
  { text: "if (err) throw err;", position: { top: "60%", right: "24%" }, duration: "20s", delay: "-14s" },
  { text: "import { ... }", position: { top: "88%", left: "32%" }, duration: "19s", delay: "-6s" },
  { prompt: ">", text: "[OK]", position: { top: "4%", left: "38%" }, duration: "16s", delay: "-10s" },
  { prompt: "//", text: "pending...", position: { top: "82%", right: "32%" }, duration: "21s", delay: "-4s" },
  { prompt: "$", text: "npm run dev", position: { top: "40%", right: "38%" }, duration: "18s", delay: "-13s" },
];

export function AmbientLogs() {
  return (
    <div aria-hidden="true" className="qt-ambient">
      {LINES.map((line, index) => {
        const style: AmbientStyle = {
          ...line.position,
          "--ad": line.duration,
          "--adelay": line.delay,
        };
        const promptClassName =
          line.prompt === "$"
            ? "qt-ambient-prompt is-cmd"
            : line.prompt === "//"
              ? "qt-ambient-prompt is-comment"
              : "qt-ambient-prompt";

        return (
          <div className="qt-ambient-line" key={index} style={style}>
            {line.prompt ? (
              <span className={promptClassName}>{line.prompt}</span>
            ) : null}
            <span className="qt-ambient-text">{line.text}</span>
          </div>
        );
      })}
    </div>
  );
}

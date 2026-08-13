import Link from "next/link";
import type { PublicHypothesis } from "@/lib/hypotheses/public-types";

type ProjectHypothesesSectionProps = Readonly<{
  hypotheses: readonly PublicHypothesis[];
}>;

export function ProjectHypothesesSection({
  hypotheses,
}: ProjectHypothesesSectionProps) {
  if (hypotheses.length === 0) {
    return null;
  }

  return (
    <section className="qt-project-hypotheses" aria-labelledby="project-hypotheses-title">
      <span className="qt-post-related-mono">// HYPOTHESES</span>
      <h2 id="project-hypotheses-title">검증 기록</h2>
      <div className="qt-project-hypotheses-list">
        {hypotheses.map((hypothesis) => (
          <Link href={`/hypotheses/${hypothesis.slug}`} key={hypothesis.id}>
            <span>{hypothesis.status.toUpperCase()}</span>
            <strong>{hypothesis.statement}</strong>
            <p>{hypothesis.publicSummary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

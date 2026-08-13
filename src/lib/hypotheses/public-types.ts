export type PublicHypothesisStatus =
  | "draft"
  | "planned"
  | "running"
  | "concluded"
  | "abandoned";

export type PublicHypothesisVerdict =
  | "supported"
  | "rejected"
  | "inconclusive"
  | "pivoted";

export type PublicHypothesisEvidence = Readonly<{
  id: string;
  evidenceType: string;
  summary: string;
  detailsMarkdown: string | null;
  sourceUrl: string | null;
  observedAt: string;
  publishedAt: string;
}>;

export type PublicHypothesisActivity = Readonly<{
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  startedAt: string;
  completedAt: string | null;
  publishedAt: string;
  relatedContent: Readonly<{
    kind: "post" | "idea" | "project";
    slug: string;
    path: string;
    title: string;
  }> | null;
  evidence: readonly PublicHypothesisEvidence[];
}>;

export type PublicHypothesis = Readonly<{
  id: string;
  slug: string;
  statement: string;
  successCriteria: string;
  measurementPlan: string;
  status: PublicHypothesisStatus;
  publicSummary: string;
  publishedAt: string;
  updatedAt: string;
  category: Readonly<{ slug: string; name: string }>;
  tags: readonly Readonly<{ slug: string; name: string }>[];
  project: Readonly<{ slug: string; path: string; title: string }> | null;
  activities: readonly PublicHypothesisActivity[];
  decision: Readonly<{
    verdict: PublicHypothesisVerdict;
    reasoning: string;
    confidenceAfter: number | null;
    failureType: string | null;
    decidedAt: string;
  }> | null;
  relations: readonly Readonly<{
    relation: string;
    hypothesis: Readonly<{
      slug: string;
      statement: string;
      status: PublicHypothesisStatus;
      publicSummary: string;
    }>;
  }>[];
}>;

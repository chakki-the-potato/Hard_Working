import type { PublicHypothesisStatus } from "@/lib/hypotheses/public-types";

export const HYPOTHESIS_STATUS_LABELS: Readonly<
  Record<PublicHypothesisStatus, string>
> = {
  draft: "DRAFT",
  planned: "PLANNED",
  running: "RUNNING",
  concluded: "CONCLUDED",
  abandoned: "ABANDONED",
};

export const HYPOTHESIS_FILTER_STATUSES: readonly PublicHypothesisStatus[] = [
  "planned",
  "running",
  "concluded",
  "abandoned",
];

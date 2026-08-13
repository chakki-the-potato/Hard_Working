export const hypothesisStatuses = [
  "draft",
  "planned",
  "running",
  "concluded",
  "abandoned",
] as const;

export const hypothesisVisibilities = ["private", "public"] as const;

export const hypothesisParentRelations = [
  "follow_up",
  "pivot",
  "retry",
  "refinement",
] as const;

export const hypothesisActivityTypes = [
  "experiment",
  "interview",
  "build",
  "launch",
  "analysis",
  "other",
] as const;

export const hypothesisEvidenceTypes = [
  "metric",
  "observation",
  "feedback",
  "artifact",
  "source",
  "other",
] as const;

export const hypothesisVerdicts = [
  "supported",
  "rejected",
  "inconclusive",
  "pivoted",
] as const;

export const hypothesisFailureTypes = [
  "hypothesis_error",
  "experiment_design",
  "execution_incomplete",
  "insufficient_data",
  "external_condition",
] as const;

export const hypothesisPublicationIntents = [
  "publish",
  "publish_changes",
  "unpublish",
] as const;

export type HypothesisStatus = (typeof hypothesisStatuses)[number];
export type HypothesisVisibility = (typeof hypothesisVisibilities)[number];
export type HypothesisParentRelation =
  (typeof hypothesisParentRelations)[number];
export type HypothesisActivityType = (typeof hypothesisActivityTypes)[number];
export type HypothesisEvidenceType = (typeof hypothesisEvidenceTypes)[number];
export type HypothesisVerdict = (typeof hypothesisVerdicts)[number];
export type HypothesisFailureType = (typeof hypothesisFailureTypes)[number];
export type HypothesisPublicationIntent =
  (typeof hypothesisPublicationIntents)[number];

export type CategoryOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type TagOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type ContentOption = Readonly<{
  id: string;
  kind: "post" | "idea" | "project";
  slug: string;
  path: string;
  title: string;
}>;

export type HypothesisAdminOptions = Readonly<{
  categories: readonly CategoryOption[];
  tags: readonly TagOption[];
  projects: readonly ContentOption[];
  relatedContent: readonly ContentOption[];
}>;

export type HypothesisListItem = Readonly<{
  id: string;
  slug: string;
  statement: string;
  category: CategoryOption;
  project: ContentOption | null;
  status: HypothesisStatus;
  visibility: HypothesisVisibility;
  reviewDueAt: string | null;
  updatedAt: string;
}>;

export type HypothesisEvidence = Readonly<{
  id: string;
  evidenceType: HypothesisEvidenceType;
  summary: string;
  detailsMarkdown: string;
  sourceUrl: string | null;
  observedAt: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type HypothesisActivity = Readonly<{
  id: string;
  relatedContent: ContentOption | null;
  activityType: HypothesisActivityType;
  title: string;
  description: string;
  startedAt: string;
  completedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: readonly HypothesisEvidence[];
}>;

export type HypothesisDecision = Readonly<{
  id: string;
  verdict: HypothesisVerdict;
  reasoning: string;
  confidenceAfter: number | null;
  failureType: HypothesisFailureType | null;
  isCurrent: boolean;
  decidedAt: string;
  createdAt: string;
}>;

export type HypothesisDetail = Readonly<{
  id: string;
  slug: string;
  project: ContentOption | null;
  category: CategoryOption;
  parent: Readonly<{
    id: string;
    relation: HypothesisParentRelation;
  }> | null;
  statement: string;
  rationale: string;
  successCriteria: string;
  measurementPlan: string;
  status: HypothesisStatus;
  visibility: HypothesisVisibility;
  publicSummary: string | null;
  confidenceBefore: number | null;
  startedAt: string | null;
  reviewDueAt: string | null;
  concludedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: readonly TagOption[];
  activities: readonly HypothesisActivity[];
  decisions: readonly HypothesisDecision[];
}>;

export type HypothesisFormValues = Readonly<{
  hypothesisId: string | null;
  slug: string;
  projectItemId: string;
  categoryId: string;
  parentHypothesisId: string;
  parentRelation: string;
  statement: string;
  rationale: string;
  successCriteria: string;
  measurementPlan: string;
  status: string;
  publicSummary: string;
  confidenceBefore: string;
  startedAt: string;
  reviewDueAt: string;
  tagIds: readonly string[];
}>;

export type HypothesisFormField =
  | "hypothesisId"
  | "slug"
  | "projectItemId"
  | "categoryId"
  | "parentHypothesisId"
  | "parentRelation"
  | "statement"
  | "rationale"
  | "successCriteria"
  | "measurementPlan"
  | "status"
  | "publicSummary"
  | "confidenceBefore"
  | "startedAt"
  | "reviewDueAt"
  | "tagIds";

export type HypothesisActivityFormValues = Readonly<{
  hypothesisId: string;
  activityId: string;
  relatedContentItemId: string;
  activityType: string;
  title: string;
  description: string;
  startedAt: string;
  completedAt: string;
}>;

export type HypothesisActivityFormField =
  | "hypothesisId"
  | "activityId"
  | "relatedContentItemId"
  | "activityType"
  | "title"
  | "description"
  | "startedAt"
  | "completedAt";

export type HypothesisEvidenceFormValues = Readonly<{
  hypothesisId: string;
  evidenceId: string;
  activityId: string;
  evidenceType: string;
  summary: string;
  detailsMarkdown: string;
  sourceUrl: string;
  observedAt: string;
}>;

export type HypothesisEvidenceFormField =
  | "hypothesisId"
  | "evidenceId"
  | "activityId"
  | "evidenceType"
  | "summary"
  | "detailsMarkdown"
  | "sourceUrl"
  | "observedAt";

export type HypothesisDecisionFormValues = Readonly<{
  hypothesisId: string;
  verdict: string;
  reasoning: string;
  confidenceAfter: string;
  failureType: string;
  decidedAt: string;
}>;

export type HypothesisDecisionFormField =
  | "hypothesisId"
  | "verdict"
  | "reasoning"
  | "confidenceAfter"
  | "failureType"
  | "decidedAt";

export type HypothesisPublicationFormValues = Readonly<{
  hypothesisId: string;
  intent: string;
  publicSummary: string;
}>;

export type HypothesisPublicationFormField =
  | "hypothesisId"
  | "intent"
  | "publicSummary";

export type HypothesisActionState<
  TField extends string,
  TValues,
> = Readonly<{
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Readonly<Partial<Record<TField, string>>>;
  values: TValues;
}>;

export type HypothesisFormActionState = HypothesisActionState<
  HypothesisFormField,
  HypothesisFormValues
>;
export type HypothesisActivityActionState = HypothesisActionState<
  HypothesisActivityFormField,
  HypothesisActivityFormValues
>;
export type HypothesisEvidenceActionState = HypothesisActionState<
  HypothesisEvidenceFormField,
  HypothesisEvidenceFormValues
>;
export type HypothesisDecisionActionState = HypothesisActionState<
  HypothesisDecisionFormField,
  HypothesisDecisionFormValues
>;
export type HypothesisPublicationActionState = HypothesisActionState<
  HypothesisPublicationFormField,
  HypothesisPublicationFormValues
>;

export type HypothesisPublicationJson =
  | null
  | boolean
  | number
  | string
  | readonly HypothesisPublicationJson[]
  | HypothesisPublicationObject;

export interface HypothesisPublicationObject {
  readonly [key: string]: HypothesisPublicationJson;
}

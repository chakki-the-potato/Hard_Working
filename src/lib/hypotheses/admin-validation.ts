import type {
  HypothesisActivityFormField,
  HypothesisActivityFormValues,
  HypothesisDecisionFormField,
  HypothesisDecisionFormValues,
  HypothesisEvidenceFormField,
  HypothesisEvidenceFormValues,
  HypothesisFailureType,
  HypothesisFormActionState,
  HypothesisFormField,
  HypothesisFormValues,
  HypothesisParentRelation,
  HypothesisPublicationFormField,
  HypothesisPublicationFormValues,
  HypothesisPublicationIntent,
  HypothesisStatus,
  HypothesisVerdict,
  HypothesisActivityType,
  HypothesisEvidenceType,
  HypothesisActivityActionState,
  HypothesisEvidenceActionState,
  HypothesisDecisionActionState,
  HypothesisPublicationActionState,
} from "@/lib/hypotheses/admin-types";
import {
  hypothesisActivityTypes,
  hypothesisEvidenceTypes,
  hypothesisFailureTypes,
  hypothesisParentRelations,
  hypothesisPublicationIntents,
  hypothesisStatuses,
  hypothesisVerdicts,
} from "@/lib/hypotheses/admin-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type ParseResult<TInput, TState> =
  | Readonly<{ ok: true; input: TInput }>
  | Readonly<{ ok: false; state: TState }>;

export type SaveHypothesisInput = Readonly<{
  values: HypothesisFormValues;
  hypothesisId: string | null;
  projectItemId: string | null;
  categoryId: string;
  parentHypothesisId: string | null;
  parentRelation: HypothesisParentRelation | null;
  status: HypothesisStatus;
  confidenceBefore: number | null;
  startedAt: string | null;
  reviewDueAt: string | null;
  tagIds: readonly string[];
}>;

export type CreateActivityInput = Readonly<{
  values: HypothesisActivityFormValues;
  hypothesisId: string;
  relatedContentItemId: string | null;
  activityType: HypothesisActivityType;
  startedAt: string;
  completedAt: string | null;
}>;

export type CreateEvidenceInput = Readonly<{
  values: HypothesisEvidenceFormValues;
  activityId: string;
  evidenceType: HypothesisEvidenceType;
  sourceUrl: string | null;
  observedAt: string;
}>;

export type HypothesisDecisionInput = Readonly<{
  values: HypothesisDecisionFormValues;
  hypothesisId: string;
  verdict: HypothesisVerdict;
  confidenceAfter: number | null;
  failureType: HypothesisFailureType | null;
  decidedAt: string;
}>;

export type HypothesisPublicationInput = Readonly<{
  values: HypothesisPublicationFormValues;
  hypothesisId: string;
  intent: HypothesisPublicationIntent;
}>;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStrings(formData: FormData, key: string): readonly string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isOneOf<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return values.includes(value as T);
}

function parseTimestamp(value: string): string | null {
  if (!value || Number.isNaN(Date.parse(value))) {
    return null;
  }

  return new Date(value).toISOString();
}

function parseOptionalConfidence(value: string): number | null {
  if (!value) {
    return null;
  }

  if (!/^\d{1,3}$/.test(value)) {
    return null;
  }

  const confidence = Number(value);
  return confidence >= 0 && confidence <= 100 ? confidence : null;
}

function hasFieldErrors<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
): boolean {
  return Object.keys(fieldErrors).length > 0;
}

function hypothesisValues(formData: FormData): HypothesisFormValues {
  return {
    hypothesisId: getString(formData, "hypothesisId") || null,
    slug: getString(formData, "slug"),
    projectItemId: getString(formData, "projectItemId"),
    categoryId: getString(formData, "categoryId"),
    parentHypothesisId: getString(formData, "parentHypothesisId"),
    parentRelation: getString(formData, "parentRelation"),
    statement: getString(formData, "statement"),
    rationale: getString(formData, "rationale"),
    successCriteria: getString(formData, "successCriteria"),
    measurementPlan: getString(formData, "measurementPlan"),
    status: getString(formData, "status"),
    publicSummary: getString(formData, "publicSummary"),
    confidenceBefore: getString(formData, "confidenceBefore"),
    startedAt: getString(formData, "startedAt"),
    reviewDueAt: getString(formData, "reviewDueAt"),
    tagIds: getStrings(formData, "tagIds"),
  };
}

function hypothesisErrorState(
  values: HypothesisFormValues,
  fieldErrors: Partial<Record<HypothesisFormField, string>>,
): HypothesisFormActionState {
  return {
    status: "error",
    message: "입력 내용을 확인해 주세요.",
    fieldErrors,
    values,
  };
}

export function parseCreateHypothesisFormData(
  formData: FormData,
): ParseResult<SaveHypothesisInput, HypothesisFormActionState> {
  const parsed = parseHypothesisFormData(formData, false);
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.input.hypothesisId !== null) {
    return {
      ok: false,
      state: hypothesisErrorState(parsed.input.values, {
        hypothesisId: "새 가설에는 기존 가설 ID를 사용할 수 없습니다.",
      }),
    };
  }
  if (parsed.input.status === "concluded" || parsed.input.status === "abandoned") {
    return {
      ok: false,
      state: hypothesisErrorState(parsed.input.values, {
        status: "새 가설은 초안, 계획됨, 진행 중 상태로만 만들 수 있습니다.",
      }),
    };
  }
  return parsed;
}

export function parseUpdateHypothesisFormData(
  formData: FormData,
): ParseResult<SaveHypothesisInput, HypothesisFormActionState> {
  return parseHypothesisFormData(formData, true);
}

function parseHypothesisFormData(
  formData: FormData,
  requireHypothesisId: boolean,
): ParseResult<SaveHypothesisInput, HypothesisFormActionState> {
  const values = hypothesisValues(formData);
  const fieldErrors: Partial<Record<HypothesisFormField, string>> = {};
  const hypothesisId = values.hypothesisId;
  const projectItemId = values.projectItemId || null;
  const parentHypothesisId = values.parentHypothesisId || null;
  const parentRelation = values.parentRelation || null;
  const confidenceBefore = parseOptionalConfidence(values.confidenceBefore);
  const startedAt = values.startedAt ? parseTimestamp(values.startedAt) : null;
  const reviewDueAt = values.reviewDueAt ? parseTimestamp(values.reviewDueAt) : null;

  if (requireHypothesisId && !isUuid(hypothesisId ?? "")) {
    fieldErrors.hypothesisId = "가설 정보를 확인할 수 없습니다.";
  }
  if (!values.slug || values.slug.length > 120 || !SLUG_PATTERN.test(values.slug)) {
    fieldErrors.slug = "영문 소문자, 숫자, 하이픈만 사용해 120자 이내로 입력해 주세요.";
  }
  if (projectItemId && !isUuid(projectItemId)) {
    fieldErrors.projectItemId = "프로젝트 정보를 확인할 수 없습니다.";
  }
  if (!isUuid(values.categoryId)) {
    fieldErrors.categoryId = "카테고리를 선택해 주세요.";
  }
  if ((parentHypothesisId === null) !== (parentRelation === null)) {
    fieldErrors.parentHypothesisId = "상위 가설과 관계를 함께 입력해 주세요.";
    fieldErrors.parentRelation = "상위 가설과 관계를 함께 입력해 주세요.";
  }
  if (parentHypothesisId && !isUuid(parentHypothesisId)) {
    fieldErrors.parentHypothesisId = "상위 가설 정보를 확인할 수 없습니다.";
  }
  if (parentRelation && !isOneOf(hypothesisParentRelations, parentRelation)) {
    fieldErrors.parentRelation = "지원하지 않는 가설 관계입니다.";
  }
  if (!values.statement) {
    fieldErrors.statement = "가설을 입력해 주세요.";
  }
  if (!values.successCriteria) {
    fieldErrors.successCriteria = "성공 기준을 입력해 주세요.";
  }
  if (!isOneOf(hypothesisStatuses, values.status)) {
    fieldErrors.status = "지원하지 않는 가설 상태입니다.";
  }
  if (values.confidenceBefore && confidenceBefore === null) {
    fieldErrors.confidenceBefore = "확신도는 0에서 100 사이의 정수로 입력해 주세요.";
  }
  if (values.startedAt && !startedAt) {
    fieldErrors.startedAt = "시작 시각을 올바르게 입력해 주세요.";
  }
  if (values.reviewDueAt && !reviewDueAt) {
    fieldErrors.reviewDueAt = "검토 예정 시각을 올바르게 입력해 주세요.";
  }
  if (new Set(values.tagIds).size !== values.tagIds.length || values.tagIds.some((id) => !isUuid(id))) {
    fieldErrors.tagIds = "태그 정보를 확인해 주세요.";
  }

  if (hasFieldErrors(fieldErrors)) {
    return { ok: false, state: hypothesisErrorState(values, fieldErrors) };
  }

  return {
    ok: true,
    input: {
      values,
      hypothesisId,
      projectItemId,
      categoryId: values.categoryId,
      parentHypothesisId,
      parentRelation: parentRelation as HypothesisParentRelation | null,
      status: values.status as HypothesisStatus,
      confidenceBefore,
      startedAt,
      reviewDueAt,
      tagIds: values.tagIds,
    },
  };
}

export function parseCreateHypothesisActivityFormData(
  formData: FormData,
): ParseResult<CreateActivityInput, HypothesisActivityActionState> {
  return parseHypothesisActivityFormData(formData, false);
}

export function parseUpdateHypothesisActivityFormData(
  formData: FormData,
): ParseResult<CreateActivityInput, HypothesisActivityActionState> {
  return parseHypothesisActivityFormData(formData, true);
}

function parseHypothesisActivityFormData(
  formData: FormData,
  requireActivityId: boolean,
): ParseResult<CreateActivityInput, HypothesisActivityActionState> {
  const values: HypothesisActivityFormValues = {
    hypothesisId: getString(formData, "hypothesisId"),
    activityId: getString(formData, "activityId"),
    relatedContentItemId: getString(formData, "relatedContentItemId"),
    activityType: getString(formData, "activityType"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    startedAt: getString(formData, "startedAt"),
    completedAt: getString(formData, "completedAt"),
  };
  const fieldErrors: Partial<Record<HypothesisActivityFormField, string>> = {};
  const startedAt = parseTimestamp(values.startedAt);
  const completedAt = values.completedAt ? parseTimestamp(values.completedAt) : null;

  if (!isUuid(values.hypothesisId)) fieldErrors.hypothesisId = "가설 정보를 확인할 수 없습니다.";
  if (requireActivityId && !isUuid(values.activityId)) fieldErrors.activityId = "활동 정보를 확인할 수 없습니다.";
  if (values.relatedContentItemId && !isUuid(values.relatedContentItemId)) fieldErrors.relatedContentItemId = "연결 콘텐츠 정보를 확인할 수 없습니다.";
  if (!isOneOf(hypothesisActivityTypes, values.activityType)) fieldErrors.activityType = "지원하지 않는 활동 유형입니다.";
  if (!values.title) fieldErrors.title = "활동 제목을 입력해 주세요.";
  if (!startedAt) fieldErrors.startedAt = "시작 시각을 올바르게 입력해 주세요.";
  if (values.completedAt && !completedAt) fieldErrors.completedAt = "완료 시각을 올바르게 입력해 주세요.";
  if (startedAt && completedAt && completedAt < startedAt) fieldErrors.completedAt = "완료 시각은 시작 시각보다 빠를 수 없습니다.";

  if (hasFieldErrors(fieldErrors)) return { ok: false, state: { status: "error", message: "입력 내용을 확인해 주세요.", fieldErrors, values } };
  return { ok: true, input: { values, hypothesisId: values.hypothesisId, relatedContentItemId: values.relatedContentItemId || null, activityType: values.activityType as HypothesisActivityType, startedAt, completedAt } };
}

export function parseCreateHypothesisEvidenceFormData(
  formData: FormData,
): ParseResult<CreateEvidenceInput, HypothesisEvidenceActionState> {
  return parseHypothesisEvidenceFormData(formData, false);
}

export function parseUpdateHypothesisEvidenceFormData(
  formData: FormData,
): ParseResult<CreateEvidenceInput, HypothesisEvidenceActionState> {
  return parseHypothesisEvidenceFormData(formData, true);
}

function parseHypothesisEvidenceFormData(
  formData: FormData,
  requireEvidenceId: boolean,
): ParseResult<CreateEvidenceInput, HypothesisEvidenceActionState> {
  const values: HypothesisEvidenceFormValues = {
    hypothesisId: getString(formData, "hypothesisId"),
    evidenceId: getString(formData, "evidenceId"),
    activityId: getString(formData, "activityId"),
    evidenceType: getString(formData, "evidenceType"),
    summary: getString(formData, "summary"),
    detailsMarkdown: getString(formData, "detailsMarkdown"),
    sourceUrl: getString(formData, "sourceUrl"),
    observedAt: getString(formData, "observedAt"),
  };
  const fieldErrors: Partial<Record<HypothesisEvidenceFormField, string>> = {};
  const observedAt = parseTimestamp(values.observedAt);
  if (!isUuid(values.hypothesisId)) fieldErrors.hypothesisId = "가설 정보를 확인할 수 없습니다.";
  if (requireEvidenceId && !isUuid(values.evidenceId)) fieldErrors.evidenceId = "증거 정보를 확인할 수 없습니다.";
  if (!isUuid(values.activityId)) fieldErrors.activityId = "활동 정보를 확인할 수 없습니다.";
  if (!isOneOf(hypothesisEvidenceTypes, values.evidenceType)) fieldErrors.evidenceType = "지원하지 않는 증거 유형입니다.";
  if (!values.summary) fieldErrors.summary = "증거 요약을 입력해 주세요.";
  if (values.sourceUrl && !/^https?:\/\//i.test(values.sourceUrl)) fieldErrors.sourceUrl = "http 또는 https URL을 입력해 주세요.";
  if (!observedAt) fieldErrors.observedAt = "관찰 시각을 올바르게 입력해 주세요.";
  if (hasFieldErrors(fieldErrors)) return { ok: false, state: { status: "error", message: "입력 내용을 확인해 주세요.", fieldErrors, values } };
  return { ok: true, input: { values, activityId: values.activityId, evidenceType: values.evidenceType as HypothesisEvidenceType, sourceUrl: values.sourceUrl || null, observedAt } };
}

function parseDecisionFormData(
  formData: FormData,
): ParseResult<HypothesisDecisionInput, HypothesisDecisionActionState> {
  const values: HypothesisDecisionFormValues = {
    hypothesisId: getString(formData, "hypothesisId"),
    verdict: getString(formData, "verdict"),
    reasoning: getString(formData, "reasoning"),
    confidenceAfter: getString(formData, "confidenceAfter"),
    failureType: getString(formData, "failureType"),
    decidedAt: getString(formData, "decidedAt"),
  };
  const fieldErrors: Partial<Record<HypothesisDecisionFormField, string>> = {};
  const confidenceAfter = parseOptionalConfidence(values.confidenceAfter);
  const decidedAt = parseTimestamp(values.decidedAt);
  if (!isUuid(values.hypothesisId)) fieldErrors.hypothesisId = "가설 정보를 확인할 수 없습니다.";
  if (!isOneOf(hypothesisVerdicts, values.verdict)) fieldErrors.verdict = "지원하지 않는 판정입니다.";
  if (!values.reasoning) fieldErrors.reasoning = "판정 근거를 입력해 주세요.";
  if (values.confidenceAfter && confidenceAfter === null) fieldErrors.confidenceAfter = "확신도는 0에서 100 사이의 정수로 입력해 주세요.";
  if (values.failureType && !isOneOf(hypothesisFailureTypes, values.failureType)) fieldErrors.failureType = "지원하지 않는 실패 유형입니다.";
  if (!decidedAt) fieldErrors.decidedAt = "판정 시각을 올바르게 입력해 주세요.";
  if (hasFieldErrors(fieldErrors)) return { ok: false, state: { status: "error", message: "입력 내용을 확인해 주세요.", fieldErrors, values } };
  return { ok: true, input: { values, hypothesisId: values.hypothesisId, verdict: values.verdict as HypothesisVerdict, confidenceAfter, failureType: values.failureType ? values.failureType as HypothesisFailureType : null, decidedAt } };
}

export const parseConcludeHypothesisFormData = parseDecisionFormData;
export const parseCorrectHypothesisDecisionFormData = parseDecisionFormData;

export function parseHypothesisPublicationIntentFormData(
  formData: FormData,
): ParseResult<HypothesisPublicationInput, HypothesisPublicationActionState> {
  const values: HypothesisPublicationFormValues = {
    hypothesisId: getString(formData, "hypothesisId"),
    intent: getString(formData, "intent"),
    publicSummary: getString(formData, "publicSummary"),
  };
  const fieldErrors: Partial<Record<HypothesisPublicationFormField, string>> = {};
  if (!isUuid(values.hypothesisId)) fieldErrors.hypothesisId = "가설 정보를 확인할 수 없습니다.";
  if (!isOneOf(hypothesisPublicationIntents, values.intent)) fieldErrors.intent = "지원하지 않는 공개 작업입니다.";
  if (values.intent !== "unpublish" && !values.publicSummary) fieldErrors.publicSummary = "공개 요약을 입력해 주세요.";
  if (hasFieldErrors(fieldErrors)) return { ok: false, state: { status: "error", message: "입력 내용을 확인해 주세요.", fieldErrors, values } };
  return { ok: true, input: { values, hypothesisId: values.hypothesisId, intent: values.intent as HypothesisPublicationIntent } };
}

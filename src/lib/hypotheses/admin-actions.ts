"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import type {
  HypothesisActivityActionState,
  HypothesisDecisionActionState,
  HypothesisEvidenceActionState,
  HypothesisFormActionState,
  HypothesisPublicationActionState,
} from "@/lib/hypotheses/admin-types";
import {
  parseConcludeHypothesisFormData,
  parseCorrectHypothesisDecisionFormData,
  parseCreateHypothesisActivityFormData,
  parseCreateHypothesisEvidenceFormData,
  parseCreateHypothesisFormData,
  parseHypothesisPublicationIntentFormData,
  parseUpdateHypothesisActivityFormData,
  parseUpdateHypothesisEvidenceFormData,
  parseUpdateHypothesisFormData,
} from "@/lib/hypotheses/admin-validation";

function revalidateHypothesisPaths(hypothesisId: string): void {
  revalidatePath("/admin");
  revalidatePath("/admin/hypotheses");
  revalidatePath(`/admin/hypotheses/${hypothesisId}`);
}

function hypothesisDetailPath(hypothesisId: string, result: string): string {
  return `/admin/hypotheses/${hypothesisId}?result=${result}`;
}

export async function createHypothesisAction(
  _previousState: HypothesisFormActionState,
  formData: FormData,
): Promise<HypothesisFormActionState> {
  const parsed = parseCreateHypothesisFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession("/admin/hypotheses/new");
  const { data, error } = await supabase.rpc("create_hypothesis", {
    p_slug: parsed.input.values.slug,
    p_project_item_id: parsed.input.projectItemId,
    p_category_id: parsed.input.categoryId,
    p_parent_hypothesis_id: parsed.input.parentHypothesisId,
    p_parent_relation: parsed.input.parentRelation,
    p_statement: parsed.input.values.statement,
    p_rationale: parsed.input.values.rationale || null,
    p_success_criteria: parsed.input.values.successCriteria,
    p_measurement_plan: parsed.input.values.measurementPlan || null,
    p_status: parsed.input.status,
    p_confidence_before: parsed.input.confidenceBefore,
    p_review_due_at: parsed.input.reviewDueAt,
    p_tag_ids: parsed.input.tagIds,
  });
  if (error || typeof data !== "string") {
    console.error("Supabase hypothesis creation failed", { operation: "create hypothesis", code: error?.code ?? "invalid_result", details: error?.details ?? null, hint: error?.hint ?? null });
    return { status: "error", message: "가설을 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(data);
  redirect(hypothesisDetailPath(data, "created"));
}

export async function updateHypothesisAction(
  _previousState: HypothesisFormActionState,
  formData: FormData,
): Promise<HypothesisFormActionState> {
  const parsed = parseUpdateHypothesisFormData(formData);
  if (!parsed.ok) return parsed.state;
  const hypothesisId = parsed.input.hypothesisId;
  if (!hypothesisId) return { status: "error", message: "가설 정보를 확인할 수 없습니다.", fieldErrors: { hypothesisId: "가설 정보를 확인할 수 없습니다." }, values: parsed.input.values };
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${hypothesisId}`);
  const { error } = await supabase.rpc("update_hypothesis", {
    p_hypothesis_id: hypothesisId,
    p_slug: parsed.input.values.slug,
    p_project_item_id: parsed.input.projectItemId,
    p_category_id: parsed.input.categoryId,
    p_statement: parsed.input.values.statement,
    p_rationale: parsed.input.values.rationale || null,
    p_success_criteria: parsed.input.values.successCriteria,
    p_measurement_plan: parsed.input.values.measurementPlan || null,
    p_status: parsed.input.status,
    p_public_summary: parsed.input.values.publicSummary || null,
    p_confidence_before: parsed.input.confidenceBefore,
    p_started_at: parsed.input.startedAt,
    p_review_due_at: parsed.input.reviewDueAt,
    p_tag_ids: parsed.input.tagIds,
  });
  if (error) {
    console.error("Supabase hypothesis update failed", { operation: "update hypothesis", hypothesisId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "가설을 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(hypothesisId);
  redirect(hypothesisDetailPath(hypothesisId, "saved"));
}

export async function createHypothesisActivityAction(
  _previousState: HypothesisActivityActionState,
  formData: FormData,
): Promise<HypothesisActivityActionState> {
  const parsed = parseCreateHypothesisActivityFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.hypothesisId}`);
  const { error } = await supabase.rpc("create_hypothesis_activity", {
    p_hypothesis_id: parsed.input.hypothesisId,
    p_related_content_item_id: parsed.input.relatedContentItemId,
    p_activity_type: parsed.input.activityType,
    p_title: parsed.input.values.title,
    p_description: parsed.input.values.description || null,
    p_started_at: parsed.input.startedAt,
    p_completed_at: parsed.input.completedAt,
  });
  if (error) {
    console.error("Supabase hypothesis activity creation failed", { operation: "create hypothesis activity", hypothesisId: parsed.input.hypothesisId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "활동을 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.hypothesisId, "activity-created"));
}

export async function updateHypothesisActivityAction(
  _previousState: HypothesisActivityActionState,
  formData: FormData,
): Promise<HypothesisActivityActionState> {
  const parsed = parseUpdateHypothesisActivityFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.hypothesisId}`);
  const { error } = await supabase.rpc("update_hypothesis_activity", {
    p_activity_id: parsed.input.values.activityId,
    p_related_content_item_id: parsed.input.relatedContentItemId,
    p_activity_type: parsed.input.activityType,
    p_title: parsed.input.values.title,
    p_description: parsed.input.values.description || null,
    p_started_at: parsed.input.startedAt,
    p_completed_at: parsed.input.completedAt,
  });
  if (error) {
    console.error("Supabase hypothesis activity update failed", { operation: "update hypothesis activity", hypothesisId: parsed.input.hypothesisId, activityId: parsed.input.values.activityId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "활동을 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.hypothesisId, "activity-updated"));
}

export async function createHypothesisEvidenceAction(
  _previousState: HypothesisEvidenceActionState,
  formData: FormData,
): Promise<HypothesisEvidenceActionState> {
  const parsed = parseCreateHypothesisEvidenceFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.values.hypothesisId}`);
  const { error } = await supabase.rpc("create_hypothesis_evidence", {
    p_activity_id: parsed.input.activityId,
    p_evidence_type: parsed.input.evidenceType,
    p_summary: parsed.input.values.summary,
    p_details_markdown: parsed.input.values.detailsMarkdown || null,
    p_source_url: parsed.input.sourceUrl,
    p_observed_at: parsed.input.observedAt,
  });
  if (error) {
    console.error("Supabase hypothesis evidence creation failed", { operation: "create hypothesis evidence", activityId: parsed.input.activityId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "증거를 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.values.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.values.hypothesisId, "evidence-created"));
}

export async function updateHypothesisEvidenceAction(
  _previousState: HypothesisEvidenceActionState,
  formData: FormData,
): Promise<HypothesisEvidenceActionState> {
  const parsed = parseUpdateHypothesisEvidenceFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.values.hypothesisId}`);
  const { error } = await supabase.rpc("update_hypothesis_evidence", {
    p_evidence_id: parsed.input.values.evidenceId,
    p_evidence_type: parsed.input.evidenceType,
    p_summary: parsed.input.values.summary,
    p_details_markdown: parsed.input.values.detailsMarkdown || null,
    p_source_url: parsed.input.sourceUrl,
    p_observed_at: parsed.input.observedAt,
  });
  if (error) {
    console.error("Supabase hypothesis evidence update failed", { operation: "update hypothesis evidence", hypothesisId: parsed.input.values.hypothesisId, evidenceId: parsed.input.values.evidenceId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "증거를 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.values.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.values.hypothesisId, "evidence-updated"));
}

async function saveHypothesisDecision(
  formData: FormData,
  parser: typeof parseConcludeHypothesisFormData,
  rpcName: "conclude_hypothesis" | "correct_hypothesis_decision",
): Promise<HypothesisDecisionActionState> {
  const parsed = parser(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.hypothesisId}`);
  const { error } = await supabase.rpc(rpcName, {
    p_hypothesis_id: parsed.input.hypothesisId,
    p_verdict: parsed.input.verdict,
    p_reasoning: parsed.input.values.reasoning,
    p_confidence_after: parsed.input.confidenceAfter,
    p_failure_type: parsed.input.failureType,
    p_decided_at: parsed.input.decidedAt,
  });
  if (error) {
    console.error("Supabase hypothesis decision mutation failed", { operation: rpcName, hypothesisId: parsed.input.hypothesisId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "판정을 저장하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.hypothesisId, rpcName === "conclude_hypothesis" ? "concluded" : "decision-corrected"));
}

export async function concludeHypothesisAction(
  _previousState: HypothesisDecisionActionState,
  formData: FormData,
): Promise<HypothesisDecisionActionState> {
  return saveHypothesisDecision(formData, parseConcludeHypothesisFormData, "conclude_hypothesis");
}

export async function correctHypothesisDecisionAction(
  _previousState: HypothesisDecisionActionState,
  formData: FormData,
): Promise<HypothesisDecisionActionState> {
  return saveHypothesisDecision(formData, parseCorrectHypothesisDecisionFormData, "correct_hypothesis_decision");
}

export async function changeHypothesisPublicationAction(
  _previousState: HypothesisPublicationActionState,
  formData: FormData,
): Promise<HypothesisPublicationActionState> {
  const parsed = parseHypothesisPublicationIntentFormData(formData);
  if (!parsed.ok) return parsed.state;
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${parsed.input.hypothesisId}`);
  const rpcName = parsed.input.intent === "publish" ? "publish_hypothesis" : parsed.input.intent === "publish_changes" ? "publish_hypothesis_changes" : "unpublish_hypothesis";
  const { error } = await supabase.rpc(rpcName, { p_hypothesis_id: parsed.input.hypothesisId });
  if (error) {
    console.error("Supabase hypothesis publication mutation failed", { operation: rpcName, hypothesisId: parsed.input.hypothesisId, code: error.code, details: error.details, hint: error.hint });
    return { status: "error", message: "공개 상태를 변경하지 못했습니다. 다시 시도해 주세요.", fieldErrors: {}, values: parsed.input.values };
  }
  revalidateHypothesisPaths(parsed.input.hypothesisId);
  redirect(hypothesisDetailPath(parsed.input.hypothesisId, parsed.input.intent));
}

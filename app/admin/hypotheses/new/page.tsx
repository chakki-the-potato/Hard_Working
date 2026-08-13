import type { Metadata } from "next";
import Link from "next/link";
import { HypothesisForm } from "@/components/hypotheses/hypothesis-form";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listHypothesisAdminOptions } from "@/lib/hypotheses/admin-queries";
import {
  hypothesisParentRelations,
  type HypothesisFormValues,
  type HypothesisParentRelation,
} from "@/lib/hypotheses/admin-types";

export const metadata: Metadata = {
  title: "새 가설",
};

export const dynamic = "force-dynamic";

type NewHypothesisPageProps = Readonly<{
  searchParams: Promise<{
    parent?: string;
    relation?: string;
  }>;
}>;

function isParentRelation(value: string): value is HypothesisParentRelation {
  return hypothesisParentRelations.some((relation) => relation === value);
}

export default async function NewHypothesisPage({
  searchParams,
}: NewHypothesisPageProps) {
  const { supabase } = await requireAdminSession("/admin/hypotheses/new");
  const [options, query] = await Promise.all([
    listHypothesisAdminOptions(supabase),
    searchParams,
  ]);
  const defaultCategory = options.categories[0];

  if (!defaultCategory) {
    throw new Error("Hypothesis editor requires at least one category");
  }

  const parentRelation = query.relation && isParentRelation(query.relation)
    ? query.relation
    : "";
  const initialValues: HypothesisFormValues = {
    hypothesisId: null,
    slug: "",
    projectItemId: "",
    categoryId: defaultCategory.id,
    parentHypothesisId: query.parent ?? "",
    parentRelation: query.parent && parentRelation ? parentRelation : "",
    statement: "",
    rationale: "",
    successCriteria: "",
    measurementPlan: "",
    status: "planned",
    publicSummary: "",
    confidenceBefore: "",
    startedAt: "",
    reviewDueAt: "",
    tagIds: [],
  };

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">New hypothesis</p>
          <h1 className="admin-title">새 가설.</h1>
          <p className="admin-description">
            검증할 문장과 성공 기준을 먼저 고정합니다.
          </p>
        </div>
        <Link
          className="admin-button admin-button-secondary"
          href="/admin/hypotheses"
        >
          목록으로
        </Link>
      </header>

      <HypothesisForm
        initialValues={initialValues}
        mode="create"
        options={options}
      />
    </main>
  );
}

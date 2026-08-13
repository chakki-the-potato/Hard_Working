import type {
  HypothesisActivity,
  HypothesisAdminOptions,
  HypothesisEvidence,
} from "@/lib/hypotheses/admin-types";
import { ActivityForm } from "./activity-form";
import { EvidenceForm } from "./evidence-form";

type HypothesisTimelineProps = Readonly<{
  activities: readonly HypothesisActivity[];
  hypothesisId: string;
  options: HypothesisAdminOptions;
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function activityValues(hypothesisId: string, activity: HypothesisActivity) {
  return {
    hypothesisId,
    activityId: activity.id,
    relatedContentItemId: activity.relatedContent?.id ?? "",
    activityType: activity.activityType,
    title: activity.title,
    description: activity.description,
    startedAt: activity.startedAt,
    completedAt: activity.completedAt ?? "",
  };
}

function evidenceValues(hypothesisId: string, activityId: string, evidence: HypothesisEvidence) {
  return {
    hypothesisId,
    evidenceId: evidence.id,
    activityId,
    evidenceType: evidence.evidenceType,
    summary: evidence.summary,
    detailsMarkdown: evidence.detailsMarkdown,
    sourceUrl: evidence.sourceUrl ?? "",
    observedAt: evidence.observedAt,
  };
}

export function HypothesisTimeline({ activities, hypothesisId, options }: HypothesisTimelineProps) {
  const sortedActivities = [...activities].sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt));

  if (sortedActivities.length === 0) return <p className="hypothesis-empty">아직 기록된 활동이 없습니다.</p>;

  return (
    <ol className="hypothesis-timeline">
      {sortedActivities.map((activity) => (
        <li className="hypothesis-timeline-item" key={activity.id}>
          <article className="hypothesis-timeline-card">
            <div className="hypothesis-timeline-meta"><span className="hypothesis-badge">{activity.activityType}</span><time dateTime={activity.startedAt}>{formatDate(activity.startedAt)}</time><span className="hypothesis-badge">{activity.publishedAt ? "공개됨" : "공개 대기"}</span></div>
            <h3 className="hypothesis-timeline-title">{activity.title}</h3>
            {activity.description ? <p className="hypothesis-timeline-copy">{activity.description}</p> : null}
            {activity.relatedContent ? <a className="hypothesis-timeline-link" href={activity.relatedContent.path}>{activity.relatedContent.title}</a> : null}
            <ActivityForm initialValues={activityValues(hypothesisId, activity)} mode="edit" options={options} />
            <ol className="hypothesis-evidence-list">
              {activity.evidence.map((evidence) => (
                <li className="hypothesis-evidence-item" key={evidence.id}>
                  <div className="hypothesis-timeline-meta"><span className="hypothesis-badge">{evidence.evidenceType}</span><time dateTime={evidence.observedAt}>{formatDate(evidence.observedAt)}</time><span className="hypothesis-badge">{evidence.publishedAt ? "공개됨" : "공개 대기"}</span></div>
                  <p className="hypothesis-evidence-summary">{evidence.summary}</p>
                  {evidence.detailsMarkdown ? <p className="hypothesis-timeline-copy">{evidence.detailsMarkdown}</p> : null}
                  {evidence.sourceUrl ? <a className="hypothesis-timeline-link" href={evidence.sourceUrl} rel="noreferrer" target="_blank">출처 열기</a> : null}
                  <EvidenceForm activityTitle={activity.title} initialValues={evidenceValues(hypothesisId, activity.id, evidence)} mode="edit" />
                </li>
              ))}
            </ol>
            <EvidenceForm activityTitle={activity.title} initialValues={{ hypothesisId, evidenceId: "", activityId: activity.id, evidenceType: "metric", summary: "", detailsMarkdown: "", sourceUrl: "", observedAt: "" }} mode="create" />
          </article>
        </li>
      ))}
    </ol>
  );
}

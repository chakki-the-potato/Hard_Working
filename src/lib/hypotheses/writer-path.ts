export const HYPOTHESIS_LIST_PATH = "/hypotheses";

const HYPOTHESIS_WRITER_BASE = "/write/hypothesis";

export function getHypothesisWriterPath(
  hypothesisId?: string | null,
): string {
  return hypothesisId
    ? `${HYPOTHESIS_WRITER_BASE}/${hypothesisId}`
    : HYPOTHESIS_WRITER_BASE;
}

export function getHypothesisWriterResultPath(
  hypothesisId: string,
  result: string,
): string {
  return `${getHypothesisWriterPath(hypothesisId)}?result=${result}`;
}

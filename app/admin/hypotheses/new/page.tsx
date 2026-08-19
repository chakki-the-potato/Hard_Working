import { redirect } from "next/navigation";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

export default function LegacyNewHypothesisPage() {
  redirect(getHypothesisWriterPath());
}

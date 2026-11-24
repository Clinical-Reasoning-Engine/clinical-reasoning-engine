import { StepPlaceholder } from "@/components/diagnose/step-placeholder";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseResultsPage({ params }: PageProps<"/diagnose/[caseId]/results">) {
  const { caseId } = await params;
  return (
    <StepPlaceholder
      title="Results"
      description="Your score (history, differentials, work-up plan) with feedback on what you got right, what you missed, and why it matters."
      nextHref={stepHref(caseId, "intro")}
      nextLabel="Back to the patient"
    />
  );
}

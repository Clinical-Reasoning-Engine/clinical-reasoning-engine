import { StepPlaceholder } from "@/components/diagnose/step-placeholder";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseGradePage({ params }: PageProps<"/diagnose/[caseId]/grade">) {
  const { caseId } = await params;
  return (
    <StepPlaceholder
      title="Grade"
      description="Your score breakdown: history, differentials and work-up plan."
      nextHref={stepHref(caseId, "intro")}
      nextLabel="Back to the start"
    />
  );
}

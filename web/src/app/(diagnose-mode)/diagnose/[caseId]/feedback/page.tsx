import { StepPlaceholder } from "@/components/diagnose/step-placeholder";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseFeedbackPage({ params }: PageProps<"/diagnose/[caseId]/feedback">) {
  const { caseId } = await params;
  return (
    <StepPlaceholder
      title="Feedback"
      description="What you got right and missed, compared with the answer key."
      nextHref={stepHref(caseId, "grade")}
      nextLabel="See your grade"
    />
  );
}

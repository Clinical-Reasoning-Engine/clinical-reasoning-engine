import { StepPlaceholder } from "@/components/diagnose/step-placeholder";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseWorkupPage({ params }: PageProps<"/diagnose/[caseId]/workup">) {
  const { caseId } = await params;
  return (
    <StepPlaceholder
      title="Take a history, order tests, submit"
      description="Ask the patient questions in your own words, order tests, then commit to 3 ranked differentials and a work-up plan."
      nextHref={stepHref(caseId, "feedback")}
      nextLabel="Submit (placeholder)"
    />
  );
}

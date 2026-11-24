import { StepPlaceholder } from "@/components/diagnose/step-placeholder";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseIntroPage({ params }: PageProps<"/diagnose/[caseId]">) {
  const { caseId } = await params;
  return (
    <StepPlaceholder
      title="Patient introduction"
      description="Chief complaint, age and sex, and opening vitals from the real record."
      nextHref={stepHref(caseId, "workup")}
      nextLabel="Start the work-up"
    />
  );
}

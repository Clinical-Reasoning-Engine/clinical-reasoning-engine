// Step 3 of the case: score and feedback. Grading runs on the server
// (actions.ts); this page only renders the client view that asks for it.

import { getDiagnoseCase } from "@/lib/diagnose/cases";

import { ResultsView } from "./results-view";

export default async function DiagnoseResultsPage({ params }: PageProps<"/diagnose/[caseId]/results">) {
  const { caseId } = await params;
  // The layout's dynamicParams = false means only known case ids get here.
  const { title } = getDiagnoseCase(caseId)!;
  return <ResultsView caseId={caseId} caseTitle={title} />;
}

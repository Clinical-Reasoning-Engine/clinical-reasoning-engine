// Step 3 of the case: score and feedback. Grading runs on the server
// (actions.ts); this page only renders the client view that asks for it.

import { ResultsView } from "./results-view";

export default async function DiagnoseResultsPage({ params }: PageProps<"/diagnose/[caseId]/results">) {
  const { caseId } = await params;
  return <ResultsView caseId={caseId} />;
}

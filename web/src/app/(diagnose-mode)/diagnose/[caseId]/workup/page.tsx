// Step 2 of the case: take a history, order tests, submit differentials and a plan.
// This server page looks up the case and hands only what the browser needs to
// the client component (not the answer key, and not the big trajectory tree).

import { notFound } from "next/navigation";

import { getDiagnoseCase } from "@/lib/diagnose/cases";

import { Workup } from "./workup";

export default async function DiagnoseWorkupPage({ params }: PageProps<"/diagnose/[caseId]/workup">) {
  const { caseId } = await params;
  const c = getDiagnoseCase(caseId);
  if (!c) notFound();
  return <Workup caseId={caseId} title={c.title} history={c.history} tests={c.tests} diagnoses={c.diagnoses} />;
}

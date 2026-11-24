// Frame for every page of one Diagnose-mode case: sign-in check, user bar,
// step bar and the not-medical-advice footer.

import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { UserBar } from "@/components/auth/user-bar";
import { AttemptProvider } from "@/components/diagnose/attempt-provider";
import { ChartDialog } from "@/components/diagnose/chart-dialog";
import { Disclaimer } from "@/components/diagnose/disclaimer";
import { StepNav } from "@/components/diagnose/step-nav";
import { chartForStudent, getDiagnoseCase } from "@/lib/diagnose/cases";
import { DIAGNOSE_CASE_IDS } from "@/lib/diagnose/steps";

// Build one set of pages per known case; any other /diagnose/<id> is a 404.
export function generateStaticParams() {
  return DIAGNOSE_CASE_IDS.map((caseId) => ({ caseId }));
}
export const dynamicParams = false;

export default async function DiagnoseCaseLayout({ children, params }: LayoutProps<"/diagnose/[caseId]">) {
  const { caseId } = await params;
  const diagnoseCase = getDiagnoseCase(caseId);
  // The chart goes to the browser without its list of deliberate gaps (answer key).
  const visibleChart = diagnoseCase ? chartForStudent(diagnoseCase.chart) : null;
  const patientLine = diagnoseCase
    ? `${diagnoseCase.patient.age}-year-old ${diagnoseCase.patient.sex === "F" ? "woman" : "man"} · de-identified`
    : "";

  return (
    <>
      <RequireAuth>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xs uppercase tracking-widest text-teal-300">
                Clinical Reasoning Engine · Diagnose mode
              </Link>
              <UserBar />
            </div>
            <StepNav caseId={caseId} />
          </header>
          <AttemptProvider caseId={caseId}>{children}</AttemptProvider>
        </div>
        {visibleChart && <ChartDialog chart={visibleChart} patientLine={patientLine} />}
      </RequireAuth>
      <Disclaimer />
    </>
  );
}

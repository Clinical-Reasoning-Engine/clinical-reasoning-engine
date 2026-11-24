// Frame for every page of one Diagnose-mode case: sign-in check, a pinned
// header (app name, chart, user, patient banner, progress) and the
// not-medical-advice footer.

import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { UserBar } from "@/components/auth/user-bar";
import { AttemptProvider } from "@/components/diagnose/attempt-provider";
import { ChartDialog } from "@/components/diagnose/chart-dialog";
import { Disclaimer } from "@/components/diagnose/disclaimer";
import { PatientBanner } from "@/components/diagnose/patient-banner";
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
  // dynamicParams = false means only known ids reach this layout.
  const diagnoseCase = getDiagnoseCase(caseId)!;
  const { patient, title, openingVitals } = diagnoseCase;
  const patientLine = `${patient.age}-year-old ${patient.sex === "F" ? "woman" : "man"}`;

  return (
    <>
      <RequireAuth>
        {/* Pinned on tablets and up; on phones it would cover too much of the screen. */}
        <header className="z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur md:sticky md:top-0">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="flex h-12 items-center justify-between gap-4">
              <Link href="/" className="truncate text-sm font-semibold text-zinc-200 hover:text-white">
                Clinical Reasoning Engine
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                {/* The chart goes to the browser without its deliberate gaps (answer key). */}
                <ChartDialog chart={chartForStudent(diagnoseCase.chart)} patientLine={`${patientLine} · de-identified`} />
                <UserBar />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-3">
              <PatientBanner patientLine={patientLine} title={title} vitals={openingVitals.values} />
              <StepNav caseId={caseId} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <AttemptProvider caseId={caseId}>{children}</AttemptProvider>
        </main>
      </RequireAuth>
      <Disclaimer />
    </>
  );
}

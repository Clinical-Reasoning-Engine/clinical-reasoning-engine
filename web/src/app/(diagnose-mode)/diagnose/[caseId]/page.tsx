// Step 1 of the case: meet the patient. The story on the left, the opening
// vitals on the right. One plain note says which parts are real; the Results
// page shows sources item by item. Deliberately no diagnosis hints.

import Link from "next/link";
import { notFound } from "next/navigation";

import { VitalsPanel } from "@/components/diagnose/vitals-panel";
import { getDiagnoseCase } from "@/lib/diagnose/cases";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseIntroPage({ params }: PageProps<"/diagnose/[caseId]">) {
  const { caseId } = await params;
  const diagnoseCase = getDiagnoseCase(caseId);
  if (!diagnoseCase) notFound();
  const { patient, chiefComplaint, setting, openingVitals } = diagnoseCase;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-sm font-medium text-zinc-400">Chief complaint</h1>
          <blockquote className="border-l-2 border-teal-500 pl-4 text-2xl leading-snug text-zinc-50">
            {chiefComplaint.text}
          </blockquote>
        </div>
        <div className="flex flex-col gap-2 text-zinc-300">
          <p>{setting.text}</p>
          <p className="text-sm text-zinc-400">
            Patient: {patient.age}-year-old {patient.sex === "F" ? "woman" : "man"}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={stepHref(caseId, "workup")}
            className="self-start rounded-xl bg-teal-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-teal-400"
          >
            Start the work-up
          </Link>
          <p className="text-sm text-zinc-500">
            Take a history in your own words, order tests, then give three ranked differentials and a plan. The chart
            is in the header whenever you need it.
          </p>
        </div>
        <p className="border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-500">
          About this case: the age, sex, vitals and lab values come from a real, de-identified hospital stay (MIMIC-IV
          demo). The history, chart and some test results were written by our team for teaching. Your results page shows
          which is which.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="font-semibold text-zinc-100">Opening vitals</h2>
        <VitalsPanel values={openingVitals.values} />
        <p className="text-xs text-zinc-500">{openingVitals.note}</p>
      </section>
    </div>
  );
}

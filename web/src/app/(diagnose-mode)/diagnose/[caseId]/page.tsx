// Step 1 of the case: meet the patient. Shows the chief complaint, who the
// patient is and the opening vitals, each labelled with where it came from.
// Deliberately no diagnosis hints: the student works that out in the work-up.

import Link from "next/link";
import { notFound } from "next/navigation";

import { SourceTag } from "@/components/diagnose/source-tag";
import { VitalsPanel } from "@/components/diagnose/vitals-panel";
import { getDiagnoseCase } from "@/lib/diagnose/cases";
import { stepHref } from "@/lib/diagnose/steps";

export default async function DiagnoseIntroPage({ params }: PageProps<"/diagnose/[caseId]">) {
  const { caseId } = await params;
  const diagnoseCase = getDiagnoseCase(caseId);
  if (!diagnoseCase) notFound();
  const { title, patient, chiefComplaint, setting, openingVitals } = diagnoseCase;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-teal-300">New patient</p>
        <h1 className="text-3xl font-semibold text-zinc-50">{title}</h1>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">Chief complaint</h2>
          <SourceTag source={chiefComplaint.source} />
        </div>
        <p className="text-lg text-zinc-100">{chiefComplaint.text}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span>{setting.text}</span>
          <SourceTag source={setting.source} />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Patient</h2>
          <p className="text-lg text-zinc-100">
            {patient.age}-year-old {patient.sex === "F" ? "woman" : "man"}
          </p>
        </div>
        <SourceTag source={patient.source} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">Opening vitals</h2>
          <SourceTag source={openingVitals.source} />
        </div>
        <VitalsPanel values={openingVitals.values} />
        <p className="text-xs text-zinc-500">{openingVitals.note}</p>
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href={stepHref(caseId, "workup")}
          className="self-start rounded-xl bg-teal-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-teal-400"
        >
          Start the work-up
        </Link>
        <p className="text-sm text-zinc-400">
          Next: take a history in your own words, order tests, then commit to three ranked differentials and a plan.
        </p>
      </div>
    </div>
  );
}

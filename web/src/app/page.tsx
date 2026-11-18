import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-950 p-8 text-center">
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-xs uppercase tracking-widest text-teal-300">The Operators · COMP 490/L proof of concept</p>
        <h1 className="text-5xl font-semibold text-zinc-50">Clinical Reasoning Engine</h1>
        <p className="text-lg text-zinc-300">
          Practice real-time clinical decisions on a virtual patient whose vitals follow real ICU data.
        </p>
      </div>
      <Link
        href="/case/sepsis"
        className="rounded-xl bg-teal-500 px-6 py-3 text-lg font-semibold text-zinc-950 hover:bg-teal-400"
      >
        Start the sepsis case
      </Link>
      <p className="max-w-xl text-xs text-zinc-500">
        Educational simulation, not medical advice. Built on the open-access MIMIC-IV Clinical Database Demo (ODbL).
      </p>
    </main>
  );
}

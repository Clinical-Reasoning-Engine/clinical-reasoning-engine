// Temporary stand-in for a page that hasn't been built yet, so the whole flow
// can be clicked through. Each later step of the PR replaces one of these.

import Link from "next/link";

export function StepPlaceholder({
  title,
  description,
  nextHref,
  nextLabel,
}: {
  title: string;
  description: string;
  nextHref: string;
  nextLabel: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">Coming in the next step of the build</p>
      <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
      <p className="text-zinc-300">{description}</p>
      <Link
        href={nextHref}
        className="self-start rounded-xl bg-teal-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-teal-400"
      >
        {nextLabel}
      </Link>
    </section>
  );
}

// Small label that says where a piece of case information came from.

import { SOURCE_LABELS, type Source } from "@/lib/diagnose/case-types";

export function SourceTag({ source }: { source: Source }) {
  const real = source === "mimic-demo";
  return (
    <span
      className={
        "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        (real ? "border-teal-800 text-teal-300" : "border-zinc-700 text-zinc-400")
      }
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}

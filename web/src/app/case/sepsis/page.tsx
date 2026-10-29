import type { Metadata } from "next";

import { CaseSimulator } from "./case-simulator";

export const metadata: Metadata = {
  title: "Sepsis case · Clinical Reasoning Engine",
};

export default function SepsisCasePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-zinc-950">
      <CaseSimulator />
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-xs text-zinc-500">
        Educational simulation, not medical advice. Vitals and labs contain information from the{" "}
        <a className="underline" href="https://physionet.org/content/mimic-iv-demo/2.2/">
          MIMIC-IV Clinical Database Demo
        </a>{" "}
        (Johnson et al., 2023, PhysioNet), made available under the{" "}
        <a className="underline" href="https://opendatacommons.org/licenses/odbl/1-0/">
          Open Database License (ODbL)
        </a>
        . The patient story and replies are written by the team.
      </footer>
    </main>
  );
}

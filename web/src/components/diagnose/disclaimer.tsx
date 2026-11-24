// Shown at the bottom of every Diagnose-mode page. Keep this visible: the app
// has no medical review, and the Gemini terms forbid medical-advice use.

export function Disclaimer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-xs text-zinc-500 sm:px-6">
      <strong className="font-semibold text-zinc-400">Educational simulation, not medical advice.</strong> Vitals and labs
      contain information from the{" "}
      <a className="underline" href="https://physionet.org/content/mimic-iv-demo/2.2/">
        MIMIC-IV Clinical Database Demo
      </a>{" "}
      (Johnson et al., 2023, PhysioNet), made available under the{" "}
      <a className="underline" href="https://opendatacommons.org/licenses/odbl/1-0/">
        Open Database License (ODbL)
      </a>
      . The patient&apos;s history and replies are written by the team.
    </footer>
  );
}

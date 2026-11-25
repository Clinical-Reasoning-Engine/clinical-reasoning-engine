import type { Metadata } from "next";
import { Suspense } from "react";

import { Disclaimer } from "@/components/diagnose/disclaimer";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Clinical Reasoning Engine",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex max-w-md flex-col gap-3 text-center">
        <p className="text-sm font-medium text-teal-300">Diagnose mode</p>
        <h1 className="text-4xl font-semibold text-zinc-50">Sign in to start a case</h1>
        <p className="text-zinc-300">
          Take a history, order tests, then commit to three ranked differentials and a work-up plan.
        </p>
      </div>
      {/* LoginForm reads ?next= from the URL, which Next.js needs inside a Suspense boundary. */}
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <Disclaimer />
    </main>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { safeNextPath, signInErrorMessage } from "@/lib/auth-utils";

export function LoginForm() {
  const { status, googleAvailable, signInWithGoogle, continueAsGuest } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (or just finished signing in): go to the case.
  useEffect(() => {
    if (status === "signed-in") router.replace(next);
  }, [status, next, router]);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(signInErrorMessage((e as { code?: string }).code));
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <p className="text-sm text-zinc-500">Checking sign-in…</p>;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {googleAvailable ? (
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
        >
          <GoogleMark />
          {busy ? "Opening Google…" : "Sign in with Google"}
        </button>
      ) : (
        <>
          <p className="rounded-xl border border-amber-800 bg-amber-950 p-3 text-sm text-amber-200">
            Google sign-in isn&apos;t set up on this deployment yet. You can still try the case as a guest.
          </p>
          <button
            onClick={continueAsGuest}
            className="rounded-xl bg-teal-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-teal-400"
          >
            Continue as guest
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-orange-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Google's four-colour "G", drawn inline so we don't load an image. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

"use client";

// Wraps every Diagnose-mode page. A signed-out student is sent to the Login
// page, with ?next= set so they come back to the same page afterwards.
//
// This check runs in the browser. That's enough for the MVP: the case data is
// open-access and nothing private sits behind these pages. When we save past
// attempts to Firestore (MVP-12), Firestore security rules will do the real
// checking on the server side.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth-provider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== "signed-in") {
    return <p className="p-8 text-center text-sm text-zinc-500">Checking sign-in…</p>;
  }
  return <>{children}</>;
}

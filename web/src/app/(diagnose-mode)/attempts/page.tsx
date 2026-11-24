// My attempts (MVP-12): every graded attempt saved to the signed-in student's
// account, newest first. The list itself is loaded in the browser from
// Firestore (attempts-list.tsx); this page is just the frame.

import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { UserBar } from "@/components/auth/user-bar";
import { Disclaimer } from "@/components/diagnose/disclaimer";

import { AttemptsList } from "./attempts-list";

export default function MyAttemptsPage() {
  return (
    <>
      <RequireAuth>
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="truncate text-sm font-semibold text-zinc-200 hover:text-white">
              Clinical Reasoning Engine
            </Link>
            <UserBar />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-semibold text-zinc-50">My attempts</h1>
          <AttemptsList />
        </main>
      </RequireAuth>
      <Disclaimer />
    </>
  );
}

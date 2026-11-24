"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";

export function UserBar() {
  const { student, signOut } = useAuth();
  const router = useRouter();
  if (!student) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-400">
      {student.mode === "google" && (
        <Link href="/attempts" className="whitespace-nowrap hover:text-zinc-200">
          My attempts
        </Link>
      )}
      <span className="hidden sm:inline">{student.mode === "guest" ? "Guest (nothing is saved)" : `Signed in as ${student.name}`}</span>
      <button
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="whitespace-nowrap rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-400"
      >
        Sign out
      </button>
    </div>
  );
}

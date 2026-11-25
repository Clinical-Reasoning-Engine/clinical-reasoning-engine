// Route group for Diagnose mode: /login and /diagnose/... share this layout.
// The "(diagnose-mode)" folder name doesn't appear in URLs. Because both pages
// sit under one layout, the sign-in state survives moving from Login to the
// case. The Manage-mode POC at /case/sepsis is outside this group and doesn't
// load Firebase at all.

import { AuthProvider } from "@/components/auth/auth-provider";

export default function DiagnoseModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-950">{children}</div>
    </AuthProvider>
  );
}

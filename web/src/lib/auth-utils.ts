// Pure helpers for the Login page. No Firebase or React imports here, so they
// are easy to unit-test (see auth-utils.test.ts).

/** The four Firebase web-app settings that Google sign-in needs. */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

/** Raw values, possibly missing. Built in firebase.ts from NEXT_PUBLIC_FIREBASE_* variables. */
export type FirebaseEnv = { [K in keyof FirebaseWebConfig]: string | undefined };

/**
 * Returns the config only when every value is set. A missing value means
 * Firebase is not set up for this deployment (CI, a fresh clone), and the
 * Login page offers guest mode instead of a broken Google button.
 */
export function readFirebaseConfig(env: FirebaseEnv): FirebaseWebConfig | null {
  const entries = Object.entries(env).map(([key, value]) => [key, value?.trim() ?? ""]);
  if (entries.some(([, value]) => value === "")) return null;
  return Object.fromEntries(entries) as FirebaseWebConfig;
}

/**
 * Where to send the student after signing in. Only same-site paths are
 * allowed ("/diagnose/sepsis"), so a crafted ?next=https://evil.example link
 * can't bounce people to another site (an "open redirect").
 */
export function safeNextPath(next: string | null | undefined, fallback = "/diagnose/sepsis"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** "Gor Petrosyan" -> "Gor". We show only a first name and never store it. */
export function firstName(displayName: string | null | undefined): string {
  const name = displayName?.trim().split(/\s+/)[0];
  return name || "there";
}

/**
 * A friendly message for a Firebase sign-in error code, or null when the
 * student simply closed the popup and nothing needs to be shown.
 */
export function signInErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This web address isn't on the app's approved list yet. A teammate needs to add it in Firebase (Authentication → Settings → Authorized domains).";
    case "auth/network-request-failed":
      return "Couldn't reach Google. Check your connection and try again.";
    default:
      return "Sign-in didn't work. Please try again.";
  }
}

// Firebase setup for Google sign-in. Runs in the browser only.
//
// The values come from NEXT_PUBLIC_FIREBASE_* environment variables (Vercel →
// Settings → Environment Variables, or web/.env.local on your machine). Next.js
// copies them into the browser bundle at build time, so each one must be written
// out in full below: process.env[name] would not be filled in. After changing
// them in Vercel, redeploy. These web-app values are not secrets (anyone can see
// them in the page), but keep them in env vars so each deployment can point at
// its own project.

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { readFirebaseConfig } from "./auth-utils";

export const firebaseConfig = readFirebaseConfig({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

/** True when this deployment has Firebase set up. */
export const firebaseReady = firebaseConfig !== null;

/** The Firebase Auth instance, created on first use. Null when Firebase isn't set up. */
export function firebaseAuth(): Auth | null {
  if (!firebaseConfig) return null;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

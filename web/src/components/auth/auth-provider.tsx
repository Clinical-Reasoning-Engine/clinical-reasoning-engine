"use client";

// Who is signed in, shared with every Diagnose-mode page through React context.
//
// - Firebase set up: Firebase remembers the Google sign-in in the browser and
//   tells us through onAuthStateChanged. Status is "loading" until it answers.
// - Firebase not set up (CI, a fresh clone): there is no Google button, and the
//   student can continue as a guest. Guest mode lives only in memory, so a full
//   page reload goes back to the Login page.
//
// We keep only a first name for the header. Nothing about the student is stored
// by us or sent anywhere else.

import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { firstName } from "@/lib/auth-utils";
import { firebaseAuth, firebaseReady } from "@/lib/firebase";

export type Student = { name: string; mode: "google" | "guest" };
export type AuthStatus = "loading" | "signed-in" | "signed-out";

type AuthContextValue = {
  status: AuthStatus;
  student: Student | null;
  /** True when Google sign-in is available on this deployment. */
  googleAvailable: boolean;
  /** Opens the Google popup. Rejects with a Firebase error (it has a .code) if sign-in fails. */
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = still waiting for Firebase's first answer; null = signed out.
  const [googleUser, setGoogleUser] = useState<User | null | undefined>(undefined);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, setGoogleUser);
  }, []);

  let status: AuthStatus;
  let student: Student | null = null;
  if (firebaseReady) {
    status = googleUser === undefined ? "loading" : googleUser ? "signed-in" : "signed-out";
    if (googleUser) student = { name: firstName(googleUser.displayName), mode: "google" };
  } else {
    status = guest ? "signed-in" : "signed-out";
    if (guest) student = { name: "Guest", mode: "guest" };
  }

  const value: AuthContextValue = {
    status,
    student,
    googleAvailable: firebaseReady,
    async signInWithGoogle() {
      const auth = firebaseAuth();
      if (!auth) throw new Error("Firebase is not set up for this deployment.");
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    continueAsGuest() {
      if (!firebaseReady) setGuest(true);
    },
    async signOut() {
      setGuest(false);
      const auth = firebaseAuth();
      if (auth) await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

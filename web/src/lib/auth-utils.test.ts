import { describe, expect, it } from "vitest";

import { firstName, readFirebaseConfig, safeNextPath, signInErrorMessage } from "./auth-utils";

const full = { apiKey: "k", authDomain: "x.firebaseapp.com", projectId: "x", appId: "1:2:web:3" };

describe("readFirebaseConfig", () => {
  it("returns the config when every value is set", () => {
    expect(readFirebaseConfig(full)).toEqual(full);
  });

  it("returns null when any value is missing or blank", () => {
    expect(readFirebaseConfig({ ...full, apiKey: undefined })).toBeNull();
    expect(readFirebaseConfig({ ...full, appId: "  " })).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/diagnose/sepsis/workup")).toBe("/diagnose/sepsis/workup");
  });

  it("falls back for missing, external or protocol-relative targets", () => {
    expect(safeNextPath(null)).toBe("/diagnose/sepsis");
    expect(safeNextPath("https://evil.example")).toBe("/diagnose/sepsis");
    expect(safeNextPath("//evil.example")).toBe("/diagnose/sepsis");
    expect(safeNextPath("/\\evil.example")).toBe("/diagnose/sepsis");
  });
});

describe("firstName", () => {
  it("takes the first word of the display name", () => {
    expect(firstName("Gor Petrosyan")).toBe("Gor");
  });

  it("has a fallback when there is no name", () => {
    expect(firstName(null)).toBe("there");
    expect(firstName("   ")).toBe("there");
  });
});

describe("signInErrorMessage", () => {
  it("stays quiet when the student closes the popup", () => {
    expect(signInErrorMessage("auth/popup-closed-by-user")).toBeNull();
  });

  it("explains an unapproved domain and falls back for unknown codes", () => {
    expect(signInErrorMessage("auth/unauthorized-domain")).toMatch(/Authorized domains/);
    expect(signInErrorMessage("auth/something-new")).toMatch(/try again/);
  });
});

import type { Metadata } from "next";
import { SignupWizard } from "@/components/signup-wizard";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string; step?: string }> }) {
  const { role, step } = await searchParams;
  // After clicking the link in the verification email the person lands back here, already logged in.
  const profile = step === "password" ? await getProfile() : null;
  if (profile && profile.role !== "admin") {
    return <SignupWizard defaultRole={profile.role} verified={{ name: profile.full_name ?? "", email: profile.email }} />;
  }
  return <SignupWizard defaultRole={role} />;
}

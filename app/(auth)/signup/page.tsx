import type { Metadata } from "next";
import { SignupWizard } from "@/components/signup-wizard";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return <SignupWizard defaultRole={role} />;
}

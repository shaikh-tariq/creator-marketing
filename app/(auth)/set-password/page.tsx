import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/auth-forms";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your password" };

// Reached from the link in the verification email. The person is already logged in at this point.
export default async function SetPasswordPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const first = profile.full_name?.split(" ")[0];

  return (
    <div className="auth-shell px-5 py-12 sm:px-12 lg:py-20">
      <div className="page-enter mx-auto max-w-md">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-success text-2xl text-white">✓</span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Email verified{first ? `, ${first}` : ""}.</h1>
        <p className="mt-3 text-ink-soft">Create a password so you can log in next time.</p>
        <div className="mt-8">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}

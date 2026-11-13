import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/auth-forms";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the reset link in the email. The link has already logged the person in.
export default async function ResetPasswordPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?error=reset");
  const first = profile.full_name?.split(" ")[0];

  return (
    <div className="auth-shell px-5 py-12 sm:px-12 lg:py-20">
      <div className="page-enter mx-auto max-w-md">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Choose a new password{first ? `, ${first}` : ""}.</h1>
        <p className="mt-3 text-ink-soft">Your old password stops working once you save this one.</p>
        <div className="mt-8">
          <PasswordForm submitLabel="Save new password" />
        </div>
      </div>
    </div>
  );
}

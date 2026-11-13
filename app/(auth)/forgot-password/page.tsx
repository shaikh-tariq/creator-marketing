import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-shell px-5 py-12 sm:px-12 lg:py-20">
      <div className="page-enter mx-auto max-w-md">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Forgot your password?</h1>
        <p className="mt-3 text-ink-soft">Enter the email you signed up with. We will send a link to choose a new password.</p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Remembered it? <Link href="/login" className="text-ink underline">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}

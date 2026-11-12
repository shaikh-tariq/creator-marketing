import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";
import { Container, Eyebrow, Notice } from "@/components/ui";
import { supabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;

  return (
    <Container className="max-w-2xl py-14 sm:py-20">
      <Eyebrow>Join</Eyebrow>
      <h1 className="mt-4 text-5xl leading-tight">Create your account</h1>
      <p className="mt-4 text-ink-soft">
        Already have one? <Link href="/login" className="text-ink underline">Log in</Link>
      </p>
      {!supabaseConfigured ? (
        <div className="mt-6">
          <Notice>Preview mode: the form is here for design review. Accounts switch on once the database is connected.</Notice>
        </div>
      ) : null}
      <div className="mt-10">
        <SignUpForm defaultRole={role ?? "buyer"} />
      </div>
    </Container>
  );
}

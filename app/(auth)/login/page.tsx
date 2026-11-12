import type { Metadata } from "next";
import Link from "next/link";
import { LogInForm } from "@/components/auth-forms";
import { Container, Eyebrow, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

const errors: Record<string, string> = {
  confirm: "That verification link did not work or has expired. Try logging in, or sign up again.",
  suspended: "This account is suspended. Contact support if you think this is a mistake.",
};

export default async function LogInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <Container className="max-w-md py-14 sm:py-20">
      <Eyebrow>Welcome back</Eyebrow>
      <h1 className="mt-4 text-5xl leading-tight">Log in</h1>
      <p className="mt-4 text-ink-soft">
        New here? <Link href="/signup" className="text-ink underline">Create an account</Link>
      </p>
      {error && errors[error] ? (
        <div className="mt-6">
          <Notice>{errors[error]}</Notice>
        </div>
      ) : null}
      <div className="mt-10">
        <LogInForm next={next} />
      </div>
    </Container>
  );
}

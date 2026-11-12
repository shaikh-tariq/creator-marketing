"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string };

const notConnected =
  "Sign-up is switched off in this preview. It turns on once the Supabase keys are added (see README).";

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password needs at least 8 characters").max(72),
  // Admin is never selectable here. Admins are set directly in the database.
  role: z.enum(["seller", "influencer", "buyer"], "Please choose an account type"),
  consent: z.literal("on", "Please accept the terms and privacy policy"),
});

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!supabaseConfigured) return { error: notConnected };

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { full_name, email, password, role } = parsed.data;

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      // The database trigger reads these to create the profile row (see the migration).
      data: { full_name, role, consent_at: new Date().toISOString() },
    },
  });

  if (error) return { error: error.message };
  return { success: "Almost done. Open the link we just emailed you to verify your address." };
}

const logInSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!supabaseConfigured) return { error: notConnected };

  const parsed = logInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password do not match. Have you verified your email?" };

  redirect("/dashboard");
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

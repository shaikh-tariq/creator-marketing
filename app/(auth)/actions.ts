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
  // Admin is never selectable here. Admins are set directly in the database.
  role: z.enum(["seller", "influencer", "buyer"], "Please choose an account type"),
  consent: z.literal("on", "Please accept the terms and privacy policy"),
  // Extra details from the sign-up steps (all optional here; the database trims and checks them again).
  brand_name: z.string().max(60).optional(),
  niche: z.string().max(80).optional(),
  follower_range: z.string().max(30).optional(),
  channels: z.string().max(2000).optional(),
});

function parseChannels(raw: string | undefined) {
  try {
    const list = JSON.parse(raw || "[]");
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => c && typeof c.platform === "string" && typeof c.url === "string" && /^https?:\/\//i.test(c.url))
      .slice(0, 5)
      .map((c) => ({ platform: c.platform, url: c.url.slice(0, 300) }));
  } catch {
    return [];
  }
}

// Step 1 of sign-up: email the person a one-time code. The account is created now (with the details
// from the earlier steps) but has no password and is not verified until the code is entered.
export async function sendSignupCode(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!supabaseConfigured) return { error: notConnected };

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { full_name, email, role, brand_name, niche, follower_range, channels } = parsed.data;

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // If the person clicks the link in the email instead of typing the code, they land on the password page.
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/signup?step=password")}`,
      // The database trigger reads these to create the profile row (see the migrations).
      data: {
        full_name,
        role,
        consent_at: new Date().toISOString(),
        brand_name: role === "seller" ? brand_name ?? "" : "",
        niche: role === "influencer" ? niche ?? "" : "",
        follower_range: role === "influencer" ? follower_range ?? "" : "",
        channels: role === "influencer" ? parseChannels(channels) : [],
      },
    },
  });

  if (error) {
    if (/cannot be used|Database error/i.test(error.message)) return { error: "This email address cannot be used to create an account. Contact support if you think this is a mistake." };
    if (/rate limit|security purposes/i.test(error.message)) return { error: "Too many emails were requested. Please wait a minute and try again." };
    return { error: error.message };
  }
  return { success: "sent" };
}

// Used by the sign-up page to notice when the email link was clicked in another tab.
export async function isVerified(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}

// Step 2: check the code. On success the person is logged in.
export async function verifySignupCode(email: string, code: string): Promise<FormState> {
  if (!supabaseConfigured) return { error: notConnected };
  const token = code.replace(/\D/g, "");
  if (token.length < 6) return { error: "Enter the code from the email" };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
  if (error) return { error: "That code is wrong or has expired. Check the latest email, or send a new code." };
  return { success: "verified" };
}

// Step 3: the verified, logged-in person chooses a password, then goes to their own page.
export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!supabaseConfigured) return { error: notConnected };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password needs at least 8 characters" };
  if (password.length > 72) return { error: "Password is too long" };
  if (password !== confirm) return { error: "The two passwords do not match" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message.includes("session") ? "Your session expired. Please start again." : error.message };
  redirect("/dashboard");
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

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

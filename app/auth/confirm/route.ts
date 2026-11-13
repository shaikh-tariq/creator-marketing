import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Only the sign-up and log-in email types are accepted here.
const allowedTypes: EmailOtpType[] = ["email", "signup", "magiclink"];

function safeNext(value: string | null) {
  const next = value ?? "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

// The link in the verification email lands here. We swap it for a login session.
// Two link styles are supported:
//   ?token_hash=...&type=email   (the email template links straight to this site; recommended)
//   ?code=...                    (the older link that goes through Supabase first)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  if (supabaseConfigured) {
    const supabase = await createClient();

    if (tokenHash && type && allowedTypes.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url));
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}

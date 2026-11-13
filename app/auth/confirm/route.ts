import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// The link in the verification email lands here. We swap its code for a login session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (supabaseConfigured && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = request.nextUrl.searchParams.get("next") ?? "";
      const target = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}

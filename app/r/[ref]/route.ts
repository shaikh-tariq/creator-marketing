import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// A creator's tracked link: creatormarketing.../r/abc12345
// Counts the click, remembers the creator for 30 days, then shows the product.
export async function GET(request: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!supabaseConfigured || !/^[a-z0-9]{6,16}$/.test(ref)) return NextResponse.redirect(new URL("/", request.url));

  const supabase = await createClient();
  const { data: slug } = await supabase.rpc("resolve_ref", { p_ref: ref });
  if (!slug) return NextResponse.redirect(new URL("/", request.url));

  const response = NextResponse.redirect(new URL(`/products/${slug}`, request.url));
  response.cookies.set("cm_ref", ref, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return response;
}

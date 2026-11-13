"use server";

// Every button on the dashboards and checkout posts to one of these functions.
// Each one checks the input, asks the database to do the work (the database enforces who is allowed),
// then sends the person back to the page with a success or error message.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

function back(path: string, kind: "ok" | "error", message: string): never {
  const clean = path.split("?")[0];
  revalidatePath(clean);
  redirect(`${clean}?${kind}=${encodeURIComponent(message)}`);
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// ---------------- Seller ----------------

const productSchema = z.object({
  title: z.string().min(3, "Give the product a title (at least 3 characters)").max(120),
  hub_id: z.uuid("Choose a hub"),
  summary: z.string().max(300, "Keep the summary under 300 characters"),
  description: z.string().max(5000),
  format: z.string().max(40),
  price: z.coerce.number().min(49, "Minimum price is ₹49").max(50000, "Maximum price is ₹50,000"),
  commission_pct: z.coerce.number().min(0).max(100),
  promo_discount_pct: z.coerce.number().min(0, "Discount cannot be negative").max(50, "Maximum promo discount is 50%"),
  join_mode: z.enum(["open", "apply"]),
  brief_text: z.string().max(2000),
  license_text: z.string().max(2000),
  art: z.coerce.number().int().min(0).max(3),
  cover_path: z.string().max(300).default(""),
});

export async function saveProduct(fd: FormData) {
  const { supabase, user } = await ctx();
  const id = str(fd, "id");
  const here = id ? `/seller/products/${id}` : "/seller/products/new";

  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back(here, "error", parsed.error.issues[0].message);
  const { price, cover_path, ...rest } = parsed.data;
  const row = {
    ...rest,
    // The cover image must be in this seller's own folder (the database enforces this too).
    cover_path: cover_path && cover_path.startsWith(`${user.id}/`) ? cover_path : null,
    price_paise: Math.round(price * 100),
    includes: str(fd, "includes")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12),
  };

  if (id) {
    const { data: before } = await supabase.from("products").select("cover_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) back(here, "error", error.message);
    // A replaced or removed cover image is deleted from storage so old files do not pile up.
    if (before?.cover_path && before.cover_path !== row.cover_path) {
      await supabase.storage.from("product-covers").remove([before.cover_path]);
    }
    back(here, "ok", "Changes saved");
  }
  const { data, error } = await supabase
    .from("products")
    .insert({ ...row, seller_id: user.id })
    .select("id")
    .single();
  if (error || !data) back(here, "error", error?.message ?? "Could not create the product");
  back(`/seller/products/${data.id}`, "ok", "Draft created. Now upload the product file, then submit for review.");
}

export async function productAction(fd: FormData) {
  const { supabase } = await ctx();
  const id = str(fd, "id");
  const action = str(fd, "action");
  const { error } = await supabase.rpc("seller_product_action", { p_product: id, p_action: action });
  if (error) back(`/seller/products/${id}`, "error", error.message);
  const done: Record<string, string> = {
    submit: "Sent for review. An admin will approve or reject it.",
    pause: "Product paused. It is hidden from buyers.",
    resume: "Product is live again.",
    archive: "Product archived.",
  };
  back(action === "archive" ? "/seller/products" : `/seller/products/${id}`, "ok", done[action] ?? "Done");
}

export async function deleteFile(fd: FormData) {
  const { supabase } = await ctx();
  const id = str(fd, "id");
  const productId = str(fd, "product_id");
  const { data: file } = await supabase.from("product_files").select("storage_path").eq("id", id).single();
  if (file) {
    await supabase.storage.from("product-files").remove([file.storage_path]);
    await supabase.from("product_files").delete().eq("id", id);
  }
  back(`/seller/products/${productId}`, "ok", "File removed");
}

export async function setJoin(fd: FormData) {
  const { supabase } = await ctx();
  const status = str(fd, "status");
  const { error } = await supabase.rpc("seller_set_join", { p_join: str(fd, "join_id"), p_status: status });
  if (error) back("/seller/submissions", "error", error.message);
  const done: Record<string, string> = { active: "Influencer accepted", rejected: "Request declined", paused: "Influencer paused. Their link and code are switched off." };
  back("/seller/submissions", "ok", done[status] ?? "Updated");
}

export async function reviewSubmission(fd: FormData) {
  const { supabase } = await ctx();
  const decision = str(fd, "decision");
  const { error } = await supabase.rpc("review_submission", {
    p_submission: str(fd, "submission_id"),
    p_decision: decision,
    p_note: str(fd, "note"),
  });
  if (error) back("/seller/submissions", "error", error.message);
  const done: Record<string, string> = {
    approved: "Post approved. The influencer now has a tracked link and promo code.",
    changes_requested: "Changes requested. The influencer has been told.",
    rejected: "Post rejected.",
  };
  back("/seller/submissions", "ok", done[decision] ?? "Updated");
}

export async function saveSellerProfile(fd: FormData) {
  const { supabase, user } = await ctx();
  const brand = str(fd, "brand_name").slice(0, 60);
  if (brand.length < 2) back("/seller/profile", "error", "Enter your brand name");
  const { error } = await supabase
    .from("seller_profiles")
    .update({ brand_name: brand, bio: str(fd, "bio").slice(0, 500) })
    .eq("user_id", user.id);
  if (error) back("/seller/profile", "error", error.message);
  back("/seller/profile", "ok", "Profile saved");
}

// ---------------- Influencer ----------------

export async function joinProduct(fd: FormData) {
  const { supabase } = await ctx();
  const { error } = await supabase.rpc("join_product", { p_product: str(fd, "product_id"), p_pitch: str(fd, "pitch") });
  if (error) back(safePath(fd.get("back"), "/influencer/browse"), "error", error.message);
  back("/influencer/joins", "ok", "Joined. Read the brief, make your post, then submit it here.");
}

export async function submitContent(fd: FormData) {
  const { supabase } = await ctx();
  const { error } = await supabase.rpc("submit_content", {
    p_join: str(fd, "join_id"),
    p_platform: str(fd, "platform"),
    p_url: str(fd, "content_url"),
    p_caption: str(fd, "caption"),
    p_disclosure: fd.get("disclosure") === "on",
    p_image: str(fd, "image_path") || null,
  });
  if (error) back("/influencer/joins", "error", error.message);
  back("/influencer/joins", "ok", "Post submitted. The seller will review it.");
}

export async function setImpressions(fd: FormData) {
  const { supabase } = await ctx();
  const n = Number(str(fd, "impressions"));
  if (!Number.isInteger(n) || n < 0) back("/influencer/joins", "error", "Enter impressions as a whole number");
  const { error } = await supabase.rpc("set_post_impressions", { p_submission: str(fd, "submission_id"), p_impressions: n });
  if (error) back("/influencer/joins", "error", error.message);
  back("/influencer/joins", "ok", "Impressions updated");
}

export async function saveChannel(fd: FormData) {
  const { supabase, user } = await ctx();
  const url = str(fd, "profile_url");
  if (!/^https?:\/\//i.test(url)) back("/influencer/channels", "error", "Enter the full profile link, starting with https://");
  const { error } = await supabase.from("influencer_channels").upsert(
    { user_id: user.id, platform: str(fd, "platform"), profile_url: url.slice(0, 300), follower_range: str(fd, "follower_range") },
    { onConflict: "user_id,platform" },
  );
  if (error) back("/influencer/channels", "error", error.message);
  back("/influencer/channels", "ok", "Channel saved");
}

export async function deleteChannel(fd: FormData) {
  const { supabase } = await ctx();
  await supabase.from("influencer_channels").delete().eq("id", str(fd, "id"));
  back("/influencer/channels", "ok", "Channel removed");
}

export async function saveInfluencerProfile(fd: FormData) {
  const { supabase, user } = await ctx();
  const { error } = await supabase
    .from("influencer_profiles")
    .update({ niche: str(fd, "niche").slice(0, 80), bio: str(fd, "bio").slice(0, 500) })
    .eq("user_id", user.id);
  if (error) back("/influencer/channels", "error", error.message);
  back("/influencer/channels", "ok", "Profile saved");
}

// ---------------- Buyer ----------------

export async function placeOrder(fd: FormData) {
  const { supabase } = await ctx();
  const slug = str(fd, "slug");
  const code = str(fd, "code");
  const ref = (await cookies()).get("cm_ref")?.value ?? null;
  const { data, error } = await supabase.rpc("place_test_order", {
    p_product: str(fd, "product_id"),
    p_code: code || null,
    p_ref: ref,
  });
  if (error || !data) {
    const msg = encodeURIComponent(error?.message ?? "The order could not be placed");
    redirect(`/checkout/${slug}?error=${msg}${code ? `&code=${encodeURIComponent(code)}` : ""}`);
  }
  revalidatePath("/library");
  redirect(`/order/${data}`);
}

export async function downloadFile(fd: FormData) {
  const { supabase } = await ctx();
  const { data: file } = await supabase
    .from("product_files")
    .select("storage_path, file_name")
    .eq("id", str(fd, "file_id"))
    .single();
  const here = safePath(fd.get("back"), "/library");
  if (!file) back(here, "error", "That file is not available to you");
  // The link works for 60 seconds, so it cannot be passed around.
  const { data, error } = await supabase.storage
    .from("product-files")
    .createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (error || !data) back(here, "error", "Could not prepare the download. Please try again.");
  redirect(data.signedUrl);
}

export async function addReview(fd: FormData) {
  const { supabase, user } = await ctx();
  const rating = Number(str(fd, "rating"));
  if (!(rating >= 1 && rating <= 5)) back("/library", "error", "Choose a rating from 1 to 5");
  const { error } = await supabase.from("reviews").insert({
    product_id: str(fd, "product_id"),
    order_id: str(fd, "order_id"),
    buyer_id: user.id,
    rating,
    body: str(fd, "body").slice(0, 2000),
  });
  if (error) back("/library", "error", error.code === "23505" ? "You have already reviewed this purchase" : error.message);
  back("/library", "ok", "Thanks. Your review is live on the product page.");
}

// ---------------- Admin ----------------

export async function adminReviewProduct(fd: FormData) {
  const { supabase } = await ctx();
  const approve = str(fd, "decision") === "approve";
  const { error } = await supabase.rpc("admin_review_product", {
    p_product: str(fd, "product_id"),
    p_approve: approve,
    p_reason: str(fd, "reason"),
  });
  if (error) back("/admin/review", "error", error.message);
  back("/admin/review", "ok", approve ? "Product approved and live" : "Product rejected. The seller can see your reason.");
}

export async function adminSetUser(fd: FormData) {
  const { supabase } = await ctx();
  const status = str(fd, "status");
  const { error } = await supabase.rpc("admin_set_user_status", { p_user: str(fd, "user_id"), p_status: status });
  const here = safePath(fd.get("back"), "/admin/users");
  if (error) back(here, "error", error.message);
  back(here, "ok", status === "active" ? "Account is active" : "Account suspended");
}

export async function adminRefund(fd: FormData) {
  const { supabase } = await ctx();
  const { error } = await supabase.rpc("admin_refund_order", { p_order: str(fd, "order_id"), p_reason: str(fd, "reason") });
  if (error) back("/admin/orders", "error", error.message);
  back("/admin/orders", "ok", "Order refunded. The ledger entries were reversed and the download is switched off.");
}

const settingsSchema = z.object({
  platform_fee_pct: z.coerce.number().min(0).max(30),
  gateway_fee_est_pct: z.coerce.number().min(0).max(10),
  hold_days: z.coerce.number().int().min(0).max(90),
  commission_min_pct: z.coerce.number().min(0).max(100),
  commission_max_pct: z.coerce.number().min(0).max(100),
  gateway_fee_borne_by: z.enum(["seller", "platform"]),
});

export async function adminSaveSettings(fd: FormData) {
  const { supabase } = await ctx();
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/admin/settings", "error", "Check the numbers: " + parsed.error.issues[0].path.join("."));
  if (parsed.data.commission_min_pct > parsed.data.commission_max_pct)
    back("/admin/settings", "error", "Minimum commission cannot be higher than the maximum");
  const rows = Object.entries(parsed.data).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) back("/admin/settings", "error", error.message);
  back("/admin/settings", "ok", "Settings saved. They apply to new orders only.");
}

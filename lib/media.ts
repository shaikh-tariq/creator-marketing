import { supabaseUrl } from "./supabase/config";

// Public address of a product cover image a seller uploaded (null when the product uses a cover style).
// Kept separate from lib/data.ts so client components can use it too.
export function coverUrl(path: string | null | undefined) {
  return path ? `${supabaseUrl}/storage/v1/object/public/product-covers/${path}` : null;
}

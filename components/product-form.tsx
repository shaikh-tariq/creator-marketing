import { saveProduct } from "@/app/actions";
import { launchSettings } from "@/lib/site";
import type { Product } from "@/lib/types";
import { coverUrl } from "@/lib/media";
import { CoverPicker, SubmitButton } from "./client-bits";
import { ProductArt } from "./product-card";
import { Card, Field, buttonClass, inputClass, textareaClass } from "./ui";

// One form for both "new product" and "edit product".
export function ProductForm({ product, hubs, userId }: { product?: Product; hubs: { id: string; name: string }[]; userId: string }) {
  return (
    <form action={saveProduct} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <Card className="space-y-5">
        <h3 className="text-xl">The product</h3>
        <Field label="Title">
          <input name="title" required minLength={3} maxLength={120} defaultValue={product?.title} className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Hub">
            <select name="hub_id" required defaultValue={product?.hub_id ?? ""} className={inputClass}>
              <option value="" disabled>Choose a hub</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Format" hint="For example Canva, Figma, PDF, Notion.">
            <input name="format" maxLength={40} defaultValue={product?.format} className={inputClass} />
          </Field>
        </div>
        <Field label="Short summary" hint="One or two sentences shown on cards and at the top of the page.">
          <textarea name="summary" rows={2} maxLength={300} defaultValue={product?.summary} className={textareaClass} />
        </Field>
        <Field label="Full description">
          <textarea name="description" rows={5} maxLength={5000} defaultValue={product?.description} className={textareaClass} />
        </Field>
        <Field label="What is included" hint="One item per line, up to 12.">
          <textarea name="includes" rows={4} defaultValue={product?.includes.join("\n")} className={textareaClass} />
        </Field>
        <Field label="Licence" hint="What the buyer may and may not do with the files.">
          <textarea name="license_text" rows={2} maxLength={2000} defaultValue={product?.license_text ?? "Single-user commercial licence. Do not resell or share the files."} className={textareaClass} />
        </Field>
        <div>
          <p className="text-sm font-medium">Cover image</p>
          <p className="mt-1 text-xs text-ink-soft">The picture buyers and influencers see on cards and on your product page.</p>
          <div className="mt-3">
            <CoverPicker userId={userId} currentPath={product?.cover_path} currentUrl={coverUrl(product?.cover_path)} />
          </div>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Cover style</legend>
          <p className="mt-1 text-xs text-ink-soft">Shown instead when you have not uploaded a cover image.</p>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((n) => (
              <label key={n} className="cursor-pointer">
                <input type="radio" name="art" value={n} defaultChecked={(product?.art ?? 0) === n} className="peer sr-only" />
                <ProductArt art={n} className="aspect-[4/3] rounded-lg ring-ink ring-offset-2 ring-offset-card peer-checked:ring-2" />
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-xl">Price and the influencer deal</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Price (₹)">
            <input name="price" type="number" required min={49} max={50000} step={1} defaultValue={product ? product.price_paise / 100 : ""} className={inputClass} />
          </Field>
          <Field label="Commission (%)" hint={`${launchSettings.commissionMinPct} to ${launchSettings.commissionMaxPct}. Paid to the influencer per sale.`}>
            <input name="commission_pct" type="number" required min={0} max={100} step={1} defaultValue={product ? Number(product.commission_pct) : 20} className={inputClass} />
          </Field>
          <Field label="Promo code discount (%)" hint="Optional. Leave at 0 for no buyer discount. Anything you add here comes out of your share, on top of the commission.">
            <input name="promo_discount_pct" type="number" min={0} max={50} step={1} defaultValue={product ? Number(product.promo_discount_pct) : 0} className={inputClass} />
          </Field>
        </div>
        <Field label="Who can promote it">
          <select name="join_mode" defaultValue={product?.join_mode ?? "open"} className={inputClass}>
            <option value="open">Any influencer can join</option>
            <option value="apply">Influencers apply and I accept them</option>
          </select>
        </Field>
        <Field label="Content brief" hint="Tell influencers what a good post looks like. You still approve every post before a code is issued.">
          <textarea name="brief_text" rows={3} maxLength={2000} defaultValue={product?.brief_text} className={textareaClass} />
        </Field>
      </Card>

      <SubmitButton className={buttonClass("primary")}>{product ? "Save changes" : "Create draft"}</SubmitButton>
    </form>
  );
}

"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

// Shows a spinner inside a link the moment it is clicked, until the next page is ready.
export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="ml-1" /> : null;
}

// Header link: highlights the current page and shows a spinner while the next one loads.
export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors active:scale-[0.97] ${
        active ? "bg-paper-deep font-medium text-ink" : "text-ink-soft hover:bg-paper-deep/60 hover:text-ink"
      }`}
    >
      {children}
      <LinkPending />
    </Link>
  );
}

// A submit button that reacts instantly: it dims, shows a spinner and cannot be double-clicked.
export function SubmitButton({
  children,
  className,
  name,
  value,
  confirmText,
}: {
  children: React.ReactNode;
  className: string;
  name?: string;
  value?: string;
  confirmText?: string;
}) {
  const { pending, data } = useFormStatus();
  // When a form has several buttons, only the one that was pressed shows the spinner.
  const mine = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      aria-disabled={pending}
      className={`${className} ${pending ? "pointer-events-none opacity-70" : ""}`}
      onClick={(e) => {
        if (pending || (confirmText && !window.confirm(confirmText))) e.preventDefault();
      }}
    >
      {mine ? <Spinner /> : null}
      {children}
    </button>
  );
}

const blocked = /\.(exe|bat|cmd|com|msi|scr|js|vbs|ps1|sh|jar|apk|dll)$/i;
const maxBytes = 50 * 1024 * 1024;

// Uploads the product file straight from the browser to private storage.
export function FileUploader({ productId, userId }: { productId: string; userId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    if (blocked.test(file.name)) return setMessage({ kind: "error", text: "That file type is not allowed. Use a ZIP, PDF, image or design file." });
    if (file.size > maxBytes) return setMessage({ kind: "error", text: "The file is over 50 MB. Compress it or split it into parts." });

    setBusy(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${productId}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from("product-files").upload(path, file);
    if (upload.error) {
      setBusy(false);
      return setMessage({ kind: "error", text: upload.error.message });
    }
    const row = await supabase
      .from("product_files")
      .insert({ product_id: productId, seller_id: userId, storage_path: path, file_name: file.name, size_bytes: file.size });
    setBusy(false);
    e.target.value = "";
    if (row.error) return setMessage({ kind: "error", text: row.error.message });
    setMessage({ kind: "ok", text: `${file.name} uploaded.` });
    router.refresh();
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-ink/30 bg-paper px-4 py-8 text-center text-sm hover:border-ink">
        <span className="font-medium">{busy ? "Uploading…" : "Choose a file to upload"}</span>
        <span className="mt-1 text-xs text-ink-soft">ZIP, PDF, images or design files, up to 50 MB</span>
        <input type="file" className="sr-only" onChange={onChange} disabled={busy} />
      </label>
      {message ? (
        <p className={`mt-3 text-sm ${message.kind === "ok" ? "text-success" : "text-accent-deep"}`}>{message.text}</p>
      ) : null}
    </div>
  );
}

// Click to copy a link or promo code.
export function CopyText({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked; the text is still visible to select */
        }
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-left text-xs hover:border-ink"
      title="Copy"
    >
      <span className="truncate font-mono">{label ?? text}</span>
      <span className="shrink-0 text-ink-soft">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

// Lets an influencer attach a screenshot of their post. Uploads straight to storage and shows a preview.
export function PostImagePicker({ userId }: { userId: string }) {
  const [path, setPath] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Use a PNG, JPG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("The image is over 5 MB.");
    setBusy(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const target = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await createClient().storage.from("post-images").upload(target, file);
    setBusy(false);
    if (uploadError) return setError(uploadError.message);
    setPath(target);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div>
      <input type="hidden" name="image_path" value={path} />
      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-ink/30 bg-paper p-3 text-sm transition-colors hover:border-ink">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your post preview" className="size-20 rounded-lg object-cover" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-lg bg-paper-deep text-2xl text-accent">＋</span>
        )}
        <span>
          <span className="block font-medium">{busy ? "Uploading…" : preview ? "Change screenshot" : "Add a screenshot of your post"}</span>
          <span className="mt-1 block text-xs text-ink-soft">Shown to the seller and on your dashboard. PNG or JPG, up to 5 MB.</span>
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} disabled={busy} />
      </label>
      {error ? <p className="mt-2 text-sm text-alert">{error}</p> : null}
    </div>
  );
}

// Lets a seller upload their own cover image for a product. Uploads straight to storage, shows a preview,
// and the form saves the path. Clearing it falls back to the cover style.
export function CoverPicker({ userId, currentPath, currentUrl }: { userId: string; currentPath?: string | null; currentUrl?: string | null }) {
  const [path, setPath] = useState(currentPath ?? "");
  const [preview, setPreview] = useState(currentUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Use a PNG, JPG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("The image is over 5 MB.");
    setBusy(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const target = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await createClient().storage.from("product-covers").upload(target, file);
    setBusy(false);
    e.target.value = "";
    if (uploadError) return setError(uploadError.message);
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPath(target);
    setPreview(URL.createObjectURL(file));
  }

  function remove() {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPath("");
    setPreview("");
    setError("");
  }

  return (
    <div>
      <input type="hidden" name="cover_path" value={path} />
      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-ink/30 bg-paper p-3 text-sm transition-colors hover:border-ink">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your cover preview" className="aspect-[4/3] w-32 rounded-lg object-cover" />
        ) : (
          <span className="flex aspect-[4/3] w-32 items-center justify-center rounded-lg bg-paper-deep text-2xl text-accent">＋</span>
        )}
        <span>
          <span className="block font-medium">{busy ? "Uploading…" : preview ? "Change cover image" : "Upload your own cover image"}</span>
          <span className="mt-1 block text-xs text-ink-soft">Landscape works best (4:3, for example 1200 × 900). PNG, JPG or WebP, up to 5 MB.</span>
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} disabled={busy} />
      </label>
      {preview ? (
        <button type="button" onClick={remove} className="mt-2 text-xs text-ink-soft underline hover:text-ink">
          Remove image and use a cover style instead
        </button>
      ) : null}
      {error ? <p className="mt-2 text-sm text-alert">{error}</p> : null}
    </div>
  );
}

// Fades a section in the first time it scrolls into view.
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Promo code box at checkout. The code is applied automatically a moment after typing stops.
export function PromoInput({ initial, applied, error }: { initial: string; applied?: string; error?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const code = value.trim().toUpperCase();
    if (code === initial.trim().toUpperCase()) return;
    const timer = setTimeout(() => {
      startTransition(() => router.replace(code ? `${pathname}?code=${encodeURIComponent(code)}` : pathname, { scroll: false }));
    }, 600);
    return () => clearTimeout(timer);
  }, [value, initial, pathname, router]);

  return (
    <div>
      <label className="block text-sm font-medium">
        Promo code
        <span className="relative mt-2 block">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Have a creator's code? Type it here"
            autoComplete="off"
            className="block h-12 w-full rounded-xl border border-line bg-card px-4 pr-10 text-sm font-normal uppercase outline-none transition-colors placeholder:normal-case focus:border-accent"
          />
          {pending ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent"><Spinner /></span> : null}
        </span>
      </label>
      {!pending && applied ? <p className="mt-2 flex items-center gap-2 text-sm font-medium text-success"><span className="flex size-5 items-center justify-center rounded-full bg-success text-[11px] text-white">✓</span>{applied}</p> : null}
      {!pending && error ? <p className="mt-2 text-sm text-alert">{error}</p> : null}
    </div>
  );
}

// Upload or change a profile picture.
export function AvatarUploader({ userId, current }: { userId: string; current: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState(current);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Use a PNG, JPG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setError("The image is over 2 MB.");
    setBusy(true);
    const supabase = createClient();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const upload = await supabase.storage.from("avatars").upload(path, file);
    if (upload.error) {
      setBusy(false);
      return setError(upload.error.message);
    }
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const save = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setBusy(false);
    if (save.error) return setError(save.error.message);
    setUrl(publicUrl);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-5">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Your profile picture" className="size-20 rounded-full object-cover" />
      ) : (
        <span className="flex size-20 items-center justify-center rounded-full bg-paper-deep text-2xl text-accent-deep">＋</span>
      )}
      <div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-5 text-sm font-medium shadow-sm transition-all hover:border-ink/40 active:scale-[0.97]">
          {busy ? <Spinner /> : null}
          {url ? "Change picture" : "Upload a picture"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} disabled={busy} />
        </label>
        <p className="mt-2 text-xs text-ink-soft">PNG or JPG, up to 2 MB. Square images look best.</p>
        {error ? <p className="mt-1 text-sm text-alert">{error}</p> : null}
      </div>
    </div>
  );
}

export function PrintButton({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {children}
    </button>
  );
}

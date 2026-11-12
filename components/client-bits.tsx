"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors active:scale-[0.97] ${
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

// Dashboard menu with the current page highlighted.
export function DashNav({ items }: { items: { href: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  const root = items[0]?.href ?? "";
  return (
    <nav aria-label="Dashboard" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
      {items.map((item) => {
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center justify-between gap-3 rounded-full px-4 py-2 text-sm transition-all active:scale-[0.97] lg:rounded-xl ${
              active ? "bg-ink text-white shadow-sm" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-1">{item.label}<LinkPending /></span>
            {item.count ? (
              <span className={`rounded-full px-2 text-xs ${active ? "bg-paper/20" : "bg-accent text-paper"}`}>{item.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
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

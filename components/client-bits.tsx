"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";

// A submit button that shows it is working, so nobody double-clicks.
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
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
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
            className={`flex shrink-0 items-center justify-between gap-3 rounded-full px-4 py-2 text-sm transition-colors lg:rounded-lg ${
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
            }`}
          >
            {item.label}
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

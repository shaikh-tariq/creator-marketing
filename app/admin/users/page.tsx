import type { Metadata } from "next";
import { adminSetUser } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Badge, Flash, PageTitle, StatusBadge, Table, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const me = await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, role, status, created_at").order("created_at", { ascending: false });
  const users = data ?? [];

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Users" intro="Suspending an account blocks its dashboards immediately. Past orders are not affected." />
      <Table
        head={["Name", "Email", "Role", "Status", "Joined", ""]}
        rows={users.map((u) => [
          u.full_name ?? "Unnamed",
          u.email,
          <Badge key="r">{u.role}</Badge>,
          <StatusBadge key="s" status={u.status} />,
          shortDate(u.created_at),
          u.id === me.id ? (
            <span key="y" className="text-xs text-ink-soft">You</span>
          ) : (
            <form key="f" action={adminSetUser}>
              <input type="hidden" name="user_id" value={u.id} />
              <input type="hidden" name="back" value="/admin/users" />
              {u.status === "active" ? (
                <SubmitButton name="status" value="suspended" className={smallButton("danger")} confirmText={`Suspend ${u.email}?`}>Suspend</SubmitButton>
              ) : (
                <SubmitButton name="status" value="active" className={smallButton("outline")}>{u.status === "pending" ? "Approve" : "Reactivate"}</SubmitButton>
              )}
            </form>
          ),
        ])}
      />
    </>
  );
}

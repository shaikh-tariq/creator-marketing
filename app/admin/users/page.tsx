import type { Metadata } from "next";
import { adminBanUser, adminDeleteUser, adminSetUser, adminUnban } from "@/app/actions";
import { SubmitButton } from "@/components/client-bits";
import { Avatar, Badge, Flash, Notice, PageTitle, StatusBadge, Table, smallButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { shortDate } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const me = await requireRole(["admin"]);
  const supabase = await createClient();
  const [usersRes, bansRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, status, avatar_url, created_at").order("created_at", { ascending: false }),
    supabase.from("banned_emails").select("email, original_email, reason, created_at").order("created_at", { ascending: false }),
  ]);
  const users = usersRes.data ?? [];
  const bans = bansRes.data ?? [];
  const bannedSet = new Set(bans.map((b) => b.original_email.toLowerCase()));

  return (
    <>
      <Flash params={flash} />
      <PageTitle title="Users" intro="Three levels: suspend (can be undone), ban (that email can never log in or sign up again, in any role), delete (removes the account so the email can start fresh)." />

      <Table
        head={["User", "Role", "Status", "Joined", "Actions"]}
        rows={users.map((u) => {
          const banned = bannedSet.has(u.email.toLowerCase());
          return [
            <span key="u" className="flex items-center gap-3">
              <Avatar url={u.avatar_url} name={u.full_name} size={36} />
              <span>
                <span className="block">{u.full_name ?? "Unnamed"}</span>
                <span className="block text-xs font-normal text-ink-soft">{u.email}</span>
              </span>
            </span>,
            <Badge key="r">{u.role}</Badge>,
            banned ? <Badge key="s" tone="accent">Banned</Badge> : <StatusBadge key="s" status={u.status} />,
            shortDate(u.created_at),
            u.id === me.id ? (
              <span key="y" className="text-xs text-ink-soft">This is you</span>
            ) : (
              <span key="a" className="flex flex-wrap gap-2">
                {!banned ? (
                  <form action={adminSetUser}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <input type="hidden" name="back" value="/admin/users" />
                    {u.status === "active" ? (
                      <SubmitButton name="status" value="suspended" className={smallButton("outline")} confirmText={`Suspend ${u.email}? You can reactivate them later.`}>Suspend</SubmitButton>
                    ) : (
                      <SubmitButton name="status" value="active" className={smallButton("outline")}>{u.status === "pending" ? "Approve" : "Reactivate"}</SubmitButton>
                    )}
                  </form>
                ) : null}
                {!banned ? (
                  <form action={adminBanUser}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <SubmitButton className={smallButton("danger")} confirmText={`Ban ${u.email}? They are logged out and this email can never log in or sign up again, in any role.`}>Ban</SubmitButton>
                  </form>
                ) : null}
                <form action={adminDeleteUser}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <SubmitButton className={smallButton("danger")} confirmText={`Delete ${u.email}? Their account, products and posts are removed for good. This cannot be undone.`}>Delete</SubmitButton>
                </form>
              </span>
            ),
          ];
        })}
      />

      <div className="mt-4">
        <Notice>An account with orders on record cannot be deleted, because sales records have to be kept. Ban it instead. To stop someone coming back after deleting, ban first, then delete.</Notice>
      </div>

      <section className="mt-10 space-y-4">
        <h3 className="text-xl">Banned email addresses ({bans.length})</h3>
        {bans.length === 0 ? (
          <p className="text-sm text-ink-soft">No one is banned.</p>
        ) : (
          <Table
            head={["Email", "Banned on", "Reason", ""]}
            rows={bans.map((b) => [
              b.original_email,
              shortDate(b.created_at),
              b.reason ?? "–",
              <form key="f" action={adminUnban}>
                <input type="hidden" name="email" value={b.email} />
                <SubmitButton className={smallButton("outline")} confirmText={`Lift the ban on ${b.original_email}?`}>Lift ban</SubmitButton>
              </form>,
            ])}
          />
        )}
        <p className="text-xs text-ink-soft">For Gmail, dots and +tags are ignored, so name.surname+test@gmail.com counts as the same address.</p>
      </section>
    </>
  );
}

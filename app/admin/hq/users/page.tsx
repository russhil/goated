import { getHqUsers } from "@/lib/hq-data";
import { normalizePermissions, canManageUsers, OWNER_FALLBACK } from "@/lib/hq-perms";
import { requireUser } from "../guard";
import UsersManager, { type HqUserRow } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const gate = await requireUser();
  if (!gate.ok || !canManageUsers(gate.perms)) {
    return (
      <section className="px-6 md:px-12 pb-24 max-w-[900px] mx-auto pt-6">
        <p className="font-mono text-xs text-coral uppercase tracking-widest">
          {"// 403 — you don't have access to user management"}
        </p>
      </section>
    );
  }

  const users = await getHqUsers();
  const rows: HqUserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    is_owner: u.is_owner || OWNER_FALLBACK.includes(u.email.toLowerCase()),
    active: u.active,
    permissions: normalizePermissions(u.permissions),
  }));

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1000px] mx-auto pt-6">
      <div className="mb-6">
        <p className="section-label mb-1">// access control</p>
        <h2 className="font-serif text-2xl text-dark">Users &amp; permissions</h2>
        <p className="font-sans text-sm text-muted mt-1">
          Add someone by email and choose what they can see. They sign in with
          Google; access is matched on their email.
        </p>
      </div>
      <UsersManager users={rows} selfEmail={gate.email} />
    </section>
  );
}

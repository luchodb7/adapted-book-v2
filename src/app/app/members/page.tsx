import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { MembershipRepositoryToken } from "@/core/di/tokens";
import { prisma } from "@/lib/prisma/client";

export default async function MembersPage() {
  const ctx = await authorize("VIEWER");
  const c = getContainer();
  const memberships = c.resolve(MembershipRepositoryToken);
  const { items, total } = await memberships.listByOrganization(ctx.organizationId);

  const users = await prisma.user.findMany({
    where: { id: { in: items.map((m) => m.userId) } },
    select: { id: true, email: true, name: true, image: true },
  });
  const usersMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">{total} member(s) in your organization.</p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">Members of {ctx.organizationId}</caption>
          <thead className="border-b bg-secondary/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">Name</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Email</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Role</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((m) => {
              const user = usersMap.get(m.userId);
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium">{user?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user?.email ?? "—"}</td>
                  <td className="px-4 py-3">{m.role}</td>
                  <td className="px-4 py-3">{m.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

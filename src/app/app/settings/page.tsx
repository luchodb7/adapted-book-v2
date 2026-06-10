import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { OrganizationRepositoryToken } from "@/core/di/tokens";

export default async function SettingsPage() {
  const ctx = await authorize("VIEWER");
  const c = getContainer();
  const orgs = c.resolve(OrganizationRepositoryToken);
  const org = await orgs.findById(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization preferences.</p>
      </div>
      <dl className="grid gap-3 rounded-lg border bg-card p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Name</dt>
          <dd className="mt-1 text-sm">{org?.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Slug</dt>
          <dd className="mt-1 text-sm font-mono">{org?.slug}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Your role</dt>
          <dd className="mt-1 text-sm">{ctx.role}</dd>
        </div>
      </dl>
    </div>
  );
}

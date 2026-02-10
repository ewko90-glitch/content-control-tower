import { prisma } from "@/lib/db";
import { requireAuth, getActiveWorkspaceId } from "@/lib/guards";
import { switchWorkspace, createWorkspaceAction, inviteUserAction } from "@/app/actions/workspaces";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default async function WorkspacesPage() {
  const user = await requireAuth();
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { workspace: true }
  });
  const activeWorkspaceId = getActiveWorkspaceId();
  const activeMembership = memberships.find((membership) => membership.workspaceId === activeWorkspaceId);

  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-lg font-semibold">Twoje workspaces</h2>
          <div className="mt-4 grid gap-2">
            {memberships.map((membership) => (
              <form key={membership.id} action={switchWorkspace.bind(null, membership.workspaceId)}>
                <Button
                  type="submit"
                  variant={membership.workspaceId === activeWorkspaceId ? "primary" : "secondary"}
                >
                  {membership.workspace.name} ({membership.role})
                </Button>
              </form>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Utwórz nowy workspace</h2>
          <form action={createWorkspaceAction} className="mt-4 flex gap-2">
            <Input name="name" placeholder="Nazwa" required />
            <Button type="submit">Dodaj</Button>
          </form>
        </Card>

        {activeMembership?.role === "OWNER" && (
          <Card>
            <h2 className="text-lg font-semibold">Zaproś użytkownika</h2>
            <form action={inviteUserAction} className="mt-4 grid gap-2 md:grid-cols-3">
              <Input name="email" type="email" placeholder="Email" required />
              <Select name="role">
                <option value="EDITOR">EDITOR</option>
                <option value="APPROVER">APPROVER</option>
                <option value="OWNER">OWNER</option>
              </Select>
              <Button type="submit">Dodaj</Button>
            </form>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import type { Membership, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { getSeatLimitPlaceholder } from "@/lib/seat-limit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamInviteDialog } from "@/components/team-invite-dialog";
import { TeamRemoveDialog } from "@/components/team-remove-dialog";

type MembershipWithUser = Membership & { user: User };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Administrator",
  APPROVER: "Manager",
  EDITOR: "Redaktor"
};

const INVITE_PREVIEW = [
  { email: "anna@przyklad.pl", role: "Redaktor", status: "Wysłane" },
  { email: "team@studio.com", role: "Manager", status: "Zaakceptowane" },
  { email: "freelancer@copy.pl", role: "Redaktor", status: "Wygasło" }
];

export default async function ProjectTeamPage() {
  const { workspaceId, user } = await requireWorkspace();

  const [members, membersCount, ownerCount] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.membership.count({ where: { workspaceId } }),
    prisma.membership.count({ where: { workspaceId, role: "OWNER" } })
  ]);

  const seatLimit = getSeatLimitPlaceholder();
  const seatsFilled = membersCount;
  const seatsFull = seatsFilled >= seatLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Zespół</h2>
          <p className="mt-1 text-sm text-gray-600">
            Zarządzaj osobami, rolami i dostępem do projektu.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div>
            <p className="text-sm font-medium text-gray-900">Miejsca: {seatsFilled} / {seatLimit}</p>
            <p className="text-xs text-gray-500">Limit zależy od pakietu.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TeamInviteDialog
              seatCount={seatsFilled}
              seatLimit={seatLimit}
              disabled={seatsFull}
            />
            <Link href="/settings/project/plan" className="text-xs text-blue-600 hover:text-blue-700">
              Dokup miejsce
            </Link>
          </div>
          {seatsFull && (
            <p className="text-xs text-amber-700">
              Osiągnięto limit miejsc. Dokup miejsce lub zmień plan.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Członkowie projektu</h3>
            <p className="text-sm text-gray-600">Lista osób z przypisanymi rolami.</p>
          </div>

          {membersCount === 1 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              To projekt jednoosobowy. Zaproś zespół, aby delegować zadania.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Osoba</th>
                  <th className="px-3 py-2">Rola</th>
                  <th className="px-3 py-2">Dodano</th>
                  <th className="px-3 py-2 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member: MembershipWithUser) => {
                  const displayName = member.user.name ?? member.user.email;
                  const isSelf = member.user.id === user.id;
                  const isOwner = member.role === "OWNER";
                  const onlyOwner = isOwner && ownerCount === 1;
                  const roleLabel = ROLE_LABELS[member.role] ?? "Podgląd";
                  const disableRemoval = isSelf || onlyOwner;
                  const removalReason = isSelf
                    ? "Nie możesz usunąć siebie."
                    : onlyOwner
                      ? "Projekt musi mieć administratora."
                      : undefined;

                  return (
                    <tr key={member.id}>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{displayName}</p>
                            {member.user.name && (
                              <p className="text-xs text-gray-500">{member.user.email}</p>
                            )}
                          </div>
                          {isSelf && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Ty
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {roleLabel}
                            </span>
                            <Link
                              href="/settings/project/roles"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Zobacz uprawnienia
                            </Link>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              disabled
                              className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500"
                            >
                              <option>{roleLabel}</option>
                              <option>Administrator</option>
                              <option>Manager</option>
                              <option>Redaktor</option>
                              <option>Podgląd</option>
                            </select>
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                              Wkrótce
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-3 py-3">
                        <TeamRemoveDialog
                          memberName={displayName}
                          memberEmail={member.user.email}
                          disabled={disableRemoval}
                          disabledReason={removalReason}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Zaproszenia</h3>
              <p className="text-sm text-gray-600">
                Wkrótce: zapraszanie osób e-mailem z przypisaną rolą i statusem zaproszenia.
              </p>
            </div>

            <div className="space-y-2">
              {INVITE_PREVIEW.map((invite) => (
                <div key={invite.email} className="flex items-center justify-between rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium text-gray-800">{invite.email}</p>
                    <p className="text-gray-500">{invite.role}</p>
                  </div>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                    {invite.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <TeamInviteDialog
                seatCount={seatsFilled}
                seatLimit={seatLimit}
                disabled={seatsFull}
                label="Zaproś osobę"
                className="w-full"
              />
            </div>
          </Card>

          <Card className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Bezpieczeństwo i zasady</h3>
              <p className="text-sm text-gray-600">Utrzymuj porządek i kontrolę dostępu.</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Role określają dostęp do treści i publikacji.</li>
              <li>Wszystkie działania są audytowane w projekcie.</li>
              <li>Możesz ograniczać dostęp bez usuwania konta.</li>
            </ul>
            <Link href="/settings/project/roles" className="text-sm text-blue-600 hover:text-blue-700">
              Zarządzaj uprawnieniami →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { listTeam } from "@/lib/crmData";
import { RoleSelect } from "@/components/crm/RoleSelect";
import { AddTeamMemberForm } from "@/components/crm/AddTeamMemberForm";
import { requireAdmin } from "../../auth";

export const metadata: Metadata = { title: "Team" };

export default async function CrmTeamPage() {
  const admin = await requireAdmin();
  const team = await listTeam({ user: admin });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="type-eyebrow text-iron/80">Alcázar CRM</p>
        <h1 className="type-display-m text-iron">Team</h1>
      </div>

      <div className="overflow-x-auto border border-rule bg-linen">
        <table className="w-full min-w-[32rem] border-collapse">
          <thead>
            <tr className="border-b-2 border-pine">
              {["Name", "Email", "Role"].map((h) => (
                <th key={h} className="type-eyebrow p-3 text-start text-iron/80">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id} className="border-b border-rule/60">
                <td className="type-body-s p-3 font-medium text-iron">{member.name || "—"}</td>
                <td className="type-body-s p-3 text-iron/80">{member.email}</td>
                <td className="p-3">
                  <RoleSelect userId={member.id} role={member.role} disabled={member.id === admin.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <p className="type-eyebrow text-iron/80">Add a team member</p>
        <AddTeamMemberForm />
      </div>
    </div>
  );
}

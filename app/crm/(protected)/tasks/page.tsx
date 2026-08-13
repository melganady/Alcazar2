import type { Metadata } from "next";
import { listMyTasks } from "@/lib/crmData";
import { TaskItem } from "@/components/crm/TaskItem";
import { requireCrmUser } from "../../auth";

export const metadata: Metadata = { title: "My tasks" };

export default async function CrmMyTasksPage() {
  const user = await requireCrmUser();
  const tasks = await listMyTasks({ user });
  const today = new Date().toISOString().slice(0, 10);

  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < today);
  const dueToday = open.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === today);
  const upcoming = open.filter((t) => !t.dueDate || t.dueDate.slice(0, 10) > today);
  const done = tasks.filter((t) => t.done);

  const groups: Array<{ label: string; items: typeof tasks }> = [
    { label: "Overdue", items: overdue },
    { label: "Due today", items: dueToday },
    { label: "Upcoming / no due date", items: upcoming },
    { label: "Done", items: done },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="type-eyebrow text-iron/80">Alcázar CRM</p>
        <h1 className="type-display-m text-iron">My tasks</h1>
      </div>
      {tasks.length === 0 ? (
        <p className="type-body-s border border-rule bg-linen p-8 text-center text-iron/80">
          No tasks assigned to you yet — add one from a lead&apos;s page.
        </p>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.label} className="flex flex-col gap-2">
              <p className="type-eyebrow text-iron/80">
                {g.label} ({g.items.length})
              </p>
              <ul className="flex flex-col border border-rule bg-linen px-4">
                {g.items.map((task) => (
                  <TaskItem key={task.id} task={task} showLead />
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}

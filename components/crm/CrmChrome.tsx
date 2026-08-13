import Link from "next/link";
import { Logo } from "@/components/primitives/Logo";
import { Tag } from "@/components/primitives/Tag";
import { LogoutButton } from "./LogoutButton";
import type { CrmUser } from "@/lib/crmData";

const LINKS = [
  { href: "/crm", label: "Dashboard" },
  { href: "/crm/leads", label: "Leads" },
  { href: "/crm/tasks", label: "My tasks" },
] as const;

export function CrmChrome({ user, children }: { user: CrmUser; children: React.ReactNode }) {
  const links = user.role === "admin" ? [...LINKS, { href: "/crm/team", label: "Team" }] : LINKS;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule bg-frost">
        <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/crm" className="-m-2 shrink-0">
              <Logo />
            </Link>
            <nav aria-label="CRM" className="flex flex-wrap items-center gap-5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="type-eyebrow text-iron/80 transition-colors duration-fast ease-brand hover:text-iron hover:underline underline-offset-4"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="type-eyebrow text-iron/80 transition-colors duration-fast ease-brand hover:text-iron hover:underline underline-offset-4"
            >
              Payload admin ↗
            </a>
            <div className="flex items-center gap-2">
              <span className="type-body-s text-iron">{user.name || user.email}</span>
              <Tag>{user.role}</Tag>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-container flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  );
}

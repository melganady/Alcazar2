import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 font-display text-body-s font-medium uppercase tracking-display-l px-6 py-3 transition-colors duration-fast ease-brand disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-iron text-ash hover:bg-iron/85",
  secondary:
    "border border-pine text-iron bg-transparent hover:bg-pine/25",
  ghost: "text-iron underline-offset-4 hover:underline underline-offset-4 hover:underline px-2",
};

type ButtonProps = {
  variant?: Variant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  variant?: Variant;
  children: ReactNode;
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={cn(base, variants[variant], className)} {...props}>
      {children}
    </a>
  );
}

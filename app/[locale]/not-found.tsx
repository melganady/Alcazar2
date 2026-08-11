import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-container flex-col items-start gap-6 px-4 py-32 md:px-6">
      <Eyebrow>404</Eyebrow>
      <h1 className="type-display-l max-w-2xl text-iron">This address does not exist yet</h1>
      <p className="type-body-l max-w-xl text-iron/80">
        The page moved, or it was never here. The shortlist is the best place to
        pick the thread back up.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/projects"
          className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
        >
          See the shortlist
        </Link>
        <Link
          href="/contact"
          className="type-eyebrow border border-iron px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}

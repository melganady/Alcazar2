"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-container flex-col items-start gap-6 px-4 py-32 md:px-6">
      <p className="type-eyebrow text-iron/80">500</p>
      <h1 className="type-display-l max-w-2xl text-iron">Something broke at our end</h1>
      <p className="type-body-l max-w-xl text-iron/80">
        Not your doing. Try again, and if it persists a consultant can send you
        the same information directly.
      </p>
      {error.digest ? (
        <p className="type-micro text-iron/80">Reference {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
        >
          Try again
        </button>
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

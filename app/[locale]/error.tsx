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
      <p className="type-eyebrow text-midnight/65">500</p>
      <h1 className="type-display-l max-w-2xl text-blue">Something broke at our end</h1>
      <p className="type-body-l max-w-xl text-midnight/80">
        Not your doing. Try again, and if it persists a consultant can send you
        the same information directly.
      </p>
      {error.digest ? (
        <p className="type-micro text-midnight/65">Reference {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
        >
          Try again
        </button>
        <Link
          href="/contact"
          className="type-eyebrow border border-blue px-6 py-3.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}

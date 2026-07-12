"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type MyTasksFilterProps = {
  filters: {
    q?: string;
    status?: string;
  };
  statuses: string[];
};

function filterHref(
  pathname: string,
  searchParams: URLSearchParams,
  updates: Record<string, string | undefined>,
) {
  const next = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function MyTasksFilter({ filters, statuses }: MyTasksFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");

  useEffect(() => {
    setQuery(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query === (filters.q ?? "")) {
        return;
      }

      router.replace(filterHref(pathname, searchParams, { q: query }));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [filters.q, pathname, query, router, searchParams]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--simadep-muted)]" />
        <input
          aria-label="Cari tugas atau project"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Cari tugas atau project"
          className="rounded border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        />
      </label>
      <select
        aria-label="Filter status tugas"
        value={filters.status ?? ""}
        onChange={(event) =>
          router.replace(
            filterHref(pathname, searchParams, {
              status: event.currentTarget.value,
            }),
          )
        }
        className="rounded border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
      >
        <option value="">Semua status</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type SearchTarget = {
  placeholder: string;
  fallbackPath?: string;
  buildHref: (query: string, searchParams: URLSearchParams) => string;
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  query: string,
  extra?: Record<string, string>,
) {
  const next = new URLSearchParams(searchParams);
  next.delete("page");

  if (query.trim()) {
    next.set("q", query.trim());
  } else {
    next.delete("q");
  }

  for (const [key, value] of Object.entries(extra ?? {})) {
    next.set(key, value);
  }

  const serialized = next.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

function resolveTarget(pathname: string): SearchTarget {
  if (pathname === "/projects") {
    return {
      placeholder: "Cari project",
      buildHref: (query, searchParams) => buildHref(pathname, searchParams, query),
    };
  }

  if (/^\/projects\/[^/]+$/.test(pathname)) {
    return {
      placeholder: "Cari tugas project",
      buildHref: (query, searchParams) =>
        buildHref(pathname, searchParams, query, { tab: "tasks" }),
    };
  }

  if (pathname === "/tasks") {
    return {
      placeholder: "Cari tugas saya",
      buildHref: (query, searchParams) => buildHref(pathname, searchParams, query),
    };
  }

  if (pathname === "/users") {
    return {
      placeholder: "Cari user",
      buildHref: (query, searchParams) => buildHref(pathname, searchParams, query),
    };
  }

  if (pathname === "/departments") {
    return {
      placeholder: "Cari departemen",
      buildHref: (query, searchParams) => buildHref(pathname, searchParams, query),
    };
  }

  return {
    placeholder: "Cari project, tugas, user...",
    fallbackPath: "/projects",
    buildHref: (query) =>
      query.trim() ? `/projects?q=${encodeURIComponent(query.trim())}` : "/projects",
  };
}

export function GlobalHeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsSnapshot = searchParams.toString();
  const target = useMemo(() => resolveTarget(pathname), [pathname]);
  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery, pathname]);

  useEffect(() => {
    if (target.fallbackPath) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (query === currentQuery) {
        return;
      }

      router.replace(target.buildHref(query, new URLSearchParams(searchParamsSnapshot)));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentQuery, query, router, searchParamsSnapshot, target]);

  function clearSearch() {
    setQuery("");
    if (!target.fallbackPath) {
      router.replace(target.buildHref("", new URLSearchParams(searchParamsSnapshot)));
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = target.buildHref(query, new URLSearchParams(searchParamsSnapshot));
    if (target.fallbackPath) {
      router.push(href);
    } else {
      router.replace(href);
    }
  }

  return (
    <form className="relative hidden lg:block" onSubmit={submitSearch}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--simadep-muted)]" />
      <input
        type="search"
        aria-label="Pencarian"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={target.placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-12 pr-10 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] sm:w-80"
      />
      {query ? (
        <button
          type="button"
          aria-label="Bersihkan pencarian"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--simadep-muted)] hover:bg-[var(--simadep-primary-soft)] hover:text-[var(--color-text-main)]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function walk(dir: string, predicate: (filePath: string) => boolean): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walk(fullPath, predicate));
      continue;
    }

    if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function displayPath(filePath: string) {
  return relative(root, filePath).split(sep).join("/");
}

describe("security boundary scans", () => {
  it("requires all feature server actions to authenticate through server session", () => {
    const actionFiles = walk(join(root, "src", "features"), (filePath) =>
      /server[\\/].*actions\.ts$/.test(filePath),
    );

    expect(actionFiles.length).toBeGreaterThan(0);

    const missingSession = actionFiles
      .filter(
        (filePath) =>
          !readFileSync(filePath, "utf8").includes("requireServerSession"),
      )
      .map(displayPath);

    expect(missingSession).toEqual([]);
  });

  it("requires internal API route handlers to authenticate before executing", () => {
    const routeFiles = walk(join(root, "src", "app", "api"), (filePath) =>
      filePath.endsWith(`${sep}route.ts`),
    ).filter((filePath) => {
      const path = displayPath(filePath);
      return (
        !path.includes("/api/auth/[...all]/") &&
        !path.includes("/api/health/")
      );
    });

    expect(routeFiles.length).toBeGreaterThan(0);

    const missingSession = routeFiles
      .filter(
        (filePath) =>
          !readFileSync(filePath, "utf8").includes("requireServerSession"),
      )
      .map(displayPath);

    expect(missingSession).toEqual([]);
  });
});

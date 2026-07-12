import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(join(root, path));
    if (stats.isDirectory()) {
      return walk(path);
    }
    return path;
  });
}

describe("UI restoration invariants", () => {
  it("keeps project detail tabbed with SPA-style client switching", () => {
    const page = read("src/app/(main)/projects/[id]/page.tsx");
    const shell = read("src/features/projects/ui/project-detail-shell.tsx");
    const header = read("src/features/projects/ui/project-detail-header.tsx");

    expect(page).toContain("resolveProjectTab");
    expect(page).toContain("ProjectDetailShell");
    expect(shell).toContain("window.history.pushState");
    expect(shell).toContain("popstate");
    expect(header).toContain("onTabChange");
    expect(header).toContain("href={onTabChange ? undefined");
  });

  it("keeps mutation-heavy secondary forms behind progressive disclosure", () => {
    const usersPage = read("src/app/(main)/users/page.tsx");
    const usersView = read(
      "src/features/identity/users/ui/users-management-view.tsx",
    );
    const departmentsPage = read("src/app/(main)/departments/page.tsx");
    const departmentsView = read(
      "src/features/departments/ui/departments-management-view.tsx",
    );

    expect(usersPage).not.toContain("password");
    expect(usersView).toContain("Tambah User");
    expect(usersView).toContain('role="dialog"');
    expect(departmentsPage).not.toContain("CreateDepartmentForm");
    expect(departmentsView).toContain("Buat Departemen");
    expect(departmentsView).toContain('role="dialog"');
  });

  it("keeps role visibility capability-driven", () => {
    const sidebar = read("src/components/dashboard/Sidebar.tsx");
    const appLayout = read("src/app/(main)/layout.tsx");
    const sessionClient = read("src/features/identity/session-client.ts");
    const navigation = read(
      "src/features/navigation/domain/navigation-capabilities.ts",
    );

    expect(appLayout).toContain("getCachedNavigationCapabilities");
    expect(appLayout).toContain("getNavigationCapabilitiesForUser");
    expect(sidebar).toContain("capability");
    expect(sidebar).not.toContain("mapGlobalRoleToDisplayRole");
    expect(sessionClient).not.toContain("Team Member");
    expect(sessionClient).not.toContain("Project Manager");
    expect(navigation).toContain("deriveNavigationCapabilities");
  });

  it("keeps destructive actions behind confirmation modals", () => {
    const projectList = read("src/features/projects/ui/project-list-view.tsx");
    const taskTab = read("src/features/work-items/ui/project-tasks-tab.tsx");
    const usersView = read(
      "src/features/identity/users/ui/users-management-view.tsx",
    );

    expect(projectList).toContain("ProjectArchiveConfirmationModal");
    expect(taskTab).toContain("WorkItemConfirmationModal");
    expect(usersView).toContain("ConfirmActionForm");
  });

  it("does not reintroduce legacy client auth or service layers", () => {
    const sourceFiles = walk("src").filter(
      (path) => /\.(ts|tsx)$/.test(path) && !path.startsWith("src\\test"),
    );
    const source = sourceFiles.map((path) => read(path)).join("\n");

    expect(source).not.toContain("AuthContext");
    expect(source).not.toContain("useAuth");
    expect(source).not.toContain("NEXT_PUBLIC_API_SMIP_BASE_URL");
    expect(source).not.toMatch(/from ["']@\/src\/services/);
    expect(source).not.toMatch(/localStorage\.(getItem|setItem).*token/);
    expect(source).not.toMatch(/sessionStorage\.(getItem|setItem).*token/);
  });
});

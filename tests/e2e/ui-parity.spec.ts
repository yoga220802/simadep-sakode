import { expect, type Locator, type Page, test } from "@playwright/test";

const seedPassword = process.env.SIMADEP_E2E_PASSWORD ?? "SimadepLocal2026!";
const projectId =
  process.env.SIMADEP_E2E_PROJECT_ID ??
  "20000000-0000-4000-8000-000000000001";

const accounts = {
  system: "admin.local@simadep.test",
  department: "head.local@simadep.test",
  user: "user.local@simadep.test",
} as const;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(seedPassword);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

async function capture(page: Page, name: string) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.screenshot({
    path: test.info().outputPath(`ui-${name}.png`),
    fullPage: true,
  });
}

async function expectNoObviousAccessibilityIssues(page: Page) {
  const issues = await page.evaluate(() => {
    function textName(element: Element) {
      return [
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        element.textContent,
      ]
        .join(" ")
        .trim();
    }

    const unnamedButtons = Array.from(
      document.querySelectorAll("button, [role='button']"),
    )
      .filter((element) => !textName(element))
      .map((element) => element.outerHTML.slice(0, 120));

    const unnamedFormControls = Array.from(
      document.querySelectorAll(
        "input:not([type='hidden']), select, textarea",
      ),
    )
      .filter((element) => {
        const id = element.getAttribute("id");
        const hasLabel = id
          ? Boolean(document.querySelector(`label[for='${CSS.escape(id)}']`))
          : false;
        return (
          !element.getAttribute("aria-label") &&
          !element.getAttribute("placeholder") &&
          !element.getAttribute("name") &&
          !hasLabel
        );
      })
      .map((element) => element.outerHTML.slice(0, 120));

    const dialogsWithoutSemantics = Array.from(
      document.querySelectorAll("[data-open='true'], .fixed.inset-0"),
    )
      .filter((element) => {
        const dialog =
          element.matches("[role='dialog']") ||
          element.querySelector("[role='dialog']");
        return !dialog;
      })
      .map((element) => element.outerHTML.slice(0, 120));

    return {
      unnamedButtons,
      unnamedFormControls,
      dialogsWithoutSemantics,
    };
  });

  expect(issues).toEqual({
    unnamedButtons: [],
    unnamedFormControls: [],
    dialogsWithoutSemantics: [],
  });
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5_000 });
}

async function openProjectTasks(page: Page) {
  await page.goto(`/projects/${projectId}?tab=tasks`);
  await expect(page.getByRole("tab", { name: /daftar tugas/i })).toBeVisible();
  await expect(page).toHaveURL(/tab=tasks/);
}

function firstVisible(locator: Locator) {
  return locator.first();
}

test.describe("visual screenshot coverage", () => {
  test("captures project list desktop and mobile layouts", async ({ page }) => {
    await signIn(page, accounts.system);
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: /project/i })).toBeVisible();
    await capture(page, "project-list-desktop");

    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, "project-list-mobile");
    await expectNoObviousAccessibilityIssues(page);
  });

  test("captures every project detail tab", async ({ page }) => {
    await signIn(page, accounts.department);

    const tabs = [
      ["detail", /detail/i],
      ["tasks", /daftar tugas/i],
      ["categories", /kategori/i],
      ["report", /laporan/i],
    ] as const;

    for (const [tab, label] of tabs) {
      await page.goto(`/projects/${projectId}?tab=${tab}`);
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
      await capture(page, `project-detail-${tab}`);
      await expectNoObviousAccessibilityIssues(page);
    }
  });

  test("captures users page and dashboards by actor scope", async ({ page }) => {
    await signIn(page, accounts.system);
    await page.goto("/users");
    await expect(page.getByRole("button", { name: /tambah user/i })).toBeVisible();
    await capture(page, "users-page");
    await expectNoObviousAccessibilityIssues(page);

    await page.goto("/dashboard");
    await capture(page, "dashboard-system");

    await page.context().clearCookies();
    await signIn(page, accounts.department);
    await page.goto("/dashboard");
    await capture(page, "dashboard-department");

    await page.context().clearCookies();
    await signIn(page, accounts.user);
    await page.goto("/dashboard");
    await capture(page, "dashboard-user");
  });
});

test.describe("interaction and progressive disclosure coverage", () => {
  test("preserves project tab URL state across back and forward", async ({ page }) => {
    await signIn(page, accounts.department);
    await page.goto(`/projects/${projectId}?tab=detail`);

    await page.getByRole("tab", { name: /daftar tugas/i }).click();
    await expect(page).toHaveURL(/tab=tasks/);

    await page.goBack();
    await expect(page).toHaveURL(/tab=detail/);
    await expect(page.getByRole("tab", { name: /detail/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.goForward();
    await expect(page).toHaveURL(/tab=tasks/);
  });

  test("opens and closes project create and edit modals", async ({ page }) => {
    await signIn(page, accounts.system);
    await page.goto("/projects");

    await page.getByRole("button", { name: /buat project/i }).click();
    await expect(page.getByRole("dialog", { name: /buat project/i })).toBeVisible();
    await capture(page, "create-project-modal");
    await closeDialog(page);

    await page.getByRole("button", { name: /aksi project/i }).first().click();
    await page.getByRole("menuitem", { name: /^edit$/i }).click({ force: true });
    await expect(page.getByRole("dialog", { name: /edit project/i })).toBeVisible();
    await capture(page, "edit-project-modal");
    await closeDialog(page);
  });

  test("opens member modal and keeps focus inside dialog", async ({ page }) => {
    await signIn(page, accounts.department);
    await page.goto(`/projects/${projectId}?tab=detail`);

    await page.getByRole("button", { name: /tambahkan anggota/i }).click();
    const dialog = page.getByRole("dialog", { name: /kelola anggota project/i });
    await expect(dialog).toBeVisible();
    await capture(page, "member-modal");

    await page.keyboard.press("Tab");
    await expect(dialog).toBeVisible();
    await closeDialog(page);
  });

  test("opens task modal, drawer, popovers, and delete confirmation", async ({ page }) => {
    await signIn(page, accounts.department);
    await openProjectTasks(page);

    await firstVisible(page.getByRole("button", { name: /buat tugas di milestone/i })).click();
    await expect(page.getByRole("dialog", { name: /buat tugas/i })).toBeVisible();
    await capture(page, "task-modal");
    await closeDialog(page);

    await page
      .getByRole("button", {
        name: /^build database foundation$/i,
      })
      .click();
    await expect(page.getByRole("heading", { name: /^komentar$/i })).toBeVisible();
    await capture(page, "task-detail-drawer");
    await page.getByRole("button", { name: /tutup detail tugas/i }).click();

    await firstVisible(page.getByRole("button", { name: /backend|frontend|pilih kategori/i })).click();
    await expect(page.getByRole("menu").or(page.getByRole("listbox"))).toBeVisible();
    await capture(page, "category-popover");
    await page.keyboard.press("Escape");

    await firstVisible(page.getByRole("button", { name: /hapus tugas/i })).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await capture(page, "task-delete-confirmation");
    await closeDialog(page);
  });

  test("opens category modal from the separate categories tab", async ({ page }) => {
    await signIn(page, accounts.department);
    await page.goto(`/projects/${projectId}?tab=categories`);

    await page.getByRole("button", { name: /tambah kategori/i }).click();
    await expect(page.getByRole("dialog", { name: /tambah kategori/i })).toBeVisible();
    await capture(page, "category-modal");
    await closeDialog(page);
  });
});

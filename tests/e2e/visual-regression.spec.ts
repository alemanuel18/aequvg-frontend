import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/eventos",
  "/eventos/10",
  "/noticias",
  "/recursos",
  "/junta-directiva",
  "/contacto",
  "/acceso",
  "/registro",
] as const;

const loginAsAdmin = async (page: import("@playwright/test").Page) => {
  await page.goto("/administrador");
  await page.getByLabel("Correo institucional").fill("admin@uvg.edu.gt");
  await page.getByLabel("Contraseña").fill("Acceso123!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/administrador\/panel$/);
};

test.describe("regresión visual transversal", () => {
  test("mantiene las vistas públicas dentro del viewport móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const sizes = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(sizes.scroll, `${route} genera overflow horizontal`).toBeLessThanOrEqual(
        sizes.client,
      );
    }
  });

  test("mantiene navegación y acciones táctiles utilizables en 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Abrir menú de navegación" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegación principal" })
        .getByRole("link")
        .first(),
    ).toHaveCSS("min-height", "48px");
  });

  test("mantiene los flujos administrativos principales en desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: /Bienvenido/ })).toBeVisible();
    await page.goto("/administrador/eventos");
    await expect(page.getByRole("heading", { name: /Eventos/ }).first()).toBeVisible();
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  });

  test("mantiene login y panel administrativo utilizables en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/administrador");
    await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible();
    await loginAsAdmin(page);
    const menu = page.getByRole("button", { name: "Abrir menú administrativo" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("navigation", { name: "Navegación administrativa" })).toBeVisible();
  });
});

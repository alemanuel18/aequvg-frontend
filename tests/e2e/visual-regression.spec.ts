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
    const firstNavLink = page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link")
      .first();
    const navLinkBox = await firstNavLink.boundingBox();
    expect(navLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);
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

  test("conserva la sesión al navegar por módulos administrativos en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);
    for (const route of ["/administrador/eventos", "/administrador/noticias", "/administrador/recursos", "/administrador/junta-directiva", "/administrador/contacto", "/administrador/panel"]) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/administrador\?returnTo=/);
      await expect(page.locator("main#admin-content")).toBeVisible();
    }
  });

  test("permite seleccionar o cargar una imagen de noticia", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);
    await page.goto("/administrador/noticias");
    await expect(page.getByRole("tab", { name: "Seleccionar existente" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "laboratorio.png" })).toBeVisible();
    await page.getByRole("radio", { name: "laboratorio.png" }).click();
    await expect(page.getByText("Seleccionada: laboratorio.png")).toBeVisible();
    await page.getByRole("tab", { name: "Subir nueva" }).click();
    await page.locator("#news-image-upload").setInputFiles({
      name: "nueva.png",
      mimeType: "image/png",
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });
    await expect(page.getByText("La imagen se cargó y quedó seleccionada.")).toBeVisible();
    await expect(page.getByText("Seleccionada: nueva.png")).toBeVisible();
  });
});

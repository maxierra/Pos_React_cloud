import { test, expect, type Page } from "@playwright/test";

type Credentials = { email: string; password: string; businessName: string };

const userA: Credentials = { email: "usuarioA@gmail.com", password: "123456", businessName: "Test Negocio A" };
const userB: Credentials = { email: "usuarioB@gmail.com", password: "123456", businessName: "Test Negocio B" };

async function login(page: Page, creds: Credentials) {
  await page.goto("/auth/login?redirect=%2Fapp");

  await page.getByLabel(/correo/i).or(page.getByRole("textbox", { name: /email/i })).fill(creds.email);
  await page.getByLabel(/contraseña/i).or(page.getByRole("textbox", { name: /password/i })).fill(creds.password);

  await page.getByRole("button", { name: /ingresar|entrar|login|iniciar sesión/i }).click();

  // Espera a que cargue alguna página del app
  await page.waitForLoadState("networkidle");

  // Si estamos en el wizard de setup, completamos datos mínimos de negocio
  if (page.url().includes("/app/setup")) {
    await page.getByLabel("Nombre del negocio").fill(creds.businessName);
    // slug se completa solo; simplemente enviamos el formulario
    await page.getByRole("button", { name: /crear negocio/i }).click();
    await page.waitForLoadState("networkidle");
  }
}

async function createProduct(page: Page, opts: { name: string; price: number; barcode: string }) {
  await page.goto("/app/products");

  await page.getByRole("button", { name: /nuevo producto/i }).click();

  // Campo "Nombre" del formulario (no el buscador "Buscar por nombre")
  const nameInput = page.getByRole("textbox", { name: /^nombre$/i });
  await nameInput.fill(opts.name);

  const priceInput = page.getByRole("spinbutton", { name: /precio venta/i });
  await priceInput.fill(String(opts.price));

  const barcodeInput = page.locator('input[name="barcode"]');
  await barcodeInput.fill(opts.barcode);

  await page.getByRole("button", { name: /guardar/i }).click();

  await expect(page.getByText(opts.name, { exact: false })).toBeVisible();
}

async function makeSaleWithBarcode(page: Page, barcode: string) {
  await page.goto("/app/pos");

  const searchInput = page.getByRole("textbox").first();
  await searchInput.fill(barcode);
  await searchInput.press("Enter");

  // abrir modal de cobro
  await page.getByRole("button", { name: /cobrar/i }).click();

  // asumimos efectivo, monto auto-llenado, confirmar
  await page.getByRole("button", { name: /revisar y cobrar|confirmar cobro/i }).first().click();
}

test.describe("Multi-tenant isolation between users", () => {
  test("usuarioA y usuarioB ven negocios distintos en el sidebar", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await login(pageA, userA);

    // Verificamos que el header muestre el nombre del negocio A
    const headerA = pageA.getByRole("banner");
    await expect(headerA.getByText(userA.businessName, { exact: true })).toBeVisible();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await login(pageB, userB);

    // Verificamos que el header muestre el nombre del negocio B
    const headerB = pageB.getByRole("banner");
    await expect(headerB.getByText(userB.businessName, { exact: true })).toBeVisible();

    // Aseguramos que cada usuario NO ve el nombre del negocio del otro en su propio header
    await expect(headerA.getByText(userB.businessName, { exact: true })).toHaveCount(0);
    await expect(headerB.getByText(userA.businessName, { exact: true })).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });

  test("productos de A no aparecen en B", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await login(pageA, userA);

    const productNameA = "Producto A exclusivo";
    const barcodeA = "A-1234567890";

    await createProduct(pageA, { name: productNameA, price: 1000, barcode: barcodeA });

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await login(pageB, userB);

    // En productos de B no debe aparecer el producto exclusivo de A
    await pageB.goto("/app/products");
    await expect(pageB.getByText(productNameA, { exact: false })).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});


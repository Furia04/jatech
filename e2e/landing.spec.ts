import { test, expect } from '@playwright/test';

test.describe('Página Principal (Landing Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe cargar correctamente el título y logo de JaTech', async ({ page }) => {
    await expect(page).toHaveTitle(/JaTech/);
    const logo = page.locator('text=JaTech').first();
    await expect(logo).toBeVisible();
  });

  test('debe alternar entre Modo Cliente y Modo Técnico', async ({ page }) => {
    // Modo Cliente por defecto
    await expect(page.locator('text=Audita el avance sin intermediarios')).toBeVisible();
    await expect(page.locator('input[placeholder*="DNI"]')).toBeVisible();

    // Cambiar a Modo Técnico
    const techButton = page.locator('button:has-text("Dueño de Taller")');
    await techButton.click();

    await expect(page.locator('text=Control Operativo y Financiero')).toBeVisible();
    await expect(page.locator('text=Iniciar Prueba Gratuita')).toBeVisible();
  });

  test('debe mostrar la sección de telemetría y comanda térmica de 80mm', async ({ page }) => {
    await expect(page.locator('text=Telemetría en Vivo')).toBeVisible();
    await expect(page.locator('text=Comanda Térmica 80mm').first()).toBeVisible();
    await expect(page.locator('text=ESC/POS 203 DPI')).toBeVisible();
  });

  test('debe mostrar el plan único de $20.000 ARS/mes', async ({ page }) => {
    await expect(page.locator('text=Plan Taller Pro')).toBeVisible();
    await expect(page.locator('text=$20.000')).toBeVisible();
    await expect(page.locator('text=ARS / mes')).toBeVisible();
  });
});

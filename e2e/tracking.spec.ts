import { test, expect } from '@playwright/test';

test.describe('Portal Público de Seguimiento (/track)', () => {
  test('debe cargar la pantalla de búsqueda pública de órdenes', async ({ page }) => {
    await page.goto('/track');
    await expect(page.locator('text=Consulta el Estado de tu Equipo por DNI')).toBeVisible();
    await expect(page.locator('input[placeholder*="DNI"]')).toBeVisible();
  });

  test('debe validar la búsqueda y mostrar mensaje cuando no encuentra la orden', async ({ page }) => {
    await page.goto('/track');
    const input = page.locator('input[placeholder*="DNI"]');
    await input.fill('9999999999');
    await page.locator('button[type="submit"]').click();

    // Debe mostrar que no se encontró o mensaje de no resultados
    await expect(page.locator('text=No se encontraron órdenes').or(page.locator('text=no registra'))).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir navegar desde la landing page al portal de tracking', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="Ingresa DNI o código OT"]');
    await searchInput.fill('WO-1234');
    await page.locator('button:has-text("Auditar Estado")').click();

    await expect(page).toHaveURL(/\/track\?q=WO-1234/);
  });
});

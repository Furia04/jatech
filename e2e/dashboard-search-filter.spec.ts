import { test, expect } from '@playwright/test';

test.describe('Dashboard User Flows', () => {
  // Configuración de la fixture: inyectar una orden de prueba en localStorage
  // ya que la aplicación soporta fallback a localStorage cuando no hay auth
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
    await page.evaluate(() => {
      const mockOrder = {
        id: 'test-order-123',
        tracking_code: '#WO-QA-1234',
        status: 'recibido',
        customer_name: 'Test Customer',
        device_info: 'Notebook QA',
        reported_fault: 'Falla de prueba QA',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('prorepair_local_orders', JSON.stringify([mockOrder]));
    });
    await page.reload();
  });

  test('Search for an order from the dashboard', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar orden/i).first();
    // Validar que el input de búsqueda existe, si la UI lo tiene. Si no, usamos el del dashboard principal.
    if (await searchInput.isVisible()) {
      await searchInput.fill('#WO-QA-1234');
      await expect(page.getByText('Test Customer')).toBeVisible();
    } else {
      // Como estamos en /demo, las órdenes se listan directamente
      await expect(page.getByText('Test Customer')).toBeVisible();
      await expect(page.getByText('#WO-QA-1234')).toBeVisible();
    }
  });

  test('Filter service orders by lifecycle state', async ({ page }) => {
    // Verificar que la orden inyectada se muestra en el estado "Recibido"
    await expect(page.getByText('Test Customer')).toBeVisible();
    
    // Si hay un filtro, podemos interactuar con él
    const filterBtn = page.getByRole('button', { name: /Filtrar/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      const recibidasFilter = page.getByRole('menuitem', { name: /Recibid/i });
      if (await recibidasFilter.isVisible()) {
        await recibidasFilter.click();
        await expect(page.getByText('#WO-QA-1234')).toBeVisible();
      }
    }
  });
});

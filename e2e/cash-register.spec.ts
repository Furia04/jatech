import { test, expect } from '@playwright/test';

test.describe('Arqueo & Cierre de Caja (Z-Report) (/demo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('debe abrir el modal de Cierre de Caja al hacer clic en el boton de navegacion', async ({ page }) => {
    const cashBtn = page.getByRole('button', { name: /Cierre de Caja/i }).first();
    await expect(cashBtn).toBeVisible();
    await cashBtn.click();

    await expect(page.getByText('Cierre de Caja Diario')).toBeVisible();
    await expect(page.getByText('TOTAL ARQUEO')).toBeVisible();
  });

  test('debe permitir cambiar filtros de periodo', async ({ page }) => {
    await page.getByRole('button', { name: /Cierre de Caja/i }).first().click();

    const todayBtn = page.getByRole('button', { name: 'Hoy' });
    const allBtn = page.getByRole('button', { name: /Todo el Hist/i });

    await expect(todayBtn).toBeVisible();
    await expect(allBtn).toBeVisible();

    await allBtn.click();
    await expect(page.getByText('TOTAL ARQUEO')).toBeVisible();
  });

  test('debe tener botones para Exportar CSV e Imprimir Ticket Z de 80mm', async ({ page }) => {
    await page.getByRole('button', { name: /Cierre de Caja/i }).first().click();

    const csvBtn = page.getByRole('button', { name: /Exportar CSV/i });
    const printBtn = page.getByRole('button', { name: /Ticket Z/i });

    await expect(csvBtn).toBeVisible();
    await expect(printBtn).toBeVisible();
  });
});

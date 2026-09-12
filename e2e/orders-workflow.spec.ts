import { test, expect } from '@playwright/test';

test.describe('Flujos de Ordenes: WhatsApp & Presupuestador (/demo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('debe abrir el Centro de Notificaciones de WhatsApp con plantillas interactivas', async ({ page }) => {
    const waBtn = page.locator('button[title="Notificar por WhatsApp"]').first();
    await expect(waBtn).toBeVisible();
    await waBtn.click();

    await expect(page.getByText(/CENTRO DE NOTIFICACIONES WHATSAPP/i)).toBeVisible();
    await expect(page.getByText(/Vista Previa del Mensaje/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar por WhatsApp/i })).toBeVisible();
  });

  test('debe permitir seleccionar distintas plantillas de WhatsApp y actualizar el mensaje', async ({ page }) => {
    await page.locator('button[title="Notificar por WhatsApp"]').first().click();

    const readyTemplateBtn = page.getByRole('button', { name: /Listo para Retiro/i });
    await expect(readyTemplateBtn).toBeVisible();
    await readyTemplateBtn.click();

    await expect(page.getByText(/LISTO PARA RETIRAR/i)).toBeVisible();

    const budgetTemplateBtn = page.getByRole('button', { name: /Presupuesto y Diagn/i });
    await expect(budgetTemplateBtn).toBeVisible();
    await budgetTemplateBtn.click();

    await expect(page.getByText(/Presupuesto total/i)).toBeVisible();
  });

  test('debe abrir el presupuestador y calcular repuestos + mano de obra', async ({ page }) => {
    const editBtn = page.locator('button[title="Editar Orden / Presupuestar"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const budgetTab = page.getByRole('button', { name: /Presupuestador Sandbox/i });
    await expect(budgetTab).toBeVisible();
    await budgetTab.click();

    await expect(page.getByText(/Presupuestador & Repuestos/i)).toBeVisible();
    await expect(page.getByText('PRECIO FINAL CLIENTE')).toBeVisible();
  });
});

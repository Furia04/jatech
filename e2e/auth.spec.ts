import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación & Seguridad', () => {
  test('debe mostrar el formulario de inicio de sesión (/login)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe mostrar error amigable si el enlace de recuperación expiró', async ({ page }) => {
    await page.goto('/login?error=access_denied&error_code=otp_expired');
    await expect(page.locator('text=El enlace de recuperación ha expirado')).toBeVisible();
  });

  test('debe cargar la página de recuperación de contraseña (/reset-password)', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('h2:has-text("Recuperar Contraseña")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar")')).toBeVisible();
  });

  test('debe cargar la página de actualización de contraseña (/update-password)', async ({ page }) => {
    await page.goto('/update-password');
    await expect(page.locator('h2:has-text("Crear Nueva Contraseña")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Mínimo 6 caracteres"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Repite tu contraseña"]')).toBeVisible();
  });

  test('debe proteger las rutas del dashboard y redirigir al login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    // Si no está autenticado, middleware debe redirigir a /login
    await expect(page).toHaveURL(/\/login/);
  });
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright E2E para JaTech
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Tiempo máximo por test */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar la suite en CI si se dejó test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentos en caso de fallo */
  retries: process.env.CI ? 2 : 0,
  /* Workers */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    /* URL base para pruebas locales */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    /* Capturar traza solo en fallos */
    trace: 'on-first-retry',
    /* Screenshots en fallos */
    screenshot: 'only-on-failure',
  },

  /* Proyectos por navegador */
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge',
      },
    },
    {
      name: 'Mobile View (Emulación Mostrador)',
      use: {
        ...devices['Pixel 5'],
        channel: 'chrome',
      },
    },
  ],

  /* Iniciar servidor de Next.js automáticamente si no está corriendo */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

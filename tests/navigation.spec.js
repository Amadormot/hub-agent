import { test, expect } from '@playwright/test';

test.describe('Navigation Security', () => {

    const protectedRoutes = ['/rotas', '/eventos', '/garagem', '/perfil', '/admin'];

    protectedRoutes.forEach(route => {
        test(`should redirect unauthenticated user from ${route} to login`, async ({ page }) => {
            await page.goto(route);
            await expect(page).toHaveURL(/\/login/);
            // Optional: Check if "Entrar" button or specific login text exists
            await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
        });
    });

    test('should allow access to public pages like Login and Register', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL('/login');

        await page.goto('/register');
        await expect(page).toHaveURL('/register');
    });

});

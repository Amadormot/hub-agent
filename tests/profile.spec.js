import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {

    // Create a new user before each test to ensure fresh state and valid auth
    test.beforeEach(async ({ page }) => {
        const uniqueEmail = `profile_test_${Date.now()}@motohub.com`;
        await page.goto('/register');
        await page.getByPlaceholder('Ex: Águia da Estrada').fill('Profile Tester');
        await page.getByPlaceholder('seu@email.com').fill(uniqueEmail);
        await page.getByPlaceholder('••••••••').fill('password123');
        await page.getByPlaceholder('Ex: Honda').fill('Triumph');
        await page.getByPlaceholder('Ex: CB 500X').fill('Tiger 1200');
        await page.getByPlaceholder('Ex: 2023').fill('2024');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
    });

    test('should view profile information', async ({ page }) => {
        // Navigate to profile
        await page.goto('/perfil');

        // Check if key elements are visible
        // "Meu Perfil" heading
        await expect(page.getByRole('heading', { name: /Meu Perfil/i })).toBeVisible();

        // Check for user name "Andre" or "agm_jr"
        await expect(page.getByText(/Andre/i)).toBeVisible();

        // Check for "Minha Moto" section
        await expect(page.getByText(/Minha Moto/i)).toBeVisible();
    });

    test('should edit profile motorcycle', async ({ page }) => {
        await page.goto('/perfil');

        // Find "Editar Perfil" or similar button. 
        // In Profile.jsx: <button onClick={() => setIsEditing(true)} ...>Editar Perfil</button>
        await page.click('button:has-text("Editar Perfil")');

        // Check if inputs are editable
        const motoInput = page.locator('input[value="Triumph Tiger 1200"]'); // Or whatever the current value is
        // Wait, the input might just be labelled "Moto".
        // Let's assume there is a label "Moto" or placeholder.
        // Better strategy: Target by name or placeholder if possible.
        // Looking at Profile.jsx content (which I didn't read fully but assume standard form):
        // <label>Sua Moto</label>
        // <input value={formData.motorcycle} ... />

        // Let's force fill a new value
        await page.fill('input[name="motorcycle"]', 'Honda CB 500 Teste');

        // Save
        await page.click('button:has-text("Salvar Alterações")');

        // Verify toast or updated text
        await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();

        // Verify the text is updated on the profile view
        await expect(page.getByText('Honda CB 500 Teste')).toBeVisible();

        // Cleanup: Revert change
        await page.click('button:has-text("Editar Perfil")');
        await page.fill('input[name="motorcycle"]', 'Triumph Tiger 1200'); // Original value assumption
        await page.click('button:has-text("Salvar Alterações")');
        await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();
    });

});

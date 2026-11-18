import { test as base, expect, type Route } from '@playwright/test';
import type { CoachRequest, Reply } from '../../lib/contracts';
import { errorCopy } from '../../lib/copy';

const answer: Reply = { kind: 'clarify', reason: 'missing_context', language: 'en', question: 'When does bedtime become difficult?' };
async function respond(route: Route, reply: Reply = answer) {
  const request = route.request().postDataJSON() as CoachRequest;
  await route.fulfill({ json: { ok: true, requestId: request.requestId, reply } });
}

// Install the fallback before navigation: an unconfigured test must never reach the provider.
const test = base.extend<{ requests: CoachRequest[] }>({
  requests: async ({ page }, use) => {
    const requests: CoachRequest[] = [];
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/api/coach') requests.push(request.postDataJSON());
    });
    await page.route('**/api/coach', route => respond(route));
    await use(requests);
  },
});
test.beforeEach(async ({ page, requests }) => {
  expect(requests).toHaveLength(0);
  await page.goto('/');
});

test('blank and oversized drafts never submit; Enter inserts a newline', async ({ page, requests }) => {
  const input = page.getByRole('textbox', { name: 'Your message' });
  const send = page.getByRole('button', { name: 'Send', exact: true });
  await expect(send).toBeDisabled();
  await input.fill('   ');
  await expect(send).toBeDisabled();
  await input.fill('First line');
  await input.press('Enter');
  await input.pressSequentially('Second line');
  await expect(input).toHaveValue('First line\nSecond line');
  await input.fill('x'.repeat(2001));
  await send.click();
  await expect(page.getByText('Please keep your message within 2,000 characters.', { exact: true }).first()).toBeVisible();
  expect(requests).toHaveLength(0);
});

test('keyboard Send retains focus on Cancel then returns to composer after success', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/coach', async route => { await gate; await respond(route); });
  const input = page.getByRole('textbox');
  await input.fill('Bedtime is difficult.');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await expect(input).toHaveAttribute('readonly', '');
  release();
  await expect(page.getByText(answer.question)).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
});

for (const retryable of [true, false]) {
  test(`public error preserves draft and Retry focus (retryable=${retryable})`, async ({ page, requests }) => {
    await page.route('**/api/coach', async route => {
      await route.fulfill({ status: 503, json: { ok: false, requestId: route.request().postDataJSON().requestId,
        error: errorCopy(retryable ? 'provider_failure' : 'review_rejected', 'en') } });
    });
    const input = page.getByRole('textbox');
    await input.fill('Bedtime is difficult.');
    await page.getByRole('button', { name: 'Send', exact: true }).focus();
    await page.keyboard.press('Enter');
    const retry = page.getByRole('button', { name: 'Retry', exact: true });
    await expect(retry).toBeVisible();
    await expect(input).toHaveValue('Bedtime is difficult.');
    if (retryable) await expect(retry).toBeFocused();
    else {
      await expect(retry).toBeDisabled();
      await retry.press('Enter');
      expect(requests).toHaveLength(1);
      await input.fill('An edited bedtime concern.');
      await expect(retry).toBeEnabled();
    }
    await page.route('**/api/coach', route => respond(route));
    await retry.click();
    await expect(page.getByText(answer.question)).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].transcript).toEqual([{ role: 'user', text: retryable ? 'Bedtime is difficult.' : 'An edited bedtime concern.' }]);
  });
}

test('Cancel retains draft and ignores a late response even when transport abort is ineffective', async ({ page }) => {
  // Simulate a transport that cannot cancel, exercising the UI request identity guard.
  await page.evaluate(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => original(input, { ...init, signal: undefined });
  });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/coach', async route => { await gate; await respond(route); });
  const input = page.getByRole('textbox');
  await input.fill('Keep my draft.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(input).toHaveValue('Keep my draft.');
  await expect(input).toBeFocused();
  const arrived = page.waitForResponse('**/api/coach');
  release();
  await arrived;
  // Drain the response JSON and React render before checking stale suppression.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByText(answer.question)).toHaveCount(0);
  await expect(input).toHaveValue('Keep my draft.');
});

test('reset requires confirmation and clears conversation and draft', async ({ page }) => {
  await page.getByRole('textbox').fill('Bedtime is difficult.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(answer.question)).toBeVisible();
  await page.getByRole('textbox').fill('Unsent follow-up');
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Clear this conversation?' });
  await dialog.getByRole('button', { name: 'Keep conversation', exact: true }).click();
  await expect(page.getByText(answer.question)).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveValue('Unsent follow-up');
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  await dialog.getByRole('button', { name: 'Clear conversation', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(answer.question)).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveValue('');
  await expect(page.getByRole('textbox')).toBeFocused();
});

test('privacy dialog closes with Escape and returns focus to opener', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'Privacy & limits', exact: true });
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'Privacy & limits' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('HTML-like parent and response text stays inert plain text', async ({ page }) => {
  const html = '<img src=x onerror="window.injected=true"><script>window.injected=true</script>';
  await page.route('**/api/coach', route => respond(route, { ...answer, question: html }));
  await page.getByRole('textbox').fill(html);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(html, { exact: true })).toHaveCount(2);
  await expect(page.locator('section img, section script')).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, 'injected'))).toBeUndefined();
});

test('English and Urdu document and messages retain language/direction at 320px without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('textbox').fill('An English bedtime concern.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(answer.question)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'اردو', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const question = 'سونے کے وقت کیا مشکل ہوتی ہے؟';
  await page.route('**/api/coach', route => respond(route, { ...answer, language: 'ur', question }));
  await page.getByRole('textbox', { name: 'آپ کا پیغام' }).fill('سونے کے وقت مشکل ہوتی ہے۔');
  await page.getByRole('button', { name: 'بھیجیں', exact: true }).click();
  const urdu = page.locator('section[lang="ur"][dir="rtl"]').filter({ hasText: question });
  await expect(urdu).toBeVisible();
  await expect(page.locator('section[lang="en"][dir="ltr"]').filter({ hasText: answer.question })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

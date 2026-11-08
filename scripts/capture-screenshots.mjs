import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
const base = 'http://localhost:3000';
const apiBase = 'http://localhost:4000/api/v1';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  baseURL: base,
});
const page = await context.newPage();

async function shot(name) {
  const file = path.join(outDir, name);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', name);
}

// Static pages
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await shot('01-home.png');

await page.goto(`${base}/how-it-works`, { waitUntil: 'networkidle' });
await shot('02-how-it-works.png');

await page.goto(`${base}/consult/chat`, { waitUntil: 'networkidle' });
await shot('03-chat-start.png');

// Interactive chat flow in the real UI
await page.getByRole('button', { name: /Begin consultation/i }).click();
await page.getByText('Consultation token').waitFor({ timeout: 20000 });
await shot('04-chat-active.png');

await page.getByPlaceholder(/Describe your concern/i).fill(
  'I have fever and sore throat with mild cough for 2 days',
);
await page.getByRole('button', { name: /^Send$/i }).click();
await page.waitForTimeout(2500);
await shot('05-chat-reply.png');

await page.getByRole('button', { name: /End consultation/i }).click();
await page.getByRole('heading', { name: /AI prescription/i }).waitFor({ timeout: 45000 });
await page.waitForTimeout(1800);
await shot('06-prescription-medicines.png');

await page.getByText(/AI Generated — Not a legally valid prescription/i).first().scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await shot('07-thank-you-ai-footer.png');

const tokenText = await page.locator('.font-mono').first().innerText().catch(() => '');

await page.goto(`${base}/consult/video`, { waitUntil: 'networkidle' });
await shot('08-video-consultation.png');

await page.goto(`${base}/assessment`, { waitUntil: 'networkidle' });
await shot('09-symptom-assessment.png');

await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('10-dashboard.png');

await page.goto(`${base}/appointments`, { waitUntil: 'networkidle' });
await shot('11-appointments.png');

await page.goto(`${base}/profile`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('12-profile.png');

await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
await page.getByPlaceholder('x-admin-key').fill('dev-admin-key');
await page.getByRole('button', { name: /Load metrics/i }).click();
await page.waitForTimeout(1500);
await shot('13-admin-dashboard.png');

await page.goto('http://localhost:4000/docs', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await shot('14-api-docs.png');

await writeFile(
  path.join(outDir, 'CAPTURE_INFO.json'),
  JSON.stringify({ capturedAt: new Date().toISOString(), tokenText }, null, 2),
);

await browser.close();
console.log('All screenshots saved to', outDir);

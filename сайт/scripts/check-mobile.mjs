import puppeteer from 'puppeteer';
import { KnownDevices } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:4321';
const OUT_DIR = path.join(process.cwd(), 'mobile-screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const devicesToTest = [
  'iPhone 13',
  'iPhone 13 Pro Max',
  'Pixel 5',
  'Galaxy S5',
  'iPad Mini'
];

async function run() {
  console.log(`Testing URL: ${URL}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const deviceName of devicesToTest) {
    const device = KnownDevices[deviceName];
    if (!device) {
      console.warn(`Device ${deviceName} not found.`);
      continue;
    }

    console.log(`Emulating ${deviceName}...`);
    await page.emulate(device);
    
    try {
      await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait a bit for animations/fonts to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileName = `${deviceName.replace(/\s+/g, '-')}.png`;
      const filePath = path.join(OUT_DIR, fileName);
      
      // Full page screenshot
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`✅ Saved screenshot to ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to test ${deviceName}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);

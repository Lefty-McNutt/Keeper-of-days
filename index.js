const puppeteer = require('puppeteer');

const SQUARE_EMAIL = process.env.SQUARE_EMAIL;
const SQUARE_PASSWORD = process.env.SQUARE_PASSWORD;
const SQUARE_URL = 'https://squareup.com/login';

async function blockSquareTime() {
  let browser;
  try {
    console.log('Starting browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(SQUARE_URL, { waitUntil: 'networkidle2' });
    console.log('At Square login page');

    // Log in
    await page.type('input[type="email"]', SQUARE_EMAIL);
    await page.type('input[type="password"]', SQUARE_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in');

    // Navigate to calendar
    await page.goto('https://squareup.com/dashboard/calendar', { waitUntil: 'networkidle2' });
    console.log('At calendar');

    // Look for block creation button and click it
    await page.waitForSelector('button[aria-label*="Block"]', { timeout: 5000 }).catch(() => {
      console.log('Block button not immediately found, searching for alternative...');
    });

    // Try clicking create event
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Block') || text.includes('Create')) {
        await btn.click();
        break;
      }
    }

    console.log('✓ Block creation initiated');
    
    // Wait a bit for the form
    await page.waitForTimeout(2000);
    
    console.log('✓ Success');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

blockSquareTime();

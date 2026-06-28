// Convert HTML files to PNG using Playwright
// Usage: node convert-png.js <input.html> <output.png> <width> <height>

const { chromium } = require('playwright');

async function convertToPng(inputPath, outputPath, width, height) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2, // 2x for retina quality
  });
  const page = await context.newPage();

  await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle' });
  // Wait for fonts to load
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: outputPath,
    width,
    height,
    omitBackground: false,
    type: 'png',
  });

  await browser.close();
  console.log(`✓ ${outputPath} (${width}x${height}, 2x retina)`);
}

const [input, output, w, h] = process.argv.slice(2);
if (!input || !output || !w || !h) {
  console.error('Usage: node convert-png.js <input.html> <output.png> <width> <height>');
  process.exit(1);
}

convertToPng(input, output, parseInt(w), parseInt(h))
  .catch(err => { console.error(err); process.exit(1); });

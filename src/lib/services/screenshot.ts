import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export interface ScreenshotResult {
  filePath: string; // relative path like /uploads/{sessionId}/url-{hash}.png
  absolutePath: string;
  width: number;
  height: number;
}

/**
 * Captures a full-page screenshot of a URL using Puppeteer.
 * Returns the saved file path for use as a reference image.
 */
export async function captureScreenshot(
  url: string,
  sessionId: string
): Promise<ScreenshotResult> {
  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a filename from the URL
  const urlHash = Buffer.from(url).toString('base64url').slice(0, 16);
  const filename = `url-${urlHash}-${Date.now()}.png`;
  const absolutePath = path.join(uploadDir, filename);
  const relativePath = `/uploads/${sessionId}/${filename}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to a standard desktop size
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to the URL with a generous timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a moment for any animations/lazy-loading to settle
    // Wait 8 seconds for animations, lazy-loading, fonts, hero images to fully settle
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Take a full-page screenshot
    await page.screenshot({
      path: absolutePath,
      fullPage: true,
      type: 'png',
    });

    return {
      filePath: relativePath,
      absolutePath,
      width: 1440,
      height: 900,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Captures just the above-the-fold viewport screenshot.
 * Better for probe-style comparisons where we want a fixed viewport.
 */
export async function captureViewportScreenshot(
  url: string,
  sessionId: string,
  viewport: { width: number; height: number } = { width: 1440, height: 900 }
): Promise<ScreenshotResult> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const urlHash = Buffer.from(url).toString('base64url').slice(0, 16);
  const filename = `viewport-${urlHash}-${Date.now()}.png`;
  const absolutePath = path.join(uploadDir, filename);
  const relativePath = `/uploads/${sessionId}/${filename}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait 8 seconds for animations, lazy-loading, fonts, hero images to fully settle
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Viewport-only screenshot (not fullPage)
    await page.screenshot({
      path: absolutePath,
      fullPage: false,
      type: 'png',
    });

    return {
      filePath: relativePath,
      absolutePath,
      width: viewport.width,
      height: viewport.height,
    };
  } finally {
    await browser.close();
  }
}

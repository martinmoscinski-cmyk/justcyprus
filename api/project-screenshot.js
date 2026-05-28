import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { put } from "@vercel/blob";
import { getCachedImage, setCachedImage } from "./screenshot-cache.js";

export default async function handler(req, res) {
  let browser;

  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing url"
      });
    }

    const cacheKey = String(url);
    const cachedImage = getCachedImage(cacheKey);

    if (cachedImage) {
      return res.redirect(302, cachedImage);
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1400,
      height: 1000
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: false
    });

    const blob = await put(
      `projects/${Date.now()}.jpg`,
      screenshot,
      {
        access: "public"
      }
    );

    setCachedImage(cacheKey, blob.url);

    return res.redirect(302, blob.url);

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
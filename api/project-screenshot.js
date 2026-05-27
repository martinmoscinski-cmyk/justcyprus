import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { put } from "@vercel/blob";

export default async function handler(req, res) {

  try {

    const url =
      req.query.url;

    if (!url) {
      return res
        .status(400)
        .json({ error: "Missing url" });
    }

    const browser =
      await puppeteer.launch({
        args: chromium.args,
        executablePath:
          await chromium.executablePath(),
        headless: true
      });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1400,
      height: 1000
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.screenshot({
      path: "/tmp/project.jpg",
      type: "jpeg",
      quality: 80,
      fullPage: false
    });

    await browser.close();

    const fs =
      await import("fs");

    const buffer =
      fs.readFileSync("/tmp/project.jpg");

    const blob =
      await put(
        `projects/${Date.now()}.jpg`,
        buffer,
        {
          access: "public"
        }
      );

    return res.status(200).json({
      success: true,
      image: blob.url
    });

  } catch (e) {

    return res.status(500).json({
      success: false,
      error: e.message
    });

  }
}
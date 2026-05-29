import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";
const MAX_PAGES = 2;

const cleanText = (html = "") =>
  normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
  );

const absoluteUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const extractImageFromBlock = (block = "") => {
  const img =
    block.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1];

  return img ? absoluteUrl(img) : fallbackImage;
};

const extractLocation = (text = "") => {
  const lower = text.toLowerCase();

  if (lower.includes("larnaca")) return "Larnaca";
  if (lower.includes("protaras")) return "Protaras";
  if (lower.includes("pernera")) return "Pernera";
  if (lower.includes("kapparis")) return "Kapparis";
  if (lower.includes("ayia napa") || lower.includes("agia napa")) return "Ayia Napa";
  if (lower.includes("cape greco")) return "Cape Greco";
  if (lower.includes("deryneia")) return "Deryneia";
  if (lower.includes("sotira")) return "Sotira";
  if (lower.includes("paralimni")) return "Paralimni";

  return "Famagusta";
};

const extractType = (text = "") => {
  const lower = text.toLowerCase();

  if (lower.includes("villa")) return "Villa";
  if (lower.includes("penthouse")) return "Penthouse";
  if (lower.includes("shop")) return "Shop";
  if (lower.includes("office")) return "Office";
  if (lower.includes("apartment")) return "Apartment";

  return "Property";
};

export async function getGiovaniProjects() {
  const units = [];

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    const url =
      pageNo === 1
        ? `${BASE_URL}/properties/`
        : `${BASE_URL}/properties/page/${pageNo}/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    const blocks =
      html.match(/<div[^>]+class=["'][^"']*(?:property|listing)[^"']*["'][\s\S]*?(?=<div[^>]+class=["'][^"']*(?:property|listing)|<\/main>|<\/body>)/gi) || [];

    blocks.forEach((block, index) => {
      const text = cleanText(block);

      const priceMatch = text.match(/€\s*([\d,]+)/i);
      if (!priceMatch) return;

      const price = Number(priceMatch[1].replace(/,/g, ""));
      if (!price || price < 50000) return;

      const titleMatch =
        block.match(/<h4[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/<h3[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i) ||
        block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);

      if (!titleMatch) return;

      const title = normalizeProjectName(
        normalizeText(titleMatch[1])
          .replace(/\s+/g, " ")
          .trim()
      );

      if (!title || title.length < 3) return;

      const link =
        block.match(/href=["']([^"']+)["']/i)?.[1] || url;

      const image = extractImageFromBlock(block);
      const location = extractLocation(text);
      const type = extractType(text);

      units.push({
        unitRef: `GIO-${pageNo}-${index + 1}`,
        projectName: title,
        unitTitle: title,
        location,
        type,
        price,
        image,
        images: [image],
        description: `${title} is a selected Giovani development in ${location}. Contact us for current availability, layouts and details.`,
        bedrooms: "",
        developer: "Giovani",
        source: absoluteUrl(link)
      });
    });
  }

  return units;
}
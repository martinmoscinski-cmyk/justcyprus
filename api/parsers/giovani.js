import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";

const absoluteUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const cleanText = (html) => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  );
};

const extractPrice = (text) => {
  const match = text.match(/€\s*([\d,]+)/i);

  if (!match) return 0;

  return Number(match[1].replace(/,/g, ""));
};

const extractCity = (text) => {
  const match = text.match(/City:\s*([A-Za-z\s-]+)/i);

  if (!match) return "";

  return normalizeText(match[1])
    .replace(/Zip.*$/i, "")
    .trim();
};

const extractTitle = (html, text) => {
  const h1 =
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ||
    text.split("€")[0];

  return normalizeProjectName(
    normalizeText(h1)
      .replace(/Available/i, "")
      .replace(/\s+(APARTMENT|VILLA|HOUSE|UNIT)\s*\d+[A-Z]?$/i, "")
      .replace(/\s+\d+[A-Z]?$/i, "")
      .replace(/\s+/g, " ")
  );
};

const extractImage = (html) => {
  const og =
    html.match(
      /property="og:image"\s+content="([^"]+)"/i
    )?.[1];

  if (og) return absoluteUrl(og);

  return fallbackImage;
};

export async function getGiovaniProjects() {
  const pages = [
    "https://giovani.cy/properties/",
    "https://giovani.cy/properties/page/2/",
    "https://giovani.cy/properties/page/3/"
  ];

  const allLinks = [];

  for (const page of pages) {
    try {
      const response = await fetch(page, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await response.text();

      const links = [
        ...html.matchAll(
          /href="([^"]*\/property\/[^"]+)"/gi
        )
      ].map((m) => absoluteUrl(m[1]));

      allLinks.push(...links);

    } catch (e) {}
  }

  const uniqueLinks = [...new Set(allLinks)];

  const units = [];

  for (let i = 0; i < uniqueLinks.length; i++) {
    const link = uniqueLinks[i];

    try {
      const response = await fetch(link, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await response.text();

      const text = cleanText(html);

      const location = extractCity(text);

      if (!location) continue;

      const title = extractTitle(html, text);

      if (!title || title.length < 3) continue;

      const price = extractPrice(text);

      if (price < 50000) continue;

      let type = "Property";

      const lower = text.toLowerCase();

      if (lower.includes("villa")) {
        type = "Villa";
      } else if (lower.includes("apartment")) {
        type = "Apartment";
      } else if (lower.includes("penthouse")) {
        type = "Penthouse";
      }

      const image = extractImage(html);

      units.push({
        unitRef: `GIO-${i + 1}`,
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
        source: link
      });

    } catch (e) {
      console.log("GIOVANI ERROR:", e.message);
    }
  }

  return units;
}
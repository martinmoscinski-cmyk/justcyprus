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

const extractCity = (html, text, url = "") => {
  const cityMatch = text.match(/City:\s*([A-Za-z\s-]+)\s+Zip:/i);

  if (cityMatch?.[1]) {
    const city = normalizeText(cityMatch[1]).trim();

    if (city.toLowerCase() !== "famagusta") {
      return city;
    }
  }

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("larnaca")) return "Larnaca";
  if (lowerUrl.includes("protaras")) return "Protaras";
  if (lowerUrl.includes("pernera")) return "Pernera";
  if (lowerUrl.includes("kapparis")) return "Kapparis";
  if (lowerUrl.includes("ayia-napa") || lowerUrl.includes("agia-napa")) return "Ayia Napa";
  if (lowerUrl.includes("cape-greco")) return "Cape Greco";
  if (lowerUrl.includes("deryneia")) return "Deryneia";
  if (lowerUrl.includes("sotira")) return "Sotira";
  if (lowerUrl.includes("paralimni")) return "Paralimni";

  return "";
};

const extractTitle = (html, text) => {
  const h1 =
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ||
    text.split("€")[0];

  return normalizeProjectName(
    normalizeText(h1)
      .replace(/Available/i, "")
      .replace(/\s+(APARTMENT|VILLA|HOUSE|UNIT|OFFICE|PENTHOUSE)\s*[A-Z]?\d+[A-Z]?$/i, "")
      .replace(/\s+[A-Z]\d{2,4}$/i, "")
      .replace(/\s+\d{2,4}$/i, "")
      .replace(/\s+/g, " ")
  );
};

const extractImage = (html) => {
  const og =
    html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];

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
        ...html.matchAll(/href="([^"]*\/property\/[^"]+)"/gi)
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

      const location = extractCity(html, text, link);

      if (!location) continue;

      const title = extractTitle(html, text);

      if (!title || title.length < 3) continue;

      const price = extractPrice(text);

      if (price < 50000) continue;

      let type = "Property";

      const lower = text.toLowerCase();

      if (lower.includes("apartment")) {
        type = "Apartment";
      } else if (lower.includes("villa")) {
        type = "Villa";
      } else if (lower.includes("penthouse")) {
        type = "Penthouse";
      } else if (lower.includes("office")) {
        type = "Office";
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
    } catch (e) {}
  }

  return units;
}
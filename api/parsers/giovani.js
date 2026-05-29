import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";
const MAX_PAGES = 2;

const absoluteUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
  );
};

const extractPrice = (text = "") => {
  const match = text.match(/€\s*([\d,]+)/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, "")) || 0;
};

const extractTitle = (html = "", text = "") => {
  const h1 =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    text.split("€")[0];

  return normalizeProjectName(
    normalizeText(h1)
      .replace(/Available/gi, "")
      .replace(/Giovani Homes/gi, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

const extractImage = (html = "") => {
  const og =
    html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1];

  if (og) return absoluteUrl(og);

  const img =
    html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

  return img ? absoluteUrl(img) : fallbackImage;
};

const extractLocation = (text = "", url = "") => {
  const lower = `${text} ${url}`.toLowerCase();

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
  if (lower.includes("office")) return "Office";
  if (lower.includes("apartment")) return "Apartment";

  return "Property";
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) return "";

  return response.text();
};

export async function getGiovaniProjects() {
  const pages = [];

  for (let i = 1; i <= MAX_PAGES; i++) {
    pages.push(
      i === 1
        ? "https://giovani.cy/properties/"
        : `https://giovani.cy/properties/page/${i}/`
    );
  }

  const links = [];

  for (const page of pages) {
    const html = await fetchHtml(page);

    const found = [
      ...html.matchAll(/href=["']([^"']*\/property\/[^"']+)["']/gi)
    ].map((m) => absoluteUrl(m[1]));

    links.push(...found);
  }

  const uniqueLinks = [...new Set(links)];

  const units = [];

  for (let i = 0; i < uniqueLinks.length; i++) {
    const link = uniqueLinks[i];

    try {
      const html = await fetchHtml(link);
      if (!html) continue;

      const text = cleanText(html);

      const price = extractPrice(text);
      if (!price || price < 50000) continue;

      const title = extractTitle(html, text);
      if (!title || title.length < 3) continue;

      const location = extractLocation(text, link);
      const type = extractType(text);
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
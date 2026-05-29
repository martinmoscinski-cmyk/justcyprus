import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";
const MAX_PAGES = 2;
const CONCURRENCY = 8;

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
  const match =
    text.match(/Price:\s*€\s*([\d,]+)/i) ||
    text.match(/€\s*([\d,]+)/i);

  if (!match) return 0;

  return Number(match[1].replace(/,/g, "")) || 0;
};

const extractCity = (text = "", url = "") => {
  const cityMatch =
    text.match(/City:\s*([A-Za-z\s-]+)\s+Zip:/i);

  if (cityMatch?.[1]) {
    const city = normalizeText(cityMatch[1]).trim();

    if (city && city.toLowerCase() !== "famagusta") {
      return city;
    }
  }

  const lower = url.toLowerCase();

  if (lower.includes("larnaca")) return "Larnaca";
  if (lower.includes("protaras")) return "Protaras";
  if (lower.includes("pernera")) return "Pernera";
  if (lower.includes("kapparis")) return "Kapparis";
  if (lower.includes("ayia-napa") || lower.includes("agia-napa")) return "Ayia Napa";
  if (lower.includes("cape-greco")) return "Cape Greco";
  if (lower.includes("deryneia")) return "Deryneia";
  if (lower.includes("sotira")) return "Sotira";
  if (lower.includes("paralimni")) return "Paralimni";

  return "Famagusta";
};

const extractTitle = (html = "", text = "") => {
  const h1 =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    text.split("Price:")[0] ||
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
    html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1];

  return img ? absoluteUrl(img) : fallbackImage;
};

const extractType = (text = "", title = "") => {
  const lower = `${title} ${text}`.toLowerCase();

  if (lower.includes("villa")) return "Villa";
  if (lower.includes("penthouse")) return "Penthouse";
  if (lower.includes("office")) return "Office";
  if (lower.includes("shop")) return "Shop";
  if (lower.includes("apartment")) return "Apartment";

  return "Property";
};

const fetchHtml = async (url = "") => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) return "";

  return response.text();
};

const runBatches = async (items, size, handler) => {
  const out = [];

  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const result = await Promise.all(batch.map(handler));
    out.push(...result);
  }

  return out;
};

export async function getGiovaniProjects() {
  const pages = [];

  for (let i = 1; i <= MAX_PAGES; i++) {
    pages.push(
      i === 1
        ? `${BASE_URL}/properties/`
        : `${BASE_URL}/properties/page/${i}/`
    );
  }

  const pageHtmls = await Promise.all(
    pages.map((page) => fetchHtml(page).catch(() => ""))
  );

  const allLinks = [];

  pageHtmls.forEach((html) => {
    const links = [
      ...html.matchAll(/href=["']([^"']*\/property\/[^"']+)["']/gi)
    ].map((m) => absoluteUrl(m[1]));

    allLinks.push(...links);
  });

  const uniqueLinks = [...new Set(allLinks)];

  const units = await runBatches(
    uniqueLinks,
    CONCURRENCY,
    async (link, index) => {
      try {
        const html = await fetchHtml(link);
        if (!html) return null;

        const text = cleanText(html);

        const price = extractPrice(text);
        if (!price || price < 50000) return null;

        const title = extractTitle(html, text);
        if (!title || title.length < 3) return null;

        const location = extractCity(text, link);
        const type = extractType(text, title);
        const image = extractImage(html);

        return {
          unitRef: `GIO-${index + 1}`,
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
        };
      } catch {
        return null;
      }
    }
  );

  return units.filter(Boolean);
}
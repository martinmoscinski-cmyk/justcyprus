import { put, list } from "@vercel/blob";

import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";
const MAX_PAGES = 20;
const CONCURRENCY = 6;

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

const slugify = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
};

const extractPrice = (text = "") => {
  const match = text.match(/€\s*([\d,]+)/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, "")) || 0;
};

const extractCity = (html, text, url = "") => {
  const cityMatch = text.match(/City:\s*([A-Za-z\s-]+)\s+Zip:/i);

  if (cityMatch?.[1]) {
    const city = normalizeText(cityMatch[1]).trim();
    return city || "Famagusta";
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

  return "Famagusta";
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
    html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] ||
    html.match(/content="([^"]+)"\s+property="og:image"/i)?.[1];

  if (og) return absoluteUrl(og);

  return fallbackImage;
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

const runInBatches = async (items, size, handler) => {
  const results = [];

  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const batchResults = await Promise.all(batch.map(handler));
    results.push(...batchResults);
  }

  return results;
};

const getBlobImage = async (imageUrl = "", projectKey = "") => {
  if (!imageUrl || imageUrl === fallbackImage) {
    return fallbackImage;
  }

  try {
    const safeKey = slugify(projectKey || imageUrl);
    const prefix = `giovani/${safeKey}`;

    const existing = await list({
      prefix,
      limit: 1
    });

    if (existing.blobs?.[0]?.url) {
      return existing.blobs[0].url;
    }

    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!imageResponse.ok) {
      return imageUrl;
    }

    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    const ext =
      contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : "jpg";

    const buffer = Buffer.from(
      await imageResponse.arrayBuffer()
    );

    const blob = await put(
      `${prefix}.${ext}`,
      buffer,
      {
        access: "public",
        contentType,
        addRandomSuffix: false
      }
    );

    return blob.url;

  } catch {
    return imageUrl || fallbackImage;
  }
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

  const pageHtmls = await Promise.all(
    pages.map((page) => fetchHtml(page).catch(() => ""))
  );

  const allLinks = [];

  pageHtmls.forEach((html) => {
    const links = [
      ...html.matchAll(/href="([^"]*\/property\/[^"]+)"/gi)
    ].map((m) => absoluteUrl(m[1]));

    allLinks.push(...links);
  });

  const uniqueLinks = [...new Set(allLinks)];

  const units = await runInBatches(
    uniqueLinks,
    CONCURRENCY,
    async (link, index) => {
      try {
        const html = await fetchHtml(link);
        if (!html) return null;

        const text = cleanText(html);

        const location = extractCity(html, text, link);
        const title = extractTitle(html, text);
        const price = extractPrice(text);

        if (!title || title.length < 3) return null;
        if (price < 50000) return null;

        let type = "Property";
        const lower = text.toLowerCase();

        if (lower.includes("apartment")) type = "Apartment";
        else if (lower.includes("villa")) type = "Villa";
        else if (lower.includes("penthouse")) type = "Penthouse";
        else if (lower.includes("office")) type = "Office";

        const originalImage = extractImage(html);

        const image = await getBlobImage(
          originalImage,
          `${title}-${location}`
        );

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
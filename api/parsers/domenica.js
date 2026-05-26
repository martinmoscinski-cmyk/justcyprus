import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://www.domenicagroup.com";
const SOURCE_URL = `${BASE_URL}/portfolio`;

const absoluteUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
  );
};

const getImages = (html = "") => {
  const patterns = [
    /https?:\/\/res2\.weblium\.site\/res\/[^\s"'<>),\\]+/gi,
    /https?:\/\/[^"'<>),\\]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>),\\]*)?/gi,
    /(?:src|data-src|data-lazy-src|href)=["']([^"']+)["']/gi,
    /background-image:\s*url\(["']?([^"')]+)["']?\)/gi
  ];

  const images = [];

  patterns.forEach((regex) => {
    [...html.matchAll(regex)].forEach((match) => {
      const raw = (match[1] || match[0])
        .replace(/&quot;/g, "")
        .replace(/&amp;/g, "&")
        .trim();

      const url = absoluteUrl(raw);
      const lower = url.toLowerCase();

      if (
        url.startsWith("http") &&
        (
          lower.includes("res2.weblium.site/res/") ||
          lower.includes(".jpg") ||
          lower.includes(".jpeg") ||
          lower.includes(".png") ||
          lower.includes(".webp")
        ) &&
        !lower.includes("logo") &&
        !lower.includes("icon") &&
        !lower.includes("svg") &&
        !lower.includes("favicon") &&
        !lower.includes("placeholder")
      ) {
        images.push(url);
      }
    });
  });

  return [...new Set(images)];
};

const parsePrice = (text = "") => {
  const match =
    text.match(/Price range:\s*€\s*([\d.,]+)\s*k/i) ||
    text.match(/Price range:\s*€\s*([\d.,]+)/i);

  if (!match) return 0;

  let value = Number(match[1].replace(/,/g, ""));

  if (/k/i.test(match[0])) {
    value *= 1000;
  }

  return value || 0;
};

const cleanProjectName = (name = "") => {
  return normalizeProjectName(name)
    .replace(/\bUnder Construction\b/gi, "")
    .replace(/\bCompleted\b/gi, "")
    .replace(/\bFor Sale\b/gi, "")
    .replace(/\bSold\b/gi, "")
    .replace(/\bShowroom\b/gi, "")
    .replace(/\bVillas\b/gi, "")
    .replace(/\bVilla\b/gi, "")
    .replace(/\bApartments\b/gi, "")
    .replace(/\bApartment\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const shouldSkip = (title = "", type = "") => {
  const text = `${title} ${type}`.toLowerCase();

  return (
    !title ||
    title.length > 45 ||
    text.includes("showroom") ||
    text.includes("sold") ||
    text.includes("villas apartments") ||
    text.includes("apartments villas")
  );
};

export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanText(html);
  const images = getImages(html);

  const matches = [
    ...text.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z\s]+,\s*Pafos|[A-Za-z\s]+,\s*Paphos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const title = cleanProjectName(match[1]);
    const location = normalizeText(match[2]).replace("Paphos", "Pafos");
    const type = normalizeText(match[4]);
    const price = parsePrice(match[0]);

    if (shouldSkip(title, type)) return;
    if (!price) return;

    const image = images[index] || fallbackImage;

    units.push({
      unitRef: `DOM-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image,
      images: [image],
      description: `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: SOURCE_URL
    });
  });

  return units;
}
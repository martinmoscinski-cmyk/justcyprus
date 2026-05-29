import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://giovani.cy";
const MAX_PAGES = 2;

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
  );
};

const extractLocation = (text = "") => {
  const lower = text.toLowerCase();

  if (lower.includes("larnaca")) return "Larnaca";
  if (lower.includes("protaras")) return "Protaras";
  if (lower.includes("pernera")) return "Pernera";
  if (lower.includes("kapparis")) return "Kapparis";
  if (lower.includes("ayia napa") || lower.includes("agia napa")) return "Ayia Napa";
  if (lower.includes("paralimni")) return "Paralimni";

  return "Famagusta";
};

const extractType = (title = "", text = "") => {
  const lower = `${title} ${text}`.toLowerCase();

  if (lower.includes("villa")) return "Villa";
  if (lower.includes("office")) return "Office";
  if (lower.includes("shop")) return "Shop";
  if (lower.includes("penthouse")) return "Penthouse";
  if (lower.includes("apartment")) return "Apartment";

  return "Property";
};

export async function getGiovaniProjects() {
  const units = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      page === 1
        ? `${BASE_URL}/properties/`
        : `${BASE_URL}/properties/page/${page}/`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();
    const text = cleanText(html);

    const matches = [
      ...text.matchAll(
        /€\s*([\d,]+)\s*\+VAT\s+([A-Z][A-Z0-9\s.'’-]{3,80}?)(?=\s+[A-Z][a-z]|\s+\d|\s+Agent:|\s+€|$)/g
      )
    ];

    matches.forEach((match, index) => {
      const price = Number(match[1].replace(/,/g, ""));
      if (!price || price < 50000) return;

      const title = normalizeProjectName(
        normalizeText(match[2])
          .replace(/\s+/g, " ")
          .trim()
      );

      if (!title || title.length < 3) return;

      const location = extractLocation(title);
      const type = extractType(title, text);

      units.push({
        unitRef: `GIO-${page}-${index + 1}`,
        projectName: title,
        unitTitle: title,
        location,
        type,
        price,
        image: fallbackImage,
        images: [fallbackImage],
        description: `${title} is a selected Giovani property in ${location}. Contact us for current availability, layouts and details.`,
        bedrooms: "",
        developer: "Giovani",
        source: url
      });
    });
  }

  return units;
}
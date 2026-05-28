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

const getProjectLinks = (html = "") => {
  const matches = [
    ...html.matchAll(/href=["']([^"']*\/portfolio\/[^"']+)["']/gi)
  ];

  return [
    ...new Set(
      matches
        .map((m) => absoluteUrl(m[1]))
        .filter((url) =>
          url.startsWith(`${BASE_URL}/portfolio/`) &&
          url !== SOURCE_URL &&
          !url.includes("#")
        )
    )
  ];
};

const makeSlug = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const findProjectLink = (title = "", links = []) => {
  const slug = makeSlug(title);
  const words = slug.split("-").filter((word) => word.length > 3);

  return (
    links.find((url) => url.toLowerCase().includes(slug)) ||
    links.find((url) =>
      words.some((word) => url.toLowerCase().includes(word))
    ) ||
    ""
  );
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

const fallbackByType = (type = "") => {
  const clean = type.toLowerCase();

  if (clean.includes("villa")) {
    return "/images/fallbacks/villa.jpg";
  }

  if (clean.includes("town")) {
    return "/images/fallbacks/townhouse.jpg";
  }

  return "/images/fallbacks/apartment.jpg";
};

const screenshotImageUrl = (projectUrl = "") => {
  if (!projectUrl) return "";
  return `/api/project-screenshot?url=${encodeURIComponent(projectUrl)}`;
};

export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanText(html);
  const projectLinks = getProjectLinks(html);

  const matches = [
    ...text.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z\s]+,\s*Pafos|[A-Za-z\s]+,\s*Paphos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const title = cleanProjectName(match[1]);

    const location = normalizeText(match[2])
      .replace("Paphos", "Pafos");

    const type = normalizeText(match[4]);
    const price = parsePrice(match[0]);

    if (shouldSkip(title, type)) return;
    if (!price) return;

    const projectUrl = findProjectLink(title, projectLinks);
    const image = screenshotImageUrl(projectUrl) || fallbackByType(type);

    units.push({
      unitRef: `DOM-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image,
      images: [image],
      description:
        `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: projectUrl || SOURCE_URL
    });
  });

  return units;
}
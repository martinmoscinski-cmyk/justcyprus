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
  const matches = [
    ...html.matchAll(/https?:\/\/res2\.weblium\.site\/[^\s"'<>),]+/gi),
    ...html.matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)
  ];

  return [
    ...new Set(
      matches
        .map((m) => absoluteUrl(m[1] || m[0]))
        .filter((url) => {
          const lower = url.toLowerCase();
          return (
            url.startsWith("http") &&
            !lower.includes("logo") &&
            !lower.includes("icon") &&
            !lower.includes("svg") &&
            !lower.includes("favicon")
          );
        })
    )
  ].slice(0, 8);
};

const getProjectLinks = (html = "") => {
  const matches = [
    ...html.matchAll(/href=["']([^"']*\/portfolio\/[^"']+)["']/gi)
  ];

  return [
    ...new Set(
      matches
        .map((m) => absoluteUrl(m[1]))
        .filter((url) => url !== SOURCE_URL)
    )
  ];
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

const parseProjectFromText = (text = "") => {
  const match = text.match(
    /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z\s]+,\s*Pafos|[A-Za-z\s]+,\s*Paphos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/i
  );

  if (!match) return null;

  return {
    title: cleanProjectName(match[1]),
    location: normalizeText(match[2]).replace("Paphos", "Pafos"),
    type: normalizeText(match[4]),
    price: parsePrice(match[0])
  };
};

export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const portfolioHtml = await response.text();
  const portfolioText = cleanText(portfolioHtml);
  const portfolioImages = getImages(portfolioHtml);
  const projectLinks = getProjectLinks(portfolioHtml);

  const portfolioMatches = [
    ...portfolioText.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z\s]+,\s*Pafos|[A-Za-z\s]+,\s*Paphos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  for (let i = 0; i < portfolioMatches.length; i++) {
    const match = portfolioMatches[i];

    const title = cleanProjectName(match[1]);
    const location = normalizeText(match[2]).replace("Paphos", "Pafos");
    const type = normalizeText(match[4]);
    const price = parsePrice(match[0]);

    if (shouldSkip(title, type)) continue;
    if (!price) continue;

    let images = [];

    const link =
      projectLinks.find((url) =>
        url.toLowerCase().includes(
          title.toLowerCase().replace(/\s+/g, "-")
        )
      ) || projectLinks[i];

    if (link) {
      try {
        const projectResponse = await fetch(link, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const projectHtml = await projectResponse.text();
        images = getImages(projectHtml);
      } catch (e) {}
    }

    const safeImages =
      images.length
        ? images
        : [portfolioImages[i] || fallbackImage];

    units.push({
      unitRef: `DOM-${i + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image: safeImages[0],
      images: safeImages,
      description: `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: link || SOURCE_URL
    });
  }

  return units;
}
import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const SOURCE_URL =
  "https://www.domenicagroup.com/portfolio";

const cleanHtmlText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  );
};

const cleanTitle = (title = "") => {
  return normalizeProjectName(title)
    .replace(/\bFor Sale\b/gi, "")
    .replace(/\bSold\b/gi, "")
    .replace(/\bShowroom\b/gi, "")
    .replace(/\bCompleted\b/gi, "")
    .replace(/\bUnder Construction\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const shouldSkipProject = (title = "", type = "") => {
  const text = `${title} ${type}`.toLowerCase();

  return (
    !title ||
    title.length > 45 ||
    text.includes("for sale showroom") ||
    text.includes("for sale apartments") ||
    text.includes("for sale villas") ||
    text.includes("for sale sold") ||
    text.includes("under construction completed") ||
    text.includes("sold")
  );
};

const parsePrice = (value = "", hasK = false) => {
  let price =
    Number(
      String(value)
        .replace(/,/g, "")
        .replace(/\s/g, "")
    ) || 0;

  if (hasK) {
    price = price * 1000;
  }

  if (price < 50000 || price > 10000000) {
    return 0;
  }

  return price;
};

const getImages = (html = "") => {
  const imageMatches = [
    ...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  ];

  return imageMatches
    .map((match) => match[1])
    .filter((src) =>
      src &&
      !src.toLowerCase().includes("logo") &&
      !src.toLowerCase().includes("icon") &&
      !src.toLowerCase().includes("svg") &&
      !src.toLowerCase().includes("favicon")
    )
    .map((src) => {
      if (src.startsWith("/")) {
        return `https://www.domenicagroup.com${src}`;
      }

      return src;
    });
};

export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanHtmlText(html);
  const images = getImages(html);

  const matches = [
    ...text.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z,\s]+Pafos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|For Sale|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const title = cleanTitle(match[1]);
    const location = normalizeText(match[2]);
    const type = normalizeText(match[4]);
    const hasK = /k/i.test(match[0]);

    if (shouldSkipProject(title, type)) {
      return;
    }

    const price = parsePrice(match[5], hasK);

    if (!price) {
      return;
    }

    const image =
      images[index] ||
      fallbackImage;

    units.push({
      unitRef: `DOM-PAF-PRO-${index + 1}`,
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
      source: SOURCE_URL
    });
  });

  return units;
}
import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const cleanGiovaniTitle = (text) => {
  return normalizeProjectName(text)
    .replace(/\s*\.\.\..*$/g, "")
    .replace(/\s+(Comprising|Are you|consists|located|with|is a|offering).*$/i, "")
    .replace(/\s+[A-Z]?\d{2,4}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

const detectLocationFromText = (text) => {
  const value = String(text || "").toLowerCase();

  if (value.includes("paralimni")) return "Paralimni";
  if (value.includes("protaras")) return "Protaras";
  if (value.includes("pernera")) return "Pernera";
  if (value.includes("kapparis")) return "Kapparis";
  if (value.includes("ayia-napa") || value.includes("ayia napa") || value.includes("agia-napa") || value.includes("agia napa")) return "Ayia Napa";
  if (value.includes("cape-greco") || value.includes("cape greco")) return "Cape Greco";
  if (value.includes("larnaca")) return "Larnaca";

  return "";
};

export async function getGiovaniProjects() {
  const response = await fetch("https://giovani.cy/properties/", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const text = normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  );

  const propertyLinks = [
    ...html.matchAll(/href=["']([^"']*estate_property[^"']*)["']/gi)
  ].map((match) => match[1]);

  const matches = [
    ...text.matchAll(
      /€\s*([\d,]+)\s*\+?\s*VAT?\s+([A-Z0-9][A-Za-z0-9\s.'’&-]{3,100})\s+([^€]{20,300}?)(?=(?:€\s*[\d,]+\s*\+?\s*VAT?)|Agent:|About|Contact|$)/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const price =
      Number(String(match[1]).replace(/,/g, "")) || 0;

    if (price < 50000 || price > 10000000) return;

    const rawTitle = normalizeText(match[2]);
    const rawText = normalizeText(match[3]);

    const title =
      cleanGiovaniTitle(rawTitle) || "Giovani Property";

    const link = propertyLinks[index] || "";
    const combined = `${title} ${rawTitle} ${rawText} ${link}`;

    const location =
      detectLocationFromText(link) ||
      detectLocationFromText(combined);

    if (!location) return;

    let type = "Property";

    const lowerCombined = combined.toLowerCase();

    if (lowerCombined.includes("apartment")) {
      type = "Apartment";
    }

    if (lowerCombined.includes("villa")) {
      type = "Villa";
    }

    if (
      lowerCombined.includes("townhouse") ||
      lowerCombined.includes("town house")
    ) {
      type = "Townhouse";
    }

    if (lowerCombined.includes("maisonette")) {
      type = "Maisonette";
    }

    units.push({
      unitRef: `GIO-${index + 1}`,
      projectName: title,
      unitTitle: rawTitle,
      location,
      type,
      price,
      image: fallbackImage,
      images: [fallbackImage],
      description: `${title} is a selected Giovani development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Giovani",
      source: link || "https://giovani.cy/properties/"
    });
  });

  return units;
}
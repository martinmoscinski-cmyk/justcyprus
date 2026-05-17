import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const cleanGiovaniTitle = (text) => {
  return normalizeProjectName(text)
    .replace(/\s*\.\.\..*$/g, "")
    .replace(/\s+(Comprising|Are you|consists|located|with|is a).*$/i, "")
    .replace(/\s+[A-Z]?\d{2,4}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
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

    const combined =
      `${rawTitle} ${rawText}`.toLowerCase();

    const title =
      cleanGiovaniTitle(rawTitle) || "Giovani Property";

    let type = "Property";

    if (combined.includes("apartment")) {
      type = "Apartment";
    }

    if (combined.includes("villa")) {
      type = "Villa";
    }

    if (
      combined.includes("townhouse") ||
      combined.includes("town house")
    ) {
      type = "Townhouse";
    }

    if (combined.includes("maisonette")) {
      type = "Maisonette";
    }

    let location = "";

    if (combined.includes("paralimni")) {
      location = "Paralimni";
    } else if (combined.includes("protaras")) {
      location = "Protaras";
    } else if (combined.includes("pernera")) {
      location = "Pernera";
    } else if (combined.includes("kapparis")) {
      location = "Kapparis";
    } else if (
      combined.includes("ayia napa") ||
      combined.includes("agia napa")
    ) {
      location = "Ayia Napa";
    } else if (combined.includes("cape greco")) {
      location = "Cape Greco";
    } else if (combined.includes("larnaca")) {
      location = "Larnaca";
    } else {
      return;
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
      source: "https://giovani.cy/properties/"
    });
  });

  return units;
}
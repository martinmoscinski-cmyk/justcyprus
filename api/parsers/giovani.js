import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

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
      /€\s*([\d,]+)\s*\+?\s*VAT?\s+([A-Z0-9][A-Za-z0-9\s.'’&-]{3,80})\s+([^€]{20,350}?)(?=(?:€\s*[\d,]+\s*\+?\s*VAT?)|Agent:|About|Contact|$)/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const price =
      Number(String(match[1]).replace(/,/g, "")) || 0;

    if (price < 50000 || price > 10000000) return;

    const rawTitle = normalizeText(match[2]);
    const title = normalizeProjectName(rawTitle);

    const description = normalizeText(match[3]);

    const combined =
      `${title} ${description}`.toLowerCase();

    let type = "Property";

    if (
      combined.includes("apartment") ||
      combined.includes("apartments")
    ) {
      type = "Apartment";
    }

    if (
      combined.includes("villa") ||
      combined.includes("villas")
    ) {
      type = "Villa";
    }

    if (
      combined.includes("townhouse") ||
      combined.includes("town house")
    ) {
      type = "Townhouse";
    }

    if (
      combined.includes("maisonette")
    ) {
      type = "Maisonette";
    }

    let location = "Paralimni";

    if (combined.includes("protaras")) {
      location = "Protaras";
    }

    if (combined.includes("pernera")) {
      location = "Pernera";
    }

    if (combined.includes("kapparis")) {
      location = "Kapparis";
    }

    if (
      combined.includes("ayia napa") ||
      combined.includes("agia napa")
    ) {
      location = "Ayia Napa";
    }

    if (combined.includes("cape greco")) {
      location = "Cape Greco";
    }

    if (combined.includes("larnaca")) {
      location = "Larnaca";
    }

    if (combined.includes("famagusta")) {
      location = "Famagusta";
    }

    units.push({
      unitRef: `GIO-PAR-PRO-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image: fallbackImage,
      images: [fallbackImage],
      description:
        description ||
        `${title} is a selected Giovani development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Giovani",
      source: "https://giovani.cy/properties/"
    });
  });

  return units;
}
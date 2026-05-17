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
      /€\s*([\d,]+)\s*\+VAT\s+([A-Z0-9][A-Z0-9\s.-]{3,60})\s+([^€]{20,260}?)(?=(?:€\s*[\d,]+\s*\+VAT)|Agent:|About)/gi
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

    let type = "Property";

    if (title.toLowerCase().includes("apartment")) {
      type = "Apartment";
    }

    if (title.toLowerCase().includes("villa")) {
      type = "Villa";
    }

    let location = "Cyprus";

    const locationHints = [
      "Paralimni",
      "Protaras",
      "Pernera",
      "Kapparis",
      "Ayia Napa",
      "Cape Greco",
      "Larnaca",
      "Famagusta"
    ];

    for (const hint of locationHints) {
      if (
        description.toLowerCase().includes(hint.toLowerCase()) ||
        title.toLowerCase().includes(hint.toLowerCase())
      ) {
        location = hint;
        break;
      }
    }

    units.push({
      unitRef: `GIO-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image: fallbackImage,
      images: [fallbackImage],
      description,
      bedrooms: "",
      developer: "Giovani",
      source: "https://giovani.cy/properties/"
    });
  });

  return units;
}
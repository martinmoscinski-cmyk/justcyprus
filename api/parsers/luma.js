import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/13nEauDXxv3zDbs_2wkTsTOY-8v6GNmTgHHweS_3LluI/gviz/tq?tqx=out:csv&sheet=MASTER";

const projectAssets = {
  Genesis: {
    image: "https://luma.cy/wp-content/uploads/2026/01/project_hero_genesis.webp",
    source: "https://luma.cy/projects/luma-genesis-paphos/"
  },
  "Emerald Park": {
    image: "https://luma.cy/wp-content/uploads/2026/01/project_hero_Emerald.webp",
    source: "https://luma.cy/projects/emerald-park/"
  },
  Skala: {
    image: "https://luma.cy/wp-content/uploads/2026/01/project_hero_Skala.webp",
    source: "https://luma.cy/projects/skala/"
  },
  "Luma Resale": {
    image: fallbackImage,
    source: "https://luma.cy/our-projects/"
  }
};

const parseCSVLine = (line = "") => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parsePrice = (value = "") => {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
};

const normalizeLumaLocation = (location = "") => {
  const clean = normalizeText(location).toLowerCase();

  if (clean.includes("universal")) {
    return "Universal, Paphos";
  }

  if (clean.includes("geroskipou")) {
    return "Geroskipou, Paphos";
  }

  return normalizeText(location) || "Paphos";
};

export async function getLumaProjects() {
  const response = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const raw = await response.text();

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const units = [];

  lines.forEach((line, index) => {
    if (
      !line.includes("€") ||
      line.includes("Project Catalogue")
    ) {
      return;
    }

    const cols = parseCSVLine(line);

    const projectName = normalizeProjectName(cols[0] || "");

if (
  projectName.toLowerCase().includes("resale")
) {
  return;
}

if (!projectName) return;

    const location = normalizeLumaLocation(cols[1] || "Paphos");
    const bedrooms = normalizeText(cols[2] || "");
    const type = normalizeText(cols[3] || "Apartment");
    const totalUnits = Number(cols[4] || 0);
    const price = parsePrice(cols[5] || "");

    if (!price) return;

    const assets = projectAssets[projectName] || {};
    const image = assets.image || fallbackImage;

    units.push({
      unitRef: `LUM-${index + 1}`,
      projectName,
      unitTitle: projectName,
      location,
      type,
      price,
      image,
      images: [image],
      description: `${projectName} is a selected Luma development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms,
      totalUnits,
      unitsAvailable: null,
      availabilityText: "Availability on request",
      deliveryDate: normalizeText(cols[6] || ""),
      developer: "Luma",
      source: assets.source || CSV_URL
    });
  });

  return units;
}
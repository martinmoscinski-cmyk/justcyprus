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
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
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
  return (
    Number(
      String(value)
        .replace(/€|EUR|VAT|\+|,/gi, "")
        .replace(/[^\d]/g, "")
    ) || 0
  );
};

const normalizeLocation = (location = "") => {
  const clean = normalizeText(location);

  if (clean.toLowerCase().includes("gero")) {
    return "Geroskipou, Paphos";
  }

  return clean || "Paphos";
};

export async function getLumaProjects() {
  const response = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const csv = await response.text();

  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  const rows = lines.map(parseCSVLine);

  const headers = rows[1];

  const dataRows = rows.slice(2);

  const units = [];

  dataRows.forEach((row, index) => {
    const item = {};

    headers.forEach((header, i) => {
      item[normalizeText(header)] =
        normalizeText(row[i] || "");
    });

    const projectName = normalizeProjectName(
      item["Project Name"]
    );

    if (!projectName) return;

    const price = parsePrice(
      item["Starting Price"]
    );

    if (!price) return;

    const assets = projectAssets[projectName] || {};

    const location = normalizeLocation(
      item["Location"]
    );

    const image = assets.image || fallbackImage;

    units.push({
      unitRef: `LUM-${index + 1}`,
      projectName,
      unitTitle: projectName,
      location,
      type: item["Property Type"] || "Apartment",
      price,
      image,
      images: [image],
      description: `${projectName} is a selected Luma development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: item["Bedrooms"] || "",
      unitsAvailable: Number(item["Units"] || 0),
      deliveryDate: item["Delivery Date"] || "",
      developer: "Luma",
      source: assets.source || CSV_URL
    });
  });

  return units;
}
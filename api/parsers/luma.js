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

const parseCSV = (csv = "") => {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  const rows = lines.map(parseCSVLine);

  const headerIndex = rows.findIndex((row) =>
    row.join(" ").toLowerCase().includes("project name")
  );

  if (headerIndex === -1) {
    return [];
  }

  const headers = rows[headerIndex].map((h) =>
    normalizeText(h)
  );

  return rows.slice(headerIndex + 1).map((row) => {
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = normalizeText(row[index] || "");
    });

    return obj;
  });
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
  const rows = parseCSV(csv);

  const units = [];

  rows.forEach((row, index) => {
    const projectName = normalizeProjectName(
      row["Project Name"] || ""
    );

    if (!projectName) return;

    const price = parsePrice(
      row["Starting Price"] || ""
    );

    if (!price) return;

    const assets = projectAssets[projectName] || {};

    const location = normalizeLocation(
      row["Location"] || ""
    );

    const image =
      assets.image || fallbackImage;

    units.push({
      unitRef: `LUM-${index + 1}`,
      projectName,
      unitTitle: projectName,
      location,
      type: normalizeText(row["Property Type"] || "Apartment"),
      price,
      image,
      images: [image],
      description:
        `${projectName} is a selected Luma development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: normalizeText(row["Bedrooms"] || ""),
      unitsAvailable: Number(row["Units"] || 0),
      deliveryDate: normalizeText(row["Delivery Date"] || ""),
      developer: "Luma",
      source: assets.source || CSV_URL
    });
  });

  return units;
}
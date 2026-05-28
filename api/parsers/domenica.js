import fs from "fs";
import path from "path";

import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const SOURCE_URL =
  "https://www.domenicagroup.com/portfolio";

const LOCAL_IMAGES_PATH =
  path.join(process.cwd(), "images", "DOMENICA");

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
  );
};

const projectSlug = (text = "") => {
  return normalizeProjectName(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

const isImage = (file = "") => {
  return /\.(jpg|jpeg|png|webp)$/i.test(file);
};

const scoreImage = (imagePath = "") => {
  const clean = imagePath.toLowerCase();

  let score = 0;

  if (clean.includes("exterior")) score += 100;
  if (clean.includes("renders")) score += 60;
  if (clean.includes("day")) score += 40;
  if (clean.includes("afternoon")) score += 30;

  if (clean.includes("cover")) score += 200;
  if (clean.includes("main")) score += 150;
  if (clean.includes("front")) score += 80;
  if (clean.includes("hero")) score += 80;

  if (clean.includes("interior")) score -= 50;
  if (clean.includes("floor")) score -= 100;
  if (clean.includes("plan")) score -= 100;

  return score;
};

const getProjectImages = (title = "") => {
  try {
    if (!fs.existsSync(LOCAL_IMAGES_PATH)) return [];

    const wantedSlug = projectSlug(title);

    const folders = fs.readdirSync(LOCAL_IMAGES_PATH);

    const matchedFolder = folders.find((folder) => {
      return projectSlug(folder) === wantedSlug;
    });

    if (!matchedFolder) return [];

    const projectPath =
      path.join(LOCAL_IMAGES_PATH, matchedFolder);

    const images = [];

    const scan = (folderPath) => {
      const items = fs.readdirSync(folderPath);

      items.forEach((item) => {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
          return;
        }

        if (!isImage(item)) return;

        const publicPath =
          fullPath
            .replace(process.cwd(), "")
            .replaceAll("\\", "/");

        images.push(publicPath);
      });
    };

    scan(projectPath);

    return images.sort((a, b) => {
      return scoreImage(b) - scoreImage(a);
    });

  } catch {
    return [];
  }
};

export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanText(html);

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

    const images = getProjectImages(title);

    if (!images.length) {
      return;
    }

    const image = images[0];

    units.push({
      unitRef: `DOM-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image,
      images,
      description:
        `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: SOURCE_URL
    });
  });

  return units;
}
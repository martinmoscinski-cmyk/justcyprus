import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const DOMENICA_URL =
  "https://www.domenicagroup.com/portfolio";

function slugify(text = "") {

  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

}

function imageScore(file) {

  const clean =
    file.toLowerCase();

  let score = 0;

  if (clean.includes("external")) score += 500;
  if (clean.includes("exterior")) score += 500;

  if (clean.includes("renders")) score += 200;

  if (clean.includes("day")) score += 100;
  if (clean.includes("afternoon")) score += 80;

  if (clean.includes("cover")) score += 1000;
  if (clean.includes("hero")) score += 900;
  if (clean.includes("main")) score += 800;
  if (clean.includes("front")) score += 700;

  if (clean.includes("internal")) score -= 200;
  if (clean.includes("interior")) score -= 200;

  if (clean.includes("plan")) score -= 500;
  if (clean.includes("floor")) score -= 500;

  return score;

}

function getProjectImages(projectSlug) {

  const basePath = path.join(
    process.cwd(),
    "images",
    "DOMENICA"
  );

  if (!fs.existsSync(basePath)) {
    return null;
  }

  const folders =
    fs.readdirSync(basePath);

  const matchedFolder =
    folders.find((folder) => {

      return (
        slugify(folder) ===
        projectSlug
      );

    });

  if (!matchedFolder) {
    return null;
  }

  const projectPath = path.join(
    basePath,
    matchedFolder
  );

  const imageFiles = [];

  function scan(dir) {

    const items =
      fs.readdirSync(dir);

    items.forEach((item) => {

      const fullPath =
        path.join(dir, item);

      const stat =
        fs.statSync(fullPath);

      if (stat.isDirectory()) {

        scan(fullPath);

      } else {

        const lower =
          item.toLowerCase();

        if (
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp")
        ) {

          const relativePath =
            fullPath
              .replace(process.cwd(), "")
              .replaceAll("\\", "/");

          imageFiles.push(
            relativePath
          );

        }

      }

    });

  }

  scan(projectPath);

  if (!imageFiles.length) {
    return null;
  }

  imageFiles.sort(
    (a, b) =>
      imageScore(b) -
      imageScore(a)
  );

  return {
    cover:
      imageFiles[0],

    images:
      imageFiles
  };

}

export async function getDomenicaProjects() {

  const response =
    await fetch(DOMENICA_URL);

  const html =
    await response.text();

  const $ =
    cheerio.load(html);

  const projects = [];

  $(".portfolio-item").each(
    (index, el) => {

      const title =
        $(el)
          .find("h3")
          .first()
          .text()
          .trim();

      if (!title) return;

      const slug =
        slugify(title);

      const gallery =
        getProjectImages(slug);

      if (!gallery) {
        return;
      }

      const text =
        $(el).text();

      const priceMatch =
        text.match(
          /€\s?([\d,.]+k?)/i
        );

      if (!priceMatch) {
        return;
      }

      const location =
        $(el)
          .find(".location")
          .text()
          .trim() ||
        "Pafos";

      const cleanPrice =
        priceMatch[1]
          .replace(/,/g, "")
          .replace("k", "000");

      projects.push({

        unitRef:
          `DOM-${index + 1}`,

        projectName:
          title,

        unitTitle:
          title,

        location,

        type:
          "Apartment",

        price:
          Number(cleanPrice),

        image:
          gallery.cover,

        images:
          gallery.images,

        description:
          `${title} development in ${location}. Contact us for current availability and layouts.`,

        developer:
          "Domenica"

      });

    }
  );

  return projects;

}
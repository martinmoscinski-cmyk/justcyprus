import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://luma.cy";

const absoluteUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

const cleanHtml = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
  );
};

const getImageNearTitle = (html, title) => {
  const titleIndex = html.toLowerCase().indexOf(title.toLowerCase());

  if (titleIndex === -1) {
    return fallbackImage;
  }

  const before = html.slice(Math.max(0, titleIndex - 3000), titleIndex + 3000);

  const image =
    before.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
    before.match(/data-src=["']([^"']+)["']/i)?.[1] ||
    "";

  return image ? absoluteUrl(image) : fallbackImage;
};

export async function getLumaProjects() {
  const response = await fetch("https://luma.cy/our-projects/", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanHtml(html);

  const knownProjects = [
    {
      title: "Emerald Park",
      location: "Geroskipou, Paphos"
    },
    {
      title: "Luma Genesis",
      location: "Geroskipou, Paphos"
    },
    {
      title: "Skala",
      location: "Geroskipou Hills, Paphos"
    }
  ];

  const units = [];

  knownProjects.forEach((project, index) => {
    const titleIndex = text
      .toLowerCase()
      .indexOf(project.title.toLowerCase());

    if (titleIndex === -1) return;

    const nearbyText = text.slice(titleIndex, titleIndex + 700);

    const priceMatch = nearbyText.match(/€\s*([\d,]+)/i);

    const price = priceMatch
      ? Number(priceMatch[1].replace(/,/g, ""))
      : 0;

    if (!price) return;

    const image = getImageNearTitle(html, project.title);

    units.push({
      unitRef: `LUM-${index + 1}`,
      projectName: normalizeProjectName(project.title),
      unitTitle: normalizeText(project.title),
      location: project.location,
      type: "Apartment",
      price,
      image,
      images: [image],
      description: `${project.title} is a selected Luma development in ${project.location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Luma",
      source: "https://luma.cy/our-projects/"
    });
  });

  return units;
}
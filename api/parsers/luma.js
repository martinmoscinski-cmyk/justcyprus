import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const BASE_URL = "https://luma.cy";

const absoluteUrl = (url = "") => {
  if (!url) return "";

  if (url.startsWith("http")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${BASE_URL}${url}`;
  }

  return `${BASE_URL}/${url}`;
};

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
  );
};

const extractPrice = (text = "") => {
  const match =
    text.match(/from\s+([\d,]+)\s*EUR/i) ||
    text.match(/€\s*([\d,]+)/i);

  if (!match) return 0;

  return Number(match[1].replace(/,/g, ""));
};

const extractImage = (html = "") => {
  const og =
    html.match(
      /property=["']og:image["']\s+content=["']([^"']+)["']/i
    )?.[1] ||
    html.match(
      /content=["']([^"']+)["']\s+property=["']og:image["']/i
    )?.[1];

  if (og) {
    return absoluteUrl(og);
  }

  return fallbackImage;
};

export async function getLumaProjects() {
  const projectPages = [
    {
      title: "Emerald Park",
      location: "Geroskipou, Paphos",
      url: "https://luma.cy/projects/emerald-park/"
    },
    {
      title: "Luma Genesis",
      location: "Geroskipou, Paphos",
      url: "https://luma.cy/projects/luma-genesis-paphos/"
    },
    {
      title: "Skala",
      location: "Geroskipou Hills, Paphos",
      url: "https://luma.cy/projects/skala/"
    }
  ];

  const units = [];

  for (let i = 0; i < projectPages.length; i++) {
    const project = projectPages[i];

    try {
      const response = await fetch(project.url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await response.text();
      const text = cleanText(html);

      const price = extractPrice(text);

      if (!price) continue;

      const image = extractImage(html);

      units.push({
        unitRef: `LUM-${i + 1}`,
        projectName: normalizeProjectName(project.title),
        unitTitle: normalizeText(project.title),
        location: project.location,
        type: "Apartment",
        price,
        image,
        images: [image],
        description:
          `${project.title} is a selected Luma development in ${project.location}. Contact us for current availability, layouts and details.`,
        bedrooms: "",
        developer: "Luma",
        source: project.url
      });

    } catch (e) {}
  }

  return units;
}
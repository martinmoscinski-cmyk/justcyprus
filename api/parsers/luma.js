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

export async function getLumaProjects() {
  const response = await fetch(
    "https://luma.cy/our-projects/",
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  const html = await response.text();

  const cards = [
    ...html.matchAll(
      /<article[\s\S]*?<\/article>/gi
    )
  ];

  const units = [];

  cards.forEach((card, index) => {
    const block = card[0];

    const title =
      normalizeProjectName(
        normalizeText(
          block.match(/<h3[^>]*>(.*?)<\/h3>/i)?.[1] || ""
        )
      );

    if (!title) return;

    const location =
      normalizeText(
        block.match(
          /<span[^>]*class=".*?location.*?"[^>]*>(.*?)<\/span>/i
        )?.[1] || "Paphos"
      );

    const priceText =
      normalizeText(
        block.match(/€\s*([\d,]+)/i)?.[1] || ""
      );

    const price =
      Number(priceText.replace(/,/g, "")) || 0;

    const image =
      absoluteUrl(
        block.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
        fallbackImage
      );

    const projectLink =
      absoluteUrl(
        block.match(/href="([^"]+)"/i)?.[1] || ""
      );

    units.push({
      unitRef: `LUM-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type: "Apartment",
      price,
      image,
      images: [image],
      description:
        `${title} is a selected Luma development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Luma",
      source: projectLink
    });
  });

  return units;
}
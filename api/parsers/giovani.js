import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

const absoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://giovani.cy${url}`;
  return `https://giovani.cy/${url}`;
};

const cleanTitle = (text) => {
  return normalizeProjectName(text)
    .replace(/\s*\.\.\..*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getCity = (text) => {
  const match = text.match(/City:\s*([A-Za-z\s-]+)\s+Zip:/i);
  return match ? normalizeText(match[1]) : "";
};

export async function getGiovaniProjects() {
  const response = await fetch("https://giovani.cy/properties/", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const links = [
    ...html.matchAll(/href=["']([^"']*\/property\/[^"']+)["']/gi)
  ]
    .map((match) => absoluteUrl(match[1]))
    .filter((url) => url.includes("giovani.cy/property/"));

  const uniqueLinks = [...new Set(links)].slice(0, 40);

  const units = [];

  for (let index = 0; index < uniqueLinks.length; index++) {
    const link = uniqueLinks[index];

    try {
      const detailResponse = await fetch(link, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const detailHtml = await detailResponse.text();

      const detailText = normalizeText(
        detailHtml
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]*>/g, " ")
      );

      const titleMatch = detailText.match(/#\s*([A-Z0-9][A-Za-z0-9\s.'’&-]{3,100})\s+Available/i);
      const priceMatch = detailText.match(/Price:\s*€\s*([\d,]+)/i);

      const title = cleanTitle(titleMatch?.[1] || "Giovani Property");

      const price =
        Number(String(priceMatch?.[1] || "").replace(/,/g, "")) || 0;

      if (price < 50000 || price > 10000000) {
        continue;
      }

      const location = getCity(detailText);

      if (!location) {
        continue;
      }

      const lower = `${title} ${detailText}`.toLowerCase();

      let type = "Property";

      if (lower.includes("apartment")) type = "Apartment";
      if (lower.includes("villa")) type = "Villa";
      if (lower.includes("townhouse") || lower.includes("town house")) type = "Townhouse";
      if (lower.includes("maisonette")) type = "Maisonette";

      let image = fallbackImage;

      const imageMatch = detailHtml.match(/<img[^>]+src=["']([^"']+)["']/i);

      if (
        imageMatch?.[1] &&
        !imageMatch[1].toLowerCase().includes("logo") &&
        !imageMatch[1].toLowerCase().includes("svg")
      ) {
        image = absoluteUrl(imageMatch[1]);
      }

      units.push({
        unitRef: `GIO-${index + 1}`,
        projectName: title,
        unitTitle: title,
        location,
        type,
        price,
        image,
        images: [image],
        description: `${title} is a selected Giovani development in ${location}. Contact us for current availability, layouts and details.`,
        bedrooms: "",
        developer: "Giovani",
        source: link
      });

    } catch (error) {
      continue;
    }
  }

  return units;
}
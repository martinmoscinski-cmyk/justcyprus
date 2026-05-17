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

const getCityFromDetail = (text) => {
  const cityMatch = text.match(/City:\s*([A-Za-z\s-]+)\s+(?:Zip:|Country:|Address:)/i);
  return cityMatch ? normalizeText(cityMatch[1]) : "";
};

export async function getGiovaniProjects() {
  const response = await fetch("https://giovani.cy/properties/", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const linkMatches = [
    ...html.matchAll(/href=["']([^"']*\/property\/[^"']*)["']/gi)
  ];

  const links = [...new Set(
    linkMatches
      .map((match) => absoluteUrl(match[1]))
      .filter(Boolean)
  )].slice(0, 30);

  const units = [];

  for (let index = 0; index < links.length; index++) {
    const link = links[index];

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
      const typeMatch = detailText.match(/Home\s+2\.\s*([A-Za-z]+)/i);
      const sizeMatch = detailText.match(/Property Size:\s*([\d.,]+)\s*m/i);

      const title =
        cleanTitle(titleMatch?.[1] || "Giovani Property");

      const price =
        Number(String(priceMatch?.[1] || "").replace(/,/g, "")) || 0;

      if (price < 50000 || price > 10000000) continue;

      const location = getCityFromDetail(detailText);

      if (!location) continue;

      let type = typeMatch?.[1] || "Property";

      const lower = `${title} ${detailText}`.toLowerCase();

      if (lower.includes("apartment")) type = "Apartment";
      if (lower.includes("villa")) type = "Villa";
      if (lower.includes("townhouse") || lower.includes("town house")) type = "Townhouse";
      if (lower.includes("maisonette")) type = "Maisonette";

      let image = fallbackImage;

      const imageMatch = detailHtml.match(/<img[^>]+src=["']([^"']+)["']/i);

      if (imageMatch?.[1]) {
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
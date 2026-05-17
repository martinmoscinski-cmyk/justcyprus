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

const detectLocation = (text) => {
  const value = String(text || "").toLowerCase();

  if (value.includes("paralimni")) return "Paralimni";
  if (value.includes("protaras")) return "Protaras";
  if (value.includes("pernera")) return "Pernera";
  if (value.includes("kapparis")) return "Kapparis";
  if (value.includes("ayia napa") || value.includes("agia napa")) return "Ayia Napa";
  if (value.includes("cape greco")) return "Cape Greco";
  if (value.includes("larnaca")) return "Larnaca";

  return "";
};

export async function getGiovaniProjects() {
  const response = await fetch("https://giovani.cy/properties/", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();

  const cardMatches = [
    ...html.matchAll(
      /€\s*([\d,]+)\s*\+?\s*VAT[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>\s*([^<]*?)\s*<\/a>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>\s*details\s*<\/a>/gi
    )
  ];

  const units = [];

  for (let index = 0; index < cardMatches.length; index++) {
    const match = cardMatches[index];

    const price =
      Number(String(match[1]).replace(/,/g, "")) || 0;

    if (price < 50000 || price > 10000000) continue;

    const detailUrl = absoluteUrl(match[4] || match[2]);
    const rawTitle = normalizeText(match[3]);
    const title = cleanTitle(rawTitle) || "Giovani Property";

    try {
      const detailResponse = await fetch(detailUrl, {
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

      let location = "";

      const cityMatch = detailText.match(/City:\s*([A-Za-z\s-]+)\s+(?:Zip:|Country:|Address:|Property)/i);

      if (cityMatch?.[1]) {
        location = normalizeText(cityMatch[1]);
      }

      if (!location) {
        location = detectLocation(detailText) || detectLocation(detailUrl);
      }

      if (!location) continue;

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
        source: detailUrl
      });

    } catch (error) {
      continue;
    }
  }

  return units;
}
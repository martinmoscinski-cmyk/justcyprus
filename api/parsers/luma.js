import {
  normalizeText,
  fallbackImage
} from "./helpers.js";

const cleanText = (html = "") => {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
  );
};

export async function getLumaProjects() {
  const url = "https://luma.cy/projects/emerald-park/";

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await response.text();
  const text = cleanText(html);

  return [
    {
      unitRef: "LUM-DEBUG",
      projectName: text.slice(0, 3000),
      unitTitle: "Luma Debug",
      location: "Debug",
      type: "Apartment",
      price: 1,
      image: fallbackImage,
      images: [fallbackImage],
      description: "Debug output from Luma page.",
      bedrooms: "",
      developer: "Luma",
      source: url
    }
  ];
}
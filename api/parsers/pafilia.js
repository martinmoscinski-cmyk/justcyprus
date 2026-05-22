import {
  normalizeText,
  normalizeProjectName,
  parsePrice,
  getTagFromItem,
  fallbackImage
} from "./helpers.js";

const cleanImageUrl = (image = "") => {
  let cleaned = String(image || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .trim();

  const urlMatch =
    cleaned.match(/https?:\/\/[^\s"'<>]+/i) ||
    cleaned.match(/\/\/[^\s"'<>]+/i);

  if (urlMatch?.[0]) {
    cleaned = urlMatch[0];
  }

  cleaned = cleaned
    .split('"')[0]
    .split("'")[0]
    .replace(/<[^>]*>/g, "")
    .replace(/\s+alt=.*$/i, "")
    .replace(/\s+loading=.*$/i, "")
    .trim();

  if (cleaned.startsWith("//")) {
    cleaned = `https:${cleaned}`;
  }

  return cleaned;
};

export async function getPafiliaProjects() {
  const response = await fetch(
    "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml",
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  const xml = await response.text();

  const items =
    xml.match(/<property>([\s\S]*?)<\/property>/gi) || [];

  const units = [];

  items.forEach((item, index) => {
    const getTag = (tag) => getTagFromItem(item, tag);

    const location =
      getTag("town") ||
      getTag("city") ||
      getTag("area") ||
      "Cyprus";

    const type =
      getTag("property_type") ||
      getTag("type") ||
      "Property";

    const rawTitle =
      getTag("title") ||
      `${location} ${type}`;

    const rawProject =
      getTag("project") ||
      getTag("Project") ||
      getTag("project_name") ||
      getTag("development") ||
      getTag("Development") ||
      getTag("complex") ||
      getTag("Complex") ||
      rawTitle;

    const projectName =
      normalizeProjectName(rawProject);

    const description =
      getTag("description") ||
      `${type} in ${location}`;

    let image =
      getTag("image") ||
      getTag("IMAGE_URL") ||
      getTag("image_url") ||
      "";

    image = cleanImageUrl(image);

    if (!image) {
      image = fallbackImage;
    }

    const price = parsePrice(
      getTag("Price") || getTag("price")
    );

    units.push({
      unitRef: `PAF-${index + 1}`,
      projectName,
      unitTitle: rawTitle,
      location,
      type,
      price,
      image,
      images: [image],
      description,
      bedrooms:
        getTag("beds") ||
        getTag("Bedrooms") ||
        getTag("bedrooms") ||
        "",
      developer: "Pafilia",
      source:
        "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml"
    });
  });

  return units;
}
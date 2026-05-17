import {
  normalizeProjectName,
  parsePrice,
  getTagFromItem,
  fallbackImage
} from "./helpers.js";

export async function getAristoProjects() {
  const response = await fetch(
    "https://www.aristodevelopers.com/downloads/AristoDevelopersUnits.xml",
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  const xml = await response.text();

  const items =
    xml.match(/<property>([\s\S]*?)<\/property>/gi) ||
    xml.match(/<Unit>([\s\S]*?)<\/Unit>/gi) ||
    [];

  const units = [];

  items.forEach((item, index) => {
    const getTag = (tag) =>
      getTagFromItem(item, tag);

    const location =
      getTag("town") ||
      getTag("city") ||
      getTag("area") ||
      getTag("Area") ||
      getTag("region") ||
      "Cyprus";

    const type =
      getTag("property_type") ||
      getTag("type") ||
      getTag("Type") ||
      "Property";

    const rawTitle =
      getTag("title") ||
      getTag("Title") ||
      `${location} ${type}`;

    const rawProject =
      getTag("project") ||
      getTag("Project") ||
      getTag("project_name") ||
      getTag("development") ||
      getTag("name") ||
      rawTitle;

    const projectName =
      normalizeProjectName(rawProject);

    const description =
      getTag("description") ||
      getTag("Description") ||
      `${type} in ${location}`;

    const price = parsePrice(
      getTag("Price") || getTag("price")
    );

    let image =
      getTag("image") ||
      getTag("IMAGE_URL") ||
      getTag("image_url") ||
      getTag("picture") ||
      "";

    image = image
      .replace(/"/g, "")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (image.startsWith("//")) {
      image = `https:${image}`;
    }

    if (!image) {
      const imageMatch = item.match(
        /<image[^>]*>([\s\S]*?)<\/image>/i
      );

      if (imageMatch && imageMatch[1]) {
        image = imageMatch[1].trim();

        if (image.startsWith("//")) {
          image = `https:${image}`;
        }
      }
    }

    if (!image) {
      image = fallbackImage;
    }

    const bedrooms =
      getTag("beds") ||
      getTag("Bedrooms") ||
      getTag("bedrooms") ||
      "";

    const unitRef =
      `ARI-${location.slice(0, 3).toUpperCase()}-${type
        .slice(0, 3)
        .toUpperCase()}-${index + 1}`;

    units.push({
      unitRef,
      projectName,
      unitTitle: rawTitle,
      location,
      type,
      price,
      image,
      images: [image],
      description,
      bedrooms,
      developer: "Aristo",
      source:
        "https://www.aristodevelopers.com/downloads/AristoDevelopersUnits.xml"
    });
  });

  return units;
}
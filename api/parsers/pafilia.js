import {
  normalizeText,
  normalizeProjectName,
  parsePrice,
  getTagFromItem,
  fallbackImage
} from "./helpers.js";

const detectPafiliaProject = (
  rawTitle,
  description,
  image
) => {
  const text =
    `${rawTitle} ${description} ${image}`.toLowerCase();

  const projects = [
    "Elysia Blu",
    "Minthis",
    "ONE",
    "NEO",
    "Lofos",
    "Pearl Park",
    "Pafilia Gardens",
    "Aphrodite Springs",
    "Park Avenue",
    "Oasis",
    "Elite Residences",
    "The Edge",
    "Urban",
    "Mediterranean Heights"
  ];

  for (const project of projects) {
    if (text.includes(project.toLowerCase())) {
      return project;
    }
  }

  return "";
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
    xml.match(/<property>([\s\S]*?)<\/property>/gi) ||
    [];

  const units = [];

  items.forEach((item, index) => {
    const getTag = (tag) =>
      getTagFromItem(item, tag);

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

    const description =
      getTag("description") ||
      `${type} in ${location}`;

    let image =
      getTag("image") ||
      getTag("IMAGE_URL") ||
      getTag("image_url") ||
      "";

    if (image.startsWith("//")) {
      image = `https:${image}`;
    }

    if (!image) {
      image = fallbackImage;
    }

    const price = parsePrice(
      getTag("Price") || getTag("price")
    );

    const detectedProject =
      detectPafiliaProject(
        rawTitle,
        description,
        image
      );

    const projectName =
      detectedProject ||
      normalizeProjectName(rawTitle);

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
      developer: "Pafilia",
      source:
        "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml"
    });
  });

  return units;
}
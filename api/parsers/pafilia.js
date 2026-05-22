import {
  normalizeText,
  normalizeProjectName,
  parsePrice,
  getTagFromItem,
  fallbackImage
} from "./helpers.js";

const SOURCE_URL =
  "https://feeds.pafilia.com/xml2u/Marketing.php";

const getBlock = (item, tag) => {
  return (
    item.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
    )?.[1] || ""
  );
};

const stripHtml = (text = "") => {
  return normalizeText(
    String(text)
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
  );
};

const getLocation = (development = "") => {
  const locationBlock = getBlock(development, "location");

  const suburb = getTagFromItem(locationBlock, "Suburb");
  const city = getTagFromItem(locationBlock, "City");
  const district = getTagFromItem(locationBlock, "District") || "Pafos";

  const main = suburb || city || district || "Pafos";

  if (main.toLowerCase().includes(district.toLowerCase())) {
    return normalizeText(main);
  }

  return normalizeText(`${main}, ${district}`);
};

const getImages = (block = "") => {
  const links = [
    ...block.matchAll(
      /<link\s+size=["'](?:large|original|small)["'][^>]*>\s*([\s\S]*?)\s*<\/link>/gi
    )
  ]
    .map((m) => normalizeText(m[1]))
    .filter((url) => url.startsWith("http"));

  return [...new Set(links)];
};

const getProperties = (development = "") => {
  const propertiesBlock = getBlock(development, "properties");

  if (!propertiesBlock) return [];

  return propertiesBlock
    .split(/<property\b/i)
    .slice(1)
    .map((part) => `<property${part.split("</property>")[0]}</property>`);
};

export async function getPafiliaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const xml = await response.text();

  const developments = [
  ...xml.matchAll(
    /<development>([\s\S]*?)<\/development>/gi
  )
].map((match) => match[0]);

  const units = [];

  developments.forEach((development, devIndex) => {
    const projectName = normalizeProjectName(
      getTagFromItem(development, "project") ||
      `Pafilia Project ${devIndex + 1}`
    );

    const developmentRef =
      getTagFromItem(development, "ref") ||
      `PAF-${devIndex + 1}`;

    const location = getLocation(development);

    const projectImages = getImages(development);

    const properties = getProperties(development);

    properties.forEach((property, propertyIndex) => {
      const status = getTagFromItem(property, "status");

      if (status && status.toLowerCase() !== "available") {
        return;
      }

      const type =
        getTagFromItem(property, "type") ||
        "Property";

      const combinedText =
        `${projectName} ${type}`.toLowerCase();

      if (
        combinedText.includes("plot") ||
        combinedText.includes("land")
      ) {
        return;
      }

      const price = parsePrice(
        getTagFromItem(property, "price")
      );

      if (!price) return;

      const unitRef =
        getTagFromItem(property, "ref") ||
        `${developmentRef}-${propertyIndex + 1}`;

      const bedrooms =
        getTagFromItem(property, "bedrooms") ||
        "";

      const bathrooms =
        getTagFromItem(property, "bathrooms") ||
        "";

      const shortDescriptionBlock =
        getBlock(property, "short-description");

      const description =
        stripHtml(shortDescriptionBlock) ||
        `${projectName} is a selected Pafilia development in ${location}.`;

      const propertyImages = getImages(property);
      const images =
        propertyImages.length > 0
          ? propertyImages
          : projectImages;

      const image =
        images[0] || fallbackImage;

      units.push({
        unitRef,
        projectName,
        unitTitle: `${projectName} ${type}`,
        location,
        type,
        price,
        image,
        images: images.length ? images.slice(0, 8) : [fallbackImage],
        description,
        bedrooms,
        bathrooms,
        developer: "Pafilia",
        source: SOURCE_URL
      });
    });
  });

  return units;
}
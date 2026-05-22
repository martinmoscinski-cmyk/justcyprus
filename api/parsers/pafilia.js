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
    item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ||
    ""
  );
};

const getLocationFromDevelopment = (development = "") => {
  const locationBlock = getBlock(development, "location");

  const city =
    getTagFromItem(locationBlock, "City") ||
    getTagFromItem(locationBlock, "Suburb") ||
    getTagFromItem(locationBlock, "District") ||
    "Pafos";

  const district =
    getTagFromItem(locationBlock, "District") ||
    "Pafos";

  if (city.toLowerCase().includes(district.toLowerCase())) {
    return normalizeText(city);
  }

  return normalizeText(`${city}, ${district}`);
};

const getDevelopmentImages = (development = "") => {
  const links = [
    ...development.matchAll(
      /<link\s+size=["'](?:large|original|small)["'][^>]*>\s*([\s\S]*?)\s*<\/link>/gi
    )
  ]
    .map((match) => normalizeText(match[1]))
    .filter((url) => url.startsWith("http"));

  return [...new Set(links)];
};

const getPropertyBlocks = (development = "") => {
  const propertiesBlock = getBlock(development, "properties");

  return (
    propertiesBlock.match(/<property[\s\S]*?<\/property>/gi) ||
    []
  );
};

export async function getPafiliaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const xml = await response.text();

  const developments =
    xml.match(/<development>[\s\S]*?<\/development>/gi) || [];

  const units = [];

  developments.forEach((development, developmentIndex) => {
    const projectName = normalizeProjectName(
      getTagFromItem(development, "project") ||
      `Pafilia Project ${developmentIndex + 1}`
    );

    const developmentRef =
      getTagFromItem(development, "ref") ||
      `PAF-${developmentIndex + 1}`;

    const location =
      getLocationFromDevelopment(development);

    const projectImages = getDevelopmentImages(development);

    const propertyBlocks = getPropertyBlocks(development);

    propertyBlocks.forEach((property, propertyIndex) => {
      const status =
        getTagFromItem(property, "status") ||
        "";

      if (
        status &&
        status.toLowerCase() !== "available"
      ) {
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

      const price =
        parsePrice(
          getTagFromItem(property, "price")
        );

      if (!price) {
        return;
      }

      const bedrooms =
        getTagFromItem(property, "bedrooms") ||
        "";

      const bathrooms =
        getTagFromItem(property, "bathrooms") ||
        "";

      const unitRef =
        getTagFromItem(property, "ref") ||
        `${developmentRef}-${propertyIndex + 1}`;

      const shortDescription =
        getBlock(property, "short-description");

      const description =
        normalizeText(shortDescription)
          .replace(/<[^>]*>/g, "") ||
        `${projectName} is a selected Pafilia development in ${location}.`;

      const propertyImages =
        getDevelopmentImages(property);

      const images =
        propertyImages.length
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
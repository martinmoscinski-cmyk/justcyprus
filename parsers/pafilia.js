import {
  normalizeText,
  normalizeProjectName,
  parsePrice,
  fallbackImage
} from "./helpers.js";

const SOURCE_URL =
  "https://feeds.pafilia.com/xml2u/Marketing.php";

const getTag = (xml = "", tag = "") => {
  const match = xml.match(
    new RegExp(
      `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    )
  );

  if (!match) return "";

  return normalizeText(
    match[1]
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]*>/g, " ")
  );
};

const getImages = (xml = "") => {
  const matches = [
    ...xml.matchAll(
      /<link size="(?:large|original)">([\s\S]*?)<\/link>/gi
    )
  ];

  return matches
    .map((m) => normalizeText(m[1]))
    .filter((url) => url.startsWith("http"));
};

export async function getPafiliaProjects() {
  const response = await fetch(SOURCE_URL);

  const xml = await response.text();

  const developments = [
    ...xml.matchAll(
      /<development>([\s\S]*?)<\/development>/gi
    )
  ].map((m) => m[0]);

  const units = [];

  developments.forEach((development, devIndex) => {
    const projectName = normalizeProjectName(
      getTag(development, "project")
    );

    if (!projectName) return;

    const district =
      getTag(development, "District") || "Paphos";

    const suburb =
      getTag(development, "Suburb");

    const location =
      suburb && suburb !== district
        ? `${suburb}, ${district}`
        : district;

    const projectImages = getImages(development);

    const properties = [
      ...development.matchAll(
        /<property[\s\S]*?<\/property>/gi
      )
    ].map((m) => m[0]);

    properties.forEach((property, propertyIndex) => {
      const status = getTag(property, "status");

      if (
        status &&
        status.toLowerCase() !== "available"
      ) {
        return;
      }

      const type =
        getTag(property, "type") || "Property";

      const combined =
        `${projectName} ${type}`.toLowerCase();

      if (
        combined.includes("plot") ||
        combined.includes("land")
      ) {
        return;
      }

      const price = parsePrice(
        getTag(property, "price")
      );

      if (!price) return;

      const propertyImages = getImages(property);

      const images =
        propertyImages.length > 0
          ? propertyImages
          : projectImages;

      const image =
        images[0] || fallbackImage;

      units.push({
        unitRef:
          getTag(property, "ref") ||
          `PAF-${devIndex + 1}-${propertyIndex + 1}`,

        projectName,

        unitTitle:
          `${projectName} ${type}`,

        location,

        type,

        price,

        image,

        images:
          images.length > 0
            ? images.slice(0, 8)
            : [fallbackImage],

        description:
          getTag(property, "short-description") ||
          `${projectName} in ${location}`,

        bedrooms:
          getTag(property, "bedrooms"),

        bathrooms:
          getTag(property, "bathrooms"),

        unitsAvailable:
          Number(
            getTag(
              development,
              "available-units"
            )
          ) || null,

        totalUnits:
          Number(
            getTag(
              development,
              "total-units"
            )
          ) || null,

        developer: "Pafilia",

        source: SOURCE_URL
      });
    });
  });

  return units;
}
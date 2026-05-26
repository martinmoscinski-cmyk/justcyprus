import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";
import { getLumaProjects } from "./parsers/luma.js";

export const config = {
  runtime: "nodejs"
};

const fallbackImage = "images/property-1.jpg";

const normalizeProjectName = (text = "") => {
  return String(text)
    .replace(/\s+(APARTMENT|VILLA|HOUSE|UNIT|OFFICE|PENTHOUSE)\s*[A-Z]?\d+[A-Z]?$/i, "")
    .replace(/\s+[A-Z]\d{2,4}$/i, "")
    .replace(/\s+\d{2,4}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanImages = (unit) => {
  const images = [
    unit.image,
    ...(unit.images || [])
  ].filter((img) =>
    img &&
    typeof img === "string" &&
    img.trim() &&
    img !== "undefined" &&
    img !== "null"
  );

  return images.length ? [...new Set(images)] : [fallbackImage];
};

export default async function handler(req, res) {
  try {
    const [aristo, pafilia, domenica, luma] = await Promise.all([
      getAristoProjects(),
      getPafiliaProjects(),
      getDomenicaProjects(),
      getLumaProjects()
    ]);

    const allUnits = [
      ...aristo,
      ...pafilia,
      ...domenica,
      ...luma
    ];

    const grouped = {};

    allUnits.forEach((unit) => {
      const cleanProjectName = normalizeProjectName(unit.projectName);

      if (!cleanProjectName) return;

      const unitImages = cleanImages(unit);

      const key = `${unit.developer}-${cleanProjectName}-${unit.location}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef}-PROJECT`,
          title: cleanProjectName,
          location: unit.location,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unitImages[0],
          images: [...unitImages],
          description:
            `${cleanProjectName} is a selected development in ${unit.location}. Contact us for current availability, layouts and details.`,
          unitsCount: 0,
          units: [],
          developer: unit.developer,
          source: unit.source
        };
      }

      grouped[key].units.push(unit);
      grouped[key].unitsCount += 1;

      if (
        unit.price &&
        (!grouped[key].priceFrom || unit.price < grouped[key].priceFrom)
      ) {
        grouped[key].priceFrom = unit.price;
      }

      unitImages.forEach((img) => {
        if (img && !grouped[key].images.includes(img)) {
          grouped[key].images.push(img);
        }
      });

      if (!grouped[key].image && grouped[key].images.length) {
        grouped[key].image = grouped[key].images[0];
      }
    });

    const projects = Object.values(grouped)
      .filter((project) => project.priceFrom > 0)
      .sort((a, b) => a.priceFrom - b.priceFrom);

    res.setHeader(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate=86400"
    );

    res.status(200).json({
      success: true,
      updatedAt: new Date().toISOString(),
      projects,
      totalProjects: projects.length,
      totalUnits: allUnits.length,
      locations: [
        ...new Set(
          projects
            .map((p) => p.location)
            .filter(Boolean)
        )
      ].sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
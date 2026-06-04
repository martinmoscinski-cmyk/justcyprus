import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";
import { getLumaProjects } from "./parsers/luma.js";
import { getGiovaniProjects } from "./parsers/giovani.js";

export const config = {
  runtime: "nodejs"
};

const normalizeProjectName = (text = "") => {
  return String(text)
    .replace(/\s+V\d+$/i, "")
    .replace(/\s+\d+$/i, "")
    .replace(/\b(APARTMENT|VILLA|HOUSE|UNIT|OFFICE|PENTHOUSE|SHOP)\b\s*[A-Z]?\d+[A-Z]?$/i, "")
    .replace(/\s+[A-Z]\d{2,4}$/i, "")
    .replace(/\s+\d{2,4}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default async function handler(req, res) {
  try {
    const [aristo, pafilia, domenica, luma, giovani] = await Promise.all([
      getAristoProjects(),
      getPafiliaProjects(),
      getDomenicaProjects(),
      getLumaProjects(),
      getGiovaniProjects()
    ]);

    const allUnits = [
      ...aristo,
      ...pafilia,
      ...domenica,
      ...luma,
      ...giovani
    ];

    const grouped = {};

    allUnits.forEach((unit) => {
      const cleanProjectName = normalizeProjectName(unit.projectName);
const cleanLocation = normalizeLocation(unit.location);

      const key = `${unit.developer}-${cleanProjectName}-${cleanLocation}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef}-PROJECT`,
          title: cleanProjectName,
          location: cleanLocation,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unit.image,
          images: [],
          description: `${cleanProjectName} is a selected development in ${unit.location}. Contact us for current availability, layouts and details.`,
          unitsCount: 0,
          units: [],
          developer: unit.developer,
          source: unit.source
        };
      }

      grouped[key].units.push(unit);
      grouped[key].unitsCount += 1;

      if (unit.price && (!grouped[key].priceFrom || unit.price < grouped[key].priceFrom)) {
        grouped[key].priceFrom = unit.price;
      }

      unit.images?.forEach((img) => {
        if (img && !grouped[key].images.includes(img)) {
          grouped[key].images.push(img);
        }
      });
    });

    const projects = Object.values(grouped)
      .filter((project) => project.priceFrom > 0)
      .sort((a, b) => a.priceFrom - b.priceFrom);

    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );

    res.status(200).json({
      success: true,
      projects,
      totalProjects: projects.length,
      totalUnits: allUnits.length,
      locations: [
        ...new Set(projects.map((p) => p.location).filter(Boolean))
      ].sort()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
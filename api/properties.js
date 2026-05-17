import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";
import { getGiovaniProjects } from "./parsers/giovani.js";
import { normalizeProjectName } from "./parsers/helpers.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const allUnits = [
      ...(await getAristoProjects()),
      ...(await getPafiliaProjects()),
      ...(await getDomenicaProjects()),
      ...(await getGiovaniProjects())
    ];

    const grouped = {};

    allUnits.forEach((unit) => {
      const projectName =
        normalizeProjectName(unit.projectName);

      const key =
        `${unit.developer}-${projectName}-${unit.location}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef}-PROJECT`,
          title: projectName,
          location: unit.location,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unit.image,
          images: [],
          description: `${projectName} is a selected development in ${unit.location}. Contact us for current availability, layouts and details.`,
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
        (!grouped[key].priceFrom ||
          unit.price < grouped[key].priceFrom)
      ) {
        grouped[key].priceFrom = unit.price;
      }

      if (
        unit.image &&
        !grouped[key].images.includes(unit.image)
      ) {
        grouped[key].images.push(unit.image);
      }

      if (!grouped[key].image && unit.image) {
        grouped[key].image = unit.image;
      }
    });

    const projects = Object.values(grouped).filter(
      (project) => Number(project.priceFrom || 0) > 0
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );

    res.status(200).json({
      success: true,
      projects,
      totalProjects: projects.length,
      totalUnits: allUnits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
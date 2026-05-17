import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";
import { normalizeProjectName } from "./parsers/helpers.js";

export default async function handler(req, res) {
  try {
    const allUnits = [
      ...(await getAristoProjects()),
      ...(await getPafiliaProjects()),
      ...(await getDomenicaProjects())
    ];

    const grouped = {};

    allUnits.forEach((unit) => {
      const keyProjectName = normalizeProjectName(unit.projectName);

      const key =
        `${unit.developer}-${keyProjectName}-${unit.location}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: unit.unitRef,
          title: keyProjectName,
          location: unit.location,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unit.image,
          images: [],
          description: `${keyProjectName} is a selected development in ${unit.location}, with ${String(unit.type || "property").toLowerCase()} options available. Contact us for current availability, layouts and details.`,
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

      unit.images.forEach((img) => {
        if (img && !grouped[key].images.includes(img)) {
          grouped[key].images.push(img);
        }
      });
    });

    const projects = Object.values(grouped).filter(
      (project) => Number(project.priceFrom || 0) > 0
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
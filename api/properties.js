import { getGiovaniProjects } from "./parsers/giovani.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const projects = await getGiovaniProjects();

    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      total: projects.length,
      locations: [...new Set(projects.map(p => p.location))],
      titles: projects.map(p => ({
        title: p.projectName,
        location: p.location,
        price: p.price,
        source: p.source
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
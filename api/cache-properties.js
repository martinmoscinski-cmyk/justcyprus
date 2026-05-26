import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";

export default async function handler(req, res) {
  try {
    const [
      aristo,
      pafilia,
      domenica
    ] = await Promise.all([
      getAristoProjects(),
      getPafiliaProjects(),
      getDomenicaProjects()
    ]);

    const projects = [
      ...aristo,
      ...pafilia,
      ...domenica
    ];

    res.setHeader(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate"
    );

    res.status(200).json({
      success: true,
      updatedAt: new Date().toISOString(),
      total: projects.length,
      projects
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
import { getAristoProjects } from "./parsers/aristo.js";
import { getPafiliaProjects } from "./parsers/pafilia.js";
import { getDomenicaProjects } from "./parsers/domenica.js";
import { normalizeProjectName } from "./parsers/helpers.js";

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled([
      getAristoProjects(),
      getPafiliaProjects(),
      getDomenicaProjects()
    ]);

    res.status(200).json({
      success: true,
      debug: results.map((r, index) => ({
        parser: ["Aristo", "Pafilia", "Domenica"][index],
        status: r.status,
        count: r.status === "fulfilled" ? r.value.length : 0,
        error: r.status === "rejected" ? r.reason.message : null
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
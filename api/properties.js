import { getLumaProjects } from "./parsers/luma.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const luma = await getLumaProjects();

    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      count: luma.length,
      luma
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
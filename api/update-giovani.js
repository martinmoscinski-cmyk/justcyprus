import { put } from "@vercel/blob";
import { getGiovaniProjects } from "./parsers/giovani-live.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const data = await getGiovaniProjects();

    const blob = await put(
      "data/giovani-data.json",
      JSON.stringify(data, null, 2),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false
      }
    );

    res.status(200).json({
      success: true,
      count: data.length,
      url: blob.url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
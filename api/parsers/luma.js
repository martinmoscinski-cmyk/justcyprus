import {
  fallbackImage
} from "./helpers.js";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/13nEauDXxv3zDbs_2wkTsTOY-8v6GNmTgHHweS_3LluI/gviz/tq?tqx=out:csv&sheet=MASTER";

export async function getLumaProjects() {

  const response = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const raw = await response.text();

  console.log("========= LUMA RAW START =========");
  console.log(raw);
  console.log("========= LUMA RAW END =========");

  return [
    {
      unitRef: "LUM-DEBUG",
      projectName: "Luma Debug",
      unitTitle: "Luma Debug",
      location: "Debug",
      type: "Apartment",
      price: 1,
      image: fallbackImage,
      images: [fallbackImage],
      description: "Debug output from Google Sheets.",
      bedrooms: "",
      developer: "Luma",
      source: CSV_URL
    }
  ];
}
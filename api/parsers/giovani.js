import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

export async function getGiovaniProjects() {

  console.log("GIOVANI START");

  return [
    {
      unitRef: "GIO-TEST-1",
      projectName: "Giovani Test",
      unitTitle: "Giovani Test",
      location: "Paralimni",
      type: "Apartment",
      price: 150000,
      image: fallbackImage,
      images: [fallbackImage],
      description: "Test project",
      bedrooms: "",
      developer: "Giovani",
      source: "https://giovani.cy"
    }
  ];

}
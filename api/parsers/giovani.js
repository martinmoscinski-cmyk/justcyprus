import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

export async function getGiovaniProjects() {

  return [
    {
      unitRef: "GIO-1",
      projectName: "Giovani Test",
      unitTitle: "Giovani Test",
      location: "Paralimni",
      type: "Apartment",
      price: 123456,
      image: "https://via.placeholder.com/800x600",
      images: ["https://via.placeholder.com/800x600"],
      description: "test",
      bedrooms: "",
      developer: "Giovani",
      source: "https://giovani.cy"
    }
  ];

}
const BASE_URL = "https://luma.cy";

export async function getLumaProjects() {
  try {
    const response = await fetch(
      "https://luma.cy/our-projects/",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const html = await response.text();

    return [
      {
        unitRef: "TEST-1",
        projectName: html.slice(0, 500),
        unitTitle: "TEST",
        location: "TEST",
        type: "Apartment",
        price: 1,
        image: "",
        images: [],
        description: "test",
        bedrooms: "",
        developer: "Luma",
        source: "https://luma.cy/our-projects/"
      }
    ];
  } catch (e) {
    return [];
  }
}
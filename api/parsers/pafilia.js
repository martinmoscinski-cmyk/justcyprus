export async function getPafiliaProjects() {
  const response = await fetch(
    "https://feeds.pafilia.com/xml2u/Marketing.php",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );

  const xml = await response.text();

  return [{
    unitRef: "PAF-DEBUG",
    projectName: xml.slice(0, 3000),
    unitTitle: "Pafilia Debug",
    location: "Debug",
    type: "Apartment",
    price: 1,
    image: "",
    images: [],
    description: "Debug Pafilia feed",
    bedrooms: "",
    developer: "Pafilia",
    source: "debug"
  }];
}
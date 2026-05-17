import {
  normalizeText,
  normalizeProjectName,
  fallbackImage
} from "./helpers.js";

export async function getDomenicaProjects() {
  const response = await fetch(
    "https://www.domenicagroup.com/portfolio",
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  const html = await response.text();

  const text = normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  );

  const matches = [
    ...text.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z,\s]+Pafos)\s+Area:\s*([^]*?)\s+Type:\s*([^]*?)\s+(?:Off Plan|Under Construction|For Sale|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  matches.forEach((match, index) => {
    const title = normalizeProjectName(match[1]);
    const location = normalizeText(match[2]);
    const type = normalizeText(match[4]);

    const hasK = /k/i.test(match[0]);

    let price =
      Number(
        String(match[5])
          .replace(/,/g, "")
          .replace(/\s/g, "")
      ) || 0;

    if (hasK) {
      price = price * 1000;
    }

    if (price < 50000 || price > 10000000) {
      return;
    }

    units.push({
      unitRef: `DOM-PAF-PRO-${index + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image: fallbackImage,
      images: [fallbackImage],
      description: `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: "https://www.domenicagroup.com/portfolio"
    });
  });

  return units;
}
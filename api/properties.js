export default async function handler(req, res) {

  const feeds = [
    {
      developer: "Aristo",
      code: "ARI",
      url: "https://www.aristodevelopers.com/downloads/AristoDevelopersUnits.xml"
    },
    {
      developer: "Pafilia",
      code: "PAF",
      url: "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml"
    }
  ];

  try {

    const allUnits = [];

    for (const feed of feeds) {

      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const xml = await response.text();

      const items =
        xml.match(/<property>([\s\S]*?)<\/property>/gi) ||
        xml.match(/<Unit>([\s\S]*?)<\/Unit>/gi) ||
        [];

      items.forEach((item, index) => {

        const getTag = (tag) => {
          const match = item.match(
            new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
          );

          return match
            ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()
            : "";
        };

        const location =
          getTag("town") ||
          getTag("city") ||
          getTag("area") ||
          getTag("region") ||
          "Cyprus";

        const type =
          getTag("property_type") ||
          getTag("type") ||
          "Property";

        const rawTitle =
          getTag("title") ||
          getTag("project_name") ||
          getTag("name") ||
          getTag("project") ||
          getTag("development") ||
          `${location} ${type}`;

        const projectName = rawTitle
          .replace(/Villa No\.?\s*\d+/gi, "")
          .replace(/Apartment No\.?\s*\d+/gi, "")
          .replace(/Unit No\.?\s*\d+/gi, "")
          .replace(/No\.?\s*\d+/gi, "")
          .replace(/\s+-\s+$/g, "")
          .trim() || rawTitle;

        const rawPrice =
          getTag("price")
            .replace(/€/g, "")
            .replace(/,/g, "")
            .replace(/\s/g, "");

        let price =
          Number(rawPrice) || 0;

        if (price > 10000000) {
          price = Math.round(price / 100);
        }

        const rawImage =
          getTag("image") ||
          getTag("image_url") ||
          getTag("IMAGE_URL") ||
          getTag("picture") ||
          "";

        const image = rawImage
          .replace(/"/g, "")
          .replace(/<[^>]*>/g, "")
          .trim() ||
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

        const description =
          getTag("description") ||
          getTag("desc") ||
          `${type} in ${location}`;

        const bedrooms =
          getTag("beds") ||
          getTag("bedrooms") ||
          getTag("BEDROOMS") ||
          "";

        const unitRef =
          `${feed.code}-${location.slice(0,3).toUpperCase()}-${type.slice(0,3).toUpperCase()}-${index + 1}`;

        allUnits.push({
          unitRef,
          projectName,
          unitTitle: rawTitle,
          location,
          type,
          price,
          image,
          images: [image],
          description,
          bedrooms,
          developer: feed.developer,
          source: feed.url
        });

      });

    }

    const grouped = {};

    allUnits.forEach((unit) => {

      const key =
        `${unit.developer}-${unit.projectName}-${unit.location}-${unit.type}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef.split("-").slice(0,3).join("-")}-PROJECT`,
          title: unit.projectName,
          location: unit.location,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unit.image,
          images: [],
          description: unit.description,
          unitsCount: 0,
          units: [],
          developer: unit.developer,
          source: unit.source
        };
      }

      grouped[key].units.push(unit);
      grouped[key].unitsCount += 1;

      if (
        unit.price &&
        (!grouped[key].priceFrom || unit.price < grouped[key].priceFrom)
      ) {
        grouped[key].priceFrom = unit.price;
      }

      unit.images.forEach((img) => {
        if (img && !grouped[key].images.includes(img)) {
          grouped[key].images.push(img);
        }
      });

    });

    const projects = Object.values(grouped);

    res.status(200).json({
      success: true,
      projects,
      totalProjects: projects.length,
      totalUnits: allUnits.length
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

}
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
            ? match[1]
                .replace(/<!\[CDATA\[|\]\]>/g, "")
                .trim()
            : "";
        };

        const cleanName = (text) => {
          return String(text || "")
            .replace(/&nbsp;/g, " ")
            .replace(/\u00A0/g, " ")
            .replace(/[–—]/g, "-")
            .replace(/\s+/g, " ")
            .trim();
        };

        const location =
          getTag("town") ||
          getTag("city") ||
          getTag("area") ||
          getTag("Area") ||
          getTag("region") ||
          "Cyprus";

        const type =
          getTag("property_type") ||
          getTag("type") ||
          getTag("Type") ||
          "Property";

        const rawTitle =
          getTag("title") ||
          getTag("Title") ||
          getTag("project_name") ||
          getTag("name") ||
          getTag("project") ||
          getTag("Project") ||
          getTag("development") ||
          `${location} ${type}`;

        const projectName = cleanName(rawTitle)
          .replace(/\s*-\s*Villa No\.?\s*\d+[A-Z]?/gi, "")
          .replace(/\s*-\s*Apartment No\.?\s*\d+[A-Z]?/gi, "")
          .replace(/\s*-\s*Unit No\.?\s*\d+[A-Z]?/gi, "")

          .replace(/Villa No\.?\s*\d+[A-Z]?/gi, "")
          .replace(/Apartment No\.?\s*\d+[A-Z]?/gi, "")
          .replace(/Unit No\.?\s*\d+[A-Z]?/gi, "")

          .replace(/\(Old\s*\d+\)/gi, "")
          .replace(/Old\s*\d+/gi, "")

          .replace(/\s*-\s*V\d+/gi, "")
.replace(/\s*-\s*[A-Z]\d+$/gi, "")
.replace(/\s*Apartment\s*\d+[A-Z]?$/gi, "")
.replace(/\s*Apt\.?\s*\d+[A-Z]?$/gi, "")
.replace(/\/\d+$/g, "")

          .replace(/\s*[-–—]+\s*$/g, "")

          .replace(/([a-z])([A-Z])$/g, "$1")

          .replace(/\s{2,}/g, " ")
          .trim();

        const priceText =
          getTag("Price") ||
          getTag("price") ||
          "";

        const cleanPrice = priceText
          .replace(/&#x20AC;/g, "")
          .replace(/€/g, "")
          .replace(/,/g, "")
          .replace(/\s/g, "")
          .trim();

        let price = Number(cleanPrice) || 0;

        if (price < 50000 || price > 10000000) {
          price = 0;
        }

        const rawImage =
          getTag("image") ||
          getTag("IMAGE_URL") ||
          getTag("image_url") ||
          getTag("picture") ||
          "";

        let image = rawImage
          .replace(/"/g, "")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (image.startsWith("//")) {
          image = `https:${image}`;
        }

        if (!image) {
          const imageMatch = item.match(
            /<image[^>]*>([\s\S]*?)<\/image>/i
          );

          if (imageMatch && imageMatch[1]) {
            image = imageMatch[1].trim();

            if (image.startsWith("//")) {
              image = `https:${image}`;
            }
          }
        }

        if (!image) {
          const urlMatch = item.match(
            /<url[^>]*>([\s\S]*?)<\/url>/i
          );

          if (urlMatch && urlMatch[1]) {
            image = urlMatch[1].trim();

            if (image.startsWith("//")) {
              image = `https:${image}`;
            }
          }
        }

        if (!image) {
          image =
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";
        }

        const description =
          getTag("description") ||
          getTag("Description") ||
          getTag("desc") ||
          `${type} in ${location}`;

        const bedrooms =
          getTag("beds") ||
          getTag("Bedrooms") ||
          getTag("bedrooms") ||
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

      const keyProjectName = cleanProjectName(unit.projectName);

      const key =
        `${unit.developer}-${keyProjectName}-${unit.location}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {

        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef.split("-").slice(0,3).join("-")}-PROJECT`,
          title: keyProjectName,
          location: unit.location,
          type: unit.type,
          priceFrom: unit.price || 0,
          image: unit.image,
          images: [],
          description: `${keyProjectName} is a selected development in ${unit.location}, with ${unit.type.toLowerCase()} options available. Contact us for current availability, layouts and details.`,
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
        (
          !grouped[key].priceFrom ||
          unit.price < grouped[key].priceFrom
        )
      ) {
        grouped[key].priceFrom = unit.price;
      }

      unit.images.forEach((img) => {
        if (img && !grouped[key].images.includes(img)) {
          grouped[key].images.push(img);
        }
      });

    });

    function cleanProjectName(text) {
      return String(text || "")
        .replace(/&nbsp;/g, " ")
        .replace(/\u00A0/g, " ")
        .replace(/[–—]/g, "-")
        .replace(/\s*-\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

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
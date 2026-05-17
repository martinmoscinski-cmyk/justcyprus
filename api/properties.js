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

  const fallbackImage =
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

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

        const getAnyTag = (tags) => {
          for (const tag of tags) {
            const value = getTag(tag);
            if (value) return value;
          }
          return "";
        };

        const parsePrice = () => {
          const priceText = getAnyTag([
            "price",
            "PRICE",
            "Price",
            "property_price",
            "PropertyPrice",
            "sale_price",
            "SalePrice",
            "asking_price",
            "AskingPrice",
            "from_price",
            "price_from",
            "unit_price",
            "UnitPrice",
            "value"
          ]);

          if (!priceText) return 0;

          let cleaned = priceText
            .replace(/€/g, "")
            .replace(/EUR/gi, "")
            .replace(/,/g, "")
            .replace(/\s/g, "")
            .replace(/[^\d.]/g, "");

          let value = Number(cleaned);

          if (!value) return 0;

          if (value > 10000000 && value % 100 === 0) {
            value = value / 100;
          }

          if (value < 50000 || value > 10000000) {
            return 0;
          }

          return Math.round(value);
        };

        const location =
          getAnyTag(["town", "city", "area", "region", "location"]) ||
          "Cyprus";

        const type =
          getAnyTag(["property_type", "type", "category"]) ||
          "Property";

        const rawTitle =
          getAnyTag(["title", "project_name", "name", "project", "development"]) ||
          `${location} ${type}`;

        const projectName = rawTitle
          .replace(/Villa No\.?\s*\d+/gi, "")
          .replace(/Apartment No\.?\s*\d+/gi, "")
          .replace(/Unit No\.?\s*\d+/gi, "")
          .replace(/No\.?\s*\d+/gi, "")
          .replace(/\s+-\s+$/g, "")
          .trim() || rawTitle;

        const price = parsePrice();

        const rawImage =
          getAnyTag(["image", "image_url", "IMAGE_URL", "picture", "photo", "url"]);

        const image = rawImage
          .replace(/"/g, "")
          .replace(/<[^>]*>/g, "")
          .trim() || fallbackImage;

        const description =
          getAnyTag(["description", "desc", "short_description"]) ||
          `${type} in ${location}`;

        const bedrooms =
          getAnyTag(["beds", "bedrooms", "BEDROOMS", "Bedrooms"]);

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
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

  const htmlSources = [
    {
      developer: "Domenica",
      code: "DOM",
      url: "https://www.domenicagroup.com/portfolio"
    }
  ];

  const fallbackImage =
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

  const normalizeText = (text) => {
    return String(text || "")
      .normalize("NFKC")
      .replace(/&nbsp;/g, " ")
      .replace(/&#xA0;/g, " ")
      .replace(/\u00A0/g, " ")
      .replace(/&#8211;/g, "-")
      .replace(/&#8212;/g, "-")
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeProjectName = (text) => {
    return normalizeText(text)
      .replace(/\s*-\s*Villa No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/\s*-\s*Apartment No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/\s*-\s*Maisonette No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/\s*-\s*Semi Detached House No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/\s*-\s*Unit No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/Villa No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/Apartment No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/Maisonette No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/Semi Detached House No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/Unit No\.?\s*[\d/]+[A-Z]?/gi, "")
      .replace(/\s*-\s*V\d+$/gi, "")
      .replace(/\s*-\s*[A-Z]\d+$/gi, "")
      .replace(/\/\d+$/g, "")
      .replace(/\(Old\s*\d+\)/gi, "")
      .replace(/Old\s*\d+/gi, "")
      .replace(/\s*[-–—]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getTagFromItem = (item, tag) => {
    const match = item.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
    );

    return match
      ? normalizeText(match[1].replace(/<!\[CDATA\[|\]\]>/g, ""))
      : "";
  };

  const detectPafiliaProject = (rawTitle, description, image) => {
    const text = `${rawTitle} ${description} ${image}`.toLowerCase();

    const projects = [
      "Elysia Blu",
      "Minthis",
      "ONE",
      "NEO",
      "Lofos",
      "Pearl Park",
      "Pafilia Gardens",
      "Aphrodite Springs",
      "Park Avenue",
      "Oasis",
      "Elite Residences",
      "The Edge",
      "Urban",
      "Mediterranean Heights"
    ];

    for (const project of projects) {
      if (text.includes(project.toLowerCase())) {
        return project;
      }
    }

    return "";
  };

  const parsePrice = (priceText) => {
    const cleanPrice = normalizeText(priceText)
      .replace(/&#x20AC;/g, "")
      .replace(/€/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "")
      .trim();

    let price = Number(cleanPrice) || 0;

    if (price < 50000 || price > 10000000) {
      price = 0;
    }

    return price;
  };

  try {
    const allUnits = [];

    // XML feeds: Aristo + Pafilia
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
        const getTag = (tag) => getTagFromItem(item, tag);

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
          `${location} ${type}`;

        const description =
          getTag("description") ||
          getTag("Description") ||
          getTag("desc") ||
          `${type} in ${location}`;

        let image =
          getTag("image") ||
          getTag("IMAGE_URL") ||
          getTag("image_url") ||
          getTag("picture") ||
          "";

        image = image
          .replace(/"/g, "")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (image.startsWith("//")) {
          image = `https:${image}`;
        }

        if (!image) {
          const imageMatch = item.match(/<image[^>]*>([\s\S]*?)<\/image>/i);

          if (imageMatch && imageMatch[1]) {
            image = normalizeText(imageMatch[1]);

            if (image.startsWith("//")) {
              image = `https:${image}`;
            }
          }
        }

        if (!image) {
          const urlMatch = item.match(/<url[^>]*>([\s\S]*?)<\/url>/i);

          if (urlMatch && urlMatch[1]) {
            image = normalizeText(urlMatch[1]);

            if (image.startsWith("//")) {
              image = `https:${image}`;
            }
          }
        }

        if (!image) {
          image = fallbackImage;
        }

        const priceText =
          getTag("Price") ||
          getTag("price") ||
          "";

        const price = parsePrice(priceText);

        const rawProject =
          getTag("project") ||
          getTag("Project") ||
          getTag("project_name") ||
          getTag("development") ||
          getTag("name") ||
          rawTitle;

        let projectName = normalizeProjectName(rawProject);

        if (feed.developer === "Pafilia") {
          const detectedProject = detectPafiliaProject(
            rawTitle,
            description,
            image
          );

          projectName = detectedProject || `${location} ${type}`;
        }

        const bedrooms =
          getTag("beds") ||
          getTag("Bedrooms") ||
          getTag("bedrooms") ||
          "";

        const unitRef =
          `${feed.code}-${location.slice(0, 3).toUpperCase()}-${type
            .slice(0, 3)
            .toUpperCase()}-${index + 1}`;

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

    // HTML source: Domenica live parser
    for (const source of htmlSources) {
      const response = await fetch(source.url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await response.text();

      const text = normalizeText(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]*>/g, " ")
      );

      const chunks = text
        .split(/(?=Price range:|Area:|Type:|Off Plan|Under Construction|Completed|For Sale)/gi)
        .join(" ")
        .split(/(?=[A-Z][A-Za-z0-9'’&.\s-]{2,50}\s+Area:)/g);

      let index = 0;

      chunks.forEach((chunk) => {
        const cleanChunk = normalizeText(chunk);

        if (!cleanChunk.toLowerCase().includes("price range")) {
          return;
        }

        const priceMatch = cleanChunk.match(/Price range:\s*€\s*([\d.,]+)\s*k?/i);
        const areaMatch = cleanChunk.match(/Area:\s*([^]*?)\s*Type:/i);
        const typeMatch = cleanChunk.match(/Type:\s*([^]*?)(?:Off Plan|Under Construction|For Sale|Completed|Price range)/i);

        if (!priceMatch) {
          return;
        }

        let priceText = priceMatch[1].replace(/,/g, "").trim();
        let price = Number(priceText) || 0;

        if (/k/i.test(priceMatch[0])) {
          price = price * 1000;
        }

        if (price < 50000 || price > 10000000) {
          return;
        }

        let location = areaMatch ? normalizeText(areaMatch[1]) : "Paphos";
        let type = typeMatch ? normalizeText(typeMatch[1]) : "Property";

        const beforeArea = cleanChunk.split("Area:")[0] || "";
        let title = normalizeProjectName(beforeArea);

        if (!title || title.length < 3 || title.length > 80) {
          title = `Domenica ${type}`;
        }

        index++;

        allUnits.push({
          unitRef: `${source.code}-PAF-PRO-${index}`,
          projectName: title,
          unitTitle: title,
          location,
          type,
          price,
          image: fallbackImage,
          images: [fallbackImage],
          description: `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
          bedrooms: "",
          developer: source.developer,
          source: source.url
        });
      });
    }

    const grouped = {};

    allUnits.forEach((unit) => {
      const keyProjectName = normalizeProjectName(unit.projectName);

      const key =
        `${unit.developer}-${keyProjectName}-${unit.location}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

      if (!grouped[key]) {
        grouped[key] = {
          projectId: key,
          ref: `${unit.unitRef.split("-").slice(0, 3).join("-")}-PROJECT`,
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

    const projects = Object.values(grouped).filter(
      (project) => Number(project.priceFrom || 0) > 0
    );

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
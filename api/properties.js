export default async function handler(req, res) {

  const feeds = [
    {
      developer: "Aristo",
      url: "https://www.aristodevelopers.com/downloads/AristoDevelopersUnits.xml"
    },
    {
      developer: "Pafilia",
      url: "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml"
    }
  ];

  try {

    const allProperties = [];

    for (const feed of feeds) {

      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const xml = await response.text();

      const items = xml.match(/<property>([\s\S]*?)<\/property>/g) || [];

      items.forEach((item, index) => {

        const getTag = (tag) => {
          const match = item.match(
            new RegExp(`<${tag}>(.*?)</${tag}>`, "i")
          );

          return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
        };

        const title =
          getTag("title") ||
          getTag("property_type") ||
          "Property in Cyprus";

        const location =
          getTag("town") ||
          getTag("area") ||
          getTag("region") ||
          "Cyprus";

        const type =
          getTag("property_type") ||
          "Property";

        const price =
          Number(getTag("price")) || 0;

        const image =
          getTag("image") ||
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

        const description =
          getTag("description").slice(0, 180) ||
          `${type} in ${location}`;

        const ref =
          `${feed.developer.slice(0,3).toUpperCase()}-${location.slice(0,3).toUpperCase()}-${type.slice(0,3).toUpperCase()}-${index+1}`;

        allProperties.push({
          ref,
          title,
          location,
          type,
          price,
          image,
          description,
          developer: feed.developer
        });

      });

    }

    res.status(200).json({
      success: true,
      properties: allProperties
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

}
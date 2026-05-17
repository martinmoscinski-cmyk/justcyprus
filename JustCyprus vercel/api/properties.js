export default async function handler(req, res) {
  const feeds = [
    "https://www.aristodevelopers.com/downloads/AristoDevelopersUnits.xml",
    "https://www.xml2u.com/Xml/Pafilia%20Property%20Developers_3814/6768_Kyero.xml"
  ];

  try {
    const results = await Promise.all(
      feeds.map(async (url) => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${url}`);
        }

        const xml = await response.text();

        return {
          source: url,
          xml
        };
      })
    );

    res.status(200).json({
      feeds: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
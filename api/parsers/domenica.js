export async function getDomenicaProjects() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const portfolioHtml = await response.text();
  const portfolioText = cleanText(portfolioHtml);

  const projectLinks = [
    ...new Set(
      [
        ...portfolioHtml.matchAll(
          /href=["']([^"']*\/portfolio\/[^"']+)["']/gi
        )
      ]
        .map((m) => absoluteUrl(m[1]))
        .filter((url) => url !== SOURCE_URL)
    )
  ];

  const portfolioMatches = [
    ...portfolioText.matchAll(
      /([A-Z][A-Za-z0-9'’&.\s-]{2,60})\s+([A-Za-z\s]+,\s*Pafos|[A-Za-z\s]+,\s*Paphos)\s+Area:\s*([\s\S]*?)\s+Type:\s*([\s\S]*?)\s+(?:Off Plan|Under Construction|Completed)\s+Price range:\s*€\s*([\d.,]+)\s*k?/gi
    )
  ];

  const units = [];

  for (let i = 0; i < portfolioMatches.length; i++) {

    const match = portfolioMatches[i];

    const title = cleanProjectName(match[1]);
    const location = normalizeText(match[2])
      .replace("Paphos", "Pafos");

    const type = normalizeText(match[4]);
    const price = parsePrice(match[0]);

    if (shouldSkip(title, type)) continue;
    if (!price) continue;

    const titleSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const link =
      projectLinks.find((url) =>
        url.toLowerCase().includes(titleSlug)
      ) || "";

    let image = fallbackImage;

    if (link) {
      try {

        const projectResponse = await fetch(link, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const projectHtml = await projectResponse.text();

        const ogImage =
          projectHtml.match(
            /property=["']og:image["'] content=["']([^"']+)["']/i
          )?.[1];

        const twitterImage =
          projectHtml.match(
            /name=["']twitter:image["'] content=["']([^"']+)["']/i
          )?.[1];

        image =
          absoluteUrl(
            ogImage ||
            twitterImage ||
            fallbackImage
          );

      } catch (e) {}
    }

    units.push({
      unitRef: `DOM-${i + 1}`,
      projectName: title,
      unitTitle: title,
      location,
      type,
      price,
      image,
      images: [image],
      description:
        `${title} is a selected Domenica Group development in ${location}. Contact us for current availability, layouts and details.`,
      bedrooms: "",
      developer: "Domenica",
      source: link || SOURCE_URL
    });
  }

  return units;
}
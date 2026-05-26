export const fallbackImage =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

export const normalizeText = (text) => {
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

export const normalizeProjectName = (text) => {
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
    .replace(/^k\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const parsePrice = (priceText) => {
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

export const getTagFromItem = (item, tag) => {
  const match = item.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );

  return match
    ? normalizeText(
        match[1].replace(/<!\[CDATA\[|\]\]>/g, "")
      )
    : "";
};
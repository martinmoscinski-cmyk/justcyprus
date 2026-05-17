async function fetchProperties() {
  const response = await fetch("/api/properties");
  const data = await response.json();

  console.log("API DATA:", data);

  if (!data.feeds) return [];

  const allProperties = [];

  data.feeds.forEach((feed) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(feed.xml, "text/xml");

    const items = [
      ...xml.querySelectorAll("property"),
      ...xml.querySelectorAll("Property"),
      ...xml.querySelectorAll("Unit")
    ];

    items.forEach((item) => {
      const text = item.textContent || "";

      allProperties.push({
        raw: text,
        title:
          item.querySelector("title")?.textContent ||
          item.querySelector("TITLE")?.textContent ||
          item.querySelector("name")?.textContent ||
          "Cyprus property",

        location:
          item.querySelector("town")?.textContent ||
          item.querySelector("city")?.textContent ||
          item.querySelector("CITY")?.textContent ||
          item.querySelector("location")?.textContent ||
          "Cyprus",

        type:
          item.querySelector("type")?.textContent ||
          item.querySelector("PROPERTY_TYPE")?.textContent ||
          "Property",

        price:
          item.querySelector("price")?.textContent ||
          item.querySelector("PRICE")?.textContent ||
          "",

        image:
          item.querySelector("image url")?.textContent ||
          item.querySelector("image")?.textContent ||
          item.querySelector("IMAGE_URL")?.textContent ||
          "images/property-1.jpg",

        description:
          item.querySelector("desc")?.textContent ||
          item.querySelector("description")?.textContent ||
          item.querySelector("DESCRIPTION")?.textContent ||
          text.slice(0, 160)
      });
    });
  });

  return allProperties;
}

document.getElementById("propertySearch").addEventListener("submit", async (e) => {
  e.preventDefault();

  const location = document.getElementById("location").value.toLowerCase();
  const type = document.getElementById("type").value.toLowerCase();
  const budget = Number(document.getElementById("budget").value);

  const properties = await fetchProperties();
  const results = document.getElementById("results");

  results.innerHTML = "";

  const matched = properties.filter((property) => {
    const text = JSON.stringify(property).toLowerCase();
    const numericPrice = Number(String(property.price).replace(/[^\d]/g, ""));

    const locationMatch = !location || text.includes(location);
    const typeMatch = !type || text.includes(type);
    const budgetMatch = !budget || !numericPrice || numericPrice <= budget;

    return locationMatch && typeMatch && budgetMatch;
  });

  if (matched.length === 0) {
    results.innerHTML = `<p>No matching properties found.</p>`;
    return;
  }

  matched.slice(0, 12).forEach((property) => {
    const numericPrice = Number(String(property.price).replace(/[^\d]/g, ""));

    results.innerHTML += `
      <div class="property-card">
        <img src="${property.image || "images/property-1.jpg"}" alt="${property.title}">

        <div class="property-body">
          <small>${property.location}</small>

          <h3>${property.title}</h3>

          <p>${property.description}</p>

          <div class="property-meta">
            <div class="price">
              ${numericPrice ? "€" + numericPrice.toLocaleString() : "Details on request"}
            </div>

            <a href="https://wa.me/447459899618" class="card-btn">
              Enquire
            </a>
          </div>
        </div>
      </div>
    `;
  });
});
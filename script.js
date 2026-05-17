async function fetchProperties() {

  const response = await fetch("/api/properties");

  const data = await response.json();

  return data.properties || [];

}

document.getElementById("propertySearch").addEventListener("submit", async (e) => {

  e.preventDefault();

  const location =
    document.getElementById("location").value.toLowerCase();

  const type =
    document.getElementById("type").value.toLowerCase();

  const budget =
    Number(document.getElementById("budget").value);

  const properties = await fetchProperties();

  const results = document.getElementById("results");

  results.innerHTML = "";

  const matched = properties.filter((property) => {

    const locationMatch =
      !location ||
      property.location.toLowerCase().includes(location);

    const typeMatch =
      !type ||
      property.type.toLowerCase().includes(type);

    const budgetMatch =
      !budget ||
      property.price <= budget;

    return (
      locationMatch &&
      typeMatch &&
      budgetMatch
    );

  });

  if (matched.length === 0) {

    results.innerHTML = `
      <p>No matching properties found.</p>
    `;

    return;

  }

  matched.slice(0, 12).forEach((property) => {

    const whatsappMessage = encodeURIComponent(
      `Hi, I am interested in:
${property.ref}
${property.title}
${property.location}`
    );

    results.innerHTML += `

      <div class="property-card">

        <img src="${property.image}" alt="${property.title}">

        <div class="property-body">

          <small>${property.location}</small>

          <h3>${property.title}</h3>

          <p>${property.description}</p>

          <div class="property-meta">

            <div class="price">
              ${property.price
                ? "€" + property.price.toLocaleString()
                : "Details on request"}
            </div>

            <div class="card-actions">

              <a
                href="https://wa.me/447459899618?text=${whatsappMessage}"
                class="card-btn"
              >
                WhatsApp
              </a>

              <a
                href="mailto:marcin@nglobalinvestments.com?subject=Property enquiry ${property.ref}&body=${whatsappMessage}"
                class="card-btn secondary-card-btn"
              >
                Request details
              </a>

            </div>

          </div>

        </div>

      </div>

    `;

  });

});
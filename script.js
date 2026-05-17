async function fetchProjects() {
  const response = await fetch("/api/properties");
  const data = await response.json();
  console.log("API DATA:", data);
  return data.projects || [];
}

function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makePrice(price) {
  const value = Number(price || 0);

  if (!value) {
    return "Price on request";
  }

  return "From €" + value.toLocaleString();
}

function shortDescription(text) {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return "Selected new-build project in Cyprus with direct developer opportunities.";
  }

  return cleaned.length > 170
    ? cleaned.slice(0, 170) + "..."
    : cleaned;
}

document.getElementById("propertySearch").addEventListener("submit", async (e) => {
  e.preventDefault();

  const location = document.getElementById("location").value.toLowerCase();
  const type = document.getElementById("type").value.toLowerCase();
  const budget = Number(document.getElementById("budget").value);

  const projects = await fetchProjects();
  const results = document.getElementById("results");

  results.innerHTML = "";

  const matched = projects.filter((project) => {
    const projectLocation = cleanText(project.location).toLowerCase();
    const projectType = cleanText(project.type).toLowerCase();
    const projectPrice = Number(project.priceFrom || 0);

    const locationMatch = !location || projectLocation.includes(location);
    const typeMatch = !type || projectType.includes(type);
    const budgetMatch = !budget || !projectPrice || projectPrice <= budget;

    return locationMatch && typeMatch && budgetMatch;
  });

  if (matched.length === 0) {
    results.innerHTML = `<p>No matching projects found.</p>`;
    return;
  }

  matched.slice(0, 12).forEach((project) => {
    const title = cleanText(project.title || "Cyprus project");
    const locationText = cleanText(project.location || "Cyprus");
    const ref = cleanText(project.ref || "JC-PROJECT");
    const image =
      project.images?.[0] ||
      project.image ||
      "images/property-1.jpg";

    const priceText = makePrice(project.priceFrom);
    const description = shortDescription(project.description);

    const whatsappMessage = encodeURIComponent(
      `Hi, I am interested in:\nRef: ${ref}\n${title}\n${locationText}\n${priceText}`
    );

    const emailBody = encodeURIComponent(
      `Hi,\n\nI would like more details about:\n\nRef: ${ref}\n${title}\n${locationText}\n${priceText}`
    );

    results.innerHTML += `
      <div class="property-card">

        <div class="property-badge">
          Ref: ${ref}
        </div>

        <img src="${image}" alt="${title}">

        <div class="property-body">

          <small>${locationText}</small>

          <h3>${title}</h3>

          <p>${description}</p>

          <div class="property-meta">

            <div>
              <div class="price">${priceText}</div>
              <small>${project.unitsCount || 0} units available</small>
            </div>

            <div class="card-actions">

              <a
                href="https://wa.me/447459899618?text=${whatsappMessage}"
                class="card-btn"
              >
                WhatsApp
              </a>

              <a
                href="mailto:marcin@nglobalinvestments.com?subject=Property enquiry ${ref}&body=${emailBody}"
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
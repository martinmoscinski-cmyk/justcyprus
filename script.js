async function fetchProjects() {
  const response = await fetch("/api/properties");
  const data = await response.json();
  console.log("API DATA:", data);
  return data.projects || [];
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
    const projectLocation = String(project.location || "").toLowerCase();
    const projectType = String(project.type || "").toLowerCase();
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
    const mainImage =
      project.images?.[0] ||
      project.image ||
      "images/property-1.jpg";

    const priceText =
      project.priceFrom
        ? "From €" + Number(project.priceFrom).toLocaleString()
        : "Price available on request";

    const whatsappMessage = encodeURIComponent(
      `Hi, I am interested in:\nRef: ${project.ref}\n${project.title}\n${project.location}\n${priceText}`
    );

    const emailBody = encodeURIComponent(
      `Hi,\n\nI would like more details about:\n\nRef: ${project.ref}\n${project.title}\n${project.location}\n${priceText}`
    );

    results.innerHTML += `
      <div class="property-card">

        <div class="property-badge">
          Ref: ${project.ref}
        </div>

        <img src="${mainImage}" alt="${project.title}">

        <div class="property-body">

          <small>${project.location}</small>

          <h3>${project.title}</h3>

          <p>${project.description || "Selected new-build project in Cyprus."}</p>

          <div class="property-meta">

            <div class="price">
              ${priceText}
            </div>

            <small>
              ${project.unitsCount || 0} units available
            </small>

            <div class="card-actions">

              <a
                href="https://wa.me/447459899618?text=${whatsappMessage}"
                class="card-btn"
              >
                WhatsApp
              </a>

              <a
                href="mailto:marcin@nglobalinvestments.com?subject=Property enquiry ${project.ref}&body=${emailBody}"
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
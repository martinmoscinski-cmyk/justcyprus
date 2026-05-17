let currentPage = 1;
const resultsPerPage = 6;
let currentMatched = [];

async function fetchProjects() {
  const response = await fetch("/api/properties");
  const data = await response.json();
  return data.projects || [];
}

function cleanText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#xA0;/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[–—−‒]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*$/g, "")
    .trim();
}
function normalizeLocation(text) {
  return cleanText(text)
    .toLowerCase()
    .replaceAll("paphos", "pafos");
}

function makePrice(price) {
  const value = Number(price || 0);

  if (!value) {
    return "Price on request";
  }

  return `From €${value.toLocaleString()}`;
}

function shortDescription(text) {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return "Selected development in Cyprus. Contact us for current availability, layouts and details.";
  }

  return cleaned.length > 170
    ? cleaned.slice(0, 170) + "..."
    : cleaned;
}

function renderProjects(projects, page = 1) {
  const results = document.getElementById("results");
  const pagination = document.getElementById("pagination");

  results.innerHTML = "";
  if (pagination) pagination.innerHTML = "";

  const start = (page - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const paginatedProjects = projects.slice(start, end);

  paginatedProjects.forEach((project) => {
    const title = cleanText(project.title || "Cyprus property");
    const locationText = cleanText(project.location || "Cyprus");
    const ref = cleanText(project.ref || "JC-PROJECT");
    const description = shortDescription(project.description);
    const priceText = makePrice(project.priceFrom);

    const image =
      project.images?.[0] ||
      project.image ||
      "images/property-1.jpg";

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

        <img src="${image}" alt="${title}" loading="lazy">

        <div class="property-body">

          <small>${locationText}</small>

          <h3>${title}</h3>

          <p>${description}</p>

          <div class="property-meta">

            <div>
              <div class="price">${priceText}</div>
              <small class="units">${project.unitsCount || 0} units available</small>
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

  const totalPages = Math.ceil(projects.length / resultsPerPage);

  if (pagination && totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      pagination.innerHTML += `
        <button class="page-btn ${i === page ? "active" : ""}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    document.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        renderProjects(currentMatched, currentPage);
        document.getElementById("results").scrollIntoView({ behavior: "smooth" });
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("propertySearch");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const location = normalizeLocation(
  document.getElementById("location").value
);
    const type = document.getElementById("type").value.toLowerCase();
    const budgetValue =
  document.getElementById("budget").value;

    const projects = await fetchProjects();
    const results = document.getElementById("results");
    const pagination = document.getElementById("pagination");

    results.innerHTML = "";
    if (pagination) pagination.innerHTML = "";

    const matched = projects.filter((project) => {
      const projectLocation = normalizeLocation(project.location);
      const projectType = cleanText(project.type).toLowerCase();
      const projectPrice = Number(project.priceFrom || 0);

      if (!projectPrice) {
        return false;
      }

      const locationMatch = !location || projectLocation.includes(location);
      const typeMatch = !type || projectType.includes(type);
      let matchesBudget = true;

if (budgetValue) {

  const [minBudget, maxBudget] =
    budgetValue.split("-").map(Number);

  matchesBudget =
    projectPrice >= minBudget &&
    projectPrice <= maxBudget;
}

      return locationMatch && typeMatch && matchesBudget;
    });

    if (matched.length === 0) {
      results.innerHTML = `<p>No matching projects found.</p>`;
      return;
    }

    currentMatched = matched;
    currentPage = 1;
    renderProjects(currentMatched, currentPage);
  });
});
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
    .replaceAll("paphos", "pafos")
    .replaceAll("pafos", "pafos")
    .replaceAll("geroskipou hills", "pafos")
    .replaceAll("geroskipou", "pafos");
}

function normalizeLocationForDropdown(location) {
  const clean = cleanText(location)
    .replaceAll("Pafos", "Paphos");

  if (clean.includes("Paphos")) return "Paphos";
  if (clean.includes("Limassol")) return "Limassol";

  return clean;
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
const projectUrl =
  `/property.html?id=${encodeURIComponent(project.projectId)}`;

    const image =
      project.image ||
      project.images?.[0] ||
      "images/property-1.jpg";

    const whatsappMessage = encodeURIComponent(
      `Hi, I am interested in:\nRef: ${ref}\n${title}\n${locationText}\n${priceText}`
    );

    const emailBody = encodeURIComponent(
      `Hi,\n\nI would like more details about:\n\nRef: ${ref}\n${title}\n${locationText}\n${priceText}`
    );

    results.innerHTML += `
  <div
    class="property-card"
    onclick="window.location.href='${projectUrl}'"
    style="cursor:pointer;"
  >

        <div class="property-badge">
          Ref: ${ref}
        </div>

        <img
          src="${image}"
          alt="${title}"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='images/property-1.jpg';"
        >

        <div class="property-body">

          <small>${locationText}</small>

          <h3>${title}</h3>

          <p>${description}</p>

          <div class="property-meta">

            <div>
              <div class="price">${priceText}</div>
              <small class="units">
                ${["Domenica", "Luma"].includes(project.developer)
                  ? "Availability on request"
                  : `${project.unitsCount || 0} units available`}
              </small>
            </div>

            <div class="card-actions">

              <a
  href="https://wa.me/447459899618?text=${whatsappMessage}"
  class="card-btn"
  onclick="event.stopPropagation();"
>
                WhatsApp
              </a>

              <<a
  href="mailto:marcin@nglobalinvestments.com?subject=Property enquiry ${ref}&body=${emailBody}"
  class="card-btn secondary-card-btn"
  onclick="event.stopPropagation();"
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
function sortProjects(projects, sortValue) {
  if (sortValue === "price-low") {
    projects.sort((a, b) => a.priceFrom - b.priceFrom);
  }

  if (sortValue === "price-high") {
    projects.sort((a, b) => b.priceFrom - a.priceFrom);
  }

  if (sortValue === "name") {
    projects.sort((a, b) =>
      cleanText(a.title).localeCompare(cleanText(b.title))
    );
  }

  return projects;
}

function applyFilters(projects) {
  const location = normalizeLocation(
    document.getElementById("location").value
  );

  const type = document.getElementById("type").value.toLowerCase();
  const budgetValue = document.getElementById("budget").value;
  const sortValue = document.getElementById("sort").value;

  const results = document.getElementById("results");
  const pagination = document.getElementById("pagination");
  const resultsCount = document.getElementById("resultsCount");

  results.innerHTML = "";
  if (pagination) pagination.innerHTML = "";

  const matched = projects.filter((project) => {
    const projectLocation = normalizeLocation(project.location);
    const projectType = cleanText(project.type).toLowerCase();
    const projectPrice = Number(project.priceFrom || 0);

    if (!projectPrice) return false;

    const locationMatch =
      !location ||
      projectLocation.includes(location);

    const typeMatch =
      !type ||
      projectType.includes(type);

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

  sortProjects(matched, sortValue);

  if (matched.length === 0) {
    if (resultsCount) {
      resultsCount.innerText = "0 projects found";
    }

    results.innerHTML = `<p>No matching projects found.</p>`;
    return;
  }

  if (resultsCount) {
    resultsCount.innerText = `${matched.length} projects found`;
  }

  currentMatched = matched;
  currentPage = 1;
  renderProjects(currentMatched, currentPage);
}
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("propertySearch");

  if (!form) return;

  const projects = await fetchProjects();

  const locationSelect = document.getElementById("location");

  if (locationSelect) {
    const locationCounts = {};

    projects.forEach((project) => {
      const location =
        normalizeLocationForDropdown(project.location);

      if (!location) return;

      locationCounts[location] =
        (locationCounts[location] || 0) + 1;
    });

    const locations =
      Object.keys(locationCounts).sort();

    locationSelect.innerHTML = `
      <option value="">
        All locations (${projects.length})
      </option>

      ${locations
        .map((location) => {
          return `
            <option value="${location}">
              ${location} (${locationCounts[location]})
            </option>
          `;
        })
        .join("")}
    `;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters(projects);
  });

  ["location", "type", "budget", "sort"].forEach((id) => {
  const field = document.getElementById(id);

  if (!field) return;

  field.addEventListener("change", () => {
    applyFilters(projects);
  });
});

currentMatched = projects;
renderProjects(projects, 1);

const resultsCount =
  document.getElementById("resultsCount");

if (resultsCount) {
  resultsCount.innerText =
    `${projects.length} projects found`;
}

});
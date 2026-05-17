async function fetchProjects() {

  const response = await fetch("/api/properties");

  const data = await response.json();

  return data.projects || [];

}

document
  .getElementById("propertySearch")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const location =
      document.getElementById("location").value.toLowerCase();

    const type =
      document.getElementById("type").value.toLowerCase();

    const budget =
      Number(document.getElementById("budget").value);

    const projects = await fetchProjects();

    const results =
      document.getElementById("results");

    results.innerHTML = "";

    const matched = projects.filter((project) => {

      const locationMatch =
        !location ||
        project.location.toLowerCase().includes(location);

      const typeMatch =
        !type ||
        project.type.toLowerCase().includes(type);

      const budgetMatch =
        !budget ||
        project.minPrice <= budget;

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

    matched.slice(0, 12).forEach((project) => {

      const whatsappMessage = encodeURIComponent(
        `Hi, I am interested in project:\n${project.title}\n${project.location}\nRef: ${project.ref}`
      );

      const mainImage =
        project.images?.[0] ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

      results.innerHTML += `

        <div class="property-card">

          <img src="${mainImage}" alt="${project.title}">

          <div class="property-body">

            <small>${project.location}</small>

            <h3>${project.title}</h3>

            <p>
              ${project.description}
            </p>

            <div class="property-meta">

              <div>

                <div class="price">
                  From €${project.minPrice.toLocaleString()}
                </div>

                <small>
                  ${project.unitsCount} units available
                </small>

              </div>

              <div class="card-actions">

                <a
                  href="https://wa.me/447459899618?text=${whatsappMessage}"
                  class="card-btn"
                >
                  WhatsApp
                </a>

                <button
                  class="card-btn secondary-card-btn"
                >
                  View project
                </button>

              </div>

            </div>

          </div>

        </div>

      `;

    });

});
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadProject() {
  const response = await fetch("/api/properties");
  const data = await response.json();

  const project = data.projects.find(
    (p) => p.projectId === id
  );

  if (!project) {
    document.getElementById("title").innerText =
      "Project not found";
    return;
  }

  document.title = project.title;

  document.getElementById("title").innerText =
    project.title;

  document.getElementById("location").innerText =
    project.location || "";

  document.getElementById("price").innerText =
    project.priceFrom
      ? `From €${Number(project.priceFrom).toLocaleString()}`
      : "Price on request";

  document.getElementById("description").innerText =
    project.description || "";

  document.getElementById("heroImage").src =
    project.image ||
    project.images?.[0] ||
    "images/property-1.jpg";

  document.getElementById("meta").innerHTML = `
    <p><strong>Reference:</strong> ${project.ref}</p>
    <p><strong>Developer:</strong> ${project.developer}</p>
    <p><strong>Units available:</strong> ${project.unitsCount || 0}</p>
  `;

  const whatsappMessage = encodeURIComponent(
    `Hi, I am interested in:\nRef: ${project.ref}\n${project.title}`
  );

  document.getElementById("whatsappBtn").href =
    `https://wa.me/447459899618?text=${whatsappMessage}`;

  document.getElementById("emailBtn").href =
    `mailto:marcin@nglobalinvestments.com?subject=Property enquiry ${project.ref}`;

    const gallery = document.getElementById("gallery");

  gallery.innerHTML =
    (project.images || [])
      .map(
        (img) => `
          <img
            src="${img}"
            alt="${project.title}"
            loading="lazy"
            onclick="document.getElementById('heroImage').src='${img}'"
          >
        `
      )
      .join("");
}

loadProject();
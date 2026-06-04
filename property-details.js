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

  document.getElementById("title").innerText =
    project.title;

  console.log(project);
}

loadProject();
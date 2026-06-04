const params = new URLSearchParams(window.location.search);

const id = params.get("id");

document.getElementById("title").innerText =
  id || "No project selected";
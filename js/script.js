document.addEventListener("DOMContentLoaded", () => {
  // Fetches and returns JSON data from the given path
  async function fetchJSON(path) {
    let response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  }

  // Fetches and returns plain text from the given path
  async function fetchText(path) {
    let response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.text();
  }

  // Displays the available albums on the page
  async function displayAlbums() {
    console.log("Fetching albums...");
    let html = await fetchText(`/songs/`);
    let div = document.createElement("div");
    div.innerHTML = html;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let anchor of anchors) {
      let href = anchor.getAttribute("href");
      console.log(href);
      if (href && href.startsWith("/songs/")) {
        let folder = href.split("/").filter(Boolean).pop();
        console.log(`Fetching info for folder: ${folder}`);
        let metadata;
        try {
          metadata = await fetchJSON(`/songs/${folder}/info.json`);
        } catch (e) {
          console.error(`Error fetching info.json for folder: ${folder}`);
          metadata = {
            title: folder,
            description: "No description available.",
          };
        }
        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
              </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="cover">
            <h2>${metadata.title}</h2>
            <p>${metadata.description}</p>
          </div>`;
      }
    }
  }

  // Main function to initialize the player
  async function main() {
    await displayAlbums(); // Load and display albums
  }

  main();
});

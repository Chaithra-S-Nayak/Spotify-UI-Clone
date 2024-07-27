document.addEventListener("DOMContentLoaded", () => {
  // Initialize the audio player and variables
  let currentSong = new Audio();
  let songs = [];
  let currFolder;
  let currentlyPlayingIndex = null; // Tracks the index of the currently playing song

  // Converts seconds to a MM:SS format
  function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

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

  // Fetches songs from the specified folder and updates the UI
  async function getSongs(folder) {
    // Stop the currently playing song
    if (!currentSong.paused) {
      currentSong.pause();
    }
    currentSong.currentTime = 0;
    currentlyPlayingIndex = null;
    document.querySelector("#play").src = "img/play.svg";

    currFolder = folder;
    console.log(`Fetching songs from folder: ${folder}`);
    let html = await fetchText(`/${folder}/`);
    let div = document.createElement("div");
    div.innerHTML = html;
    let links = div.getElementsByTagName("a");
    songs = Array.from(links)
      .filter((link) => link.href.endsWith(".mp3"))
      .map((link) => link.href.split(`/${folder}/`)[1]);

    displaySongs();
  }

  // Plays the song at the specified index, or pauses it if it's already playing
  function playMusic(index) {
    if (currentlyPlayingIndex === index) {
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = "img/pause.svg";
        document.querySelector(
          `.songList ul li:nth-child(${index + 1}) .playnow img`
        ).src = "img/pause.svg";
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "img/play.svg";
        document.querySelector(
          `.songList ul li:nth-child(${index + 1}) .playnow img`
        ).src = "img/play.svg";
      }
      return;
    }

    currentlyPlayingIndex = index;
    currentSong.src = `/${currFolder}/` + songs[index];
    currentSong.play();
    document.querySelector("#play").src = "img/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(
      songs[index]
    );
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    displaySongs(); // Update the song list icons
  }

  // Displays the list of songs in the current album
  function displaySongs() {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = songs
      .map(
        (song, index) => `
      <li>
        <img class="invert" width="34" src="img/music.svg" alt="music">
        <div class="info">
          <div>${decodeURIComponent(song.replaceAll("%20", " "))}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="${
            currentlyPlayingIndex === index ? "img/pause.svg" : "img/play.svg"
          }" alt="play">
        </div>
      </li>`
      )
      .join("");

    Array.from(songUL.getElementsByTagName("li")).forEach((li, index) => {
      li.addEventListener("click", () => playMusic(index));
    });
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

    // Add event listeners to the album cards
    Array.from(cardContainer.getElementsByClassName("card")).forEach((card) => {
      card.addEventListener("click", async () => {
        let folder = card.dataset.folder;
        await getSongs(`songs/${folder}`);
        playMusic(0); // Play the first song of the album
      });
    });
  }

  // Sets up various event listeners for player controls
  function setupEventListeners() {
    document.querySelector("#play").addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = "img/pause.svg";
        if (currentlyPlayingIndex !== null) {
          document.querySelector(
            `.songList ul li:nth-child(${
              currentlyPlayingIndex + 1
            }) .playnow img`
          ).src = "img/pause.svg";
        }
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "img/play.svg";
        if (currentlyPlayingIndex !== null) {
          document.querySelector(
            `.songList ul li:nth-child(${
              currentlyPlayingIndex + 1
            }) .playnow img`
          ).src = "img/play.svg";
        }
      }
    });

    // Update the song's progress and time display
    currentSong.addEventListener("timeupdate", () => {
      document.querySelector(
        ".songtime"
      ).innerHTML = `${secondsToMinutesSeconds(
        currentSong.currentTime
      )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      document.querySelector(".circle").style.left = `${
        (currentSong.currentTime / currentSong.duration) * 100
      }%`;
    });

    // Seek within the song
    document.querySelector(".seekbar").addEventListener("click", (e) => {
      let percent = e.offsetX / e.target.getBoundingClientRect().width;
      currentSong.currentTime = percent * currentSong.duration;
    });

    // Play the previous song
    document.querySelector("#previous").addEventListener("click", () => {
      if (currentlyPlayingIndex > 0) {
        playMusic(currentlyPlayingIndex - 1);
      }
    });

    // Play the next song
    document.querySelector("#next").addEventListener("click", () => {
      if (currentlyPlayingIndex < songs.length - 1) {
        playMusic(currentlyPlayingIndex + 1);
      }
    });

    // Adjust the volume
    document.querySelector(".range input").addEventListener("input", (e) => {
      currentSong.volume = e.target.value / 100;
      document.querySelector(".volume img").src =
        e.target.value > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    // Mute or unmute the audio
    document.querySelector(".volume img").addEventListener("click", () => {
      let volumeIcon = document.querySelector(".volume img");
      if (currentSong.volume > 0) {
        currentSong.volume = 0;
        volumeIcon.src = "img/mute.svg";
        document.querySelector(".range input").value = 0;
      } else {
        currentSong.volume = 0.1;
        volumeIcon.src = "img/volume.svg";
        document.querySelector(".range input").value = 10;
      }
    });
  }

  // Main function to initialize the player
  async function main() {
    await displayAlbums(); // Load and display albums
    setupEventListeners(); // Setup player controls
  }

  main();
});

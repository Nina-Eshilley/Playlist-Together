const API_KEY = "SUA_CHAVE_YOUTUBE";
const youtubeResults = document.getElementById("youtubeResults");

// Buscar músicas no YouTube
async function searchYouTube() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;

  youtubeResults.innerHTML = "Carregando...";
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=6&key=${API_KEY}`);
    const data = await res.json();
    renderYouTubeResults(data.items);
  } catch (err) {
    youtubeResults.innerHTML = "Erro ao buscar.";
    console.error(err);
  }
}

// Renderizar resultados
function renderYouTubeResults(videos) {
  youtubeResults.innerHTML = "";
  videos.forEach(v => {
    const music = {
      title: v.snippet.title,
      artist: v.snippet.channelTitle,
      videoId: v.id.videoId
    };

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="https://img.youtube.com/vi/${music.videoId}/mqdefault.jpg" alt="${music.title}">
      <h3>${music.title}</h3>
      <p>${music.artist}</p>
      <button class="playBtn btn btn-warning">▶ Ouvir</button>
    `;

    card.querySelector(".playBtn").addEventListener("click", () => openPlayer(music));
    youtubeResults.appendChild(card);
  });
}

// Abrir player em nova aba (ouvir.html)
function openPlayer(music) {
  const url = `./ouvir.html?title=${encodeURIComponent(music.title)}&artist=${encodeURIComponent(music.artist)}&videoId=${music.videoId}`;
  window.open(url, "_blank");
}

document.getElementById("searchBtn").addEventListener("click", searchYouTube);

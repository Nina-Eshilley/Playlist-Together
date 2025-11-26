// ======= Config =======
const API_KEY = "AIzaSyCoWxaW6WlUbKuTNHJrIIVsX7mS6332wW0";//chave YouTube
const API_BASE = "http://localhost:3000";

const youtubeResults = document.getElementById("youtubeResults");
const playlistsDiv = document.getElementById("playlists");
const playlistMusicasDiv = document.getElementById("playlistMusicas");
const playlistTitle = document.getElementById("playlistTitle");
const maisOuvidasDiv = document.getElementById("maisOuvidas");

// Helper: pega perfil atual e avisa se não tiver
function getPerfilOrAlert() {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) {
    alert("Perfil não encontrado! Selecione/entre em um perfil.");
    return null;
  }
  return perfil;
}

// ======= Buscar no YouTube (sem alteração) =======
async function searchYouTube() {
  const q = document.getElementById("searchInput")?.value.trim();
  if (!q) return;

  youtubeResults.innerHTML = "Carregando...";
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=6&key=${API_KEY}`
  );
  const data = await res.json();
  renderYouTubeResults(data.items || []);
}

function renderYouTubeResults(videos) {
  youtubeResults.innerHTML = "";

  videos.forEach(v => {
    const music = {
      title: v.snippet.title,
      artist: v.snippet.channelTitle,
      videoId: v.id.videoId,
    };

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="https://img.youtube.com/vi/${music.videoId}/mqdefault.jpg" alt="${music.title}" width="100%">
      <h3>${music.title}</h3>
      <p>${music.artist}</p>
      <div class="containerBtns">
        <button class="playBtn">▶ Ouvir</button>
        <button class="favBtn">★ Favoritar</button>
        <button class="addPlaylistBtn">✚ Adicionar à playlist</button>
      </div>
    `;

    card.querySelector(".playBtn").addEventListener("click", () => openPlayer(music));
    card.querySelector(".addPlaylistBtn").addEventListener("click", () => escolherPlaylist(music));
    card.querySelector(".favBtn").addEventListener("click", () => adicionarFavorito(music));

    youtubeResults.appendChild(card);
  });
}

// ======= Favoritos (sem alteração) =======
function adicionarFavorito(music) {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  const chave = `favoritos_${perfil.perfil_id}`;
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];

  if (favoritos.some(f => f.videoId === music.videoId)) {
    alert("Essa música já está nos favoritos!");
    return;
  }

  favoritos.push(music);
  localStorage.setItem(chave, JSON.stringify(favoritos));
  alert("Música adicionada aos favoritos 💛");
}

// ===================== NOTIFICAÇÃO LIVE =====================
function sendMusicNotification(title, artist) {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return;

  fetch(`${API_BASE}/live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      perfil_id: perfil.perfil_id,
      perfil_nome: perfil.nome,
      title,
      artist
    }),
  })
  .catch(err => console.error("Erro ao enviar notificação:", err));
}

// ======= Player (sem alteração) =======
function openPlayer(music) {
  const url = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(music.title)}&artist=${encodeURIComponent(music.artist)}&videoId=${music.videoId}`;
  sendMusicNotification(music.title, music.artist);
  window.location.href = url;
  registrarOuvida(music);
}

// ======= Registrar música ouvida (mantive perfil_id) =======
async function registrarOuvida(music) {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  try {
    await fetch(`${API_BASE}/maisouvidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...music, perfil_id: perfil.perfil_id }),
    });
  } catch (err) {
    console.error("Erro ao registrar música ouvida:", err);
  }
}


// Carregar playlists do perfil atual
async function carregarPlaylists() {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  // <<< Usar rota correta: /playlists/:perfil_id >>>
  const res = await fetch(`${API_BASE}/playlists/${perfil.perfil_id}`);
  if (!res.ok) {
    console.error("Erro ao buscar playlists:", res.status, await res.text());
    playlistsDiv.innerHTML = "<p>Erro ao carregar playlists.</p>";
    return;
  }

  const playlists = await res.json();

  playlistsDiv.innerHTML = "";
  if (!playlists || playlists.length === 0) {
    playlistsDiv.innerHTML = "<p>Nenhuma playlist criada ainda.</p>";
    return;
  }

  playlists.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistCard";
    div.innerHTML = `
      <h3>${pl.name}</h3>
      <button class="verBtn">📂 Ver músicas</button>
    `;
    div.querySelector(".verBtn").addEventListener("click", () => abrirPlaylist(pl.id, pl.name));
    playlistsDiv.appendChild(div);
  });
}

// Criar playlist vinculada ao perfil atual
async function criarPlaylist() {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  const name = prompt("Nome da nova playlist:");
  if (!name) return;

  const res = await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, perfil_id: perfil.perfil_id }),
  });

  if (!res.ok) {
    console.error("Erro ao criar playlist:", res.status, await res.text());
    alert("Erro ao criar playlist.");
    return;
  }

  carregarPlaylists();
}

// Escolher playlist (mostra só playlists do perfil e adiciona música)
async function escolherPlaylist(music) {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  // <<< rota  /playlists/:perfil_id >>>
  const res = await fetch(`${API_BASE}/playlists/${perfil.perfil_id}`);
  if (!res.ok) {
    console.error("Erro ao buscar playlists:", res.status, await res.text());
    return alert("Erro ao obter playlists.");
  }

  const playlists = await res.json();
  if (!playlists || playlists.length === 0) {
    alert("Nenhuma playlist encontrada! Crie uma primeiro.");
    return;
  }

  const nomes = playlists.map(p => `${p.id}: ${p.name}`).join("\n");
  const escolha = prompt(`Escolha a playlist (digite o número):\n${nomes}`);
  const playlist = playlists.find(p => p.id == escolha);
  if (!playlist) return;

  // postar música no servidor (body = { title, artist, videoId })
  const addRes = await fetch(`${API_BASE}/playlists/${playlist.id}/musicas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(music),
  });

  if (!addRes.ok) {
    console.error("Erro ao adicionar música:", addRes.status, await addRes.text());
    return alert("Erro ao adicionar música na playlist.");
  }

  alert("Música adicionada à playlist!");
  abrirPlaylist(playlist.id, playlist.name);
}

// Abrir playlist e listar músicas 
async function abrirPlaylist(id, name) {
  playlistTitle.textContent = name;
  playlistMusicasDiv.innerHTML = "";

  const res = await fetch(`${API_BASE}/playlists/${id}/musicas`);
  if (!res.ok) {
    console.error("Erro ao buscar músicas:", res.status, await res.text());
    playlistMusicasDiv.innerHTML = "<p>Erro ao carregar músicas.</p>";
    return;
  }

  const musicas = await res.json();
  if (!musicas || musicas.length === 0) {
    playlistMusicasDiv.innerHTML = "<p>Nenhuma música nesta playlist.</p>";
    return;
  }

  musicas.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" alt="${m.title}" width="100%">
      <h3>${m.title}</h3>
      <p>${m.artist || ""}</p>
      <button class="playBtn">▶ Ouvir</button>
      <button class="removeBtn">✖ Remover</button>
    `;

    div.querySelector(".playBtn").addEventListener("click", () => openPlayer(m));
    div.querySelector(".removeBtn").addEventListener("click", async () => {
      await fetch(`${API_BASE}/playlists/${id}/musicas/${m.id}`, { method: "DELETE" });
      abrirPlaylist(id, name);
    });

    playlistMusicasDiv.appendChild(div);
  });
}

// ======= Mais Ouvidas  =======
async function carregarMaisOuvidas() {
  const perfil = getPerfilOrAlert();
  if (!perfil) return;

  // /maisouvidas/:perfil_id
  const res = await fetch(`${API_BASE}/maisouvidas/${perfil.perfil_id}`);
  if (!res.ok) return;

  const top = await res.json();
  maisOuvidasDiv.innerHTML = "";

  top.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" alt="${m.title}" width="100%">
      <h3>${i + 1}. ${m.title}</h3>
      <p>${m.artist}</p>
      <p>🔥 Tocada ${m.count}x</p>
      <button class="playBtn">▶ Ouvir</button>
    `;
    div.querySelector(".playBtn").addEventListener("click", () => openPlayer(m));
    maisOuvidasDiv.appendChild(div);
  });
}


// ======= Inicialização (eventos) =======
document.getElementById("searchBtn")?.addEventListener("click", searchYouTube);
document.getElementById("addPlaylistBtn")?.addEventListener("click", criarPlaylist);

if (playlistsDiv) carregarPlaylists();
if (maisOuvidasDiv) carregarMaisOuvidas();

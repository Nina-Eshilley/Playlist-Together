// === Chaves e constantes principais ===
const API_KEY = "AIzaSyCoWxaW6WlUbKuTNHJrIIVsX7mS6332wW0"; // Chave da API do YouTube (necessária pra buscar vídeos)
const API_BASE = "http://localhost:3000"; // URL do backend local (onde salva playlists, mais ouvidas, etc.)

// Pegando elementos do HTML pra usar depois
const youtubeResults = document.getElementById("youtubeResults");
const playlistsDiv = document.getElementById("playlists");
const playlistMusicasDiv = document.getElementById("playlistMusicas");
const playlistTitle = document.getElementById("playlistTitle");
const maisOuvidasDiv = document.getElementById("maisOuvidas");


// ======= Buscar no YouTube =======
async function searchYouTube() {
  // Pega o valor digitado no input
  const q = document.getElementById("searchInput")?.value.trim();
  if (!q) return; // Se não digitou nada, sai da função

  youtubeResults.innerHTML = "Carregando..."; // Mostra feedback enquanto consulta API

  // Faz requisição à API do YouTube com a pesquisa
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=6&key=${API_KEY}`
  );

  const data = await res.json(); // transforma resposta em JSON
  renderYouTubeResults(data.items); // exibe os resultados na tela
}


// Monta os cards das músicas do YouTube
function renderYouTubeResults(videos) {
  youtubeResults.innerHTML = "";

  videos.forEach(v => {
    const music = {
      title: v.snippet.title,
      artist: v.snippet.channelTitle,
      videoId: v.id.videoId,
    };

    // Cria um card com thumbnail, título e botões
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="https://img.youtube.com/vi/${music.videoId}/mqdefault.jpg" alt="${music.title}" width="100%">
      <h3>${music.title}</h3>
      <p>${music.artist}</p>
      <button class="playBtn">▶ Ouvir</button>
      <button class="addPlaylistBtn">✚ Adicionar à playlist</button>
      <button class="favBtn">★ Favoritar</button>
    `;

    // Eventos dos botões dentro do card
    card.querySelector(".playBtn").addEventListener("click", () => openPlayer(music));
    card.querySelector(".addPlaylistBtn").addEventListener("click", () => escolherPlaylist(music));
    card.querySelector(".favBtn").addEventListener("click", () => adicionarFavorito(music));

    youtubeResults.appendChild(card);
  });
}



// ======= Favoritos =======
function adicionarFavorito(music) {
  // Pega o perfil logado
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return alert("Perfil não encontrado!");

  // Nome da chave única por usuário
  const chave = `favoritos_${perfil.perfil_id}`;
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];

  // Impede música duplicada
  if (favoritos.some(f => f.videoId === music.videoId)) {
    alert("Essa música já está nos favoritos!");
    return;
  }

  favoritos.push(music); // Adiciona música
  localStorage.setItem(chave, JSON.stringify(favoritos)); // Salva no localStorage
  alert("Música adicionada aos favoritos 💛");
}



// ======= Player =======
function openPlayer(music) {
  // Abre outra página passando os dados da música pela URL
  const url = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(music.title)}&artist=${encodeURIComponent(music.artist)}&videoId=${music.videoId}`;
  window.location.href = url;

  registrarOuvida(music); // Registra que a música foi tocada
}



// ======= Registrar música ouvida =======
async function registrarOuvida(music) {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return;

  try {
    // Envia pro backend registrar contador
    await fetch(`${API_BASE}/maisouvidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...music, perfil_id: perfil.perfil_id }),
    });
  } catch (err) {
    console.error("Erro ao registrar música ouvida:", err);
  }
}



// ======= Playlists =======
async function carregarPlaylists() {
  // Busca playlists no servidor
  const res = await fetch(`${API_BASE}/playlists`);
  const playlists = await res.json();

  playlistsDiv.innerHTML = "";

  // Cria um card pra cada playlist
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



// Criar uma nova playlist
async function criarPlaylist() {
  const name = prompt("Nome da nova playlist:");
  if (!name) return;

  // Envia pro backend
  await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  carregarPlaylists(); // Atualiza lista
}



// Abre playlist mostrando suas músicas
async function abrirPlaylist(id, name) {
  playlistTitle.textContent = name;
  playlistMusicasDiv.innerHTML = "";

  const res = await fetch(`${API_BASE}/playlists/${id}/musicas`);
  const musicas = await res.json();

  musicas.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" alt="${m.title}" width="100%">
      <h3>${m.title}</h3>
      <p>${m.artist}</p>
      <button class="playBtn">▶ Ouvir</button>
      <button class="removeBtn">✖ Remover</button>
    `;

    // Botão ouvir
    div.querySelector(".playBtn").addEventListener("click", () => openPlayer(m));

    // Botão que remove a música
    div.querySelector(".removeBtn").addEventListener("click", async () => {
      await fetch(`${API_BASE}/playlists/${id}/musicas/${m.id}`, { method: "DELETE" });
      abrirPlaylist(id, name); // atualiza a lista depois de apagar
    });

    playlistMusicasDiv.appendChild(div);
  });
}



// Pergunta em qual playlist adicionar a música
async function escolherPlaylist(music) {
  const res = await fetch(`${API_BASE}/playlists`);
  const playlists = await res.json();

  if (playlists.length === 0) {
    alert("Nenhuma playlist encontrada! Crie uma primeiro.");
    return;
  }

  // Lista playlists numeradas e pede escolha
  const nomes = playlists.map(p => `${p.id}: ${p.name}`).join("\n");
  const escolha = prompt(`Escolha a playlist (digite o número):\n${nomes}`);

  const playlist = playlists.find(p => p.id == escolha);
  if (!playlist) return;

  // Adiciona música à playlist escolhida
  await fetch(`${API_BASE}/playlists/${playlist.id}/musicas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(music),
  });

  alert("Música adicionada à playlist!");
  abrirPlaylist(playlist.id, playlist.name);
}



// ======= Mais Ouvidas =======
async function carregarMaisOuvidas() {
  const res = await fetch(`${API_BASE}/maisouvidas`);
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



// ======= Inicialização =======
// Liga botões ao código
document.getElementById("searchBtn")?.addEventListener("click", searchYouTube);
document.getElementById("addPlaylistBtn")?.addEventListener("click", criarPlaylist);

// Só carrega playlists e mais ouvidas se existir na página
if (playlistsDiv) carregarPlaylists();
if (maisOuvidasDiv) carregarMaisOuvidas();

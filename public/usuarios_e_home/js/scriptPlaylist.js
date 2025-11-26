

// Variáveis do DOM
let playlistsDiv, playlistDetail, playlistMusicas, playlistTitle, voltarPlaylistsBtn;
let playerIframe = null;
let currentPlaylistId = null;

// Perfil logado
const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
const perfil_id = currentProfile?.perfil_id;

// Bloqueia acesso sem perfil
if (!perfil_id) {
    alert("Selecione um perfil antes de acessar playlists!");
    window.location.href = "perfis.html";
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    inicializarElementos();
    inicializarEventListeners();
    carregarPlaylists();
});

// ------------------------ PEGAR ELEMENTOS ------------------------
function inicializarElementos() {
    playlistsDiv = document.getElementById("playlists");
    playlistDetail = document.getElementById("playlistDetail");
    playlistMusicas = document.getElementById("playlistMusicas");
    playlistTitle = document.getElementById("playlistTitle");
    voltarPlaylistsBtn = document.getElementById("voltarPlaylists");
}

// ------------------------ EVENTOS ------------------------
function inicializarEventListeners() {
    document.getElementById("addPlaylistBtn")?.addEventListener("click", criarPlaylist);
    voltarPlaylistsBtn?.addEventListener("click", voltarParaLista);
}


// LISTAR PLAYLISTS
async function carregarPlaylists() {
    playlistsDiv.innerHTML = "<p>Carregando playlists...</p>";

    const res = await fetch(`${API_BASE}/playlists/${perfil_id}`);
    const playlists = await res.json();

    playlistsDiv.innerHTML = "";

    if (!playlists || playlists.length === 0) {
        playlistsDiv.innerHTML = "<p>Nenhuma playlist criada ainda.</p>";
        return;
    }

    playlists.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("playlist-item");

        div.innerHTML = `
            <span onclick="abrirPlaylist(${p.id}, '${p.name}')">${p.name}</span>
            <button onclick="renomearPlaylist(${p.id}, '${p.name}')">✎</button>
            <button onclick="deletarPlaylist(${p.id})">✖ Remover</button>
        `;

        playlistsDiv.appendChild(div);
    });
}


// CRIAR PLAYLIST
async function criarPlaylist() {
    const name = prompt("Digite o nome da nova playlist:");
    if (!name) return;

    await fetch(`${API_BASE}/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, perfil_id })
    });

    carregarPlaylists();
}


// ABRIR PLAYLIST
async function abrirPlaylist(id, name) {
    currentPlaylistId = id;
    playlistTitle.textContent = name;

    playlistsDiv.style.display = "none";
    playlistDetail.style.display = "block";

    const res = await fetch(`${API_BASE}/playlists/${id}/musicas`);
    const musicas = await res.json();

    playlistMusicas.innerHTML = "";

    if (!musicas || musicas.length === 0) {
        playlistMusicas.innerHTML = "<p>Sem músicas adicionadas ainda.</p>";
        return;
    }

    musicas.forEach(m => {
        const safeArtist = m.artist && m.artist !== "undefined" ? m.artist : "";

        const item = document.createElement("div");
        item.classList.add("music-item");
        item.dataset.id = m.id; // ⚡ importante para remover do DOM

        const musicInfo = document.createElement("div");
        musicInfo.classList.add("music-info");
        musicInfo.innerHTML = `<strong>${m.title || "Nome não disponível"}</strong><br><small>${safeArtist}</small>`;

        const playBtn = document.createElement("button");
        playBtn.classList.add("playBtn");
        playBtn.textContent = "▶ Ouvir";
        playBtn.addEventListener("click", () => {
            reproduzir(m.videoId, m.title, safeArtist);
        });

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("removeBtn");
        removeBtn.textContent = "✖ Remover";
        removeBtn.addEventListener("click", async () => {
            await removerMusica(m.id);
            item.remove(); // ⚡ remove do DOM imediatamente
        });

        item.appendChild(musicInfo);
        item.appendChild(playBtn);
        item.appendChild(removeBtn);

        playlistMusicas.appendChild(item);
    });
}

// REPRODUZIR MÚSICA
function reproduzir(videoId, title, artist = "") {
    if (!playerIframe) {
        playerIframe = document.createElement("iframe");
        playerIframe.width = "50%";
        playerIframe.height = "500";
        playerIframe.allow = "autoplay";
        playlistDetail.appendChild(playerIframe);
    }

    playerIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}


// REMOVER MÚSICA

async function removerMusica(musicId) {
    if (!currentPlaylistId) {
        alert("Erro: nenhuma playlist aberta.");
        return;
    }

    const confirmDelete = confirm("Deseja realmente remover essa música?");
    if (!confirmDelete) return;

    try {
        const res = await fetch(`${API_BASE}/playlists/${currentPlaylistId}/musicas/${musicId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Erro ao remover música: ${text}`);
        }

    } catch (err) {
        console.error(err);
        alert("Não foi possível remover a música. Veja o console para mais detalhes.");
    }
}


// RENOMEAR PLAYLIST

async function renomearPlaylist(id, oldName) {
    const newName = prompt("Novo nome:", oldName);
    if (!newName) return;

    await fetch(`${API_BASE}/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
    });

    carregarPlaylists();
}

// DELETAR PLAYLIST
async function deletarPlaylist(id) {
    if (!confirm("Tem certeza que deseja excluir esta playlist?")) return;

    await fetch(`${API_BASE}/playlists/${id}`, { method: "DELETE" });
    carregarPlaylists();
}


// VOLTAR
function voltarParaLista() {
    playlistDetail.style.display = "none";
    playlistsDiv.style.display = "block";
}

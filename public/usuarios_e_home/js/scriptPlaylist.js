// scriptPlaylists.js - Script completo para gerenciar playlists e músicas
const API_KEY = "AIzaSyCoWxaW6WlUbKuTNHJrIIVsX7mS6332wW0";
const API_BASE = "http://localhost:3000";

// Elementos da DOM
let playlistsDiv, playlistDetail, playlistMusicas, playlistTitle, voltarPlaylistsBtn;

console.log("Script Playlists carregado!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - Playlists!");
    
    // Inicializar elementos da DOM
    inicializarElementos();
    
    // Inicializar event listeners
    inicializarEventListeners();
    
    // Carregar playlists ao iniciar
    carregarPlaylists();
});

// ======= INICIALIZAR ELEMENTOS =======
function inicializarElementos() {
    playlistsDiv = document.getElementById("playlists");
    playlistDetail = document.getElementById("playlistDetail");
    playlistMusicas = document.getElementById("playlistMusicas");
    playlistTitle = document.getElementById("playlistTitle");
    voltarPlaylistsBtn = document.getElementById("voltarPlaylists");
    
    console.log("🔍 Elementos inicializados:", {
        playlistsDiv: !!playlistsDiv,
        playlistDetail: !!playlistDetail,
        playlistMusicas: !!playlistMusicas,
        playlistTitle: !!playlistTitle,
        voltarPlaylistsBtn: !!voltarPlaylistsBtn
    });
}

// ======= INICIALIZAR EVENT LISTENERS =======
function inicializarEventListeners() {
    // Botão criar playlist
    const addPlaylistBtn = document.getElementById("addPlaylistBtn");
    if (addPlaylistBtn) {
        addPlaylistBtn.addEventListener("click", criarPlaylist);
        console.log("Event listener do criar playlist adicionado!");
    }
    
    // Botão voltar para playlists
    if (voltarPlaylistsBtn) {
        voltarPlaylistsBtn.addEventListener("click", voltarParaPlaylists);
        console.log("Event listener do voltar adicionado!");
    }
}

// ======= CRIAR PLAYLIST =======
async function criarPlaylist() {
    console.log("FUNÇÃO CRIAR PLAYLIST CHAMADA!");
    
    const name = prompt("Nome da nova playlist:");
    console.log("Nome digitado:", name);
    
    if (!name || name.trim() === "") {
        console.log("Nome vazio - cancelado");
        return;
    }

    try {
        console.log("Enviando requisição para API...");
        
        const response = await fetch(`${API_BASE}/playlists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() })
        });

        console.log("Resposta recebida:", response.status);
        
        if (response.ok) {
            console.log("Playlist criada com sucesso!");
            alert(`Playlist "${name}" criada com sucesso!`);
            await carregarPlaylists();
        } else {
            console.error("Erro na resposta da API");
            alert("Erro ao criar playlist. Verifique o servidor.");
        }
        
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
}

// ======= CARREGAR PLAYSLISTS =======
async function carregarPlaylists() {
    if (!playlistsDiv) {
        console.error("Elemento playlists não encontrado!");
        return;
    }

    try {
        console.log("Carregando playlists...");
        const res = await fetch(`${API_BASE}/playlists`);
        const playlists = await res.json();

        playlistsDiv.innerHTML = "";
        
        if (playlists.length === 0) {
            playlistsDiv.innerHTML = "<p>Nenhuma playlist criada ainda.</p>";
            return;
        }

        // Para cada playlist, criar um card
        playlists.forEach(pl => {
            const div = document.createElement("div");
            div.className = "playlistCard";
            div.innerHTML = `
                <h3>${pl.name}</h3>
                <p><small>ID: ${pl.id}</small></p>
                <button class="verBtn btn">📂 Ver músicas</button>
                <button class="excluirBtn btn" style="background-color: #ff6b6b;">🗑️ Excluir</button>
            `;
            
            // Evento para ver músicas
            div.querySelector(".verBtn").addEventListener("click", () => abrirPlaylist(pl.id, pl.name));
            
            // Evento para excluir playlist
            div.querySelector(".excluirBtn").addEventListener("click", () => excluirPlaylist(pl.id));
            
            playlistsDiv.appendChild(div);
        });
        
        console.log(`📁 ${playlists.length} playlists carregadas`);
    } catch (error) {
        console.error("Erro ao carregar playlists:", error);
        playlistsDiv.innerHTML = "<p>Erro ao carregar playlists.</p>";
    }
}

// ======= ABRIR PLAYSLIST (MOSTRAR MÚSICAS) =======
async function abrirPlaylist(id, name) {
    console.log(`📂 Abrindo playlist: ${name} (ID: ${id})`);
    
    try {
        // Mostrar loading
        playlistMusicas.innerHTML = "Carregando músicas...";
        
        // Buscar músicas da playlist específica
        const res = await fetch(`${API_BASE}/playlists/${id}/musicas`);
        
        if (!res.ok) {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        
        const musicas = await res.json();
        
        // Atualizar UI para mostrar a playlist
        mostrarDetalhesPlaylist(name, musicas, id);
        
    } catch (error) {
        console.error("Erro ao carregar músicas:", error);
        playlistMusicas.innerHTML = `<p>Erro ao carregar músicas: ${error.message}</p>`;
    }
}

// ======= MOSTRAR DETALHES DA PLAYLIST =======
function mostrarDetalhesPlaylist(nomePlaylist, musicas, playlistId) {
    console.log(`🎵 Mostrando ${musicas.length} músicas da playlist "${nomePlaylist}"`);
    
    // 1. Esconder lista de playlists
    playlistsDiv.style.display = "none";
    
    // 2. Mostrar seção de detalhes
    playlistDetail.style.display = "block";
    
    // 3. Atualizar título
    playlistTitle.textContent = `🎵 ${nomePlaylist} (${musicas.length} músicas)`;
    
    // 4. Limpar e preencher lista de músicas
    playlistMusicas.innerHTML = "";
    
    if (musicas.length === 0) {
        playlistMusicas.innerHTML = `
            <p>Nenhuma música nesta playlist ainda.</p>
            <button id="adicionarMusicaBtn" class="btn">➕ Adicionar Música</button>
        `;
        
        document.getElementById("adicionarMusicaBtn").addEventListener("click", () => {
            // Futuramente: implementar busca e adição de músicas
            alert("Em breve: você poderá adicionar músicas aqui!");
        });
        
        return;
    }
    
    // Para cada música, criar um card
    musicas.forEach((musica, index) => {
        const musicaDiv = document.createElement("div");
        musicaDiv.className = "musicaCard";
        musicaDiv.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <h4>${index + 1}. ${musica.title}</h4>
                    <p><small>Artista: ${musica.artist}</small></p>
                    <p><small>ID do Vídeo: ${musica.videoId}</small></p>
                </div>
                <div>
                    <button class="playBtn btn" title="Ouvir">▶️</button>
                    <button class="removerBtn btn" style="background-color: #ff6b6b;" title="Remover">❌</button>
                </div>
            </div>
        `;
        
        // Evento para tocar música
        musicaDiv.querySelector(".playBtn").addEventListener("click", () => {
            console.log("🎵 Tocando música:", musica.title);
            // Aqui você pode implementar o player
            alert(`Tocando: ${musica.title} - ${musica.artist}`);
        });
        
        // Evento para remover música da playlist
        musicaDiv.querySelector(".removerBtn").addEventListener("click", async () => {
            if (confirm(`Remover "${musica.title}" da playlist?`)) {
                await removerMusicaDaPlaylist(playlistId, musica.id || musica.videoId);
            }
        });
        
        playlistMusicas.appendChild(musicaDiv);
    });
}

// ======= REMOVER MÚSICA DA PLAYLIST =======
async function removerMusicaDaPlaylist(playlistId, musicaId) {
    try {
        console.log(`🗑️ Removendo música ${musicaId} da playlist ${playlistId}`);
        
        const response = await fetch(`${API_BASE}/playlists/${playlistId}/musicas/${musicaId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            console.log("Música removida com sucesso!");
            // Recarregar a playlist atual
            const playlistName = playlistTitle.textContent.replace("🎵 ", "").split(" (")[0];
            await abrirPlaylist(playlistId, playlistName);
        } else {
            alert("Erro ao remover música.");
        }
    } catch (error) {
        console.error("Erro ao remover música:", error);
        alert("Erro de conexão ao remover música.");
    }
}

// ======= EXCLUIR PLAYLIST =======
async function excluirPlaylist(playlistId) {
    if (!confirm("Tem certeza que deseja excluir esta playlist? Todas as músicas serão perdidas.")) {
        return;
    }
    
    try {
        console.log(`Excluindo playlist ${playlistId}`);
        
        const response = await fetch(`${API_BASE}/playlists/${playlistId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            console.log("Playlist excluída com sucesso!");
            alert("Playlist excluída com sucesso!");
            await carregarPlaylists();
        } else {
            alert("Erro ao excluir playlist.");
        }
    } catch (error) {
        console.error("Erro ao excluir playlist:", error);
        alert("Erro de conexão ao excluir playlist.");
    }
}

// ======= VOLTAR PARA LISTA DE PLAYSLISTS =======
function voltarParaPlaylists() {
    console.log("⬅ Voltando para lista de playlists");
    
    // Esconder detalhes
    playlistDetail.style.display = "none";
    
    // Mostrar lista de playlists
    playlistsDiv.style.display = "block";
    
    // Recarregar playlists (caso alguma tenha sido excluída)
    carregarPlaylists();
}
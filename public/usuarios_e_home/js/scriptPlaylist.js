// scriptPlaylists.js - Script completo para gerenciar playlists e músicas
 
// Chave da API do YouTube (usada futuramente para buscar músicas)
const API_KEY = "AIzaSyCoWxaW6WlUbKuTNHJrIIVsX7mS6332wW0";
 
// Endereço do servidor onde as playlists estão sendo salvas
const API_BASE = "http://localhost:3000";
 
// Variáveis usadas para pegar elementos do HTML depois
let playlistsDiv, playlistDetail, playlistMusicas, playlistTitle, voltarPlaylistsBtn;
 
console.log("Script Playlists carregado!");
 
// Espera o HTML carregar antes de executar o script
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - Playlists!");
   
    inicializarElementos(); // pega os elementos da tela
    inicializarEventListeners(); // adiciona funções nos botões
    carregarPlaylists(); // carrega playlists do servidor
});
 
 
// ======= LOCALIZA OS ELEMENTOS DO HTML =======
function inicializarElementos() {
    playlistsDiv = document.getElementById("playlists"); // lista de playlists
    playlistDetail = document.getElementById("playlistDetail"); // tela de músicas da playlist
    playlistMusicas = document.getElementById("playlistMusicas"); // lista de músicas dentro da playlist
    playlistTitle = document.getElementById("playlistTitle"); // título da playlist aberta
    voltarPlaylistsBtn = document.getElementById("voltarPlaylists"); // botão de voltar
 
    // mostra no console se os elementos foram encontrados
    console.log("🔍 Elementos inicializados:", {
        playlistsDiv: !!playlistsDiv,
        playlistDetail: !!playlistDetail,
        playlistMusicas: !!playlistMusicas,
        playlistTitle: !!playlistTitle,
        voltarPlaylistsBtn: !!voltarPlaylistsBtn
    });
}
 
 
// ======= ADICIONA FUNÇÕES AOS BOTÕES =======
function inicializarEventListeners() {
    const addPlaylistBtn = document.getElementById("addPlaylistBtn"); // botão de criar playlist
   
    if (addPlaylistBtn) {
        addPlaylistBtn.addEventListener("click", criarPlaylist); // quando clicar → chama criarPlaylist()
    }
   
    if (voltarPlaylistsBtn) {
        voltarPlaylistsBtn.addEventListener("click", voltarParaPlaylists); // botão de voltar
    }
}
 
 
// ======= CRIA UMA NOVA PLAYLIST =======
async function criarPlaylist() {
    const name = prompt("Nome da nova playlist:"); // abre caixa pra digitar nome
   
    if (!name || name.trim() === "") return; // impede playlist vazia
 
    try {
        // envia ao servidor a nova playlist
        const response = await fetch(`${API_BASE}/playlists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() })
        });
 
        if (response.ok) {
            alert(`Playlist "${name}" criada!`);
            await carregarPlaylists(); // recarrega lista
        } else {
            alert("Erro ao criar playlist.");
        }
       
    } catch (error) {
        alert("Erro de conexão com o servidor.");
    }
}
 
 
// ======= BUSCA TODAS AS PLAYLISTS NO SERVIDOR =======
async function carregarPlaylists() {
    if (!playlistsDiv) return;
 
    try {
        const res = await fetch(`${API_BASE}/playlists`); // pega playlists
        const playlists = await res.json();
 
        playlistsDiv.innerHTML = ""; // limpa lista
 
        if (playlists.length === 0) {
            playlistsDiv.innerHTML = "<p>Nenhuma playlist criada ainda.</p>";
            return;
        }
 
        // cria um card para cada playlist
        playlists.forEach(pl => {
            const div = document.createElement("div");
            div.className = "playlistCard";
            div.innerHTML = `
                <h3>${pl.name}</h3>
                <p><small>ID: ${pl.id}</small></p>
                <button class="verBtn btn">Ver músicas</button>
                <button class="excluirBtn btn" style="background-color: #ff6b6b;">🗑️ Excluir</button>
            `;
           
            // abre playlist quando clicar
            div.querySelector(".verBtn").addEventListener("click", () => abrirPlaylist(pl.id, pl.name));
           
            // exclui playlist
            div.querySelector(".excluirBtn").addEventListener("click", () => excluirPlaylist(pl.id));
           
            playlistsDiv.appendChild(div);
        });
 
    } catch (error) {
        playlistsDiv.innerHTML = "<p>Erro ao carregar playlists.</p>";
    }
}
 
 
// ======= MOSTRA MÚSICAS DE UMA PLAYLIST =======
async function abrirPlaylist(id, name) {
    try {
        playlistMusicas.innerHTML = "Carregando músicas...";
       
        const res = await fetch(`${API_BASE}/playlists/${id}/musicas`); // pega músicas
        const musicas = await res.json();
       
        mostrarDetalhesPlaylist(name, musicas, id);
 
    } catch (error) {
        playlistMusicas.innerHTML = `<p>Erro ao carregar músicas.</p>`;
    }
}
 
 
// ======= MUDA TELA PARA VISUALIZAR UMA PLAYLIST =======
function mostrarDetalhesPlaylist(nomePlaylist, musicas, playlistId) {
    playlistsDiv.style.display = "none"; // esconde lista
    playlistDetail.style.display = "block"; // mostra músicas
    playlistTitle.textContent = `🎵 ${nomePlaylist} (${musicas.length} músicas)`; // coloca título
 
    playlistMusicas.innerHTML = ""; // limpa lista
 
    if (musicas.length === 0) {
        playlistMusicas.innerHTML = `
            <p>Nenhuma música nesta playlist ainda.</p>
            <button id="adicionarMusicaBtn" class="btn">➕ Adicionar Música</button>
        `;
        return;
    }
 
    // cria um card para cada música
    musicas.forEach((musica, index) => {
        const musicaDiv = document.createElement("div");
        musicaDiv.className = "musicaCard";
        musicaDiv.innerHTML = `
            <h4>${index + 1}. ${musica.title}</h4>
            <button class="playBtn btn">▶️</button>
            <button class="removerBtn btn" style="background-color: #ff6b6b;">❌</button>
        `;
       
        musicaDiv.querySelector(".playBtn").addEventListener("click", () => {
            alert(`Tocando: ${musica.title}`);
        });
       
        musicaDiv.querySelector(".removerBtn").addEventListener("click", () => {
            removerMusicaDaPlaylist(playlistId, musica.id || musica.videoId);
        });
       
        playlistMusicas.appendChild(musicaDiv);
    });
}
 
 
// ======= REMOVE UMA MÚSICA =======
async function removerMusicaDaPlaylist(playlistId, musicaId) {
    try {
        await fetch(`${API_BASE}/playlists/${playlistId}/musicas/${musicaId}`, { method: "DELETE" });
        const playlistName = playlistTitle.textContent.replace("🎵 ", "").split(" (")[0];
        abrirPlaylist(playlistId, playlistName); // atualiza tela
 
    } catch (error) {
        alert("Erro ao remover música.");
    }
}
 
 
// ======= REMOVE UMA PLAYLIST =======
async function excluirPlaylist(playlistId) {
    if (!confirm("Excluir playlist?")) return;
 
    try {
        await fetch(`${API_BASE}/playlists/${playlistId}`, { method: "DELETE" });
        alert("Playlist excluída!");
        carregarPlaylists();
 
    } catch (error) {
        alert("Erro ao excluir playlist.");
    }
}
 
 
// ======= VOLTA PARA TELA INICIAL =======
function voltarParaPlaylists() {
    playlistDetail.style.display = "none"; // esconde músicas
    playlistsDiv.style.display = "block"; // mostra playlists
    carregarPlaylists(); // recarrega
}
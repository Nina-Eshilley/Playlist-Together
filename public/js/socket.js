// Cria o socket apenas se ainda não existir
window.socket = window.socket || io("http://localhost:3000");
console.log("socket.js carregou!");

const socket = window.socket; // referência para uso local

console.log("socket.js carregou!");

const perfilAtualSocket = JSON.parse(localStorage.getItem("currentProfile"));

// Envia info quando entra
socket.emit("perfilOnline", {
  perfil_id: perfilAtualSocket.perfil_id,
  nome: perfilAtualSocket.nome
});

// Atualiza lista de online
socket.on("onlineList", lista => {
  document.querySelectorAll(".amigo").forEach(div => {
    const id = div.getAttribute("data-id");
    const status = div.querySelector(".status");

    if (lista.includes(parseInt(id))) {
      status.textContent = "🟢 Online";
      status.style.color = "#4CAF50";
    } else {
      status.textContent = "🔴 Offline";
      status.style.color = "gray";
    }
  });
});

// Recebe notificação de música
socket.on("musicNotification", ({ nome, musica, playlistUrl }) => {
  if (typeof mostrarNotificacao === "function") {
    mostrarNotificacao(nome, musica, playlistUrl);
  }
});

// Função para emitir notificação quando a pessoa dá play
function enviarNotificacaoMusica(musica, playlistUrl) {
  socket.emit("musicPlaying", {
    perfil_id: perfilAtualSocket.perfil_id,
    nome: perfilAtualSocket.nome,
    musica,
    playlistUrl
  });
}

window.enviarNotificacaoMusica = enviarNotificacaoMusica;

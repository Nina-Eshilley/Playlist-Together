// Cria socket global apenas uma vez
if (!window.socket) {
  window.socket = io("http://localhost:3000");
  console.log("🔌 Socket criado!");
}

const socket = window.socket;

// Quando conecta, avisa ao server
socket.on("connect", () => {
  console.log("🟢 Conectado ao servidor Socket!");

  const perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));
  if (perfilAtual) {
    socket.emit("perfilOnline", {
      perfil_id: perfilAtual.perfil_id,
      nome: perfilAtual.nome
    });
  }
});

// Receber notificação global
socket.on("musicNotification", (data) => {
  console.log("📢 Notificação de música recebida:", data);
  if (typeof mostrarNotificacao === "function") {
    mostrarNotificacao(data.nome, data.musica, data.playlistUrl);
  }
});

// Função pública para enviar notificação
function enviarNotificacaoMusica(musica, playlistUrl) {
  const perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfilAtual) {
    console.error("Perfil não encontrado para enviar notificação");
    return;
  }

  socket.emit("musicPlaying", {
    perfil_id: perfilAtual.perfil_id,
    nome: perfilAtual.nome,
    musica,
    playlistUrl
  });
  
  console.log("📤 Notificação enviada:", musica);
}

window.enviarNotificacaoMusica = enviarNotificacaoMusica;
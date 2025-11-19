// ======================= ELEMENTOS =======================
console.log("amigos.js carregou!");

const lista = document.getElementById("lista-amigos");
const notificacaoContainer = document.getElementById("notificacao-container");

const perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));
const contaId = localStorage.getItem("conta_id");

// ======================= SOCKET =======================
// ======================= SOCKET =======================
// Usa o socket global já criado
// Apenas use o socket global diretamente
window.socket.on("connect", () => {
  console.log("🔌 Conectado ao servidor!");
  
  const perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));
  if (perfilAtual) {
    window.socket.emit("perfilOnline", {
      perfil_id: perfilAtual.perfil_id,
      nome: perfilAtual.nome
    });
  }
});

// Quando receber lista de online
window.socket.on("onlineList", (onlineUsers) => {
  document.querySelectorAll(".amigo").forEach(div => {
    const id = Number(div.getAttribute("data-id"));
    const status = div.querySelector(".status");

    if (onlineUsers.includes(id)) {
      status.textContent = "🟢 Online";
      status.style.color = "lime";
    } else {
      status.textContent = "Offline";
      status.style.color = "gray";
    }
  });
});


// Envia quando conecta
socket.on("connect", () => {
  console.log("🔌 Conectado ao servidor!");

  if (perfilAtual) {
    socket.emit("perfilOnline", {
      perfil_id: perfilAtual.perfil_id,
      nome: perfilAtual.nome
    });
  }
});

// Atualiza lista quando servidor manda quem está online
socket.on("onlineList", (onlineUsers) => {
  document.querySelectorAll(".amigo").forEach(div => {
    const id = Number(div.getAttribute("data-id"));
    const status = div.querySelector(".status");

    if (onlineUsers.includes(id)) {
      status.textContent = "🟢 Online";
      status.style.color = "lime";
    } else {
      status.textContent = "Offline";
      status.style.color = "gray";
    }
  });
});


// ======================= CARREGAR AMIGOS =======================
async function carregarAmigos() {
  const res = await fetch(`${API_BASE}/api/perfis/${contaId}`);
  const perfis = await res.json();

  lista.innerHTML = "";

  perfis.forEach(p => {
    if (p.perfil_id !== perfilAtual.perfil_id) {
      const div = document.createElement("div");
      div.className = "amigo";
      div.setAttribute("data-id", p.perfil_id);

      div.innerHTML = `
      <img src="${p.imagem || 'default.png'}">
      <div>
        <strong>${p.nome}</strong>
        <div class="status">Offline</div>
      </div>
      `;

      lista.appendChild(div);
    }
  });

  // pede ao servidor a lista de quem está online
  socket.emit("getOnlineUsers");
}

carregarAmigos();


// ======================= NOTIFICAÇÃO DE MÚSICA =======================

// Quando outra pessoa começar a ouvir música
socket.on("musicNotification", ({ nome, musica, playlistUrl }) => {
  mostrarNotificacao(nome, musica, playlistUrl);
});

function mostrarNotificacao(nome, musica, playlistUrl) {
  const box = document.createElement("div");
  box.className = "notificacao";

  box.innerHTML = `
    <p><strong>${nome}</strong> está ouvindo agora:</p>
    <p>🎧 <strong>${musica}</strong></p>
    <button class="ouvir-btn">Ouvir junto</button>
  `;

  box.querySelector(".ouvir-btn").addEventListener("click", () => {
    window.location.href = playlistUrl; 
  });

  notificacaoContainer.appendChild(box);

  setTimeout(() => box.remove(), 10000);
}

window.mostrarNotificacao = mostrarNotificacao;

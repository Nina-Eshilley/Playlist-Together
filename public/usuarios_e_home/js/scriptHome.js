document.addEventListener('DOMContentLoaded', () => {
  const welcomeEl = document.getElementById('welcome');
  const avatarEl = document.getElementById('avatar');

  const perfil = JSON.parse(localStorage.getItem('currentProfile'));

  if (!perfil) {
    welcomeEl.textContent = 'Perfil não encontrado!';
    avatarEl.style.display = 'none';
    return;
  }

  welcomeEl.textContent = `Olá, ${perfil.nome}!`;

  if (perfil.imagem.startsWith('data:image')) {
    avatarEl.src = perfil.imagem;
  } else {
    avatarEl.src = `./../img/${perfil.imagem}`;
  }
});

const API_BASE = "http://localhost:3000";
const maisOuvidasDiv = document.getElementById("maisOuvidas");
const youtubePlayer = document.getElementById("youtubePlayer");

// Carregar músicas mais acessadas
async function carregarMaisOuvidas() {
  try {
    const res = await fetch(`${API_BASE}/maisouvidas`);
    const top = await res.json();
    maisOuvidasDiv.innerHTML = "";

    top.forEach((m, i) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" alt="${m.title}">
        <h3>${i + 1}. ${m.title}</h3>
        <p>${m.artist}</p>
        <p>🔥 Tocada ${m.count || 1}x</p>
        <button class="playBtn btn btn-warning">▶ Ouvir</button>
      `;

      // Abre o player na própria home
      div.querySelector(".playBtn").addEventListener("click", () => {
        youtubePlayer.src = `https://www.youtube.com/embed/${m.videoId}?autoplay=1`;
        registrarOuvida(m);
      });

      maisOuvidasDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar mais ouvidas:", err);
  }
}

// Registrar música tocada
async function registrarOuvida(music) {
  try {
    await fetch(`${API_BASE}/maisouvidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(music)
    });
  } catch (err) {
    console.error("Erro ao registrar música:", err);
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", carregarMaisOuvidas);


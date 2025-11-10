const API_BASE = "http://localhost:3000";
const welcomeEl = document.getElementById("welcome");
const avatarEl = document.getElementById("avatar");
const maisOuvidasDiv = document.getElementById("maisOuvidas");

// ======= Perfil e Boas-vindas =======
document.addEventListener("DOMContentLoaded", async () => {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));

  if (!perfil) {
    welcomeEl.textContent = "Perfil não encontrado!";
    avatarEl.style.display = "none";
    return;
  }

  welcomeEl.textContent = `Olá, ${perfil.nome}!`;

  avatarEl.src = perfil.imagem.startsWith("data:image")
    ? perfil.imagem
    : `./../img/${perfil.imagem}`;

  await carregarMaisOuvidas(perfil.perfil_id);
  carregarFavoritos();
});

// ======= Mais Ouvidas =======
async function carregarMaisOuvidas(perfil_id) {
  try {
    const res = await fetch(`${API_BASE}/maisouvidas/${perfil_id}`);
    const top = await res.json();

    maisOuvidasDiv.innerHTML = "";

    if (!top || top.length === 0) {
      maisOuvidasDiv.innerHTML = "<p>Nenhuma música ouvida ainda 🎧</p>";
      return;
    }

    top.forEach((m, i) => {
      const div = document.createElement("div");
      div.className = "card";
      div.style.cssText = `
        margin:10px;padding:10px;background:#3a210d;border-radius:10px;
        color:#ffcd7c;text-align:center;width:220px;display:inline-block;
      `;

      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" 
             alt="${m.title}" width="100%" style="border-radius:8px;">
        <h3 style="font-size:16px;margin-top:10px;">${i + 1}. ${m.title}</h3>
        <p style="font-size:14px;">${m.artist}</p>
        <p style="font-size:13px;">🔥 Tocada ${m.count}x</p>
        <button class="playBtn" style="background:#ffcd7c;color:#251400;border:none;border-radius:5px;padding:5px 10px;cursor:pointer;">▶ Ouvir</button>
      `;

      div.querySelector(".playBtn").addEventListener("click", () => {
        window.location.href = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(m.title)}&artist=${encodeURIComponent(m.artist)}&videoId=${m.videoId}`;
      });

      maisOuvidasDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar mais ouvidas:", err);
    maisOuvidasDiv.innerHTML = "<p>Erro ao carregar músicas.</p>";
  }
}

// ======= Favoritos =======
function carregarFavoritos() {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return;

  const chave = `favoritos_${perfil.perfil_id}`;
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];

  const container = document.getElementById("favoritos");
  if (!container) return;

  container.innerHTML = favoritos.length
    ? ""
    : "<p>Nenhuma música adicionada aos favoritos 💛</p>";

  favoritos.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.cssText = `
      margin:10px;padding:10px;background:#3a210d;border-radius:10px;
      color:#ffcd7c;text-align:center;width:220px;display:inline-block;
    `;

    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" alt="${m.title}" width="100%" style="border-radius:8px;">
      <h3 style="font-size:16px;margin-top:10px;">${m.title}</h3>
      <p style="font-size:14px;">${m.artist}</p>
      <button class="playBtn" style="background:#ffcd7c;color:#251400;border:none;border-radius:5px;padding:5px 10px;cursor:pointer;">▶ Ouvir</button>
      <button class="removeFavBtn" style="background:#a14b00;color:#fff;border:none;border-radius:5px;padding:5px 10px;margin-top:5px;cursor:pointer;">✖ Remover</button>
    `;

    div.querySelector(".playBtn").addEventListener("click", () => {
      window.location.href = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(m.title)}&artist=${encodeURIComponent(m.artist)}&videoId=${m.videoId}`;
    });

    div.querySelector(".removeFavBtn").addEventListener("click", () => {
      removerFavorito(m.videoId);
      carregarFavoritos();
    });

    container.appendChild(div);
  });
}

function removerFavorito(videoId) {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return;

  const chave = `favoritos_${perfil.perfil_id}`;
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];

  const novos = favoritos.filter(f => f.videoId !== videoId);
  localStorage.setItem(chave, JSON.stringify(novos));
}

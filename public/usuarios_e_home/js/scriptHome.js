const API_BASE = "http://localhost:3000";
const welcomeEl = document.getElementById("welcome");
const avatarEl = document.getElementById("avatar");
const maisOuvidasDiv = document.getElementById("maisOuvidas");

document.addEventListener("DOMContentLoaded", async () => {
  // ---- Perfil e boas-vindas ----
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));

  if (!perfil) {
    welcomeEl.textContent = "Perfil não encontrado!";
    avatarEl.style.display = "none";
    return;
  }

  welcomeEl.textContent = `Olá, ${perfil.nome}!`;

  if (perfil.imagem.startsWith("data:image")) {
    avatarEl.src = perfil.imagem;
  } else {
    avatarEl.src = `./../img/${perfil.imagem}`;
  }

  // ---- Carregar músicas mais ouvidas ----
  await carregarMaisOuvidas(perfil.perfil_id);
});

// ---- Função para buscar e exibir as mais ouvidas ----
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
      div.style.margin = "10px";
      div.style.padding = "10px";
      div.style.backgroundColor = "#3a210d";
      div.style.borderRadius = "10px";
      div.style.color = "#ffcd7c";
      div.style.textAlign = "center";
      div.style.width = "220px";
      div.style.display = "inline-block";

      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg" 
             alt="${m.title}" 
             width="100%" 
             style="border-radius: 8px;">
        <h3 style="font-size: 16px; margin-top: 10px;">${i + 1}. ${m.title}</h3>
        <p style="font-size: 14px;">${m.artist}</p>
        <p style="font-size: 13px;">🔥 Tocada ${m.count}x</p>
        <button class="playBtn" 
                style="background-color: #ffcd7c; color: #251400; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer;">
          ▶ Ouvir
        </button>
      `;

      div.querySelector(".playBtn").addEventListener("click", () => {
        window.location.href = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(
          m.title
        )}&artist=${encodeURIComponent(m.artist)}&videoId=${m.videoId}`;
      });

      maisOuvidasDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar mais ouvidas:", err);
    maisOuvidasDiv.innerHTML = "<p>Erro ao carregar músicas.</p>";
  }
}

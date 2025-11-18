// URL base da API backend
const API_BASE = "http://localhost:3000";
 
// Pegando elementos do HTML pelo ID
const welcomeEl = document.getElementById("welcome");
const avatarEl = document.getElementById("avatar");
const maisOuvidasDiv = document.getElementById("maisOuvidas");
 
 
// ======= Perfil e Boas-vindas =======
document.addEventListener("DOMContentLoaded", async () => {
  // Executa quando o HTML terminar de carregar
 
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  // Obtém o perfil salvo no localStorage e transforma de texto pra objeto
 
  if (!perfil) {
    // Se não existir perfil
    welcomeEl.textContent = "Perfil não encontrado!";
    avatarEl.style.display = "none"; // Esconde foto
    return; // Encerra a função
  }
 
  // Mostra um texto de boas-vindas com o nome da pessoa
  welcomeEl.textContent = `Olá, ${perfil.nome}!`;
 
  // Define a imagem do avatar
  avatarEl.src = perfil.imagem.startsWith("data:image")
    ? perfil.imagem // Se for imagem base64, usa ela diretamente
    : `./../img/${perfil.imagem}`; // Se for arquivo, usa a pasta img
 
  // Carrega músicas mais ouvidas e favoritos
  await carregarMaisOuvidas(perfil.perfil_id);
  carregarFavoritos();
});
 
 
// ======= Mais Ouvidas =======
async function carregarMaisOuvidas(perfil_id) {
  try {
    // Faz requisição ao servidor buscando as músicas mais ouvidas desse usuário
    const res = await fetch(`${API_BASE}/maisouvidas/${perfil_id}`);
    const top = await res.json(); // Converte resposta para JSON
 
    maisOuvidasDiv.innerHTML = ""; // Limpa a área antes de preencher
 
    if (!top || top.length === 0) {
      // Caso não tenha músicas salvas
      maisOuvidasDiv.innerHTML = "<p>Nenhuma música ouvida ainda 🎧</p>";
      return;
    }
 
    top.forEach((m, i) => {
      // Para cada música retornada, cria um card
 
      const div = document.createElement("div"); // Cria um elemento div
      div.className = "card"; // Define classe
      div.style.cssText = `
        margin:10px;padding:10px;background:#3a210d;border-radius:10px;
        color:#ffcd7c;text-align:center;width:220px;display:inline-block;
      `; // Estilo do card
 
      // Conteúdo HTML dentro do card
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg"
             alt="${m.title}" width="100%" style="border-radius:8px;">
        <h3 style="font-size:16px;margin-top:10px;">${i + 1}. ${m.title}</h3>
        <p style="font-size:14px;">${m.artist}</p>
        <p style="font-size:13px;">🔥 Tocada ${m.count}x</p>
        <button class="playBtn" style="background:#ffcd7c;color:#251400;border:none;border-radius:5px;padding:5px 10px;cursor:pointer;">▶ Ouvir</button>
      `;
 
      // Botão para abrir a música na tela de player
      div.querySelector(".playBtn").addEventListener("click", () => {
        window.location.href = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(m.title)}&artist=${encodeURIComponent(m.artist)}&videoId=${m.videoId}`;
      });
 
      // Adiciona o card dentro da div principal
      maisOuvidasDiv.appendChild(div);
    });
 
  } catch (err) {
    // Caso aconteça erro na requisição
    console.error("Erro ao carregar mais ouvidas:", err);
    maisOuvidasDiv.innerHTML = "<p>Erro ao carregar músicas.</p>";
  }
}
 
 
// ======= Favoritos =======
function carregarFavoritos() {
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return; // Se não tiver perfil, sai
 
  // Nome da chave no localStorage específica para esse perfil
  const chave = `favoritos_${perfil.perfil_id}`;
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];
  // Busca favoritos ou cria um array vazio
 
  const container = document.getElementById("favoritos");
  if (!container) return;
 
  // Se houver favoritos, limpa para preencher; se não, mostra aviso
  container.innerHTML = favoritos.length
    ? ""
    : "<p>Nenhuma música adicionada aos favoritos 💛</p>";
 
  favoritos.forEach(m => {
    // Cria um card para cada música favorita
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
 
    // Botão para ouvir música
    div.querySelector(".playBtn").addEventListener("click", () => {
      window.location.href = `../usuarios_e_home/ouvir.html?title=${encodeURIComponent(m.title)}&artist=${encodeURIComponent(m.artist)}&videoId=${m.videoId}`;
    });
 
    // Botão para remover a música dos favoritos
    div.querySelector(".removeFavBtn").addEventListener("click", () => {
      removerFavorito(m.videoId); // Remove do localStorage
      carregarFavoritos(); // Atualiza tela
    });
 
    container.appendChild(div);
  });
}
 
 
function removerFavorito(videoId) {
  // Obtém novamente o perfil
  const perfil = JSON.parse(localStorage.getItem("currentProfile"));
  if (!perfil) return;
 
  // Nome da chave do perfil
  const chave = `favoritos_${perfil.perfil_id}`;
 
  // Pega a lista de favoritos
  const favoritos = JSON.parse(localStorage.getItem(chave)) || [];
 
  // Remove o item filtrando pelo id
  const novos = favoritos.filter(f => f.videoId !== videoId);
 
  // Salva lista atualizada
  localStorage.setItem(chave, JSON.stringify(novos));
}
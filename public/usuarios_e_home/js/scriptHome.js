document.addEventListener('DOMContentLoaded', () => {
  const welcomeEl = document.getElementById('welcome');
  const avatarEl = document.getElementById('avatar');

  const perfil = JSON.parse(localStorage.getItem('currentProfile'));

  if (!perfil) {
    welcomeEl.textContent = 'Perfil não encontrado!';
    avatarEl.style.display = 'none';
    return;
  }

  welcomeEl.textContent = `Bem-vindo(a), ${perfil.nome}!`;

  // Se for Base64, usa direto; se for caminho local, adiciona o caminho da pasta
  if (perfil.imagem.startsWith('data:image')) {
    avatarEl.src = perfil.imagem;
  } else {
    avatarEl.src = `./../img/${perfil.imagem}`;
  }
});

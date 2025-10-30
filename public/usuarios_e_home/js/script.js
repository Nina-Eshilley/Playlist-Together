const profilesContainer = document.getElementById('profiles'); // onde os perfis aparecem
const addProfileBtn = document.getElementById('addProfileBtn'); // botão de adicionar novo perfil
const modal = document.getElementById('editModal'); // modal (caixinha) de edição/adicionar perfil
const saveProfileBtn = document.getElementById('saveProfileBtn'); // botão de salvar dentro do modal
const cancelEditBtn = document.getElementById('cancelEditBtn'); // botão de cancelar no modal
const nameInput = document.getElementById('profileName'); // campo de texto pro nome do perfil
const imgInput = document.getElementById('profileImage'); // input pra imagem do perfil
const addProfileContainer = document.querySelector('.add-profile'); //bloco do botão e texto de adicionar perfil
const deleteProfileBtn = document.getElementById('deleteProfileBtn');

// Carrega os perfis salvos no localStorage, senão começa com um array vazio
let profiles = JSON.parse(localStorage.getItem('profiles')) || [];

// Guarda o índice do perfil que estamos editando (se for null, é novo)
let editingIndex = null;

//  Função principal que mostra todos os perfis na tela
function renderProfiles() {

  // Limpa o container de perfis antes de recriar tudo
  profilesContainer.innerHTML = '';

  // Percorre todos os perfis e cria os elementos visuais
  profiles.forEach((p, index) => {

    // Cria um div pra cada perfil
    const div = document.createElement('div');
    div.className = 'profile';

    // Define o conteúdo HTML de cada perfil (imagem + nome)
    div.innerHTML = `
      <p>${p.name}</p>
      <img src="${p.image || 'default.png'}" alt="${p.name}">
      <button class="edit-btn" title="Editar perfil" data-index="${index}">✏️</button>
    `;

    //  Abre a página inicial do perfil ao clicar nele
    div.onclick = () => openProfile(index);

    // Adiciona o evento de clique no ícone de edição
    div.querySelector('.edit-btn').onclick = (e) => {
      e.stopPropagation(); // impede o clique de abrir o perfil
      const indexToEdit = parseInt(e.target.getAttribute('data-index'));
      editProfile(indexToEdit);
    };

    // Adiciona o perfil dentro do container
    profilesContainer.appendChild(div);
  });
}

 if (profiles.length >= 4) {
    addProfileContainer.style.display = 'none';
  } else {
    addProfileContainer.style.display = 'inline-block';
  }

//  Abre o perfil selecionado e vai pra página home.html
function openProfile(index) {
  // Salva no localStorage qual perfil foi escolhido
  localStorage.setItem('currentProfile', JSON.stringify(profiles[index]));

  // Redireciona pra página inicial do perfil
  window.location.href = 'home.html';
}

//  Abre o modal pra editar um perfil existente
function editProfile(index) {
  editingIndex = index; // guarda o índice pra saber quem estamos alterando
  modal.classList.remove('hidden'); // mostra o modal
  nameInput.value = profiles[index].name; // preenche o nome atual
  imgInput.value = ''; // limpa o input de imagem (pois não dá pra pré-carregar por segurança)
  deleteProfileBtn.classList.remove('hidden');
}

//  Salva o perfil (novo ou editado)
function saveProfile() {
  const name = nameInput.value.trim(); // pega o nome digitado

  // Se o nome estiver vazio, mostra um alerta
  if (!name) return alert('Insira um nome!');

  // O FileReader serve pra transformar a imagem escolhida em base64
  const reader = new FileReader();

  // Quando o FileReader terminar de "ler" o arquivo:
  reader.onload = function () {
    // Se tiver imagem nova, usa ela. Senão, usa a que já existe ou uma padrão
    const image =
      reader.result ||
      (profiles[editingIndex] && profiles[editingIndex].image) ||
      'default.png';

    // Cria um objeto com o nome e imagem do perfil
    const newProfile = { name, image };

    // Se estamos editando, substituímos o perfil antigo
    if (editingIndex !== null) profiles[editingIndex] = newProfile;
    // Se for novo, adicionamos ao final da lista
    else profiles.push(newProfile);

    // Salva tudo no localStorage (em formato de texto)
    localStorage.setItem('profiles', JSON.stringify(profiles));

    // Fecha o modal e atualiza a lista de perfis
    modal.classList.add('hidden');
    renderProfiles();
  };

  // Se o usuário escolheu uma nova imagem, lemos o arquivo
  if (imgInput.files[0]) reader.readAsDataURL(imgInput.files[0]);
  // Se não escolheu imagem nova, apenas chama o onload manualmente
  else reader.onload();
}

//  Quando clicar no botão de "Adicionar Perfil"
addProfileBtn.onclick = () => {
  editingIndex = null; // define como novo perfil
  nameInput.value = ''; // limpa o campo de nome
  imgInput.value = ''; // limpa o campo de imagem
  modal.classList.remove('hidden'); // mostra o modal
  
  // Esconde o botão "Excluir perfil" quando for novo perfil
  deleteProfileBtn.classList.add('hidden');
};

deleteProfileBtn.onclick = () => {
  if (editingIndex === null) return;

  // Confirmação simples antes de excluir
  const confirmDelete = confirm(`Tem certeza que deseja excluir o perfil "${profiles[editingIndex].name}"?`);
  if (!confirmDelete) return;

  // Remove o perfil do array
  profiles.splice(editingIndex, 1);

  // Atualiza o localStorage
  localStorage.setItem('profiles', JSON.stringify(profiles));

  // Fecha o modal
  modal.classList.add('hidden');

  // Reseta o índice de edição
  editingIndex = null;

  // Re-renderiza os perfis e verifica se o botão de adicionar deve aparecer
  renderProfiles();
};

//  Botão de "Salvar" dentro do modal
saveProfileBtn.onclick = saveProfile;

//  Botão de "Cancelar" dentro do modal
cancelEditBtn.onclick = () => modal.classList.add('hidden');

//  Mostrar os perfis salvos
renderProfiles();

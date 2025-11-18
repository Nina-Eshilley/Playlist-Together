document.addEventListener('DOMContentLoaded', () => {
  // Espera o HTML carregar antes de rodar o script
 
  // ======= Seleciona elementos do DOM =======
  const profilesContainer = document.getElementById('profiles'); // onde os perfis serão exibidos
  const addProfileBtn = document.getElementById('addProfileBtn'); // botão de adicionar perfil
  const modal = document.getElementById('editModal'); // modal de edição/criação
  const saveProfileBtn = document.getElementById('saveProfileBtn'); // botão salvar perfil
  const cancelEditBtn = document.getElementById('cancelEditBtn'); // botão cancelar edição
  const nameInput = document.getElementById('profileName'); // input do nome
  const imgInput = document.getElementById('profileImage'); // input da imagem
  const addProfileContainer = document.querySelector('.add-profile'); // container visual do botão de add
  const deleteProfileBtn = document.getElementById('deleteProfileBtn'); // botão deletar perfil
 
  // ======= Variáveis internas =======
  let profiles = []; // array que armazena perfis carregados
  let editingIndex = null; // controla se está editando ou criando um novo
  const conta_id = localStorage.getItem('conta_id'); // pega ID da conta logada
  const API_URL = 'http://localhost:3000/api/perfis'; // URL da API
 
  function showError(msg) { console.error(msg); } // função simples pra mostrar erros
 
 
  // ======= Carregar perfis da API =======
  async function carregarPerfis() {
    if (!conta_id) return console.warn('Conta não encontrada.');
   
    try {
      const res = await fetch(`${API_URL}/${conta_id}`); // busca perfis pelo ID da conta
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
     
      profiles = await res.json(); // salva perfis na variável global
      renderProfiles(); // atualiza o layout
    } catch (err) {
      showError('Erro ao carregar perfis: ' + err.message);
    }
  }
 
  // ======= Criar perfil na API =======
  async function salvarPerfil(nome, imagem) {
    const perfil = { conta_id, nome, imagem }; // objeto com dados do perfil
 
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfil)
    });
 
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Falha ao criar perfil');
    }
 
    return await res.json();
  }
 
  // ======= Editar perfil já existente =======
  async function editarPerfil(perfil_id, nome, imagem) {
    const res = await fetch(`${API_URL}/${perfil_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, imagem })
    });
 
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Falha ao editar perfil');
    }
 
    return await res.json();
  }
 
  // ======= Deletar um perfil =======
  async function deletarPerfil(perfil_id) {
    const res = await fetch(`${API_URL}/${perfil_id}`, { method: 'DELETE' });
   
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Falha ao deletar perfil');
    }
 
    return await res.json();
  }
 
  // ======= Exibe os perfis na tela =======
  function renderProfiles() {
    profilesContainer.innerHTML = ''; // limpa o container
 
    profiles.forEach((p, index) => {
      const div = document.createElement('div');
      div.className = 'profile';
 
      const nome = p.nome ?? 'Sem nome';
      const imagem = p.imagem ?? 'default.png';
 
      div.innerHTML = `<p>${nome}</p><img src="${imagem}" alt="${nome}">`;
 
      // botão de editar
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.setAttribute('tabindex', '-1');
      editBtn.innerHTML = `<img src="./../img/lapis.png" alt="Editar" class="edit-icon">`;
      editBtn.onclick = (e) => {
        e.stopPropagation(); // impede abrir o perfil ao clicar no lápis
        editProfile(index);
      };
 
      div.appendChild(editBtn);
 
      // clique no perfil abre o app
      div.onclick = () => openProfile(index);
 
      profilesContainer.appendChild(div);
    });
 
    // esconde botão de adicionar se já existirem 4 perfis
    addProfileContainer.style.display = profiles.length >= 4 ? 'none' : 'inline-block';
  }
 
  // ======= Abre um perfil escolhido =======
  function openProfile(index) {
    localStorage.setItem('currentProfile', JSON.stringify(profiles[index]));
    window.location.href = 'home.html'; // redireciona
  }
 
  // ======= Prepara a edição de um perfil =======
  function editProfile(index) {
    editingIndex = index;
    const perfil = profiles[index];
   
    nameInput.value = perfil.nome ?? '';
    imgInput.value = '';
   
    modal.classList.remove('hidden'); // mostra modal
    deleteProfileBtn.classList.remove('hidden'); // mostra botão excluir
  }
 
  // ======= Salvar perfil (novo ou editado) =======
  async function saveProfile() {
    const nome = nameInput.value.trim();
    if (!nome) return alert('Insira um nome!');
    if (!conta_id) return alert('Usuário não identificado. Faça login.');
 
    const file = imgInput.files[0];
 
    // se usuário escolheu imagem nova, ela é convertida
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => { await sendProfile(nome, reader.result); };
      reader.readAsDataURL(file);
    } else {
      // mantém imagem antiga caso não selecione outra
      const imagem = editingIndex !== null
        ? profiles[editingIndex].imagem ?? 'default.png'
        : 'default.png';
 
      await sendProfile(nome, imagem);
    }
  }
 
  // ======= Envia os dados para API (create/update) =======
  async function sendProfile(nome, imagem) {
    try {
      if (editingIndex !== null) {
        const perfil = profiles[editingIndex];
        await editarPerfil(perfil.perfl_id, nome, imagem); // editar
      } else {
        await salvarPerfil(nome, imagem); // criar novo
      }
 
      await carregarPerfis(); // recarrega lista
      modal.classList.add('hidden'); // fecha modal
      editingIndex = null;
     
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert(err.message);
    }
  }
 
  // ======= Eventos dos botões =======
  addProfileBtn.onclick = () => {
    editingIndex = null;
    nameInput.value = '';
    imgInput.value = '';
    modal.classList.remove('hidden');
    deleteProfileBtn.classList.add('hidden'); // não mostra excluir em criação
  };
 
  deleteProfileBtn.onclick = async () => {
    if (editingIndex === null) return;
 
    const perfil = profiles[editingIndex];
    if (!perfil.perfil_id) return alert('ID do perfil não encontrado.');
 
    if (!confirm(`Deseja excluir "${perfil.nome}"?`)) return;
 
    try {
      await deletarPerfil(perfil.perfil_id);
      await carregarPerfis();
      modal.classList.add('hidden');
      editingIndex = null;
     
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
 
  saveProfileBtn.onclick = saveProfile;
  cancelEditBtn.onclick = () => modal.classList.add('hidden');
 
  // carrega perfis automaticamente se o usuário estiver logado
  if (conta_id) carregarPerfis();
});
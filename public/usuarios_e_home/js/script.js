document.addEventListener('DOMContentLoaded', () => {
  const profilesContainer = document.getElementById('profiles');
  const addProfileBtn = document.getElementById('addProfileBtn');
  const modal = document.getElementById('editModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const nameInput = document.getElementById('profileName');
  const imgInput = document.getElementById('profileImage');
  const addProfileContainer = document.querySelector('.add-profile');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');

  let profiles = [];
  let editingIndex = null;
  const conta_id = localStorage.getItem('conta_id'); 
  const API_URL = 'http://localhost:3000/api/perfis';

  function showError(msg) { console.error(msg); }

  async function carregarPerfis() {
    if (!conta_id) return console.warn('Conta não encontrada.');
    try {
      const res = await fetch(`${API_URL}/${conta_id}`);
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      profiles = await res.json();
      renderProfiles();
    } catch (err) { showError('Erro ao carregar perfis: ' + err.message); }
  }

  async function salvarPerfil(nome, imagem) {
    const perfil = { conta_id, nome, imagem };
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

  async function editarPerfil(id, nome, imagem) {
    const res = await fetch(`${API_URL}/${id}`, {
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

  async function deletarPerfil(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Falha ao deletar perfil');
    }
    return await res.json();
  }

  function renderProfiles() {
    profilesContainer.innerHTML = '';
    profiles.forEach((p, index) => {
      const div = document.createElement('div');
      div.className = 'profile';
      const nome = p.nome ?? 'Sem nome';
      const imagem = p.imagem ?? 'default.png';
      div.innerHTML = `<p>${nome}</p><img src="${imagem}" alt="${nome}">`;

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.setAttribute('tabindex', '-1');
      editBtn.innerHTML = `<img src="./../img/lapis.png" alt="Editar" class="edit-icon">`;
      editBtn.onclick = (e) => { e.stopPropagation(); editProfile(index); };
      div.appendChild(editBtn);

      div.onclick = () => openProfile(index);
      profilesContainer.appendChild(div);
    });

    addProfileContainer.style.display = profiles.length >= 4 ? 'none' : 'inline-block';
  }

  function openProfile(index) {
    localStorage.setItem('currentProfile', JSON.stringify(profiles[index]));
    window.location.href = 'home.html';
  }

  function editProfile(index) {
    editingIndex = index;
    const perfil = profiles[index];
    nameInput.value = perfil.nome ?? '';
    imgInput.value = '';
    modal.classList.remove('hidden');
    deleteProfileBtn.classList.remove('hidden');
  }

  async function saveProfile() {
    const nome = nameInput.value.trim();
    if (!nome) return alert('Insira um nome!');
    if (!conta_id) return alert('Usuário não identificado. Faça login.');

    const file = imgInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => { await sendProfile(nome, reader.result); };
      reader.readAsDataURL(file);
    } else {
      const imagem = editingIndex !== null ? profiles[editingIndex].imagem ?? 'default.png' : 'default.png';
      await sendProfile(nome, imagem);
    }
  }

  async function sendProfile(nome, imagem) {
    try {
      if (editingIndex !== null) {
        const perfil = profiles[editingIndex];
        await editarPerfil(perfil.id, nome, imagem);
      } else {
        await salvarPerfil(nome, imagem);
      }
      await carregarPerfis();
      modal.classList.add('hidden');
      editingIndex = null;
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert(err.message);
    }
  }

  addProfileBtn.onclick = () => {
    editingIndex = null;
    nameInput.value = '';
    imgInput.value = '';
    modal.classList.remove('hidden');
    deleteProfileBtn.classList.add('hidden');
  };

  deleteProfileBtn.onclick = async () => {
    if (editingIndex === null) return;
    const perfil = profiles[editingIndex];
    if (!perfil.id) return alert('ID do perfil não encontrado.');
    if (!confirm(`Deseja excluir "${perfil.nome}"?`)) return;
    try {
      await deletarPerfil(perfil.id);
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

  if (conta_id) carregarPerfis();
});

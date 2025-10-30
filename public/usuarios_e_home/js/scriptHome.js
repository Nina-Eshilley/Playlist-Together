    const profile = JSON.parse(localStorage.getItem('currentProfile'));
    if (profile) {
      document.getElementById('welcome').textContent = `Olá, ${profile.name}!`;
      document.getElementById('avatar').src = profile.image;
    } else {
      window.location.href = 'usuarios.html';
    }
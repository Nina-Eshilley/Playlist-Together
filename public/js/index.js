// DOM ELEMENTS
const form = document.getElementById('form');                     
const signupFormulario = document.getElementById('signupFormulario'); 
const mostrarCadastro = document.getElementById('mostrarCadastro');   
const voltarLogin = document.getElementById('voltarLogin');           
const telaLogin = document.getElementById('tela-login');              
const telaCadastro = document.getElementById('tela-cadastro');        

// TROCA DE TELAS
mostrarCadastro.addEventListener('click', (e) => {
    e.preventDefault();                       
    telaLogin.style.display = 'none';         
    telaCadastro.style.display = 'block';     
});

voltarLogin.addEventListener('click', (e) => {
    e.preventDefault();
    telaCadastro.style.display = 'none';      
    telaLogin.style.display = 'block';        
});

// LOGIN
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {   
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso!');
            localStorage.setItem('conta_id', data.conta_id); // Salva conta_id
            window.location.href = './usuarios_e_home/usuarios.html';
        } else {
            alert('X ' + data.message);
        }
    } catch (err) {
        alert('Erro ao fazer login: ' + err.message);
    }
});

// CADASTRO
signupFormulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada!');
            localStorage.setItem('conta_id', data.conta_id); // Agora existe
            signupFormulario.reset();
            window.location.href = './usuarios_e_home/usuarios.html';
        } else {
            alert('X ' + data.message);
        }
    } catch (err) {
        alert('Erro ao criar a conta: ' + err.message);
    }
});

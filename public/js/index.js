
// DOM ELEMENTS

const form = document.getElementById('form');                     // Form login
const signupFormulario = document.getElementById('signupFormulario'); // Form cadastro
const mostrarCadastro = document.getElementById('mostrarCadastro');   // Link cadastro
const voltarLogin = document.getElementById('voltarLogin');           // Link voltar
const telaLogin = document.getElementById('tela-login');              // Div login
const telaCadastro = document.getElementById('tela-cadastro');        // Div cadastro

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
        const response = await fetch('/api/login', {   // rota backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso!');
            localStorage.setItem('token', data.token); // salvar token
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
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada!');
            signupFormulario.reset();
            telaCadastro.style.display = 'none';
            telaLogin.style.display = 'block';
        } else {
            alert('X ' + data.message);
        }
    } catch (err) {
        alert('Erro ao criar a conta: ' + err.message);
    }
});

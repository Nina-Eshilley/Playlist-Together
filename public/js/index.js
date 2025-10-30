// DOM ELEMENTS

// Seleciona os elementos do DOM para manipulação
const form = document.getElementById('form');                     // Form login
const signupFormulario = document.getElementById('signupFormulario'); // Form cadastro
const mostrarCadastro = document.getElementById('mostrarCadastro');   // Link cadastro
const voltarLogin = document.getElementById('voltarLogin');           // Link voltar
const telaLogin = document.getElementById('tela-login');              // Div login
const telaCadastro = document.getElementById('tela-cadastro');        // Div cadastro

// TROCA DE TELAS

// Mostra a tela de cadastro e esconde a de login
mostrarCadastro.addEventListener('click', (e) => {
    e.preventDefault();                       
    telaLogin.style.display = 'none';         
    telaCadastro.style.display = 'block';     
});

// Volta para a tela de login e esconde a de cadastro
voltarLogin.addEventListener('click', (e) => {
    e.preventDefault();
    telaCadastro.style.display = 'none';      
    telaLogin.style.display = 'block';        
});

// LOGIN

form.addEventListener('submit', async (e) => {
    e.preventDefault();  // Evita envio padrão do formulário
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Faz requisição POST para o backend
        const response = await fetch('/api/login', {   
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso!');
            localStorage.setItem('token', data.token); // salva token
            window.location.href = './usuarios_e_home/usuarios.html'; // redireciona para a página de usuários
        } else {
            alert('X ' + data.message); // mostra mensagem de erro do backend
        }
    } catch (err) {
        alert('Erro ao fazer login: ' + err.message); // caso ocorra erro na requisição
    }
});

// CADASTRO

signupFormulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        // Faz requisição POST para criar nova conta
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada!');
            signupFormulario.reset(); // limpa campos do formulário
            telaCadastro.style.display = 'none'; 
            telaLogin.style.display = 'block';
            window.location.href = './usuarios_e_home/usuarios.html';
        } else {
            alert('X ' + data.message); // mostra mensagem de erro do backend
        }
    } catch (err) {
        alert('Erro ao criar a conta: ' + err.message);
    }
});

//Seleção do DOM - representa estrutura HTML da página (Vimos parecido em PAM)

//Formulário de login
const form = document.getElementById('form');

//Formulário de cadastro
const signupFormulario = document.getElementById('signupFormulario');

//Botões para trocar entre telas
const mostrarCadastro = document.getElementById('mostrarCadastro');
const voltarLogin = document.getElementById('voltarLogin');

//Telas
const telaLogin = document.getElementById('tela-login');
const telaCadastro = document.getElementById('tela-cadastro');

//Quando eu clico no link de cadastro
mostrarCadastro.addEventListener('click', (e) => {
    e.preventDefault(); //Impede o comportamento padrão do link
    telaLogin.style.display = 'none'; //Esconde o login
    telaCadastro.style.display = 'block'; //Mostra o cadastro
});

//Quando clico em "voltar ao login"
voltarLogin.addEventListener('click', (e) => {
    e.preventDefault();
    telaCadastro.style.display = 'none'; //Esconde o cadastro
    telaLogin.style.display = 'block'; //Mostra o login
});

//Função de login
form.addEventListener('submit', async (e) => {
    e.preventDefault(); //Evita erro, impedindo o envio padrão do formulário

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST', //Método post
            headers: {
                'Content-Type': 'application/json', //Corrigido "aplication" para "application"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso');
            localStorage.setItem('token', data.token);
            //Objetivo aqui é redirecionar a outra página (provavelmente a página inicial)
        } else {
            alert('X ' + data.message);
        }
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

//Função de cadastro
signupFormulario.addEventListener('submit', async (e) => {
    e.preventDefault(); //Impede o envio tradicional

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST', //Corrigido
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada!');
            signupFormulario.reset();
            //Volta para tela de login
            telaCadastro.style.display = 'none';
            telaLogin.style.display = 'block';
        } else {
            alert('X ' + data.message);
        }
    } catch (error) {
        alert('Erro ao criar a conta: ' + error.message);
    }
});

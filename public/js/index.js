// ---------------- DOM ELEMENTS ----------------
// Puxa elementos do HTML pra usar no JavaScript
const form = document.getElementById('form');                      
const signupFormulario = document.getElementById('signupFormulario');
const mostrarCadastro = document.getElementById('mostrarCadastro');  
const voltarLogin = document.getElementById('voltarLogin');          
const telaLogin = document.getElementById('tela-login');              
const telaCadastro = document.getElementById('tela-cadastro');        
 
 
// ---------------- TROCA DE TELAS ----------------
// Quando clicar em "Criar conta", esconde a tela de login e mostra a de cadastro
mostrarCadastro.addEventListener('click', (e) => {
    e.preventDefault();                      
    telaLogin.style.display = 'none';        
    telaCadastro.style.display = 'block';    
});
 
// Quando clicar em "Voltar", volta para a tela do login
voltarLogin.addEventListener('click', (e) => {
    e.preventDefault();
    telaCadastro.style.display = 'none';      
    telaLogin.style.display = 'block';        
});
 
 
// ---------------- LOGIN ----------------
// Executa quando o usuário tentar fazer login
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar automaticamente
 
    // Pega os valores digitados
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
 
    try {
        // Envia os dados para o backend (API)
        const response = await fetch('http://localhost:3000/api/login', {  
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Diz que está enviando JSON
            body: JSON.stringify({ email, password }) // Converte os dados para JSON
        });
 
        const data = await response.json(); // Recebe a resposta da API
 
        if (response.ok) {
            alert('Login realizado com sucesso!');
            localStorage.setItem('conta_id', data.conta_id); // Salva o id do usuário no navegador
            window.location.href = './usuarios_e_home/usuarios.html'; // Vai para a página principal
        } else {
            alert('X ' + data.message); // Erro vindo do backend
        }
    } catch (err) {
        alert('Erro ao fazer login: ' + err.message); // Erro geral (internet/servidor)
    }
});
 
 
// ---------------- CADASTRO ----------------
// Executa quando o usuário tentar criar conta
signupFormulario.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    // Pega os valores digitados no cadastro
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
 
    try {
        // Envia os dados do cadastro para a API
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }) // Envia os dados como JSON
        });
 
        const data = await response.json();
 
        if (response.ok) {
            alert('Conta criada!');
            localStorage.setItem('conta_id', data.conta_id); // Salva o id da conta criada
            signupFormulario.reset(); // Limpa o formulário
            window.location.href = './usuarios_e_home/usuarios.html'; // Vai pra tela principal
        } else {
            alert('X ' + data.message); // Mostra erro vindo da API
        }
    } catch (err) {
        alert('Erro ao criar a conta: ' + err.message); // Erro geral
    }
});
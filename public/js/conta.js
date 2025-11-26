// Função para mostrar mensagens
function showMessage(elementId, message, isSuccess = true) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${isSuccess ? 'success' : 'error'}`;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

function getUserId() {
    return localStorage.getItem('conta_id') || 1;
}

// Accordion functionality
document.querySelectorAll('.card-header').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.parentElement;
        const content = card.querySelector('.card-content');
        const arrow = button.querySelector('.arrow');
       
        document.querySelectorAll('.card-content').forEach(item => {
            if (item !== content) item.classList.remove('open');
        });
       
        document.querySelectorAll('.arrow').forEach(arr => {
            if (arr !== arrow) arr.classList.remove('open');
        });
       
        content.classList.toggle('open');
        arrow.classList.toggle('open');
    });
});

// Editar conta
document.getElementById('editarContaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const conta_id = getUserId();

    console.log('Tentando editar conta...');

    try {
        const response = await fetch('/api/editar-conta', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conta_id, name: nome, telefone })
        });

        const responseText = await response.text();
        console.log('Resposta bruta:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Não é JSON válido:', responseText);
            throw new Error('Servidor retornou HTML em vez de JSON');
        }

        console.log('Resultado:', result);

        if (result.success) {
            showMessage('editarContaMessage', result.message, true);
        } else {
            showMessage('editarContaMessage', result.message, false);
        }
    } catch (error) {
        console.error('Erro completo:', error);
        showMessage('editarContaMessage', `Erro: ${error.message}`, false);
    }
});

// Alterar senha
document.getElementById('alterarSenhaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const conta_id = getUserId();

    console.log('Tentando alterar senha...');

    try {
        const response = await fetch('/api/alterar-senha', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conta_id, novaSenha, confirmarSenha })
        });

        const responseText = await response.text();
        console.log('Resposta bruta:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Não é JSON válido:', responseText);
            throw new Error('Servidor retornou HTML em vez de JSON');
        }

        if (result.success) {
            showMessage('alterarSenhaMessage', result.message, true);
            document.getElementById('alterarSenhaForm').reset();
        } else {
            showMessage('alterarSenhaMessage', result.message, false);
        }
    } catch (error) {
        console.error('Erro completo:', error);
        showMessage('alterarSenhaMessage', `Erro: ${error.message}`, false);
    }
});

// Sair de todos os dispositivos
document.getElementById('logoutAllForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const conta_id = getUserId();

    console.log('Tentando logout...');

    try {
        const response = await fetch('/api/logout-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conta_id })
        });

        const responseText = await response.text();
        console.log('Resposta bruta:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Não é JSON válido:', responseText);
            throw new Error('Servidor retornou HTML em vez de JSON');
        }

        if (result.success) {
            showMessage('logoutAllMessage', result.message, true);
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
        } else {
            showMessage('logoutAllMessage', result.message, false);
        }
    } catch (error) {
        console.error('Erro completo:', error);
        showMessage('logoutAllMessage', `Erro: ${error.message}`, false);
    }
});

function assinarPro() {
    alert('Redirecionando para página de assinatura...');
}
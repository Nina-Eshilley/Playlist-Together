console.log("amigos.js carregado!");

const lista = document.getElementById("lista-amigos");
const notificacaoContainer = document.getElementById("notificacao-container");

// ⚠️ REMOVA ESTA LINHA - o socket já está declarado no socket.js
// const socket = window.socket; // ❌ REMOVER

// Use o socket diretamente do window
let perfilAtual;

// Quando conecta, reenviar status online
window.socket.on("connect", () => {
    console.log("🔗 Amigos.js conectado ao socket");

    perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));
    if (perfilAtual) {
        window.socket.emit("perfilOnline", {
            perfil_id: perfilAtual.perfil_id,
            nome: perfilAtual.nome
        });
    }

    window.socket.emit("getOnlineUsers");
    carregarAmigos();
});

// Atualizar status online dos amigos
window.socket.on("onlineList", (onlineUsers) => {
    console.log("📋 Usuários online:", onlineUsers);
    
    document.querySelectorAll(".amigo-card").forEach(card => {
        const perfilId = Number(card.getAttribute("data-id"));
        const statusElement = card.querySelector(".amigo-status");
        
        if (onlineUsers.includes(perfilId)) {
            statusElement.textContent = "🟢 Online";
            statusElement.className = "amigo-status status-online";
        } else {
            statusElement.textContent = "🔴 Offline";
            statusElement.className = "amigo-status status-offline";
        }
    });
});

// Notificação de música
window.socket.on("musicNotification", (data) => {
    console.log("🎵 Notificação recebida:", data);
    mostrarNotificacao(data.nome, data.musica, data.playlistUrl);
});

// Carregar amigos (os outros 3 perfis da mesma conta)
async function carregarAmigos() {
    try {
        console.log("🔍 INICIANDO CARREGAMENTO DE AMIGOS...");
        
        const contaId = localStorage.getItem("conta_id");
        perfilAtual = JSON.parse(localStorage.getItem("currentProfile"));

        console.log("📝 Dados do localStorage:", { contaId, perfilAtual });

        if (!contaId || !perfilAtual) {
            console.error("❌ Dados do usuário não encontrados");
            lista.innerHTML = "<p style='text-align: center;'>Faça login primeiro</p>";
            return;
        }

        console.log("🌐 Fazendo requisição para:", `http://localhost:3000/api/perfis/${contaId}`);
        const res = await fetch(`http://localhost:3000/api/perfis/${contaId}`);
        
        console.log("📡 Status da resposta:", res.status);
        
        if (!res.ok) throw new Error("Erro ao carregar perfis");
        
        const perfis = await res.json();
        console.log("👥 Perfis recebidos:", perfis);
        
        // Filtra para mostrar apenas os outros 3 perfis (exclui o perfil atual)
        const outrosPerfis = perfis.filter(p => p.perfil_id !== perfilAtual.perfil_id);
        console.log("🎯 Outros perfis (amigos):", outrosPerfis);

        lista.innerHTML = "";

        if (outrosPerfis.length === 0) {
            lista.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p>Nenhum outro perfil encontrado nesta conta</p>
                    <p>Crie mais perfis para ver seus amigos aqui!</p>
                </div>
            `;
            return;
        }

        outrosPerfis.forEach(perfil => {
            console.log(`📸 Processando perfil: ${perfil.nome}`, perfil);
            
            const amigoCard = document.createElement("div");
            amigoCard.className = "amigo-card";
            amigoCard.setAttribute("data-id", perfil.perfil_id);

            // DEBUG: Verificar a imagem
            console.log(`🖼 Imagem do ${perfil.nome}:`, perfil.imagem);

            // Determina o caminho correto da imagem
            let imagemSrc = '../img/default.png';
            
            if (perfil.imagem && perfil.imagem !== 'default.png') {
                if (perfil.imagem.startsWith('data:image')) {
                    imagemSrc = perfil.imagem;
                    console.log(`✅ ${perfil.nome}: Usando imagem base64`);
                } else if (perfil.imagem.startsWith('http')) {
                    imagemSrc = perfil.imagem;
                    console.log(`✅ ${perfil.nome}: Usando URL externa`);
                } else {
                    imagemSrc = `../img/${perfil.imagem}`;
                    console.log(`✅ ${perfil.nome}: Usando arquivo local: ${imagemSrc}`);
                }
            } else {
                console.log(`⚠ ${perfil.nome}: Sem imagem, usando padrão`);
            }

            amigoCard.innerHTML = `
                <img src="${imagemSrc}" 
                     alt="${perfil.nome}" 
                     class="amigo-foto"
                     onerror="console.log('❌ Erro ao carregar imagem de ${perfil.nome}'); this.src='../img/default.png'">
                <div class="amigo-info">
                    <div class="amigo-nome">${perfil.nome}</div>
                    <div class="amigo-status status-offline">🔴 Offline</div>
                </div>
            `;

            lista.appendChild(amigoCard);
        });

        console.log("✅ Lista de amigos renderizada");
        
        // Solicitar lista atualizada de usuários online
        window.socket.emit("getOnlineUsers");
        
    } catch (error) {
        console.error("❌ Erro ao carregar amigos:", error);
        lista.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p>Erro ao carregar lista de amigos</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Notificação visual
function mostrarNotificacao(nome, musica, playlistUrl) {
    const box = document.createElement("div");
    box.className = "notificacao";
    
    // URL padrão caso não tenha playlistUrl
    const urlDestino = playlistUrl || '../usuarios_e_home/home.html';

    box.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>${nome}</strong> está ouvindo agora:
        </div>
        <div style="margin-bottom: 15px; font-size: 1.1rem;">
            🎧 <strong>${musica}</strong>
        </div>
        <div style="display: flex; gap: 10px;">
            <button class="btn btn-warning btn-sm ouvir-btn" style="flex: 1;">🎵 Ouvir Junto</button>
            <button class="btn btn-secondary btn-sm fechar-btn">✖</button>
        </div>
    `;

    box.querySelector(".ouvir-btn").addEventListener("click", () => {
        console.log("Redirecionando para:", urlDestino);
        window.location.href = urlDestino;
    });

    box.querySelector(".fechar-btn").addEventListener("click", () => {
        box.remove();
    });

    notificacaoContainer.appendChild(box);

    // Auto-remover após 10 segundos
    setTimeout(() => {
        if (box.parentElement) {
            box.remove();
        }
    }, 10000);
}

window.mostrarNotificacao = mostrarNotificacao;

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - inicializando amigos");
    carregarAmigos();
});

// Recarregar amigos quando voltar para a página
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        console.log("Página carregada do cache - recarregando amigos");
        carregarAmigos();
    }
});
// server.js

// Importando bibliotecas necessárias
import express from 'express';          // Framework para criar o servidor web
import sqlite3 from 'sqlite3';          // Para conectar com o banco de dados SQLite
import cors from 'cors';                // Permite que outros sites acessem sua API
import path from 'path';                // Para trabalhar com caminhos de arquivos
import { fileURLToPath } from 'url';    // Para conseguir usar __dirname no ES Modules

//Configurando __dirname (equivalente ao __dirname do CommonJS)
const __filename = fileURLToPath(import.meta.url);   // Pega o caminho do arquivo atual
const __dirname = path.dirname(__filename);          // Pega a pasta onde está o arquivo

//Criando a aplicação express
const app = express();

//Configurando Middewares (plugins do Express)
app.use(cors());                        // Habilita CORS - permite acesso de outros domínios
app.use(express.json());                // Permite que o servidor entenda JSON no body das requisições

//Conexão com o banco de dados SQLite
const dbPath = path.join(__dirname, 'banco.db');  // Caminho completo para o arquivo do banco
const db = new sqlite3.Database(dbPath, (err) => { // Conecta com o banco
    if (err) {
        console.error('❌ Erro ao conectar no SQLite:', err.message);  // Se der erro
    } else {
        console.log('✅ Conectado ao banco.db existente!');           // Se conectar com sucesso
    }
});

//ROTA INICIAL - Página principal da API
app.get('/', (req, res) => {
    res.json({ 
        message: "Servidor funcionando! 🎉",
        endpoints: [                    // Lista todos os endpoints disponíveis
            "GET  /debug/tabelas - Ver todas as tabelas",
            "GET  /debug/colunas/:tabela - Ver colunas de uma tabela", 
            "POST /contas - Adicionar conta",
            "GET  /contas - Listar contas"
        ]
    });
});

//ROTAS DEBUG - Para explorar o banco de dados
app.get('/debug/tabelas', (req, res) => {
    // SQL que busca todos os nomes de tabelas no banco
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });  // Erro no SQL
        }
        res.json(rows);  // Retorna a lista de tabelas
    });
});

app.get('/debug/colunas/:tabela', (req, res) => {
    const tabela = req.params.tabela;  // Pega o nome da tabela da URL
    // SQL que mostra informações das colunas de uma tabela específica
    db.all(`PRAGMA table_info(${tabela})`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });  // Erro no SQL
        }
        res.json(rows);  // Retorna as colunas da tabela
    });
});

//ROTA POST - Para criar novas contas no banco
app.post('/contas', (req, res) => {
    console.log('📨 Recebendo dados:', req.body);  // Mostra no console o que recebeu
    
    // Extrai os dados do body da requisição
    const { name, email, password } = req.body;

    //VALIDAÇÃO - Verifica se todos os campos foram enviados
    if (!name || !email || !password) {
        return res.status(400).json({ 
            error: 'Name, email e password são obrigatórios!' 
        });
    }

    //SQL para inserir nova conta no banco
    const sql = `INSERT INTO conta (name, email, password) VALUES (?, ?, ?)`;
    
    //Executa o SQL no banco
    db.run(sql, [name, email, password], function(err) {
        if (err) {
            console.log('❌ Erro ao inserir:', err);
            return res.status(500).json({ 
                error: 'Erro ao criar conta: ' + err.message 
            });
        }
        
        // 💫 SUCESSO - Conta criada
        console.log('✅ Conta criada! ID:', this.lastID);
        res.status(201).json({ 
            success: true,
            message: 'Conta criada com sucesso!',
            id: this.lastID,           // ID que foi gerado automaticamente
            dados: { name, email, password: '***' }  // Retorna dados (senha oculta)
        });
    });
});

//ROTA GET - Para listar todas as contas
app.get('/contas', (req, res) => {
    // SQL que busca todas as contas (sem a senha por segurança)
    const sql = 'SELECT id, name, email FROM conta';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);  // Retorna a lista de contas
    });
});

//Configuração de porta flexível - Tenta várias portas se uma estiver ocupada
const tryPorts = [3000, 3001, 3002, 3003, 8080, 8000];  // Portas para tentar

//Função recursiva que tenta iniciar o servidor em diferentes portas
const startServer = (portIndex = 0) => {
    // Se tentou todas as portas e nenhuma funcionou
    if (portIndex >= tryPorts.length) {
        console.log('Não foi possível iniciar o servidor em nenhuma porta!');
        return;
    }

    const PORT = tryPorts[portIndex];  // Pega a porta atual para tentar
    
    // Tenta iniciar o servidor na porta atual
    app.listen(PORT, () => {
        // SUCESSO - Servidor iniciado
        console.log(`🎉 Servidor rodando em: http://localhost:${PORT}`);
        console.log(`📝 Endpoints disponíveis:`);
        console.log(`   GET  http://localhost:${PORT}/`);
        console.log(`   GET  http://localhost:${PORT}/debug/tabelas`);
        console.log(`   POST http://localhost:${PORT}/contas`);
        console.log(`   GET  http://localhost:${PORT}/contas`);
    }).on('error', (err) => {
        // ERRO - Porta ocupada ou outro problema
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Porta ${PORT} está ocupada, tentando próxima...`);
            startServer(portIndex + 1);  // Tenta a próxima porta
        } else {
            console.log(`❌ Erro na porta ${PORT}:`, err.message);
            startServer(portIndex + 1);  // Tenta a próxima porta
        }
    });
};

// Iniciar Servidor
console.log('🔧 Iniciando servidor...');
startServer();  // Começa tentando a primeira porta (3000)
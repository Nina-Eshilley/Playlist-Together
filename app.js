import express from 'express';       // Framework para criar servidor web
import cors from 'cors';             // Permite requisições de diferentes origens (CORS)
import sqlite3 from 'sqlite3';       // Driver do SQLite para Node.js
import { open } from 'sqlite';       // Interface para usar SQLite com async/await
import path from 'path';             // Para trabalhar com caminhos de arquivos
import { fileURLToPath } from 'url'; // Para obter caminho real do arquivo com módulos ES

const app = express(); 
const PORT = 3000;

// Caminhos __filename e __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());              // Permite requisições de front-end
app.use(express.json());      // Interpreta JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos

// Rota padrão
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Função para abrir o banco SQLite
async function abrirBanco() {
  return open({
    filename: './banco.db',   // Arquivo do banco
    driver: sqlite3.Database  // Driver usado
  });
}

// Cria a tabela "conta" se não existir
// id: chave primária automática
// name: nome do usuário
// email: e-mail único
// password: senha do usuário
(async () => {
  const db = await abrirBanco();
  await db.exec('CREATE TABLE IF NOT EXISTS conta (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT)');
})();

// ROTA DE CADASTRO
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const db = await abrirBanco();
    const usuarioExistente = await db.get('SELECT * FROM conta WHERE email = ?', [email]);

    if (usuarioExistente) {
      return res.status(400).json({ message: 'E-mail já cadastrado!' });
    }

    await db.run('INSERT INTO conta (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    res.status(200).json({ message: 'Conta criada com sucesso!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
});

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const db = await abrirBanco();
    const usuario = await db.get('SELECT * FROM conta WHERE email = ? AND password = ?', [email, password]);

    if (!usuario) {
      return res.status(400).json({ message: 'E-mail ou senha incorretos!' });
    }

    res.status(200).json({ message: 'Login realizado com sucesso!', token: 'token-fake' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// INICIA O SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Importando bibliotecas necessárias
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Caminhos __dirname e __filename para localizar arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para permitir requisições entre front e back
app.use(cors());

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Middleware para servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Rota padrão para abrir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Função para abrir o banco de dados SQLite
async function abrirBanco() {
  return open({
    filename: './banco.db',
    driver: sqlite3.Database
  });
}

// Criar tabela "conta" se não existir
(async () => {
  const db = await abrirBanco();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS conta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
})();
1
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

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

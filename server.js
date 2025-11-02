import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());

// Aumenta limite de JSON e URL-encoded para aceitar imagens Base64 grandes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Função para abrir o banco SQLite
async function abrirBanco() {
  return open({
    filename: './banco.db',
    driver: sqlite3.Database,
  });
}

// Criação de tabelas
(async () => {
  const db = await abrirBanco();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS conta (
      conta_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS perfil (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conta_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      imagem TEXT,
      FOREIGN KEY (conta_id) REFERENCES conta(conta_id)
    )
  `);

  console.log('✅ Tabelas garantidas no banco.');
})();

// ROTAS//

// CADASTRO
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const db = await abrirBanco();
    const usuarioExistente = await db.get('SELECT * FROM conta WHERE email = ?', [email]);

    if (usuarioExistente) {
      return res.status(400).json({ message: 'E-mail já cadastrado!' });
    }

    await db.run(
      'INSERT INTO conta (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    const novoUsuario = await db.get('SELECT conta_id FROM conta WHERE email = ?', [email]);
    res.status(200).json({ message: 'Conta criada com sucesso!', conta_id: novoUsuario.conta_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const db = await abrirBanco();
    const usuario = await db.get(
      'SELECT * FROM conta WHERE email = ? AND password = ?',
      [email, password]
    );

    if (!usuario) {
      return res.status(400).json({ message: 'E-mail ou senha incorretos!' });
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      conta_id: usuario.conta_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// LISTAR PERFIS DE UMA CONTA
app.get('/api/perfis/:conta_id', async (req, res) => {
  const { conta_id } = req.params;

  try {
    const db = await abrirBanco();
    const perfis = await db.all('SELECT * FROM perfil WHERE conta_id = ?', [conta_id]);
    res.json(perfis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar perfis' });
  }
});

//  CRIAR PERFIL (até 4 por conta)
app.post('/api/perfis', async (req, res) => {
  const { conta_id, nome, imagem } = req.body;

  if (!conta_id || !nome) {
    return res.status(400).json({ message: 'Conta e nome do perfil são obrigatórios.' });
  }

  try {
    const db = await abrirBanco();
    const total = await db.get('SELECT COUNT(*) as qtd FROM perfil WHERE conta_id = ?', [conta_id]);

    if (total.qtd >= 4) {
      return res.status(400).json({ message: 'Limite de 4 perfis atingido!' });
    }

    await db.run(
      'INSERT INTO perfil (conta_id, nome, imagem) VALUES (?, ?, ?)',
      [conta_id, nome, imagem || 'default.png']
    );

    res.status(201).json({ message: 'Perfil criado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar perfil' });
  }
});

// EDITAR PERFIL
app.put('/api/perfis/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, imagem } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório para editar.' });
  }

  try {
    const db = await abrirBanco();
    await db.run(
      'UPDATE perfil SET nome = ?, imagem = ? WHERE id = ?',
      [nome, imagem || 'default.png', id]
    );

    res.json({ message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao editar perfil' });
  }
});

//  DELETAR PERFIL
app.delete('/api/perfis/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await abrirBanco();
    await db.run('DELETE FROM perfil WHERE id = ?', [id]);
    res.json({ message: 'Perfil excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir perfil' });
  }
});

// ROTA DE DEBUG – Apagar todas as tabelas (usar só em ambiente de teste)
app.delete('/debug/apagar-tabelas', async (req, res) => {
  try {
    const db = await abrirBanco();
    await db.exec('DROP TABLE IF EXISTS perfil');
    await db.exec('DROP TABLE IF EXISTS conta');
    res.json({ sucesso: true, message: 'Todas as tabelas foram apagadas!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

//SERVIDOR//
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

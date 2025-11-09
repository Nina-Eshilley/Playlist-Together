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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Função para abrir o banco SQLite
async function abrirBanco() {
  return open({
    filename: './banco.db',
    driver: sqlite3.Database,
  });
}

// ======== Criação de tabelas ========
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
      perfil_id INTEGER PRIMARY KEY AUTOINCREMENT,
      conta_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      imagem TEXT,
      FOREIGN KEY (conta_id) REFERENCES conta(conta_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_musicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER,
      title TEXT,
      artist TEXT,
      videoId TEXT,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id)
    )
  `);

  await db.exec(`
CREATE TABLE IF NOT EXISTS mais_ouvidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  artist TEXT,
  videoId TEXT,
  count INTEGER DEFAULT 0,
  perfil_id INTEGER,
  FOREIGN KEY (perfil_id) REFERENCES perfil(perfil_id)
)
`);


  console.log('✅ Todas as tabelas garantidas.');
})();

// ================= ROTAS =================

// --- Cadastro ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });

  try {
    const db = await abrirBanco();
    const usuarioExistente = await db.get('SELECT * FROM conta WHERE email = ?', [email]);
    if (usuarioExistente) return res.status(400).json({ message: 'E-mail já cadastrado!' });

    await db.run('INSERT INTO conta (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    const novoUsuario = await db.get('SELECT conta_id FROM conta WHERE email = ?', [email]);

    res.status(200).json({ message: 'Conta criada com sucesso!', conta_id: novoUsuario.conta_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });

  try {
    const db = await abrirBanco();
    const usuario = await db.get('SELECT * FROM conta WHERE email = ? AND password = ?', [email, password]);
    if (!usuario) return res.status(400).json({ message: 'E-mail ou senha incorretos!' });

    res.status(200).json({ message: 'Login realizado com sucesso!', conta_id: usuario.conta_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// --- Perfis ---
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

app.post('/api/perfis', async (req, res) => {
  const { conta_id, nome, imagem } = req.body;
  if (!conta_id || !nome) return res.status(400).json({ message: 'Conta e nome do perfil são obrigatórios.' });

  try {
    const db = await abrirBanco();
    const total = await db.get('SELECT COUNT(*) as qtd FROM perfil WHERE conta_id = ?', [conta_id]);
    if (total.qtd >= 4) return res.status(400).json({ message: 'Limite de 4 perfis atingido!' });

    await db.run('INSERT INTO perfil (conta_id, nome, imagem) VALUES (?, ?, ?)', [conta_id, nome, imagem || 'default.png']);
    res.status(201).json({ message: 'Perfil criado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar perfil' });
  }
});

app.put('/api/perfis/:perfil_id', async (req, res) => {
  const { perfil_id } = req.params;
  const { nome, imagem } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome é obrigatório para editar.' });

  try {
    const db = await abrirBanco();
    await db.run('UPDATE perfil SET nome = ?, imagem = ? WHERE perfil_id = ?', [nome, imagem || 'default.png', perfil_id]);
    res.json({ message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao editar perfil' });
  }
});

app.delete('/api/perfis/:perfil_id', async (req, res) => {
  const { perfil_id } = req.params;
  try {
    const db = await abrirBanco();
    await db.run('DELETE FROM perfil WHERE perfil_id = ?', [perfil_id]);
    res.json({ message: 'Perfil excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir perfil' });
  }
});

// --- Playlists ---
app.get('/playlists', async (req, res) => {
  const db = await abrirBanco();
  const playlists = await db.all('SELECT * FROM playlists');
  res.json(playlists);
});

app.post('/playlists', async (req, res) => {
  const { name } = req.body;
  const db = await abrirBanco();
  const result = await db.run('INSERT INTO playlists (name) VALUES (?)', [name]);
  res.status(201).json({ id: result.lastID, name });
});

app.get('/playlists/:id/musicas', async (req, res) => {
  const db = await abrirBanco();
  const musicas = await db.all('SELECT * FROM playlist_musicas WHERE playlist_id = ?', [req.params.id]);
  res.json(musicas || []);
});

app.post('/playlists/:id/musicas', async (req, res) => {
  const { title, artist, videoId } = req.body;
  const playlistId = req.params.id;
  const db = await abrirBanco();
  await db.run('INSERT INTO playlist_musicas (playlist_id, title, artist, videoId) VALUES (?, ?, ?, ?)', [playlistId, title, artist, videoId]);
  res.status(201).json({ playlist_id: playlistId, title, artist, videoId });
});

app.delete('/playlists/:id/musicas/:musicId', async (req, res) => {
  const db = await abrirBanco();
  await db.run('DELETE FROM playlist_musicas WHERE id = ? AND playlist_id = ?', [req.params.musicId, req.params.id]);
  res.sendStatus(200);
});

// --- Mais Ouvidas ---
app.get('/maisouvidas/:perfil_id', async (req, res) => {
  const db = await abrirBanco();
  const { perfil_id } = req.params;
  const top = await db.all('SELECT * FROM mais_ouvidas WHERE perfil_id = ? ORDER BY count DESC LIMIT 10', [perfil_id]);
  res.json(top || []);
});

app.post('/maisouvidas', async (req, res) => {
  const { perfil_id, title, artist, videoId } = req.body;
  const db = await abrirBanco();

  if (!perfil_id) return res.status(400).json({ message: "perfil_id é obrigatório." });

  const row = await db.get('SELECT * FROM mais_ouvidas WHERE videoId = ? AND perfil_id = ?', [videoId, perfil_id]);
  if (row) {
    await db.run('UPDATE mais_ouvidas SET count = count + 1 WHERE videoId = ? AND perfil_id = ?', [videoId, perfil_id]);
  } else {
    await db.run('INSERT INTO mais_ouvidas (perfil_id, title, artist, videoId, count) VALUES (?, ?, ?, ?, 1)', [perfil_id, title, artist, videoId]);
  }

  res.sendStatus(200);
});


// --- Debug: apagar tabelas ---
app.delete('/debug/apagar-tabelas', async (req, res) => {
  const db = await abrirBanco();
  await db.exec('DROP TABLE IF EXISTS perfil');
  await db.exec('DROP TABLE IF EXISTS conta');
  await db.exec('DROP TABLE IF EXISTS playlists');
  await db.exec('DROP TABLE IF EXISTS playlist_musicas');
  await db.exec('DROP TABLE IF EXISTS mais_ouvidas');
  res.json({ sucesso: true, message: 'Todas as tabelas foram apagadas!' });
});

// --- Fallback para index.html (substitui get('*') problemático) ---
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======== Iniciar servidor ========
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
// ================= IMPORTS =================
 
// Essas importações trazem ferramentas prontas pra facilitar sua vida.
// Tipo pegar ingredientes antes de cozinhar.
 
import express from 'express'; // framework pra criar servidor e rotas (tipo "backend pronto")
import cors from 'cors'; // permite que o front acesse o backend (evita bloqueio do navegador)
import sqlite3 from 'sqlite3'; // biblioteca pra usar banco SQLite
import { open } from 'sqlite'; // ajuda a trabalhar com o SQLite usando async/await
import path from 'path'; // serve pra mexer com caminhos de pastas/arquivos
import { fileURLToPath } from 'url'; // converte caminho de módulo ES pra caminho normal
 
 
// ================= CONFIG DO SERVIDOR =================
 
const app = express(); // cria o servidor
const PORT = 3000; // porta onde o backend vai rodar (URL: localhost:3000)
 
 
// ================= CAMINHOS DO PROJETO =================
 
// Essas duas variáveis pegam o caminho exato da pasta onde o arquivo tá.
// Isso é útil pra acessar pastas tipo "public".
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
 
// ================= MIDDLEWARE =================
 
// Isso aqui são coisas que o servidor executa ANTES das rotas.
 
app.use(cors()); // libera acesso externo (sem isso o front não conecta)
app.use(express.json({ limit: '10mb' })); // o servidor aceita JSON grande (tipo foto base64)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // aceita dados enviados via formulário
app.use(express.static(path.join(__dirname, 'public'))); // libera a pasta public pro navegador acessar
 
 
// ================= BANCO DE DADOS =================
 
// Função que abre o banco sempre que precisar (não deixa o banco sempre ligado pra nada)
 
async function abrirBanco() {
  return open({
    filename: './banco.db', // arquivo do banco
    driver: sqlite3.Database,
  });
}
 
 
// ================= CRIAÇÃO AUTOMÁTICA DAS TABELAS =================
 
// Essa função autoexecuta quando o app inicia.
// Ela cria as tabelas se ainda não existirem.
 
(async () => {
  const db = await abrirBanco();
 
  // Tabela de contas (login principal)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS conta (
      conta_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
 
  // Cada conta pode ter até 4 perfis
  await db.exec(`
    CREATE TABLE IF NOT EXISTS perfil (
      perfil_id INTEGER PRIMARY KEY AUTOINCREMENT,
      conta_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      imagem TEXT,
      FOREIGN KEY (conta_id) REFERENCES conta(conta_id)
    )
  `);
 
  // Tabela com playlists criadas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);
 
  // Tabela das músicas dentro da playlist
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
 
  // Tabela pra registrar as músicas mais ouvidas
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
 
  // Tabela de favoritos
  await db.exec(`
  CREATE TABLE IF NOT EXISTS favoritos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    perfil_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    videoId TEXT NOT NULL,
    FOREIGN KEY (perfil_id) REFERENCES perfil(perfil_id)
  )
`);
 
  console.log('✅ Banco configurado.');
})();
 
 
// ================= ROTAS =================
// As rotas são como "portas" que o front usa pra falar com o backend.
 
 
// --- CADASTRO ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
 
  // impede cadastros incompletos
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
 
  try {
    const db = await abrirBanco();
 
    // verifica se já existe esse email cadastrado
    const usuarioExistente = await db.get('SELECT * FROM conta WHERE email = ?', [email]);
    if (usuarioExistente) return res.status(400).json({ message: 'E-mail já cadastrado!' });
 
    // salva no banco
    await db.run('INSERT INTO conta (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
 
    const novoUsuario = await db.get('SELECT conta_id FROM conta WHERE email = ?', [email]);
 
    res.status(200).json({ message: 'Conta criada com sucesso!', conta_id: novoUsuario.conta_id });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
});
 
 
// --- LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
 
  // impede login sem dados
  if (!email || !password)
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
 
  try {
    const db = await abrirBanco();
 
    // verifica no banco
    const usuario = await db.get(
      'SELECT * FROM conta WHERE email = ? AND password = ?',
      [email, password]
    );
 
    if (!usuario)
      return res.status(400).json({ message: 'E-mail ou senha incorretos!' });
 
    res.status(200).json({ message: 'Login OK!', conta_id: usuario.conta_id });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});
 
 
// --- ROTAS DE PERFIS ---
// pegar perfis da conta
app.get('/api/perfis/:conta_id', async (req, res) => {
  const { conta_id } = req.params;
 
  try {
    const db = await abrirBanco();
    const perfis = await db.all('SELECT * FROM perfil WHERE conta_id = ?', [conta_id]);
    res.json(perfis);
 
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar perfis' });
  }
});
 
// criar perfil
app.post('/api/perfis', async (req, res) => {
  const { conta_id, nome, imagem } = req.body;
 
  if (!conta_id || !nome)
    return res.status(400).json({ message: 'Conta e nome são obrigatórios.' });
 
  try {
    const db = await abrirBanco();
 
    // só pode ter 4 perfis por conta
    const total = await db.get('SELECT COUNT(*) as qtd FROM perfil WHERE conta_id = ?', [conta_id]);
 
    if (total.qtd >= 4)
      return res.status(400).json({ message: 'Limite de 4 perfis atingido!' });
 
    await db.run(
      'INSERT INTO perfil (conta_id, nome, imagem) VALUES (?, ?, ?)',
      [conta_id, nome, imagem || 'default.png']
    );
 
    res.status(201).json({ message: 'Perfil criado!' });
 
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar perfil' });
  }
});
 
// editar perfil
app.put('/api/perfis/:perfil_id', async (req, res) => {
  const { perfil_id } = req.params;
  const { nome, imagem } = req.body;
 
  if (!nome) return res.status(400).json({ message: 'Nome é obrigatório.' });
 
  try {
    const db = await abrirBanco();
    await db.run(
      'UPDATE perfil SET nome = ?, imagem = ? WHERE perfil_id = ?',
      [nome, imagem || 'default.png', perfil_id]
    );
 
    res.json({ message: 'Perfil atualizado!' });
 
  } catch (err) {
    res.status(500).json({ message: 'Erro ao editar perfil' });
  }
});
 
// deletar perfil
app.delete('/api/perfis/:perfil_id', async (req, res) => {
  try {
    const db = await abrirBanco();
    await db.run('DELETE FROM perfil WHERE perfil_id = ?', [req.params.perfil_id]);
    res.json({ message: 'Perfil removido!' });
 
  } catch {
    res.status(500).json({ message: 'Erro ao excluir perfil' });
  }
});
 
 
// ================= PLAYLISTS =================
 
// pegar playlists
app.get('/playlists', async (req, res) => {
  const db = await abrirBanco();
  res.json(await db.all('SELECT * FROM playlists'));
});
 
// criar playlist
app.post('/playlists', async (req, res) => {
  const db = await abrirBanco();
  const result = await db.run('INSERT INTO playlists (name) VALUES (?)', [req.body.name]);
 
  res.status(201).json({ id: result.lastID, name: req.body.name });
});
 
// pegar músicas da playlist
app.get('/playlists/:id/musicas', async (req, res) => {
  const db = await abrirBanco();
  res.json(await db.all('SELECT * FROM playlist_musicas WHERE playlist_id = ?', [req.params.id]));
});
 
// add música na playlist
app.post('/playlists/:id/musicas', async (req, res) => {
  const { title, artist, videoId } = req.body;
  const db = await abrirBanco();
 
  await db.run(
    'INSERT INTO playlist_musicas (playlist_id, title, artist, videoId) VALUES (?, ?, ?, ?)',
    [req.params.id, title, artist, videoId]
  );
 
  res.status(201).json({ message: 'Música adicionada!' });
});
 
// remover música da playlist
app.delete('/playlists/:id/musicas/:musicId', async (req, res) => {
  const db = await abrirBanco();
  await db.run('DELETE FROM playlist_musicas WHERE id = ?', [req.params.musicId]);
  res.sendStatus(200);
});
 
// remover playlist inteira
app.delete('/playlists/:id', async (req, res) => {
  const db = await abrirBanco();
 
  try {
    await db.run('DELETE FROM playlist_musicas WHERE playlist_id = ?', [req.params.id]); // limpa músicas
    await db.run('DELETE FROM playlists WHERE id = ?', [req.params.id]); // apaga playlist
 
    res.sendStatus(200);
 
  } catch {
    res.status(500).json({ error: 'Erro ao excluir playlist' });
  }
});
 
 
// ================= MAIS OUVIDAS =================
 
// pegar top músicas
app.get('/maisouvidas/:perfil_id', async (req, res) => {
  const db = await abrirBanco();
  res.json(
    await db.all(
      'SELECT * FROM mais_ouvidas WHERE perfil_id = ? ORDER BY count DESC LIMIT 10',
      [req.params.perfil_id]
    ) || []
  );
});
 
// registrar música ou aumentar contador
app.post('/maisouvidas', async (req, res) => {
  const { perfil_id, title, artist, videoId } = req.body;
 
  if (!perfil_id) return res.status(400).json({ message: "perfil_id é obrigatório." });
 
  const db = await abrirBanco();
  const existe = await db.get('SELECT * FROM mais_ouvidas WHERE videoId = ? AND perfil_id = ?', [videoId, perfil_id]);
 
  if (existe) {
    await db.run('UPDATE mais_ouvidas SET count = count + 1 WHERE id = ?', [existe.id]);
  } else {
    await db.run(
      'INSERT INTO mais_ouvidas (perfil_id, title, artist, videoId, count) VALUES (?, ?, ?, ?, 1)',
      [perfil_id, title, artist, videoId]
    );
  }
 
  res.sendStatus(200);
});
 
 
// ================= FAVORITOS =================
 
// pegar favoritos
app.get('/favoritos/:perfil_id', async (req, res) => {
  const db = await abrirBanco();
  res.json(await db.all('SELECT * FROM favoritos WHERE perfil_id = ?', [req.params.perfil_id]));
});
 
// adicionar favorito
app.post('/favoritos', async (req, res) => {
  const { perfil_id, title, artist, videoId } = req.body;
 
  if (!perfil_id || !title || !videoId)
    return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
 
  const db = await abrirBanco();
  const existe = await db.get('SELECT * FROM favoritos WHERE perfil_id = ? AND videoId = ?', [perfil_id, videoId]);
 
  if (existe) return res.status(400).json({ message: 'Música já favoritada!' });
 
  await db.run(
    'INSERT INTO favoritos (perfil_id, title, artist, videoId) VALUES (?, ?, ?, ?)',
    [perfil_id, title, artist, videoId]
  );
 
  res.status(201).json({ message: 'Favorito salvo!' });
});
 
// remover favorito
app.delete('/favoritos/:perfil_id/:videoId', async (req, res) => {
  const db = await abrirBanco();
  await db.run('DELETE FROM favoritos WHERE perfil_id = ? AND videoId = ?', [req.params.perfil_id, req.params.videoId]);
  res.json({ message: 'Favorito removido.' });
});
 
 
// ================= DEBUG (APAGAR TUDÃO DO BANCO) =================
 
app.delete('/debug/apagar-tabelas', async (req, res) => {
  const db = await abrirBanco();
  await db.exec('DROP TABLE IF EXISTS perfil');
  await db.exec('DROP TABLE IF EXISTS conta');
  await db.exec('DROP TABLE IF EXISTS playlists');
  await db.exec('DROP TABLE IF EXISTS playlist_musicas');
  await db.exec('DROP TABLE IF EXISTS mais_ouvidas');
 
  res.json({ sucesso: true, message: 'Tabelas apagadas!' });
});
 
 
// ================= FRONT Fallback =================
 
// Se o user for pra uma página que não existe, ele volta pro index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
 
 
// ================= INICIAR SERVIDOR =================
 
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
 
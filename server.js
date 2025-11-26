import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
 
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
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
    name TEXT,
    perfil_id INTEGER NOT NULL,
    FOREIGN KEY (perfil_id) REFERENCES perfil(perfil_id)
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
app.get('/playlists/:perfil_id', async (req, res) => {
  const { perfil_id } = req.params;
  const db = await abrirBanco();

  const playlists = await db.all('SELECT * FROM playlists WHERE perfil_id = ?', [perfil_id]);

  res.json(playlists || []);
});

 
//Adicionar playlist
app.post('/playlists', async (req, res) => {
  const { name, perfil_id } = req.body;

  if (!name || !perfil_id) {
    return res.status(400).json({ error: 'Nome e perfil_id são obrigatórios' });
  }

  const db = await abrirBanco();
  const result = await db.run(
    'INSERT INTO playlists (name, perfil_id) VALUES (?, ?)',
    [name, perfil_id]
  );

  res.status(201).json({ id: result.lastID, name, perfil_id });
});

//Atualizar Playlist
app.put('/playlists/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
 
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
 
  try {
    const db = await abrirBanco();
    const result = await db.run('UPDATE playlists SET name = ? WHERE id = ?', [name, id]);
   
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }
   
    res.json({ id: parseInt(id), name });
  } catch (error) {
    console.error('Erro ao atualizar playlist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
 
//Deletar playlist
app.delete('/playlists/:id', async (req, res) => {
  const db = await abrirBanco();
 
  try {
    await db.run('DELETE FROM playlist_musicas WHERE playlist_id = ?', [req.params.id]);
    await db.run('DELETE FROM playlists WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro ao excluir playlist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
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
 
//Adicionar mais ouvidas
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
 
//Atualizar mais ouvidas
app.put('/maisouvidas/:id', async (req, res) => {
  const { id } = req.params;
  const { title, artist, videoId } = req.body;
 
  if (!title || !artist || !videoId) {
    return res.status(400).json({ error: 'Title, artist e videoId são obrigatórios' });
  }
 
  try {
    const db = await abrirBanco();
    const result = await db.run(
      'UPDATE mais_ouvidas SET title = ?, artist = ?, videoId = ? WHERE id = ?',
      [title, artist, videoId, id]
    );
   
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
   
    res.json({ id: parseInt(id), title, artist, videoId });
  } catch (error) {
    console.error('Erro ao atualizar mais ouvidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
 
//Deletar mais ouvidas
app.delete('/maisouvidas/:id', async (req, res) => {
  try {
    const db = await abrirBanco();
    const result = await db.run('DELETE FROM mais_ouvidas WHERE id = ?', [req.params.id]);
   
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
   
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro ao excluir mais ouvidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
 
// --- Favoritos ---
app.get('/favoritos/:perfil_id', async (req, res) => {
  const { perfil_id } = req.params;
  try {
    const db = await abrirBanco();
    const favoritos = await db.all('SELECT * FROM favoritos WHERE perfil_id = ?', [perfil_id]);
    res.json(favoritos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar favoritos' });
  }
});
 
//Adicionar favoritos
app.post('/favoritos', async (req, res) => {
  const { perfil_id, title, artist, videoId } = req.body;
 
  if (!perfil_id || !title || !videoId) {
    return res.status(400).json({
      message: 'Campos obrigatórios ausentes: perfil_id, title, videoId'
    });
  }
 
  try {
    const db = await abrirBanco();
   
    // Verifica se já existe
    const existing = await db.get(
      'SELECT * FROM favoritos WHERE perfil_id = ? AND videoId = ?',
      [perfil_id, videoId]
    );
   
    if (existing) {
      return res.status(409).json({ message: 'Música já está nos favoritos' });
    }
   
    const result = await db.run(
      'INSERT INTO favoritos (perfil_id, title, artist, videoId) VALUES (?, ?, ?, ?)',
      [perfil_id, title, artist, videoId]
    );
   
    res.status(201).json({
      id: result.lastID,
      perfil_id,
      title,
      artist,
      videoId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao adicionar favorito' });
  }
});
 
//Atualiza favoritos
app.put('/favoritos/:id', async (req, res) => {
  try {
    console.log('=== DEBUG PUT /favoritos/:id ===');
    console.log('Params:', req.params);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Body type:', typeof req.body);
   
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Body está vazio ou não é JSON válido',
        tip: 'Verifique se enviou como raw JSON no Postman'
      });
    }
   
    const { id } = req.params;
    const { title, artist, videoId } = req.body;
   
    if (!title || !artist || !videoId) {
      return res.status(400).json({
        error: 'Title, artist e videoId são obrigatórios',
        received: { title, artist, videoId }
      });
    }
 
    const db = await abrirBanco();
    const result = await db.run(
      'UPDATE favoritos SET title = ?, artist = ?, videoId = ? WHERE id = ?',
      [title, artist, videoId, id]
    );
   
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado' });
    }
   
    res.json({
      message: 'Favorito atualizado com sucesso',
      id: parseInt(id),
      title,
      artist,
      videoId
    });
   
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});
 
//Deletar favoritos
app.delete('/favoritos/:perfil_id/:videoId', async (req, res) => {
  const { perfil_id, videoId } = req.params;
  try {
    const db = await abrirBanco();
    await db.run('DELETE FROM favoritos WHERE perfil_id = ? AND videoId = ?', [perfil_id, videoId]);
    res.json({ message: 'Música removida dos favoritos!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao remover favorito' });
  }
});

// ======== ROTAS DA CONTA ========

// Rota para editar informações da conta
app.put('/api/editar-conta', async (req, res) => {
    const { conta_id, name, telefone } = req.body;

    try {
        const db = await abrirBanco();
        
        const user = await db.get('SELECT * FROM conta WHERE conta_id = ?', [conta_id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Adiciona coluna telefone se não existir
        try {
            const tableInfo = await db.all("PRAGMA table_info(conta)");
            const hasTelefone = tableInfo.some(col => col.name === 'telefone');
            
            if (!hasTelefone) {
                await db.run('ALTER TABLE conta ADD COLUMN telefone TEXT');
                console.log('✅ Coluna telefone adicionada à tabela conta');
            }
        } catch (alterError) {
            console.log('Coluna telefone já existe ou erro ao adicionar:', alterError);
        }

        // Validar telefone
        const existingPhone = await db.get(
            'SELECT conta_id FROM conta WHERE telefone = ? AND conta_id != ?',
            [telefone, conta_id]
        );

        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Este telefone já está em uso'
            });
        }

        // Atualizar dados
        await db.run(
            'UPDATE conta SET name = ?, telefone = ? WHERE conta_id = ?',
            [name, telefone, conta_id]
        );

        res.json({
            success: true,
            message: 'Dados atualizados com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao editar conta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para alterar senha
app.put('/api/alterar-senha', async (req, res) => {
    const { conta_id, novaSenha, confirmarSenha } = req.body;

    try {
        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({
                success: false,
                message: 'As senhas não coincidem'
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A senha deve ter pelo menos 6 caracteres'
            });
        }

        const db = await abrirBanco();
        const user = await db.get('SELECT conta_id FROM conta WHERE conta_id = ?', [conta_id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        await db.run(
            'UPDATE conta SET password = ? WHERE conta_id = ?',
            [novaSenha, conta_id]
        );

        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para sair de todos os dispositivos
app.post('/api/logout-all', async (req, res) => {
    const { conta_id } = req.body;
    
    res.json({
        success: true,
        message: 'Logout realizado em todos os dispositivos!'
    });
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

// --- Fallback para index.html ---  ⬅ ESTE DEVE SER O ÚLTIMO!
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= SOCKETS =================

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Novo cliente conectado:", socket.id);

  // CORREÇÃO: Mudar para "perfilOnline" para combinar com o client
  socket.on("perfilOnline", (data) => {
    onlineUsers.set(data.perfil_id, socket.id);
    // CORREÇÃO: Emitir a lista atualizada para todos
    io.emit("onlineList", Array.from(onlineUsers.keys()));
    console.log(`🟢 ${data.nome} está online`);
  });

  // CORREÇÃO: Adicionar handler para getOnlineUsers
  socket.on("getOnlineUsers", () => {
    socket.emit("onlineList", Array.from(onlineUsers.keys()));
  });

  socket.on("musicPlaying", (data) => {
    console.log(`🎵 ${data.nome} está ouvindo: ${data.musica}`);
    // CORREÇÃO: Enviar para todos exceto o remetente
    socket.broadcast.emit("musicNotification", data);
  });

  socket.on("disconnect", () => {
    // CORREÇÃO: Remover usuário desconectado
    for (const [perfilId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(perfilId);
        console.log(`🔴 Perfil ${perfilId} desconectado`);
        break;
      }
    }
    // CORREÇÃO: Atualizar lista para todos
    io.emit("onlineList", Array.from(onlineUsers.keys()));
  });
});

 
// ================= INICIAR SERVIDOR =================
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

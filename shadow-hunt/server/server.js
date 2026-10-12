// Relay-сервер для Shadow Hunt: комнаты + обмен состоянием игроков.
// Новое по сравнению с первой версией:
//  - отвечает на обычные HTTP-запросы (нужно, чтобы «будить» спящий сервер Render);
//  - если связь оборвалась, игрок возвращается под тем же id (по секретному токену);
//  - простой лимит частоты сообщений от одного клиента.
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const MAX_PLAYERS = 8;
const SESSION_TTL = 120000;   // сколько держим «место» игрока после обрыва связи (мс)
const MAX_MSG_PER_SEC = 40;   // клиент шлёт ~12 сообщений в секунду, запас с избытком

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end('Shadow Hunt server is running');
});
const wss = new WebSocketServer({ server });

const rooms = new Map();      // имя комнаты -> Set сокетов
const sessions = new Map();   // id игрока -> { token, ws, timer }
let counter = 0;

const rid = () => Math.random().toString(36).slice(2, 10);
const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };

function leave(ws) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.delete(ws);
  for (const o of room) send(o, { t: 'l', id: ws.id });
  if (!room.size) rooms.delete(ws.room);
  ws.room = null;
}

// Убрать старый сокет игрока из комнаты тихо, без сообщения «игрок вышел».
function dropSilently(old) {
  const room = rooms.get(old.room);
  if (room) { room.delete(old); if (!room.size) rooms.delete(old.room); }
  old.room = null;
  old.replaced = true;
  try { old.terminate(); } catch (e) {}
}

// Игрок вернулся после обрыва и показал свой id + токен — отдаём ему прежнее место.
function resume(ws, id, token) {
  const s = sessions.get(id);
  if (!s || s.token !== token || id === ws.id) return;
  const old = s.ws;
  if (old && old !== ws) { ws.presence = old.presence || {}; dropSilently(old); }
  clearTimeout(s.timer);
  sessions.delete(ws.id);     // временный id этого сокета больше не нужен
  ws.id = id; ws.token = token;
  s.ws = ws; s.timer = null;
}

wss.on('connection', ws => {
  ws.id = 'p' + (++counter).toString(36) + rid().slice(0, 4);
  ws.token = rid() + rid();
  ws.room = null; ws.presence = {}; ws.alive = true; ws.replaced = false;
  ws.cnt = 0; ws.cntT = Date.now();
  sessions.set(ws.id, { token: ws.token, ws, timer: null });
  ws.on('pong', () => { ws.alive = true; });
  send(ws, { t: 'hello', id: ws.id, token: ws.token });

  ws.on('message', data => {
    if (data.length > 8192) return;
    const now = Date.now();
    if (now - ws.cntT >= 1000) { ws.cntT = now; ws.cnt = 0; }
    if (++ws.cnt > MAX_MSG_PER_SEC) return;
    let m; try { m = JSON.parse(data.toString()); } catch (e) { return; }
    if (m.t === 'join' && typeof m.room === 'string') {
      leave(ws);
      if (typeof m.id === 'string' && typeof m.token === 'string') resume(ws, m.id, m.token);
      const name = m.room.slice(0, 30);
      const room = rooms.get(name) || new Set();
      if (room.size >= MAX_PLAYERS) { send(ws, { t: 'full' }); return; }
      rooms.set(name, room); room.add(ws); ws.room = name;
      send(ws, { t: 'joined', id: ws.id });
      for (const o of room) if (o !== ws) send(ws, { t: 'p', id: o.id, presence: o.presence });
    } else if (m.t === 'p' && ws.room && m.presence && typeof m.presence === 'object') {
      ws.presence = m.presence;
      const room = rooms.get(ws.room);
      const msg = JSON.stringify({ t: 'p', id: ws.id, presence: m.presence });
      for (const o of room) if (o !== ws && o.readyState === 1) o.send(msg);
    }
  });

  ws.on('close', () => {
    leave(ws);
    const s = sessions.get(ws.id);
    if (s && s.ws === ws) s.timer = setTimeout(() => sessions.delete(ws.id), SESSION_TTL);
  });
});

setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); });
}, 30000);

server.listen(PORT, () => console.log('Shadow Hunt server on port ' + PORT));

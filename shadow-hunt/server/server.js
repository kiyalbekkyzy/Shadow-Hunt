// Простой relay-сервер для Shadow Hunt: комнаты + обмен состоянием игроков.
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: process.env.PORT || 8080 });
const rooms = new Map();
const MAX_PLAYERS = 8;
let counter = 0;

function leave(ws) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.delete(ws);
  for (const o of room) if (o.readyState === 1) o.send(JSON.stringify({ t: 'l', id: ws.id }));
  if (!room.size) rooms.delete(ws.room);
  ws.room = null;
}

wss.on('connection', ws => {
  ws.id = 'p' + (++counter).toString(36) + Math.random().toString(36).slice(2, 6);
  ws.room = null; ws.presence = {}; ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.send(JSON.stringify({ t: 'hello', id: ws.id }));
  ws.on('message', data => {
    if (data.length > 8192) return;
    let m; try { m = JSON.parse(data.toString()); } catch (e) { return; }
    if (m.t === 'join' && typeof m.room === 'string') {
      leave(ws);
      const name = m.room.slice(0, 30);
      const room = rooms.get(name) || new Set();
      if (room.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'full' })); return; }
      rooms.set(name, room); room.add(ws); ws.room = name;
      ws.send(JSON.stringify({ t: 'joined' }));
      for (const o of room) if (o !== ws) ws.send(JSON.stringify({ t: 'p', id: o.id, presence: o.presence }));
    } else if (m.t === 'p' && ws.room && m.presence && typeof m.presence === 'object') {
      ws.presence = m.presence;
      const room = rooms.get(ws.room);
      const msg = JSON.stringify({ t: 'p', id: ws.id, presence: m.presence });
      for (const o of room) if (o !== ws && o.readyState === 1) o.send(msg);
    }
  });
  ws.on('close', () => leave(ws));
});

setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); });
}, 30000);
console.log('Shadow Hunt server on port ' + (process.env.PORT || 8080));

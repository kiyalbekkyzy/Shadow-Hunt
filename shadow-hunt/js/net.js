// Сетевой слой: тот же интерфейс, что и у room в claude.ai (peers / presence),
// но поверх обычного WebSocket-сервера из папки server/.
window.ShadowNet = {
  connect(code) {
    return new Promise((resolve, reject) => {
      let ws;
      try { ws = new WebSocket(window.SHADOW_SERVER); } catch (e) { return reject(e); }
      const others = new Map();
      const mine = {};
      let myId = null, done = false;
      const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch (e) {} reject(new Error('timeout')); } }, 6000);
      const api = {
        peers() {
          const list = [];
          if (myId) list.push({ peer: myId, isMe: true, sameTab: true, presence: mine });
          others.forEach((presence, id) => list.push({ peer: id, isMe: false, sameTab: false, presence }));
          return list;
        },
        presence(patch) {
          for (const k in patch) { if (patch[k] === null) delete mine[k]; else mine[k] = patch[k]; }
          if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'p', presence: mine }));
          return Promise.resolve();
        }
      };
      ws.onmessage = ev => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.t === 'hello') { myId = m.id; ws.send(JSON.stringify({ t: 'join', room: code })); }
        else if (m.t === 'joined') { if (!done) { done = true; clearTimeout(timer); resolve(api); } }
        else if (m.t === 'full') { if (!done) { done = true; clearTimeout(timer); reject(new Error('full')); } }
        else if (m.t === 'p') others.set(m.id, m.presence || {});
        else if (m.t === 'l') others.delete(m.id);
      };
      ws.onerror = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error('ws')); } };
      ws.onclose = () => others.clear();
    });
  }
};

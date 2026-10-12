// Сетевой слой: тот же интерфейс, что и у room в claude.ai (peers / presence),
// но поверх обычного WebSocket-сервера из папки server/.
// Умеет:
//  - ждать «просыпающийся» бесплатный сервер Render (до 75 секунд, с повторными попытками);
//  - будить сервер заранее, как только открыта страница;
//  - переподключаться после обрыва связи под тем же id игрока.
// О состоянии связи сообщает событием window 'shadownet' (detail.state):
//  'reconnecting' — связь пропала, пробуем вернуться; 'online' — вернулись;
//  'newid' — вернулись, но под новым id (место потеряно); 'lost' — сдались.
(function () {
  const CONNECT_TIMEOUT = 75000;    // первое подключение к спящему серверу может занять ~1 минуту
  const RECONNECT_WINDOW = 120000;  // столько сервер хранит место игрока после обрыва
  const DELAYS = [500, 1000, 2000, 4000, 4000];

  const emit = state => { try { window.dispatchEvent(new CustomEvent('shadownet', { detail: { state } })); } catch (e) {} };

  // Обычный HTTP-запрос к серверу будит его на Render; ответ нам не нужен.
  function wake() {
    try { fetch(String(window.SHADOW_SERVER).replace(/^ws/, 'http'), { mode: 'no-cors', cache: 'no-store' }).catch(() => {}); } catch (e) {}
  }

  function connect(code) {
    return new Promise((resolve, reject) => {
      if (/ИМЯ-СЕРВИСА/.test(String(window.SHADOW_SERVER))) {
        console.error('Shadow Hunt: в js/config.js не указан адрес сервера (замени ИМЯ-СЕРВИСА).');
        return reject(new Error('config'));
      }
      const others = new Map(), mine = {};
      let ws = null, live = false, everJoined = false, stopped = false, settled = false;
      let myId = null, token = null, hello = null;
      let attempt = 0, lostAt = null, stale = null, retryT = null;

      const initT = setTimeout(() => { if (!everJoined) { stop(); done(false, new Error('timeout')); } }, CONNECT_TIMEOUT);
      const done = (ok, v) => { if (settled) return; settled = true; clearTimeout(initT); ok ? resolve(v) : reject(v); };
      function stop() { stopped = true; live = false; clearTimeout(retryT); try { if (ws) ws.close(); } catch (e) {} }
      const sendPresence = () => { if (ws && live && ws.readyState === 1) ws.send(JSON.stringify({ t: 'p', presence: mine })); };

      const api = {
        peers() {
          const list = [];
          if (myId) list.push({ peer: myId, isMe: true, sameTab: true, presence: mine });
          others.forEach((presence, id) => list.push({ peer: id, isMe: false, sameTab: false, presence }));
          return list;
        },
        presence(patch) {
          for (const k in patch) { if (patch[k] === null) delete mine[k]; else mine[k] = patch[k]; }
          sendPresence();
          return Promise.resolve();
        }
      };

      function scheduleRetry() {
        clearTimeout(retryT);
        retryT = setTimeout(open, DELAYS[Math.min(attempt++, DELAYS.length - 1)]);
      }

      function onClosed() {
        if (stopped) return;
        if (everJoined && lostAt === null) { lostAt = Date.now(); emit('reconnecting'); }
        if (everJoined && Date.now() - lostAt > RECONNECT_WINDOW) { stop(); emit('lost'); return; }
        scheduleRetry();
      }

      function onMsg(m, sock) {
        if (m.t === 'hello') {
          hello = m;
          const j = { t: 'join', room: code };
          if (myId && token) { j.id = myId; j.token = token; }      // просим вернуть прежний id
          else { myId = m.id; token = m.token; }
          sock.send(JSON.stringify(j));
        } else if (m.t === 'joined') {
          const reconnected = everJoined, sameId = m.id === myId;
          if (m.id !== myId) {                                      // прежнее место потеряно
            myId = m.id; token = hello ? hello.token : token; others.clear(); stale = null;
            if (reconnected) emit('newid');
          } else if (reconnected) {
            stale = new Set(others.keys());                         // после паузы сверим, кто ещё в комнате
            setTimeout(() => { if (stale) { stale.forEach(id => others.delete(id)); stale = null; } }, 800);
          }
          live = true; everJoined = true; attempt = 0;
          if (lostAt !== null) { lostAt = null; if (sameId) emit('online'); }
          sendPresence();
          done(true, api);
        } else if (m.t === 'full') {
          stop();
          if (!everJoined) done(false, new Error('full')); else emit('lost');
        } else if (m.t === 'p') {
          if (stale) stale.delete(m.id);
          others.set(m.id, m.presence || {});
        } else if (m.t === 'l') {
          others.delete(m.id);
        }
      }

      function open() {
        if (stopped) return;
        let sock;
        try { sock = new WebSocket(window.SHADOW_SERVER); } catch (e) { return scheduleRetry(); }
        ws = sock; live = false;
        sock.onmessage = ev => {
          if (sock !== ws) return;
          let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
          onMsg(m, sock);
        };
        sock.onerror = () => {};                                    // следом всегда приходит onclose
        sock.onclose = () => { if (sock !== ws) return; live = false; onClosed(); };
      }

      open();
    });
  }

  window.ShadowNet = { connect, wake };
  wake();
})();

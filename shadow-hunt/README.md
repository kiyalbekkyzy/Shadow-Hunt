# Shadow Hunt Online

2D stealth-игра в браузере: 2 этажа, тьма и круг света, охранники, личные цветные ключи и двери.
Пойманные игроки становятся полицейскими. До 8 игроков в комнате.

## Структура
- `index.html`, `style.css`, `js/game.js` — игра (статика, GitHub Pages)
- `js/net.js`, `js/config.js` — сетевой слой и адрес сервера
- `server/` — WebSocket-сервер (Node.js), нужен для мультиплеера

## Запуск локально
```
cd server
npm install
npm start
```
Затем открой `index.html` через расширение **Live Server** в VS Code (в двух вкладках, один код комнаты).

## Публикация
1. Сервер: Render.com → New Web Service → этот репозиторий, Root Directory `server`, Build `npm install`, Start `npm start`.
2. В `js/config.js` укажи `wss://<твой-сервис>.onrender.com`.
3. Сайт: GitHub → Settings → Pages → Deploy from branch → `main` / root.

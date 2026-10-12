// Адрес WebSocket-сервера.
// Локально (Live Server, файл с диска) игра использует сервер на твоём компьютере,
// а на сайте в интернете — адрес твоего сервиса на Render.
window.SHADOW_PROD_SERVER = 'wss://shadow-hunt-hmq5.onrender.com';

window.SHADOW_SERVER = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
  ? 'ws://localhost:8080'
  : window.SHADOW_PROD_SERVER;

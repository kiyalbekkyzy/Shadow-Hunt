// Адрес WebSocket-сервера.
// ПОСЛЕ ДЕПЛОЯ НА RENDER замени ИМЯ-СЕРВИСА на имя своего сервиса
// (оно видно в адресе, который Render показывает вверху страницы сервиса).
// Адрес должен начинаться с wss:// (с двумя s), без слэша на конце.
window.SHADOW_PROD_SERVER = 'wss://ИМЯ-СЕРВИСА.onrender.com';

// Локально (Live Server, файл с диска) игра сама использует сервер на твоём компьютере,
// а на сайте в интернете — адрес выше.
window.SHADOW_SERVER = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
  ? 'ws://localhost:8080'
  : window.SHADOW_PROD_SERVER;

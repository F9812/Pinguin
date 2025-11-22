

const express = require('express');
const app = express();

// Настройка корневого маршрута
app.get('/', (req, res) => {
    res.send('Hello, World! This is a simple Vercel app!');
});

// Запуск сервера на порту 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

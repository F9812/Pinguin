const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let leaderboard = [];

// Получить таблицу лидеров
app.get('/api/leaderboard', (req, res) => {
    const sortBy = req.query.sortBy || 'energy';
    
    let sorted = [...leaderboard];
    switch (sortBy) {
        case 'prestige':
            sorted.sort((a, b) => b.prestige - a.prestige);
            break;
        case 'playtime':
            sorted.sort((a, b) => b.playTime - a.playTime);
            break;
        default:
            sorted.sort((a, b) => b.energy - a.energy);
    }
    
    res.json(sorted.slice(0, 50));
});

// Добавить/обновить игрока
app.post('/api/leaderboard', (req, res) => {
    const playerData = req.body;
    
    // Валидация
    if (!playerData.username || !playerData.energy) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    
    // Ищем существующего игрока
    const existingIndex = leaderboard.findIndex(p => p.username === playerData.username);
    
    if (existingIndex !== -1) {
        // Обновляем существующего игрока
        leaderboard[existingIndex] = {
            ...leaderboard[existingIndex],
            ...playerData,
            lastUpdated: Date.now()
        };
    } else {
        // Добавляем нового игрока
        leaderboard.push({
            ...playerData,
            lastUpdated: Date.now()
        });
    }
    
    // Сортируем
    leaderboard.sort((a, b) => b.energy - a.energy);
    
    // Ограничиваем размер
    leaderboard = leaderboard.slice(0, 100);
    
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

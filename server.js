const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// База данных для топа (в памяти, для демо)
let leaderboard = [];

// Загрузка топа из файла при запуске
const leaderboardFile = path.join(__dirname, 'leaderboard.json');
if (fs.existsSync(leaderboardFile)) {
    try {
        leaderboard = JSON.parse(fs.readFileSync(leaderboardFile, 'utf8'));
        console.log('✅ Топ загружен из файла');
    } catch (error) {
        console.error('❌ Ошибка загрузки топа:', error);
    }
}

// Функция сохранения топа в файл
function saveLeaderboard() {
    try {
        fs.writeFileSync(leaderboardFile, JSON.stringify(leaderboard, null, 2));
        console.log('💾 Топ сохранен в файл');
    } catch (error) {
        console.error('❌ Ошибка сохранения топа:', error);
    }
}

// API для обновления данных игрока в топе
app.post('/update-leaderboard', (req, res) => {
    try {
        const playerData = req.body;
        
        // Проверяем обязательные поля
        if (!playerData.username || playerData.prestigeLevel === undefined || playerData.totalEnergy === undefined) {
            return res.status(400).json({ error: 'Неверные данные игрока' });
        }
        
        // Находим существующую запись
        const existingIndex = leaderboard.findIndex(p => p.username === playerData.username);
        
        if (existingIndex !== -1) {
            // Обновляем существующую запись
            leaderboard[existingIndex] = {
                ...leaderboard[existingIndex],
                ...playerData,
                lastUpdated: Date.now()
            };
        } else {
            // Добавляем новую запись
            leaderboard.push({
                ...playerData,
                lastUpdated: Date.now()
            });
        }
        
        // Сортируем топ (сначала по престижу, потом по энергии)
        leaderboard.sort((a, b) => {
            if (b.prestigeLevel !== a.prestigeLevel) {
                return b.prestigeLevel - a.prestigeLevel;
            }
            return b.totalEnergy - a.totalEnergy;
        });
        
        // Ограничиваем топ 50 игроками
        leaderboard = leaderboard.slice(0, 50);
        
        // Сохраняем в файл
        saveLeaderboard();
        
        res.json({ 
            success: true, 
            message: 'Данные обновлены',
            rank: leaderboard.findIndex(p => p.username === playerData.username) + 1
        });
        
    } catch (error) {
        console.error('❌ Ошибка обновления топа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// API для получения топа
app.get('/leaderboard', (req, res) => {
    try {
        const sortBy = req.query.sort || 'prestige';
        let sortedLeaderboard = [...leaderboard];
        
        // Сортировка по выбранному критерию
        switch (sortBy) {
            case 'prestige':
                sortedLeaderboard.sort((a, b) => {
                    if (b.prestigeLevel !== a.prestigeLevel) {
                        return b.prestigeLevel - a.prestigeLevel;
                    }
                    return b.totalEnergy - a.totalEnergy;
                });
                break;
            case 'totalEnergy':
                sortedLeaderboard.sort((a, b) => b.totalEnergy - a.totalEnergy);
                break;
            case 'playTime':
                sortedLeaderboard.sort((a, b) => b.playTime - a.playTime);
                break;
            default:
                sortedLeaderboard.sort((a, b) => b.prestigeLevel - a.prestigeLevel);
        }
        
        res.json(sortedLeaderboard.slice(0, 20)); // Возвращаем топ 20
        
    } catch (error) {
        console.error('❌ Ошибка получения топа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// API для очистки топа (админ)
app.post('/clear-leaderboard', (req, res) => {
    try {
        const { password } = req.body;
        
        if (password === 'admin123') {
            leaderboard = [];
            saveLeaderboard();
            res.json({ success: true, message: 'Топ очищен' });
        } else {
            res.status(403).json({ error: 'Неверный пароль' });
        }
        
    } catch (error) {
        console.error('❌ Ошибка очистки топа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// API для получения статистики сервера
app.get('/server-stats', (req, res) => {
    try {
        res.json({
            totalPlayers: leaderboard.length,
            topPrestige: leaderboard[0]?.prestigeLevel || 0,
            topEnergy: leaderboard[0]?.totalEnergy || 0,
            lastUpdated: leaderboard.length > 0 
                ? new Date(Math.max(...leaderboard.map(p => p.lastUpdated))).toLocaleString()
                : 'Никогда'
        });
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Отдаем главную страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📊 Игроков в топе: ${leaderboard.length}`);
});

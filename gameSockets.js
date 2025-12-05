module.exports = (io) => {
  const Player = require('../models/Player');
  const gameEngine = require('../game/GameEngine');
  
  io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);
    
    // Аутентификация
    socket.on('authenticate', async (token) => {
      try {
        // Валидация токена (упрощенно)
        const player = await Player.findById(token.userId);
        if (!player) {
          socket.emit('error', 'Игрок не найден');
          return;
        }
        
        socket.playerId = player._id;
        socket.join(`player_${player._id}`);
        socket.join('global_chat');
        
        // Обновление времени сессии
        player.currentSessionStart = new Date();
        player.lastSeen = new Date();
        await player.save();
        
        socket.emit('authenticated', {
          player: {
            id: player._id,
            username: player.username,
            energy: player.energy,
            quantumPoints: player.quantumPoints
          }
        });
        
        // Рассылка о входе игрока
        socket.broadcast.to('global_chat').emit('player_online', {
          username: player.username,
          playerId: player._id
        });
        
      } catch (error) {
        console.error('Ошибка аутентификации:', error);
        socket.emit('error', 'Ошибка аутентификации');
      }
    });
    
    // Клик по кристаллу
    socket.on('click_crystal', async (data) => {
      try {
        const player = await Player.findById(socket.playerId);
        if (!player) return;
        
        // Базовая энергия за клик
        let clickEnergy = 1;
        
        // Умножение от улучшений
        const clickMultiplier = player.upgrades
          .filter(u => u.id.startsWith('click_'))
          .reduce((total, u) => total * (1 + u.level * 0.1), 1);
        
        clickEnergy *= clickMultiplier;
        
        // Случайный бонус (10% шанс)
        if (Math.random() < 0.1) {
          clickEnergy *= 2;
          socket.emit('bonus_click', { multiplier: 2 });
        }
        
        player.energy += clickEnergy;
        player.totalEnergyEarned += clickEnergy;
        await player.save();
        
        socket.emit('energy_update', {
          energy: player.energy,
          delta: clickEnergy
        });
        
        // Обновление в реальном времени для гильдии
        if (player.guildId) {
          socket.to(`guild_${player.guildId}`).emit('guild_member_activity', {
            playerId: player._id,
            username: player.username,
            action: 'click'
          });
        }
        
      } catch (error) {
        console.error('Ошибка клика:', error);
        socket.emit('error', 'Ошибка обработки клика');
      }
    });
    
    // Покупка генератора
    socket.on('buy_generator', async (data) => {
      try {
        const { type } = data;
        const player = await Player.findById(socket.playerId);
        if (!player) return;
        
        // Поиск существующего генератора
        let generator = player.generators.find(g => g.type === type);
        const config = gameEngine.generatorConfigs[type];
        
        if (!generator) {
          // Создание нового генератора
          generator = {
            type,
            level: 1,
            count: 0,
            lastCollection: new Date(),
            efficiency: 1.0
          };
          player.generators.push(generator);
        }
        
        // Расчет стоимости
        const cost = gameEngine.calculateGeneratorCost(type, generator.count, generator.level);
        
        if (player.energy < cost) {
          socket.emit('error', 'Недостаточно энергии');
          return;
        }
        
        // Покупка
        player.energy -= cost;
        generator.count += 1;
        generator.lastCollection = new Date();
        
        await player.save();
        
        // Расчет нового производства
        const production = gameEngine.calculateGeneratorProduction(
          type, 
          generator.count, 
          generator.level, 
          generator.efficiency
        );
        
        socket.emit('generator_purchased', {
          type,
          count: generator.count,
          cost,
          productionPerSecond: production,
          energy: player.energy
        });
        
        // Обновление для всех в гильдии
        if (player.guildId) {
          socket.to(`guild_${player.guildId}`).emit('guild_member_upgrade', {
            playerId: player._id,
            username: player.username,
            upgrade: `generator_${type}`,
            newCount: generator.count
          });
        }
        
      } catch (error) {
        console.error('Ошибка покупки генератора:', error);
        socket.emit('error', 'Ошибка покупки генератора');
      }
    });
    
    // Запрос на перерождение
    socket.on('request_rebirth', async () => {
      try {
        const player = await Player.findById(socket.playerId);
        if (!player) return;
        
        const result = gameEngine.performRebirth(player);
        await player.save();
        
        socket.emit('rebirth_completed', result);
        
        // Глобальное оповещение
        io.emit('global_event', {
          type: 'rebirth',
          player: player.username,
          rebirthCount: player.rebirthCount
        });
        
      } catch (error) {
        console.error('Ошибка перерождения:', error);
        socket.emit('rebirth_error', { message: error.message });
      }
    });
    
    // Отслеживание времени сессии
    setInterval(async () => {
      if (socket.playerId) {
        try {
          const player = await Player.findById(socket.playerId);
          if (player && player.currentSessionStart) {
            player.sessionTimeForRebirth += 60; // +1 минута
            player.totalPlayTime += 60;
            player.lastSeen = new Date();
            await player.save();
            
            // Отправка обновления сессии
            socket.emit('session_update', {
              sessionTime: player.sessionTimeForRebirth,
              canRebirth: player.sessionTimeForRebirth >= 4 * 3600
            });
          }
        } catch (error) {
          console.error('Ошибка обновления сессии:', error);
        }
      }
    }, 60000); // Каждую минуту
    
    // Отключение
    socket.on('disconnect', async () => {
      if (socket.playerId) {
        try {
          const player = await Player.findById(socket.playerId);
          if (player) {
            player.lastSeen = new Date();
            await player.save();
            
            // Уведомление гильдии
            if (player.guildId) {
              socket.to(`guild_${player.guildId}`).emit('guild_member_offline', {
                playerId: player._id,
                username: player.username
              });
            }
          }
        } catch (error) {
          console.error('Ошибка при отключении:', error);
        }
      }
    });
  });
};

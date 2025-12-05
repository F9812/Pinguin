class SocketManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(process.env.SERVER_URL || 'http://localhost:3001', {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000
                });
                
                this.setupEventListeners();
                
                // Таймаут подключения
                setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error('Таймаут подключения'));
                    }
                }, 10000);
                
            } catch (error) {
                console.error('Ошибка подключения:', error);
                reject(error);
            }
        });
    }
    
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Подключено к серверу');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Аутентификация
            const token = localStorage.getItem('energosphere_token');
            if (token) {
                this.socket.emit('authenticate', JSON.parse(token));
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('Отключено от сервера');
            this.connected = false;
            this.gameClient.ui.showNotification('Потеряно соединение', 'warning');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Ошибка подключения:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.gameClient.ui.showNotification('Не удалось подключиться к серверу', 'error');
            }
        });
        
        // Игровые события
        this.socket.on('authenticated', (data) => {
            console.log('Аутентификация успешна:', data);
            this.gameClient.player = data.player;
            this.gameClient.updateFromServer(data.player);
            this.gameClient.ui.showNotification(`Добро пожаловать, ${data.player.username}!`, 'success');
        });
        
        this.socket.on('energy_update', (data) => {
            this.gameClient.updateFromServer({ energy: data.energy });
            this.gameClient.ui.showFloatingText(`+${data.delta}`, '#00ffff');
        });
        
        this.socket.on('generator_purchased', (data) => {
            this.gameClient.updateFromServer({ energy: data.energy });
            this.gameClient.generatorManager.handlePurchase(data);
            this.gameClient.ui.showNotification(`Куплен генератор ${data.type}`, 'success');
        });
        
        this.socket.on('rebirth_completed', (data) => {
            this.gameClient.updateFromServer({
                energy: 0,
                quantumPoints: this.gameClient.gameState.quantumPoints + data.quantumPointsEarned,
                rebirthCount: data.newRebirthCount
            });
            
            this.gameClient.ui.showNotification(
                `Перерождение завершено! Получено ${data.quantumPointsEarned} квантовых очков`,
                'success'
            );
            
            // Показать экран достижения
            this.gameClient.ui.showAchievement('Квантовый Скачок', `Перерождение #${data.newRebirthCount}`);
        });
        
        this.socket.on('session_update', (data) => {
            this.gameClient.updateFromServer({ sessionTime: data.sessionTime });
            this.gameClient.rebirthManager.updateSessionProgress(data);
        });
        
        this.socket.on('game_event_start', (event) => {
            this.gameClient.ui.showGameEvent(event);
        });
        
        this.socket.on('global_event', (event) => {
            this.gameClient.ui.showGlobalNotification(
                `${event.player} совершил ${event.rebirthCount}-е перерождение!`,
                'rebirth'
            );
        });
        
        this.socket.on('error', (message) => {
            this.gameClient.ui.showNotification(message, 'error');
        });
    }
    
    isConnected() {
        return this.connected && this.socket;
    }
    
    sendClick(energy) {
        if (this.isConnected()) {
            this.socket.emit('click_crystal', { energy });
        }
    }
    
    buyGenerator(type) {
        if (this.isConnected()) {
            this.socket.emit('buy_generator', { type });
        }
    }
    
    requestRebirth() {
        if (this.isConnected()) {
            this.socket.emit('request_rebirth');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

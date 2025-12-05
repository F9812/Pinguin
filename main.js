// Глобальные переменные
let game = null;

// Инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    // Проверка поддержки WebGL
    if (!checkWebGLSupport()) {
        showWebGLError();
        return;
    }
    
    // Загрузка сохраненных данных
    loadSavedData();
    
    // Инициализация игры
    initializeGame();
    
    // Установка обработчиков
    setupEventListeners();
});

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function showWebGLError() {
    const container = document.querySelector('.game-container');
    container.innerHTML = `
        <div class="error-screen">
            <h1>⚠️ Требуется поддержка WebGL</h1>
            <p>Ваш браузер не поддерживает WebGL, необходимый для работы игры.</p>
            <p>Пожалуйста, обновите браузер или используйте другой.</p>
            <div class="browser-list">
                <a href="https://www.google.com/chrome/" target="_blank">Google Chrome</a>
                <a href="https://www.mozilla.org/firefox/" target="_blank">Mozilla Firefox</a>
                <a href="https://www.microsoft.com/edge" target="_blank">Microsoft Edge</a>
            </div>
        </div>
    `;
}

function loadSavedData() {
    // Загрузка настроек
    const settings = localStorage.getItem('energosphere_settings');
    if (settings) {
        window.gameSettings = JSON.parse(settings);
    } else {
        window.gameSettings = {
            sound: true,
            music: true,
            notifications: true,
            particles: true,
            theme: 'dark'
        };
    }
    
    // Загрузка данных аккаунта
    window.userData = {
        token: localStorage.getItem('energosphere_token'),
        username: localStorage.getItem('energosphere_username')
    };
}

function initializeGame() {
    try {
        game = new GameClient();
        window.game = game; // Для отладки
        
        // Показ экрана загрузки
        showLoadingScreen();
        
        // Имитация загрузки ресурсов
        setTimeout(() => {
            hideLoadingScreen();
            
            // Показ приветственного экрана для новых игроков
            if (!window.userData.token) {
                showWelcomeScreen();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка инициализации игры:', error);
        showErrorScreen(error);
    }
}

function showLoadingScreen() {
    const loadingHTML = `
        <div class="loading-screen active">
            <div class="loading-content">
                <div class="loading-crystal">
                    <div class="crystal-spin"></div>
                </div>
                <h2>Загрузка Энергосферы</h2>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="loading-text">Инициализация ядра...</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
        setTimeout(() => loadingScreen.remove(), 500);
    }
}

function showWelcomeScreen() {
    const welcomeHTML = `
        <div class="welcome-modal active">
            <div class="welcome-content">
                <h1>Добро пожаловать в Энергосферу!</h1>
                <p class="welcome-subtitle">Собирайте энергию, стройте генераторы и достигайте новых высот в бесконечной вселенной!</p>
                
                <div class="welcome-features">
                    <div class="feature">
                        <i class="fas fa-bolt"></i>
                        <h3>Сбор энергии</h3>
                        <p>Кликайте по кристаллу для сбора базовой энергии</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-industry"></i>
                        <h3>Автоматизация</h3>
                        <p>Стройте генераторы для пассивного дохода</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-infinity"></i>
                        <h3>Перерождения</h3>
                        <p>Перерождайтесь для получения бонусов</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-users"></i>
                        <h3>Социальность</h3>
                        <p>Вступайте в гильдии и сотрудничайте</p>
                    </div>
                </div>
                
                <div class="welcome-actions">
                    <button class="btn btn-primary btn-large" id="start-game-btn">
                        Начать игру
                    </button>
                    <button class="btn btn-secondary" id="tutorial-btn">
                        Пройти обучение
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', welcomeHTML);
    
    // Обработчики кнопок
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        document.querySelector('.welcome-modal')?.remove();
        showLoginScreen();
    });
}

function showLoginScreen() {
    const loginHTML = `
        <div class="login-modal active">
            <div class="login-content">
                <h2>Вход в Энергосферу</h2>
                
                <div class="login-options">
                    <div class="login-option active" data-type="guest">
                        <i class="fas fa-user"></i>
                        <h3>Гостевой режим</h3>
                        <p>Начните играть сразу без регистрации</p>
                        <button class="btn btn-outline" id="guest-login">Играть как гость</button>
                    </div>
                    
                    <div class="login-option" data-type="account">
                        <i class="fas fa-user-shield"></i>
                        <h3>Аккаунт</h3>
                        <p>Сохраняйте прогресс навсегда</p>
                        <form id="login-form">
                            <input type="text" placeholder="Имя пользователя" required>
                            <input type="password" placeholder="Пароль" required>
                            <button type="submit" class="btn btn-primary">Войти</button>
                            <button type="button" class="btn btn-link" id="register-btn">Регистрация</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loginHTML);
    
    // Обработчики логина
    document.getElementById('guest-login')?.addEventListener('click', createGuestAccount);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
}

function createGuestAccount() {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const guestName = 'Гость_' + Math.floor(Math.random() * 10000);
    
    // Сохранение гостевых данных
    localStorage.setItem('energosphere_token', JSON.stringify({
        guest: true,
        userId: guestId,
        username: guestName
    }));
    
    localStorage.setItem('energosphere_username', guestName);
    
    // Закрытие модального окна
    document.querySelector('.login-modal')?.remove();
    
    // Перезагрузка для применения токена
    location.reload();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        // Здесь будет запрос к API для входа
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) throw new Error('Ошибка входа');
        
        const data = await response.json();
        
        // Сохранение токена
        localStorage.setItem('energosphere_token', JSON.stringify(data.token));
        localStorage.setItem('energosphere_username', username);
        
        // Закрытие модального окна и перезагрузка
        document.querySelector('.login-modal')?.remove();
        location.reload();
        
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

function setupEventListeners() {
    // Глобальные обработчики клавиш
    document.addEventListener('keydown', (e) => {
        // Быстрые клавиши для отладки
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            // Режим разработчика
            toggleDevMode();
        }
        
        // Пауза игры на ESC
        if (e.key === 'Escape') {
            togglePause();
        }
    });
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', handleResize);
    
    // Предотвращение выхода без сохранения
    window.addEventListener('beforeunload', (e) => {
        if (game?.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
        }
    });
}

function handleResize() {
    // Адаптация UI под новый размер
    if (game?.ui) {
        game.ui.handleResize();
    }
}

function toggleDevMode() {
    window.isDevMode = !window.isDevMode;
    document.body.classList.toggle('dev-mode', window.isDevMode);
    
    if (window.isDevMode) {
        console.log('Режим разработчика активирован');
        game.ui.showNotification('Режим разработчика включен', 'info');
    }
}

function togglePause() {
    if (game) {
        game.togglePause();
    }
}

function showErrorScreen(error) {
    const container = document.querySelector('.game-container');
    container.innerHTML = `
        <div class="error-screen">
            <h1>⚠️ Произошла ошибка</h1>
            <p>Игра не может быть запущена из-за следующей ошибки:</p>
            <pre class="error-details">${error.toString()}</pre>
            <div class="error-actions">
                <button class="btn btn-primary" onclick="location.reload()">Перезагрузить</button>
                <button class="btn btn-secondary" onclick="clearGameData()">Сбросить данные</button>
                <button class="btn btn-outline" onclick="reportError()">Сообщить об ошибке</button>
            </div>
        </div>
    `;
}

// Глобальные вспомогательные функции
window.clearGameData = function() {
    if (confirm('Вы уверены? Это удалит весь ваш прогресс.')) {
        localStorage.clear();
        location.reload();
    }
};

window.reportError = function() {
    const error = new Error().stack;
    const gameState = JSON.stringify(game?.gameState, null, 2);
    
    // Здесь можно отправить ошибку на сервер
    console.log('Отчет об ошибке:', { error, gameState });
    alert('Отчет об ошибке отправлен. Спасибо!');
};

// Запуск игры
console.log('Energosphere v1.0.0 - Инициализация...');

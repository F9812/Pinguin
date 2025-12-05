// ===== КОНСТАНТЫ =====
const GAME_CONSTANTS = {
    PRESTIGE_TIME: 4 * 60 * 60 * 1000, // 4 часа
    EVENT_INTERVAL: 60 * 60 * 1000,    // 1 час
    EVENT_DURATION: 15 * 60 * 1000,    // 15 минут
    SAVE_INTERVAL: 30 * 1000,          // 30 секунд
    BASE_POWER: 1,
    PRESTIGE_BASE: 1000000,
    PRESTIGE_MULTIPLIER: 1.5,
    PRICE_INCREASE: 1.15
};

// ===== КЛАСС ИГРЫ =====
class SpaceIncrementor {
    constructor() {
        this.load();
        this.init();
    }
    
    load() {
        try {
            const saved = localStorage.getItem('spaceIncrementorSave');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Восстанавливаем состояние
                this.energy = data.energy || 0;
                this.totalEnergy = data.totalEnergy || 0;
                this.energyPerSecond = data.energyPerSecond || 0;
                this.totalClicks = data.totalClicks || 0;
                this.playTime = data.playTime || 0;
                this.startTime = Date.now();
                this.lastSave = Date.now();
                
                // Престиж
                this.prestigeLevel = data.prestigeLevel || 0;
                this.prestigePoints = data.prestigePoints || 0;
                this.lastPrestige = data.lastPrestige || Date.now();
                this.nextPrestige = data.nextPrestige || (Date.now() + GAME_CONSTANTS.PRETIGE_TIME);
                
                // Ивенты
                this.activeEvent = data.activeEvent || null;
                this.eventEndTime = data.eventEndTime || 0;
                this.nextEventTime = data.nextEventTime || (Date.now() + GAME_CONSTANTS.EVENT_INTERVAL);
                
                // Настройки
                this.settings = data.settings || {
                    username: 'Космонавт',
                    autoSave: true,
                    animations: true,
                    numberFormat: 'short'
                };
                
                // Генераторы
                this.generators = data.generators || [
                    { id: 1, name: 'Солнечная панель', cost: 10, baseCost: 10, owned: 0, production: 0.1, icon: 'fas fa-solar-panel', unlocked: true },
                    { id: 2, name: 'Ветрогенератор', cost: 50, baseCost: 50, owned: 0, production: 0.5, icon: 'fas fa-wind', unlocked: false },
                    { id: 3, name: 'Гидростанция', cost: 200, baseCost: 200, owned: 0, production: 2, icon: 'fas fa-water', unlocked: false },
                    { id: 4, name: 'Ядерный реактор', cost: 1000, baseCost: 1000, owned: 0, production: 10, icon: 'fas fa-atom', unlocked: false },
                    { id: 5, name: 'Термояд', cost: 5000, baseCost: 5000, owned: 0, production: 50, icon: 'fas fa-fire', unlocked: false }
                ];
                
                // Множители
                this.multipliers = data.multipliers || [
                    { id: 1, name: 'Эффективность I', cost: 100, baseCost: 100, owned: 0, multiplier: 1.1, icon: 'fas fa-bolt', unlocked: true },
                    { id: 2, name: 'Сеть II', cost: 500, baseCost: 500, owned: 0, multiplier: 1.25, icon: 'fas fa-network-wired', unlocked: false },
                    { id: 3, name: 'Квант III', cost: 2500, baseCost: 2500, owned: 0, multiplier: 1.5, icon: 'fas fa-microchip', unlocked: false }
                ];
                
                // Бусты
                this.boosts = data.boosts || {
                    click2x: false,
                    auto5x: false
                };
                
                // Проверяем разблокировки
                this.checkUnlocks();
                this.calculateProduction();
                
                console.log('Игра загружена');
                this.showMessage('Прогресс загружен!', 'success');
            } else {
                this.reset();
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            this.reset();
            this.showMessage('Ошибка загрузки, начата новая игра', 'error');
        }
    }
    
    reset() {
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        this.totalClicks = 0;
        this.playTime = 0;
        this.startTime = Date.now();
        this.lastSave = Date.now();
        
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.lastPrestige = Date.now();
        this.nextPrestige = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        this.activeEvent = null;
        this.eventEndTime = 0;
        this.nextEventTime = Date.now() + GAME_CONSTANTS.EVENT_INTERVAL;
        
        this.settings = {
            username: 'Космонавт',
            autoSave: true,
            animations: true,
            numberFormat: 'short'
        };
        
        this.generators = [
            { id: 1, name: 'Солнечная панель', cost: 10, baseCost: 10, owned: 0, production: 0.1, icon: 'fas fa-solar-panel', unlocked: true },
            { id: 2, name: 'Ветрогенератор', cost: 50, baseCost: 50, owned: 0, production: 0.5, icon: 'fas fa-wind', unlocked: false },
            { id: 3, name: 'Гидростанция', cost: 200, baseCost: 200, owned: 0, production: 2, icon: 'fas fa-water', unlocked: false },
            { id: 4, name: 'Ядерный реактор', cost: 1000, baseCost: 1000, owned: 0, production: 10, icon: 'fas fa-atom', unlocked: false },
            { id: 5, name: 'Термояд', cost: 5000, baseCost: 5000, owned: 0, production: 50, icon: 'fas fa-fire', unlocked: false }
        ];
        
        this.multipliers = [
            { id: 1, name: 'Эффективность I', cost: 100, baseCost: 100, owned: 0, multiplier: 1.1, icon: 'fas fa-bolt', unlocked: true },
            { id: 2, name: 'Сеть II', cost: 500, baseCost: 500, owned: 0, multiplier: 1.25, icon: 'fas fa-network-wired', unlocked: false },
            { id: 3, name: 'Квант III', cost: 2500, baseCost: 2500, owned: 0, multiplier: 1.5, icon: 'fas fa-microchip', unlocked: false }
        ];
        
        this.boosts = {
            click2x: false,
            auto5x: false
        };
    }
    
    save() {
        try {
            const saveData = {
                energy: this.energy,
                totalEnergy: this.totalEnergy,
                energyPerSecond: this.energyPerSecond,
                totalClicks: this.totalClicks,
                playTime: this.playTime + (Date.now() - this.startTime) / 1000,
                
                prestigeLevel: this.prestigeLevel,
                prestigePoints: this.prestigePoints,
                lastPrestige: this.lastPrestige,
                nextPrestige: this.nextPrestige,
                
                activeEvent: this.activeEvent,
                eventEndTime: this.eventEndTime,
                nextEventTime: this.nextEventTime,
                
                settings: this.settings,
                generators: this.generators,
                multipliers: this.multipliers,
                boosts: this.boosts,
                
                version: '3.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('spaceIncrementorSave', JSON.stringify(saveData));
            this.lastSave = Date.now();
            
            // Визуальная обратная связь
            if (window.game && window.game.onSave) {
                window.game.onSave();
            }
            
            return true;
        } catch (e) {
            console.error('Ошибка сохранения:', e);
            return false;
        }
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
        this.startAutoSave();
        
        // Первоначальный рендер
        this.render();
    }
    
    setupEventListeners() {
        // Клик по ядру
        document.getElementById('core').addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Быстрые улучшения
        document.getElementById('boost-2x').addEventListener('click', () => {
            this.buyBoost('click2x', 100);
        });
        
        document.getElementById('boost-5x').addEventListener('click', () => {
            this.buyBoost('auto5x', 500);
        });
        
        // Вкладки
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Массовые покупки
        document.getElementById('buy-10').addEventListener('click', () => {
            this.buyMultiple(10);
        });
        
        document.getElementById('buy-100').addEventListener('click', () => {
            this.buyMultiple(100);
        });
        
        document.getElementById('buy-max').addEventListener('click', () => {
            this.buyMax();
        });
        
        // Престиж
        document.getElementById('prestige-btn').addEventListener('click', () => {
            this.prestige();
        });
        
        // Настройки
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.manualSave();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('save-name').addEventListener('click', () => {
            this.saveUsername();
        });
        
        // Закрытие модального окна
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideSettings();
        });
        
        // Настройки
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.settings.autoSave = e.target.checked;
            this.save();
        });
        
        document.getElementById('animations').addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
        });
        
        document.getElementById('number-format').addEventListener('change', (e) => {
            this.settings.numberFormat = e.target.value;
            this.render();
        });
    }
    
    handleClick(event) {
        // Рассчитываем силу клика
        let power = GAME_CONSTANTS.BASE_POWER;
        let prestigeBonus = 1 + (this.prestigeLevel * 0.5);
        
        power *= prestigeBonus;
        
        if (this.boosts.click2x) {
            power *= 2;
        }
        
        if (this.activeEvent && this.activeEvent.type === 'click') {
            power *= this.activeEvent.multiplier;
        }
        
        // Добавляем энергию
        this.energy += power;
        this.totalEnergy += power;
        this.totalClicks++;
        
        // Анимация клика
        if (this.settings.animations) {
            this.createClickEffect(event, power);
        }
        
        // Проверяем разблокировки
        this.checkUnlocks();
        
        // Рендерим
        this.render();
    }
    
    createClickEffect(event, power) {
        const core = document.getElementById('core');
        const rect = core.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Создаем эффект клика
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${this.formatNumber(power)}`;
        effect.style.position = 'absolute';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        effect.style.color = '#00ff9d';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '1.2rem';
        effect.style.textShadow = '0 0 10px #00ff9d';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '100';
        effect.style.transform = 'translate(-50%, -50%)';
        
        core.appendChild(effect);
        
        // Анимация
        let opacity = 1;
        let posY = y;
        
        const animate = () => {
            opacity -= 0.02;
            posY -= 2;
            
            effect.style.opacity = opacity;
            effect.style.top = `${posY}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                effect.remove();
            }
        };
        
        animate();
    }
    
    buyGenerator(id, amount = 1) {
        const generator = this.generators.find(g => g.id === id);
        if (!generator || !generator.unlocked) return 0;
        
        let bought = 0;
        let totalCost = 0;
        
        for (let i = 0; i < amount; i++) {
            const cost = this.getGeneratorCost(generator);
            if (this.energy >= cost) {
                this.energy -= cost;
                generator.owned++;
                generator.cost = this.getGeneratorCost(generator);
                totalCost += cost;
                bought++;
            } else {
                break;
            }
        }
        
        if (bought > 0) {
            this.calculateProduction();
            this.checkUnlocks();
            this.showMessage(`Куплено ${bought} ${generator.name}`, 'success');
        }
        
        return bought;
    }
    
    buyMultiple(amount) {
        let totalBought = 0;
        
        // Покупаем самые дешевые генераторы
        while (totalBought < amount) {
            const cheapest = this.getCheapestGenerator();
            if (!cheapest || this.energy < cheapest.cost) break;
            
            if (this.buyGenerator(cheapest.id, 1) > 0) {
                totalBought++;
            } else {
                break;
            }
        }
        
        if (totalBought > 0) {
            this.render();
        }
    }
    
    buyMax() {
        let bought = 0;
        
        while (true) {
            const cheapest = this.getCheapestGenerator();
            if (!cheapest || this.energy < cheapest.cost) break;
            
            if (this.buyGenerator(cheapest.id, 1) > 0) {
                bought++;
            } else {
                break;
            }
        }
        
        if (bought > 0) {
            this.showMessage(`Куплено ${bought} генераторов`, 'success');
            this.render();
        }
    }
    
    getCheapestGenerator() {
        let cheapest = null;
        let minCost = Infinity;
        
        for (const gen of this.generators) {
            if (gen.unlocked && gen.cost < minCost) {
                minCost = gen.cost;
                cheapest = gen;
            }
        }
        
        return cheapest;
    }
    
    getGeneratorCost(generator) {
        const baseMultiplier = Math.pow(GAME_CONSTANTS.PRICE_INCREASE, generator.owned);
        const prestigeMultiplier = Math.pow(GAME_CONSTANTS.PRESTIGE_MULTIPLIER, this.prestigeLevel);
        return Math.floor(generator.baseCost * baseMultiplier * prestigeMultiplier);
    }
    
    buyMultiplier(id) {
        const multiplier = this.multipliers.find(m => m.id === id);
        if (!multiplier || !multiplier.unlocked || this.energy < multiplier.cost) return false;
        
        this.energy -= multiplier.cost;
        multiplier.owned++;
        multiplier.cost = this.getMultiplierCost(multiplier);
        
        // Пересчитываем производство
        this.calculateProduction();
        
        this.showMessage(`${multiplier.name} куплен!`, 'success');
        return true;
    }
    
    getMultiplierCost(multiplier) {
        const baseMultiplier = Math.pow(1.5, multiplier.owned);
        const prestigeMultiplier = Math.pow(GAME_CONSTANTS.PRESTIGE_MULTIPLIER, this.prestigeLevel);
        return Math.floor(multiplier.baseCost * baseMultiplier * prestigeMultiplier);
    }
    
    buyBoost(type, cost) {
        if (this.energy < cost || this.boosts[type]) return false;
        
        this.energy -= cost;
        this.boosts[type] = true;
        
        this.calculateProduction();
        this.showMessage('Буст активирован!', 'success');
        this.render();
        
        return true;
    }
    
    calculateProduction() {
        let eps = 0;
        
        // Производство генераторов
        for (const gen of this.generators) {
            eps += gen.production * gen.owned;
        }
        
        // Множители
        let multiplier = 1 + (this.prestigeLevel * 0.5); // Бонус престижа
        
        for (const mul of this.multipliers) {
            if (mul.owned > 0) {
                multiplier *= Math.pow(mul.multiplier, mul.owned);
            }
        }
        
        // Буст авто
        if (this.boosts.auto5x) {
            multiplier *= 5;
        }
        
        // Ивент
        if (this.activeEvent && this.activeEvent.type === 'production') {
            multiplier *= this.activeEvent.multiplier;
        }
        
        this.energyPerSecond = eps * multiplier;
        return this.energyPerSecond;
    }
    
    checkUnlocks() {
        // Разблокировка генераторов
        const unlockPoints = [50, 200, 1000, 5000];
        for (let i = 0; i < unlockPoints.length; i++) {
            if (this.totalEnergy >= unlockPoints[i] && i + 1 < this.generators.length) {
                if (!this.generators[i + 1].unlocked) {
                    this.generators[i + 1].unlocked = true;
                    this.showMessage(`Разблокирован ${this.generators[i + 1].name}!`, 'success');
                }
            }
        }
        
        // Разблокировка множителей
        const multiplierPoints = [500, 2500];
        for (let i = 0; i < multiplierPoints.length; i++) {
            if (this.totalEnergy >= multiplierPoints[i] && i + 1 < this.multipliers.length) {
                if (!this.multipliers[i + 1].unlocked) {
                    this.multipliers[i + 1].unlocked = true;
                    this.showMessage(`Разблокирован ${this.multipliers[i + 1].name}!`, 'success');
                }
            }
        }
        
        // Пересчет стоимостей
        for (const gen of this.generators) {
            gen.cost = this.getGeneratorCost(gen);
        }
        
        for (const mul of this.multipliers) {
            mul.cost = this.getMultiplierCost(mul);
        }
    }
    
    canPrestige() {
        const required = GAME_CONSTANTS.PRESTIGE_BASE * Math.pow(2, this.prestigeLevel);
        const now = Date.now();
        
        return this.totalEnergy >= required && now >= this.nextPrestige;
    }
    
    prestige() {
        if (!this.canPrestige()) return false;
        
        const required = GAME_CONSTANTS.PRESTIGE_BASE * Math.pow(2, this.prestigeLevel);
        const points = Math.floor(this.totalEnergy / required);
        
        // Обновляем престиж
        this.prestigeLevel++;
        this.prestigePoints += points;
        
        // Сбрасываем прогресс
        this.energy = 0;
        this.totalEnergy = 0;
        this.energyPerSecond = 0;
        
        for (const gen of this.generators) {
            gen.owned = 0;
            gen.cost = this.getGeneratorCost(gen);
        }
        
        for (const mul of this.multipliers) {
            mul.owned = 0;
            mul.cost = this.getMultiplierCost(mul);
        }
        
        this.boosts.click2x = false;
        this.boosts.auto5x = false;
        
        // Устанавливаем время следующего престижа
        this.lastPrestige = Date.now();
        this.nextPrestige = Date.now() + GAME_CONSTANTS.PRESTIGE_TIME;
        
        // Сохраняем
        this.save();
        
        this.showMessage(`Престиж ${this.prestigeLevel}! +${points} очков`, 'warning');
        this.render();
        
        return true;
    }
    
    checkEvent() {
        const now = Date.now();
        
        // Проверяем активный ивент
        if (this.activeEvent && now >= this.eventEndTime) {
            this.activeEvent = null;
        }
        
        // Запускаем новый ивент
        if (!this.activeEvent && now >= this.nextEventTime) {
            this.startEvent();
        }
    }
    
    startEvent() {
        const events = [
            {
                type: 'production',
                name: 'Энергетический всплеск',
                multiplier: 2,
                icon: 'fas fa-bolt'
            },
            {
                type: 'click',
                name: 'Квантовый ускоритель',
                multiplier: 3,
                icon: 'fas fa-mouse-pointer'
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.activeEvent = event;
        this.eventEndTime = Date.now() + GAME_CONSTANTS.EVENT_DURATION;
        this.nextEventTime = Date.now() + GAME_CONSTANTS.EVENT_INTERVAL;
        
        this.showMessage(`Начат ивент: ${event.name}`, 'success');
    }
    
    switchTab(tabName) {
        // Убираем активные классы
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.upgrades-list').forEach(list => {
            list.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-list`).classList.add('active');
    }
    
    gameLoop() {
        const update = () => {
            const now = Date.now();
            const delta = (now - this.lastUpdate) / 1000;
            this.lastUpdate = now;
            
            // Обновляем время игры
            this.playTime += delta;
            
            // Пассивный доход
            if (this.energyPerSecond > 0) {
                this.energy += this.energyPerSecond * delta;
                this.totalEnergy += this.energyPerSecond * delta;
            }
            
            // Проверяем ивенты
            this.checkEvent();
            
            // Рендерим
            this.render();
            
            // Следующий кадр
            requestAnimationFrame(update);
        };
        
        this.lastUpdate = Date.now();
        update();
    }
    
    startAutoSave() {
        setInterval(() => {
            if (this.settings.autoSave) {
                this.save();
            }
        }, GAME_CONSTANTS.SAVE_INTERVAL);
    }
    
    manualSave() {
        if (this.save()) {
            this.showMessage('Игра сохранена!', 'success');
        }
    }
    
    resetGame() {
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            localStorage.removeItem('spaceIncrementorSave');
            this.reset();
            this.render();
            this.showMessage('Игра сброшена', 'warning');
        }
    }
    
    showSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('active');
        
        // Заполняем значения
        document.getElementById('username-input').value = this.settings.username;
        document.getElementById('auto-save').checked = this.settings.autoSave;
        document.getElementById('animations').checked = this.settings.animations;
        document.getElementById('number-format').value = this.settings.numberFormat;
    }
    
    hideSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    }
    
    saveUsername() {
        const input = document.getElementById('username-input');
        const name = input.value.trim();
        
        if (name) {
            this.settings.username = name.substring(0, 20);
            this.save();
            this.showMessage('Имя сохранено!', 'success');
            this.render();
        }
    }
    
    render() {
        // Обновляем статистику
        document.getElementById('energy').textContent = this.formatNumber(this.energy);
        document.getElementById('total-energy').textContent = this.formatNumber(this.totalEnergy);
        document.getElementById('eps').textContent = this.formatNumber(this.energyPerSecond);
        document.getElementById('multiplier').textContent = (1 + (this.prestigeLevel * 0.5)).toFixed(2) + 'x';
        document.getElementById('prestige').textContent = this.prestigeLevel;
        document.getElementById('username').textContent = this.settings.username;
        document.getElementById('playtime').textContent = this.formatTime(this.playTime);
        
        // Рассчитываем силу клика
        let clickPower = GAME_CONSTANTS.BASE_POWER;
        clickPower *= 1 + (this.prestigeLevel * 0.5);
        if (this.boosts.click2x) clickPower *= 2;
        if (this.activeEvent && this.activeEvent.type === 'click') clickPower *= this.activeEvent.multiplier;
        
        document.getElementById('click-power-value').textContent = this.formatNumber(clickPower);
        document.getElementById('auto-power-value').textContent = this.formatNumber(this.energyPerSecond);
        
        // Престиж
        const required = GAME_CONSTANTS.PRESTIGE_BASE * Math.pow(2, this.prestigeLevel);
        const progress = Math.min(this.totalEnergy / required, 1);
        const timeLeft = this.nextPrestige - Date.now();
        
        document.getElementById('prestige-required').textContent = this.formatNumber(required) + ' энергии';
        document.getElementById('prestige-progress').style.width = `${progress * 100}%`;
        document.getElementById('prestige-progress-text').textContent = `${Math.floor(progress * 100)}%`;
        document.getElementById('prestige-time').textContent = this.formatTime(timeLeft);
        document.getElementById('prestige-timer').textContent = this.formatTime(timeLeft);
        
        const prestigeBtn = document.getElementById('prestige-btn');
        if (this.canPrestige()) {
            prestigeBtn.disabled = false;
        } else {
            prestigeBtn.disabled = true;
        }
        
        // Ивенты
        if (this.activeEvent) {
            const eventCard = document.getElementById('event-card');
            const timeLeftEvent = this.eventEndTime - Date.now();
            
            eventCard.innerHTML = `
                <div class="event-icon">
                    <i class="${this.activeEvent.icon}"></i>
                </div>
                <div class="event-info">
                    <h4>${this.activeEvent.name}</h4>
                    <p>Осталось: <span>${this.formatTime(timeLeftEvent)}</span></p>
                </div>
            `;
            
            document.getElementById('next-event').textContent = this.formatTime(timeLeftEvent);
        } else {
            const timeToNext = this.nextEventTime - Date.now();
            document.getElementById('next-event').textContent = this.formatTime(timeToNext);
        }
        
        // Быстрые улучшения
        document.getElementById('boost-2x').disabled = this.energy < 100 || this.boosts.click2x;
        document.getElementById('boost-5x').disabled = this.energy < 500 || this.boosts.auto5x;
        
        // Рендерим генераторы
        this.renderGenerators();
        
        // Рендерим множители
        this.renderMultipliers();
    }
    
    renderGenerators() {
        const container = document.getElementById('generators-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const gen of this.generators) {
            if (!gen.unlocked) continue;
            
            const canAfford = this.energy >= gen.cost;
            const totalProduction = gen.production * gen.owned;
            
            const html = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${gen.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h4>${gen.name}</h4>
                            <p>${gen.production}/сек</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="label">Куплено</span>
                            <span class="value">${gen.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Всего</span>
                            <span class="value">${this.formatNumber(totalProduction)}/сек</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Стоимость</span>
                            <span class="value">${this.formatNumber(gen.cost)}</span>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="game.buyGenerator(${gen.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-shopping-cart"></i>
                        ${canAfford ? 'Купить' : 'Не хватает'}
                    </button>
                </div>
            `;
            
            container.innerHTML += html;
        }
    }
    
    renderMultipliers() {
        const container = document.getElementById('multipliers-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const mul of this.multipliers) {
            if (!mul.unlocked) continue;
            
            const canAfford = this.energy >= mul.cost;
            const totalMultiplier = Math.pow(mul.multiplier, mul.owned).toFixed(2);
            
            const html = `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <div class="upgrade-icon">
                            <i class="${mul.icon}"></i>
                        </div>
                        <div class="upgrade-info">
                            <h4>${mul.name}</h4>
                            <p>+${Math.floor((mul.multiplier - 1) * 100)}% к генерации</p>
                        </div>
                    </div>
                    <div class="upgrade-stats">
                        <div class="upgrade-stat">
                            <span class="label">Куплено</span>
                            <span class="value">${mul.owned}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Множитель</span>
                            <span class="value">x${mul.multiplier}</span>
                        </div>
                        <div class="upgrade-stat">
                            <span class="label">Общий</span>
                            <span class="value">x${totalMultiplier}</span>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="game.buyMultiplier(${mul.id})" ${canAfford ? '' : 'disabled'}>
                        <i class="fas fa-chart-line"></i>
                        ${canAfford ? 'Купить' : 'Не хватает'}
                    </button>
                </div>
            `;
            
            container.innerHTML += html;
        }
    }
    
    formatNumber(num) {
        if (this.settings.numberFormat === 'full') {
            return Math.floor(num).toLocaleString();
        }
        
        // Короткий формат
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }
    
    formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    showMessage(text, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        else if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        else if (type === 'error') icon = 'fas fa-times-circle';
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <div class="notification-content">
                <div class="notification-title">${type === 'success' ? 'Успех' : type === 'warning' ? 'Внимание' : 'Ошибка'}</div>
                <div class="notification-message">${text}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    onSave() {
        const icon = document.getElementById('save-icon');
        icon.style.color = '#00ff9d';
        setTimeout(() => {
            icon.style.color = '';
        }, 500);
    }
}

// ===== ЗАПУСК ИГРЫ =====
let game;

window.addEventListener('load', () => {
    game = new SpaceIncrementor();
    
    // Делаем методы доступными глобально для обработчиков onclick
    window.game = {
        buyGenerator: (id) => {
            if (game.buyGenerator(id) > 0) {
                game.render();
            }
        },
        buyMultiplier: (id) => {
            if (game.buyMultiplier(id)) {
                game.render();
            }
        },
        onSave: () => game.onSave()
    };
    
    // Обработка закрытия страницы
    window.addEventListener('beforeunload', () => {
        game.save();
    });
});

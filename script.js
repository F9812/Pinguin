// Состояние игры
let gameState = {
    ore: 0,
    orePerClick: 1,
    orePerSecond: 0,
    upgrades: [
        {
            id: 1,
            name: "Авто-дрон",
            description: "Добывает 1 руду в секунду",
            baseCost: 10,
            cost: 10,
            owned: 0,
            increment: 1, // Сколько добавляет к orePerSecond
            type: "auto"
        },
        {
            id: 2,
            name: "Улучшенный бур",
            description: "+1 к силе клика",
            baseCost: 50,
            cost: 50,
            owned: 0,
            increment: 1, // Сколько добавляет к orePerClick
            type: "click"
        },
        {
            id: 3,
            name: "Космическая станция",
            description: "Добывает 5 руды в секунду",
            baseCost: 500,
            cost: 500,
            owned: 0,
            increment: 5,
            type: "auto"
        },
        {
            id: 4,
            name: "Квантовый усилитель",
            description: "+5 к силе клика",
            baseCost: 1000,
            cost: 1000,
            owned: 0,
            increment: 5,
            type: "click"
        }
    ]
};

// Получаем элементы DOM
const oreElement = document.getElementById('ore');
const rateElement = document.getElementById('rate');
const clickPowerElement = document.querySelector('#click-power span');
const asteroidButton = document.getElementById('asteroid');
const upgradesListElement = document.getElementById('upgrades-list');

// Функция обновления отображения
function updateDisplay() {
    oreElement.textContent = Math.floor(gameState.ore);
    rateElement.textContent = gameState.orePerSecond;
    clickPowerElement.textContent = gameState.orePerClick;
}

// Функция для добычи руды кликом
function mineOre() {
    gameState.ore += gameState.orePerClick;
    updateDisplay();
}

// Функция для покупки улучшения
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);

    if (!upgrade || gameState.ore < upgrade.cost) {
        return; // Не хватает денег или улучшение не найдено
    }

    // Списание стоимости
    gameState.ore -= upgrade.cost;

    // Применение эффекта улучшения
    if (upgrade.type === "click") {
        gameState.orePerClick += upgrade.increment;
    } else if (upgrade.type === "auto") {
        gameState.orePerSecond += upgrade.increment;
    }

    // Увеличиваем количество купленных и пересчитываем стоимость
    upgrade.owned++;
    // Формула роста стоимости (можно менять)
    upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));

    // Обновляем интерфейс
    updateDisplay();
    renderUpgrades();
}

// Функция для отрисовки списка улучшений
function renderUpgrades() {
    upgradesListElement.innerHTML = ''; // Очищаем список

    gameState.upgrades.forEach(upgrade => {
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade';

        // Проверяем, можем ли купить
        const canAfford = gameState.ore >= upgrade.cost;

        upgradeElement.innerHTML = `
            <div class="upgrade-info">
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <p>Куплено: ${upgrade.owned}</p>
                <p>Стоимость: <strong>${Math.floor(upgrade.cost)}</strong> руды</p>
            </div>
            <button ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'Купить' : 'Не хватает'}
            </button>
        `;

        // Вешаем обработчик на кнопку покупки
        const buyButton = upgradeElement.querySelector('button');
        buyButton.addEventListener('click', () => buyUpgrade(upgrade.id));

        upgradesListElement.appendChild(upgradeElement);
    });
}

// Функция пассивного заработка (вызывается каждую секунду)
function passiveIncome() {
    gameState.ore += gameState.orePerSecond;
    updateDisplay();
}

// Инициализация игры
function initGame() {
    updateDisplay();
    renderUpgrades();

    // Обработчик клика по астероиду
    asteroidButton.addEventListener('click', mineOre);

    // Запускаем пассивный доход каждую секунду
    setInterval(passiveIncome, 1000);

    // Сохранение игры каждые 10 секунд
    setInterval(saveGame, 10000);

    // Пытаемся загрузить сохранение при старте
    loadGame();
}

// --- Сохранение и загрузка ---
function saveGame() {
    localStorage.setItem('spaceMinerSave', JSON.stringify(gameState));
    console.log('Игра сохранена!');
}

function loadGame() {
    const saved = localStorage.getItem('spaceMinerSave');
    if (saved) {
        const loadedState = JSON.parse(saved);
        // Проверяем структуру, чтобы избежать ошибок
        if (loadedState.ore !== undefined) {
            gameState = loadedState;
            updateDisplay();
            renderUpgrades();
            console.log('Игра загружена!');
        }
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('load', initGame);

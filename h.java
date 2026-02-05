const penguin = document.getElementById('penguin');
const scene = document.getElementById('scene');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');

let animationId = null;
let startTime = null;
const duration = 50000; // 50 секунд в миллисекундах
const footprints = [];

// Путь движения (от левого края до правого)
const startX = 0;
const endX = window.innerWidth - 100; // учитываем ширину пингвина

// Загрузка изображения следа
const footprintImg = new Image();
footprintImg.src = 'image (70).png'; // укажите путь к изображению следа

function createFootprint(x, y) {
    const footprint = document.createElement('div');
    footprint.className = 'footprint';
    footprint.style.left = (x + 20) + 'px'; // смещение относительно пингвина
    footprint.style.bottom = (y - 10) + 'px';
    scene.appendChild(footprint);
    footprints.push(footprint);
}

function animatePenguin(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Позиция пингвина
    const currentX = startX + (endX - startX) * progress;
    penguin.style.left = currentX + 'px';

    // Оставляем следы каждые 200мс
    if (Math.floor(elapsed / 200) % 3 === 0) {
        createFootprint(currentX, 20);
    }

    if (progress < 1) {
        animationId = requestAnimationFrame(animatePenguin);
    } else {
        cancelAnimationFrame(animationId);
        console.log('Анимация завершена!');
    }
}

startBtn.addEventListener('click', () => {
    if (animationId) cancelAnimationFrame(animationId);
    startTime = null;
    animationId = requestAnimationFrame(animatePenguin);
});

resetBtn.addEventListener('click', () => {
    footprints.forEach(footprint => footprint.remove());
    footprints.length = 0;
    penguin.style.left = startX + 'px';
    if (animationId) cancelAnimationFrame(animationId);
});

document.addEventListener('DOMContentLoaded', function() {
    const penguin = document.getElementById('penguin');
    const container = document.querySelector('.penguin-container');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const speedControl = document.getElementById('speed');
    
    let isWalking = false;
    let animationId = null;
    let positionX = 15; // начальная позиция в %
    let positionY = 28; // начальная позиция в %
    let speed = 5; // начальная скорость
    const maxX = 85; // крайняя точка на горе
    
    // Функция движения вперёд (в гору)
    function moveForward() {
        if (!isWalking) return;
        
        // Увеличиваем X (вперёд) и немного Y (вверх, т.к. идём в гору)
        positionX += speed * 0.05;
        positionY -= speed * 0.008; // Медленный подъём
        
        // Ограничиваем область движения
        if (positionX > maxX) positionX = maxX;
        if (positionY < 15) positionY = 15;
        
        // Применяем позицию
        container.style.left = positionX + '%';
        container.style.bottom = positionY + '%';
        
        // Меняем масштаб по мере удаления (перспектива)
        let scale = 1 + positionX * 0.003;
        container.style.transform = `rotateX(30deg) scale(${scale})`;
        
        // Зацикливаем анимацию
        animationId = requestAnimationFrame(moveForward);
    }
    
    // Обработчики кнопок
    startBtn.addEventListener('click', function() {
        if (isWalking) return;
        isWalking = true;
        penguin.style.animationPlayState = 'running';
        moveForward();
    });
    
    stopBtn.addEventListener('click', function() {
        isWalking = false;
        penguin.style.animationPlayState = 'paused';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
    
    // Контроль скорости
    speedControl.addEventListener('input', function() {
        speed = parseInt(this.value);
        // Скорость анимации шагов тоже меняется
        penguin.style.animationDuration = (1.2 - speed * 0.1) + 's';
    });
    
    // Небольшой ветерок - случайные микросдвиги для реализма
    setInterval(() => {
        if (!isWalking) {
            container.style.transform = `rotateX(30deg) translateX(${Math.sin(Date.now() * 0.002) * 3}px)`;
        }
    }, 50);
});

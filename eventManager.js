const EventEmitter = require('events');
const io = require('../server').io; // Ссылка на Socket.io

class EventManager extends EventEmitter {
  constructor() {
    super();
    this.activeEvents = [];
    this.eventTypes = {
      CRYSTAL_SWARM: 'crystal_swarm',
      ENERGY_STORM: 'energy_storm',
      DIMENSION_BREACH: 'dimension_breach',
      VIRUS_OUTBREAK: 'virus_outbreak'
    };
  }
  
  start() {
    // Запуск случайных событий каждые 30-60 минут
    this.scheduleRandomEvent();
    
    // Проверка событий каждую минуту
    setInterval(() => this.checkActiveEvents(), 60000);
  }
  
  scheduleRandomEvent() {
    const nextEventDelay = Math.random() * 30 * 60000 + 30 * 60000; // 30-60 минут
    setTimeout(() => {
      this.triggerRandomEvent();
      this.scheduleRandomEvent();
    }, nextEventDelay);
  }
  
  triggerRandomEvent() {
    const events = Object.values(this.eventTypes);
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    const event = {
      type: randomEvent,
      startTime: new Date(),
      duration: this.getEventDuration(randomEvent),
      data: this.generateEventData(randomEvent)
    };
    
    this.activeEvents.push(event);
    this.broadcastEvent(event);
    
    // Автоматическое завершение события
    setTimeout(() => {
      this.endEvent(event);
    }, event.duration);
  }
  
  broadcastEvent(event) {
    io.emit('game_event_start', event);
    
    // Особые обработки для разных событий
    switch (event.type) {
      case this.eventTypes.CRYSTAL_SWARM:
        // Кристальный рой - появляются летающие кристаллы
        console.log('Начинается Кристальный Рой!');
        break;
      case this.eventTypes.ENERGY_STORM:
        // Энергетическая буря ×2 к производству
        console.log('Энергетическая Буря! Производство ×2');
        break;
    }
  }
  
  endEvent(event) {
    const index = this.activeEvents.findIndex(e => e === event);
    if (index !== -1) {
      this.activeEvents.splice(index, 1);
      io.emit('game_event_end', event);
    }
  }
  
  getEventDuration(eventType) {
    const durations = {
      [this.eventTypes.CRYSTAL_SWARM]: 30000,    // 30 секунд
      [this.eventTypes.ENERGY_STORM]: 120000,    // 2 минуты
      [this.eventTypes.DIMENSION_BREACH]: 180000, // 3 минуты
      [this.eventTypes.VIRUS_OUTBREAK]: 240000    // 4 минуты
    };
    return durations[eventType] || 60000;
  }
  
  generateEventData(eventType) {
    const baseData = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    switch (eventType) {
      case this.eventTypes.CRYSTAL_SWARM:
        return {
          ...baseData,
          crystals: Math.floor(Math.random() * 20) + 10,
          energyPerCrystal: Math.floor(Math.random() * 50) + 10
        };
      case this.eventTypes.ENERGY_STORM:
        return {
          ...baseData,
          multiplier: 2.0,
          affectedGenerators: ['solar', 'geothermal', 'quantum', 'gravity', 'stellar']
        };
      default:
        return baseData;
    }
  }
  
  checkActiveEvents() {
    this.activeEvents.forEach(event => {
      // Проверка таймеров, обновление состояния
      const elapsed = Date.now() - event.startTime.getTime();
      if (elapsed > event.duration) {
        this.endEvent(event);
      }
    });
  }
}

module.exports = new EventManager();

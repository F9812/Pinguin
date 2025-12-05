class MarketSystem {
    constructor() {
        this.items = new Map();
        this.nextItemId = 1;
        this.transactionHistory = [];
        
        this.itemTypes = {
            energy_cluster: {
                name: 'Сгусток энергии',
                description: 'Концентрированный источник энергии',
                basePrice: 1000,
                rarity: 'common',
                tradable: true
            },
            quantum_shard: {
                name: 'Осколок кванта',
                description: 'Фрагмент квантовой материи',
                basePrice: 5000,
                currency: 'quantum',
                rarity: 'rare',
                tradable: true
            },
            generator_blueprint: {
                name: 'Чертеж генератора',
                description: 'Позволяет построить улучшенный генератор',
                basePrice: 10000,
                rarity: 'uncommon',
                tradable: true
            },
            time_boost: {
                name: 'Ускоритель времени',
                description: 'Увеличивает скорость производства на 2 часа',
                basePrice: 2500,
                rarity: 'common',
                consumable: true
            },
            rebirth_token: {
                name: 'Токен перерождения',
                description: 'Позволяет выполнить перерождение без ожидания сессии',
                basePrice: 10000,
                currency: 'quantum',
                rarity: 'epic',
                consumable: true
            }
        };
    }
    
    listItem(sellerId, itemType, quantity = 1, price, currency = 'energy') {
        const itemConfig = this.itemTypes[itemType];
        if (!itemConfig) {
            return { success: false, error: 'Неизвестный тип предмета' };
        }
        
        // Проверка цены
        const minPrice = itemConfig.basePrice * 0.5;
        const maxPrice = itemConfig.basePrice * 10;
        
        if (price < minPrice || price > maxPrice) {
            return { 
                success: false, 
                error: `Цена должна быть в пределах ${minPrice}-${maxPrice} ${currency}`
            };
        }
        
        // Создание предмета
        const itemId = this.nextItemId++;
        const item = {
            id: itemId,
            sellerId,
            buyerId: null,
            itemType,
            quantity,
            price,
            currency,
            listedAt: Date.now(),
            expiresAt: Date.now() + (24 * 3600 * 1000), // 24 часа
            status: 'active',
            itemData: {
                name: itemConfig.name,
                description: itemConfig.description,
                rarity: itemConfig.rarity,
                ...itemConfig
            }
        };
        
        this.items.set(itemId, item);
        
        return {
            success: true,
            item,
            message: 'Предмет выставлен на рынок'
        };
    }
    
    buyItem(itemId, buyerId, buyerName) {
        const item = this.items.get(itemId);
        if (!item) {
            return { success: false, error: 'Предмет не найден' };
        }
        
        if (item.status !== 'active') {
            return { success: false, error: 'Предмет недоступен для покупки' };
        }
        
        if (item.sellerId === buyerId) {
            return { success: false, error: 'Нельзя купить собственный предмет' };
        }
        
        if (Date.now() > item.expiresAt) {
            item.status = 'expired';
            return { success: false, error: 'Время продажи истекло' };
        }
        
        // Здесь будет проверка баланса покупателя
        // и списание средств
        
        // Обновление статуса
        item.buyerId = buyerId;
        item.status = 'sold';
        item.soldAt = Date.now();
        
        // Запись транзакции
        this.recordTransaction({
            itemId,
            sellerId: item.sellerId,
            buyerId,
            price: item.price,
            currency: item.currency,
            itemType: item.itemType,
            quantity: item.quantity,
            timestamp: Date.now()
        });
        
        return {
            success: true,
            item,
            message: `Вы купили ${item.itemData.name} за ${item.price} ${item.currency}`
        };
    }
    
    cancelListing(itemId, requesterId) {
        const item = this.items.get(itemId);
        if (!item) {
            return { success: false, error: 'Предмет не найден' };
        }
        
        if (item.sellerId !== requesterId) {
            return { success: false, error: 'Только продавец может отменить продажу' };
        }
        
        if (item.status !== 'active') {
            return { success: false, error: 'Нельзя отменить проданный или истекший предмет' };
        }
        
        item.status = 'cancelled';
        item.cancelledAt = Date.now();
        
        return {
            success: true,
            message: 'Продажа отменена'
        };
    }
    
    recordTransaction(transaction) {
        this.transactionHistory.push(transaction);
        
        // Ограничение истории
        if (this.transactionHistory.length > 1000) {
            this.transactionHistory = this.transactionHistory.slice(-500);
        }
    }
    
    searchItems(filters = {}) {
        let results = Array.from(this.items.values())
            .filter(item => item.status === 'active');
        
        // Фильтры
        if (filters.itemType) {
            results = results.filter(item => item.itemType === filters.itemType);
        }
        
        if (filters.currency) {
            results = results.filter(item => item.currency === filters.currency);
        }
        
        if (filters.minPrice !== undefined) {
            results = results.filter(item => item.price >= filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
            results = results.filter(item => item.price <= filters.maxPrice);
        }
        
        if (filters.rarity) {
            results = results.filter(item => item.itemData.rarity === filters.rarity);
        }
        
        // Сортировка
        if (filters.sortBy === 'price_asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (filters.sortBy === 'price_desc') {
            results.sort((a, b) => b.price - a.price);
        } else if (filters.sortBy === 'newest') {
            results.sort((a, b) => b.listedAt - a.listedAt);
        } else {
            // По умолчанию по времени до окончания
            results.sort((a, b) => a.expiresAt - b.expiresAt);
        }
        
        // Пагинация
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
            items: results.slice(start, end),
            total: results.length,
            page,
            totalPages: Math.ceil(results.length / limit)
        };
    }
    
    getItemTypes() {
        return this.itemTypes;
    }
    
    getMarketStats() {
        const activeItems = Array.from(this.items.values())
            .filter(item => item.status === 'active');
        
        const soldItems = Array.from(this.items.values())
            .filter(item => item.status === 'sold');
        
        const totalVolume = soldItems.reduce((sum, item) => sum + item.price, 0);
        
        // Самые популярные предметы
        const popularItems = {};
        soldItems.forEach(item => {
            popularItems[item.itemType] = (popularItems[item.itemType] || 0) + 1;
        });
        
        const sortedPopular = Object.entries(popularItems)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({
                type,
                name: this.itemTypes[type]?.name || type,
                count
            }));
        
        // Средняя цена по типам
        const avgPrices = {};
        soldItems.forEach(item => {
            if (!avgPrices[item.itemType]) {
                avgPrices[item.itemType] = { total: 0, count: 0 };
            }
            avgPrices[item.itemType].total += item.price;
            avgPrices[item.itemType].count++;
        });
        
        const averagePrices = Object.entries(avgPrices).map(([type, data]) => ({
            type,
            name: this.itemTypes[type]?.name || type,
            average: Math.round(data.total / data.count)
        }));
        
        return {
            activeItems: activeItems.length,
            totalSold: soldItems.length,
            totalVolume,
            popularItems: sortedPopular,
            averagePrices,
            lastUpdate: Date.now()
        };
    }
    
    // Аукционная система
    createAuction(sellerId, itemType, startingBid, duration = 3600 * 1000) { // 1 час по умолчанию
        const itemConfig = this.itemTypes[itemType];
        if (!itemConfig) {
            return { success: false, error: 'Неизвестный тип предмета' };
        }
        
        const auctionId = this.nextItemId++;
        const auction = {
            id: auctionId,
            sellerId,
            itemType,
            startingBid,
            currentBid: startingBid,
            currentBidder: null,
            bids: [],
            endsAt: Date.now() + duration,
            status: 'active',
            itemData: {
                name: itemConfig.name,
                description: itemConfig.description,
                rarity: itemConfig.rarity
            }
        };
        
        this.items.set(auctionId, auction);
        
        return {
            success: true,
            auction,
            message: 'Аукцион создан'
        };
    }
    
    placeBid(auctionId, bidderId, bidAmount) {
        const auction = this.items.get(auctionId);
        if (!auction || auction.status !== 'active') {
            return { success: false, error: 'Аукцион не активен' };
        }
        
        if (Date.now() > auction.endsAt) {
            auction.status = 'ended';
            return { success: false, error: 'Аукцион завершен' };
        }
        
        if (bidAmount <= auction.currentBid) {
            return { 
                success: false, 
                error: `Ставка должна быть выше текущей (${auction.currentBid})` 
            };
        }
        
        // Сохранение предыдущей ставки
        if (auction.currentBidder) {
            // Возврат средств предыдущему участнику
            // (в реальной системе)
        }
        
        // Обновление аукциона
        auction.currentBid = bidAmount;
        auction.currentBidder = bidderId;
        auction.bids.push({
            bidderId,
            amount: bidAmount,
            timestamp: Date.now()
        });
        
        // Автоматическое продление при ставке в последние 5 минут
        if (auction.endsAt - Date.now() < 300000) { // 5 минут
            auction.endsAt += 300000; // Продлить на 5 минут
        }
        
        return {
            success: true,
            auction,
            message: 'Ставка принята'
        };
    }
    
    endAuction(auctionId) {
        const auction = this.items.get(auctionId);
        if (!auction) {
            return { success: false, error: 'Аукцион не найден' };
        }
        
        if (auction.status !== 'active') {
            return { success: false, error: 'Аукцион уже завершен' };
        }
        
        auction.status = 'ended';
        auction.endedAt = Date.now();
        
        if (auction.currentBidder) {
            // Продажа предмета победителю
            this.recordTransaction({
                auctionId,
                sellerId: auction.sellerId,
                buyerId: auction.currentBidder,
                price: auction.currentBid,
                currency: 'energy',
                itemType: auction.itemType,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                winner: auction.currentBidder,
                winningBid: auction.currentBid,
                message: 'Аукцион завершен'
            };
        } else {
            return {
                success: true,
                message: 'Аукцион завершен без победителя'
            };
        }
    }
}

module.exports = new MarketSystem();

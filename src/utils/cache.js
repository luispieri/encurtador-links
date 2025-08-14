// Sistema de cache em memória simples e eficiente
class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    set(key, value, ttlSeconds = 300) { // 5 minutos por padrão
        // Limpar timer anterior se existir
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Definir valor no cache
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        });

        // Configurar auto-expiração
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttlSeconds * 1000);

        this.timers.set(key, timer);
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Verificar se expirou
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
            return null;
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        return this.cache.delete(key);
    }

    clear() {
        // Limpar todos os timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.cache.clear();
    }

    // Estatísticas do cache
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Instância global do cache
const cache = new MemoryCache();

module.exports = cache;
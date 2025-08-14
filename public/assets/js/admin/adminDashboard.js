// Dashboard Admin Otimizado
class AdminDashboard {
    constructor() {
        this.statsElements = {
            totalUrls: document.getElementById('totalUrls'),
            activeUrls: document.getElementById('activeUrls'),
            totalClicks: document.getElementById('totalClicks'),
            todayUrls: document.getElementById('todayUrls')
        };
        this.isLoading = false;
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutos
    }

    async loadDashboard() {
        // Evitar múltiplas requisições simultâneas
        if (this.isLoading) return;
        
        try {
            // Verificar cache primeiro
            const cached = this.getFromCache('dashboard_stats');
            if (cached) {
                this.updateStats(cached.summary);
                this.updateTopUrls(cached.top_urls);
                this.updateWeeklyChart(cached.weekly_activity);
                return;
            }
            
            this.isLoading = true;
            this.showLoading(true);
            
            const response = await window.adminAPI.getStats();
            
            if (response.success) {
                // Salvar no cache
                this.setCache('dashboard_stats', response.data);
                
                this.updateStats(response.data.summary);
                this.updateTopUrls(response.data.top_urls);
                this.updateWeeklyChart(response.data.weekly_activity);
            }
        } catch (error) {
            window.adminAuth.showToast('Erro ao carregar dashboard: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    // Cache local do frontend
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Verificar se expirou
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    updateStats(stats) {
        this.statsElements.totalUrls.textContent = this.formatNumber(stats.total_urls);
        this.statsElements.activeUrls.textContent = this.formatNumber(stats.active_urls);
        this.statsElements.totalClicks.textContent = this.formatNumber(stats.total_clicks);
        this.statsElements.todayUrls.textContent = this.formatNumber(stats.today_urls);
    }

    updateTopUrls(topUrls) {
        const container = document.getElementById('topUrlsList');
        
        if (!topUrls || topUrls.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma URL com cliques ainda</p>';
            return;
        }

        const html = topUrls.map((url, index) => `
            <div class="top-url-item">
                <div class="rank">#${index + 1}</div>
                <div class="url-info">
                    <div class="url-title">${url.title || 'Sem título'}</div>
                    <div class="url-code">/${url.short_code}</div>
                    <div class="url-original">${this.truncateUrl(url.original_url)}</div>
                </div>
                <div class="url-clicks">
                    <strong>${this.formatNumber(url.clicks)}</strong>
                    <small>cliques</small>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateWeeklyChart(weeklyData) {
        const container = document.getElementById('weeklyChart');
        
        if (!weeklyData || weeklyData.length === 0) {
            container.innerHTML = '<p class="text-muted">Sem dados da semana</p>';
            return;
        }

        const maxValue = Math.max(...weeklyData.map(d => d.urls_created));
        
        const html = weeklyData.map(day => {
            const height = maxValue > 0 ? (day.urls_created / maxValue) * 100 : 0;
            return `
                <div class="chart-bar">
                    <div class="bar" style="height: ${height}%"></div>
                    <div class="bar-label">${day.date}</div>
                    <div class="bar-value">${day.urls_created}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="chart-bars">${html}</div>`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    truncateUrl(url) {
        return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Adicionar estilos para o dashboard
const dashboardStyles = `
    .top-url-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #f1f3f4;
        gap: 15px;
    }

    .top-url-item:last-child {
        border-bottom: none;
    }

    .rank {
        font-size: 1.2rem;
        font-weight: bold;
        color: #588ad6;
        width: 30px;
        text-align: center;
    }

    .url-info {
        flex: 1;
    }

    .url-title {
        font-weight: 600;
        color: #001826;
        margin-bottom: 2px;
    }

    .url-code {
        font-family: monospace;
        color: #588ad6;
        font-size: 0.9rem;
        margin-bottom: 2px;
    }

    .url-original {
        color: #6c757d;
        font-size: 0.8rem;
    }

    .url-clicks {
        text-align: center;
        color: #001826;
    }

    .url-clicks strong {
        display: block;
        font-size: 1.2rem;
    }

    .url-clicks small {
        color: #6c757d;
    }

    .chart-bars {
        display: flex;
        align-items: end;
        gap: 10px;
        height: 200px;
        padding: 20px 0;
    }

    .chart-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .bar {
        width: 100%;
        background: linear-gradient(to top, #588ad6, #033159);
        border-radius: 4px 4px 0 0;
        min-height: 5px;
        transition: all 0.3s ease;
    }

    .bar-label {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .bar-value {
        font-size: 0.9rem;
        font-weight: 600;
        color: #001826;
    }

    .chart-bar:hover .bar {
        background: linear-gradient(to top, #033159, #001826);
    }

    .text-muted {
        color: #6c757d;
        text-align: center;
        padding: 20px;
    }
`;

// Adicionar estilos ao documento
const style = document.createElement('style');
style.textContent = dashboardStyles;
document.head.appendChild(style);

// Inicializar dashboard
window.adminDashboard = new AdminDashboard();
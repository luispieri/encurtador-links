// Componente para gerenciamento de URLs (futuro - para aba de gerenciamento)
class URLManagement {
    constructor(baseURL) {
        this.api = new ApiClient(baseURL);
        this.urls = [];
    }

    async loadUserUrls() {
        try {
            const result = await this.api.getUserUrls();
            if (result.success) {
                this.urls = result.data;
                this.renderUrls();
            }
        } catch (error) {
            console.error('Erro ao carregar URLs:', error);
        }
    }

    async deleteUrl(id) {
        try {
            const result = await this.api.deleteUrl(id);
            if (result.success) {
                this.urls = this.urls.filter(url => url.id !== id);
                this.renderUrls();
                this.showMessage('URL removida com sucesso', 'success');
            }
        } catch (error) {
            this.showMessage('Erro ao remover URL: ' + error.message, 'error');
        }
    }

    renderUrls() {
        // Implementar renderização da lista de URLs
        // Este método será usado quando implementarmos a aba de gerenciamento
        console.log('Renderizar URLs:', this.urls);
    }

    showMessage(message, type) {
        // Implementar sistema de mensagens
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Métodos para ações futuras
    copyUrl(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showMessage('URL copiada!', 'success');
            });
        }
    }

    async showStats(code) {
        try {
            const result = await this.api.getStats(code);
            if (result.success) {
                // Implementar modal de estatísticas
                console.log('Estatísticas:', result.data);
            }
        } catch (error) {
            this.showMessage('Erro ao carregar estatísticas', 'error');
        }
    }
}